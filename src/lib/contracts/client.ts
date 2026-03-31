// Smart contract interaction client

import algosdk from 'algosdk'
import { algodClient, indexerClient } from '../algorand'

export async function getTinymanQuote(
  pool: { asset: number; reserve0: number; reserve1: number },
  assetId: number,
  amount: number,
  isBuy: boolean
): Promise<{ amountOut: number; priceImpact: number }> {
  // Simplified quote: (x + a)(y - b) = x*y
  const [xReserve, yReserve] = isBuy ? [pool.reserve0, pool.reserve1] : [pool.reserve1, pool.reserve0]
  const k = xReserve * yReserve
  const newX = xReserve + amount
  const newY = k / newX
  const amountOut = yReserve - newY
  const priceImpact = (amount / (xReserve + amount)) * 100

  return { amountOut, priceImpact }
}

export async function buildTinymanTradeTxns(
  senderAddress: string,
  assetId: number,
  amountGrams: number,
  spotPrice: number,
  platformFee: number
): Promise<algosdk.Transaction[]> {
  const params = await algodClient.getTransactionParams().do()
  const txns: algosdk.Transaction[] = []

  // Fee payment to xpc.algo
  const feeAmountInAlgo = platformFee * 0.00001 // rough conversion
  if (feeAmountInAlgo > 0) {
    const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      receiver: 'XPCFEEADDRESS', // placeholder
      amount: Math.floor(feeAmountInAlgo * 1e6),
      suggestedParams: params,
    })
    txns.push(feeTxn)
  }

  return txns
}

export async function readMarketState(appId: number) {
  try {
    const app = await indexerClient.lookupApplications(appId).do()
    const state = (app as any).application?.params?.['global-state'] || []
    const stateMap: Record<string, any> = {}

    state.forEach((item: any) => {
      const key = Buffer.from(item.key, 'base64').toString()
      stateMap[key] = item.value.type === 1 ? item.value.uint : item.value.bytes
    })

    return stateMap
  } catch (err) {
    console.error('Read market state error:', err)
    return {}
  }
}

export async function buildResolutionTxn(
  appId: number,
  marketId: string,
  outcome: 'YES' | 'NO',
  senderAddress: string
): Promise<algosdk.Transaction> {
  const params = await algodClient.getTransactionParams().do()

  const appArgs = [
    new Uint8Array(Buffer.from('resolve')),
    new Uint8Array(Buffer.from(outcome)),
  ]

  return algosdk.makeApplicationNoOpTxnFromObject({
    sender: senderAddress,
    appIndex: appId,
    appArgs,
    suggestedParams: params,
  })
}
