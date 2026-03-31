// Meld Gold trade execution via Tinyman DEX
// No API key needed — fully permissionless AMM on Algorand

import algosdk from 'algosdk'
import { algodClient } from './algorand'

// Meld Gold ASA IDs (mainnet)
export const MCAU_ASA_ID = 6547014   // Meld Gold (1 token = 1 gram gold)
export const MSOS_ASA_ID = 0         // Meld Silver — update when available
const ALGO_ASA_ID = 0

const PLATFORM_FEE_RATE = 0.007  // 0.7%
const MELD_PROTOCOL_FEE = 0.001  // ~0.1%

// XPC Fee treasury address (xpc.algo)
const FEE_TREASURY = process.env.NEXT_PUBLIC_ORACLE_ADDRESS || ''

export interface TinymanQuote {
  assetIn: number
  assetOut: number
  amountIn: number
  amountOut: number
  priceImpact: number
  exchangeRate: number
}

export async function getTinymanQuote(
  assetId: number,
  amountGrams: number,
  spotPricePerGram: number,
  isBuy: boolean
): Promise<TinymanQuote> {
  // In production, query the actual Tinyman pool reserves
  // For now, estimate based on spot price
  const total = amountGrams * spotPricePerGram
  const slippage = Math.min(amountGrams * 0.001, 2) // rough estimate

  return {
    assetIn: isBuy ? ALGO_ASA_ID : assetId,
    assetOut: isBuy ? assetId : ALGO_ASA_ID,
    amountIn: total,
    amountOut: amountGrams,
    priceImpact: slippage,
    exchangeRate: spotPricePerGram,
  }
}

export async function isOptedIntoASA(address: string, asaId: number): Promise<boolean> {
  try {
    const acct = await algodClient.accountInformation(address).do()
    return acct.assets?.some((a: any) => a['asset-id'] === asaId) ?? false
  } catch {
    return false
  }
}

export function buildASAOptInTx(
  address: string,
  asaId: number,
  params: algosdk.SuggestedParams
): algosdk.Transaction {
  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: address,
    assetIndex: asaId,
    amount: 0,
    suggestedParams: params,
  })
}

export async function buildMeldTradeTxns(
  senderAddress: string,
  assetId: number,
  amountGrams: number,
  spotPricePerGram: number,
  isBuy: boolean
): Promise<{ txns: algosdk.Transaction[]; tinymanFallbackUrl: string }> {
  const params = await algodClient.getTransactionParams().do()
  const txns: algosdk.Transaction[] = []

  const subtotal = amountGrams * spotPricePerGram
  const platformFee = subtotal * PLATFORM_FEE_RATE
  const total = subtotal + platformFee

  // Check ASA opt-in
  const optedIn = await isOptedIntoASA(senderAddress, assetId)
  if (!optedIn) {
    txns.push(buildASAOptInTx(senderAddress, assetId, params))
  }

  // Platform fee payment to treasury
  if (FEE_TREASURY && platformFee > 0) {
    const feeInMicroAlgo = Math.floor(platformFee * 1e6)
    const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      receiver: FEE_TREASURY,
      amount: feeInMicroAlgo,
      suggestedParams: params,
    })
    txns.push(feeTxn)
  }

  // Group transactions atomically
  if (txns.length > 1) {
    algosdk.assignGroupID(txns)
  }

  // Tinyman deep link fallback
  const assetName = assetId === MCAU_ASA_ID ? 'MCAU' : 'MSOS'
  const tinymanFallbackUrl = `https://app.tinyman.org/#/swap?asset_in=0&asset_out=${assetId}`

  return { txns, tinymanFallbackUrl }
}

export async function getOnChainPoolPrice(
  assetId: number
): Promise<{ pricePerGram: number; liquidity: number } | null> {
  try {
    // In production, query Tinyman pool reserves via their SDK
    // const pool = await TinymanClient.getPool(assetId, ALGO_ASA_ID)
    // return { pricePerGram: pool.price, liquidity: pool.totalLiquidity }
    return null
  } catch {
    return null
  }
}
