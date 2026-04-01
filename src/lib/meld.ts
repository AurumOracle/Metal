/**
 * Aurum Oracle — DEX Trade Execution via Tinyman
 * ================================================
 * MCAU (gold) and MSOS (silver) are Algorand Standard Assets.
 * They trade on Tinyman — a fully permissionless AMM DEX on Algorand.
 *
 * No API key. No partnership. No KYC. Pure on-chain.
 *
 * Tinyman JS SDK: @tinymanorg/tinyman-js-sdk
 * Docs: https://docs.tinyman.org
 * MCAU ASA ID: 6547014
 * MSOS ASA ID: 137594422
 * USDC ASA ID: 31566704 (primary quote currency)
 * ALGO ASA ID: 0
 *
 * The platform fee (0.7%) is appended as a separate payment tx in the
 * atomic group alongside the Tinyman swap transactions.
 */

import algosdk from 'algosdk'
import {
  Swap,
  SwapType,
  CONTRACT_VERSION,
  tinymanJSSDKConfig,
  poolUtils,
} from '@tinymanorg/tinyman-js-sdk'
import type { SwapQuote } from '@tinymanorg/tinyman-js-sdk'
import { algodClient } from '@/lib/algorand'
import { buildQuote, MELD_ASSETS } from '@/types'
import type { TradeAsset, TradeSide, TradeQuote } from '@/types'

// Label our integration in Tinyman's note field — good practice
tinymanJSSDKConfig.setClientName('AurumOracle')

// ── ASA IDs ────────────────────────────────────────────────────────────

export const ASSET_IDS = {
  ALGO:  0,
  USDC:  31566704,
  MCAU:  6547014,
  MSOS:  137594422,
} as const

const ASSET_DECIMALS: Record<number, number> = {
  [ASSET_IDS.ALGO]: 6,
  [ASSET_IDS.USDC]: 6,
  [ASSET_IDS.MCAU]: 5,   // MCAU has 5 decimal places per on-chain data
  [ASSET_IDS.MSOS]: 5,
}

// ── POOL LOOKUP ────────────────────────────────────────────────────────
// Tinyman pools are deterministic from asset pair — no API needed

async function getPool(assetInId: number, assetOutId: number) {
  const poolInfo = await poolUtils.v2.getPoolInfo({
    client:  algodClient,
    network: 'mainnet',
    asset1ID: Math.min(assetInId, assetOutId),
    asset2ID: Math.max(assetInId, assetOutId),
  })
  return poolInfo
}

// ── GET SWAP QUOTE FROM TINYMAN ────────────────────────────────────────

export interface TinymanQuote {
  swapType:         'fixed-input' | 'fixed-output'
  assetInId:        number
  assetOutId:       number
  amountIn:         bigint
  amountOut:        bigint
  priceImpactPct:   number
  slippagePct:      number
  quote:            SwapQuote
}

/**
 * Get a live swap quote from Tinyman for MCAU or MSOS.
 *
 * For BUY: swap ALGO → MCAU/MSOS (fixed output — exact grams received)
 * For SELL: swap MCAU/MSOS → ALGO (fixed input — exact grams sold)
 *
 * Returns null if the pool has no liquidity or an error occurs.
 */
export async function getTinymanQuote(
  asset:        TradeAsset,
  side:         TradeSide,
  amountGrams:  number,
  slippagePct   = 0.5,   // 0.5% default slippage tolerance
): Promise<TinymanQuote | null> {
  const metalAsaId = asset === 'gold' ? ASSET_IDS.MCAU : ASSET_IDS.MSOS
  const decimals   = ASSET_DECIMALS[metalAsaId]
  const rawAmount  = BigInt(Math.floor(amountGrams * 10 ** decimals))

  try {
    if (side === 'buy') {
      // Buy MCAU/MSOS with ALGO — fixed output (we know how many grams we want)
      const poolInfo = await getPool(ASSET_IDS.ALGO, metalAsaId)
      if (!poolInfo) return null

      const quote = await Swap.v2.getFixedOutputSwapQuote({
        pool:     poolInfo,
        assetIn:  { id: ASSET_IDS.ALGO, decimals: ASSET_DECIMALS[ASSET_IDS.ALGO] },
        assetOut: { id: metalAsaId, decimals },
        amount:   rawAmount,
        network:  'mainnet',
        slippage: slippagePct / 100,
      })

      // Extract amounts from direct quote data
      const quoteData = quote.data as any

      return {
        swapType:        'fixed-output',
        assetInId:       ASSET_IDS.ALGO,
        assetOutId:      metalAsaId,
        amountIn:        BigInt(quoteData.assetInAmount ?? 0),
        amountOut:       BigInt(quoteData.assetOutAmount ?? 0),
        priceImpactPct:  parseFloat(String(quoteData.priceImpact ?? quoteData.price_impact ?? 0)) * 100,
        slippagePct,
        quote,
      }
    } else {
      // Sell MCAU/MSOS for ALGO — fixed input (we know how many grams we're selling)
      const poolInfo = await getPool(metalAsaId, ASSET_IDS.ALGO)
      if (!poolInfo) return null

      const quote = await Swap.v2.getFixedInputSwapQuote({
        pool:     poolInfo,
        assetIn:  { id: metalAsaId, decimals },
        assetOut: { id: ASSET_IDS.ALGO, decimals: ASSET_DECIMALS[ASSET_IDS.ALGO] },
        amount:   rawAmount,
        network:  'mainnet',
        slippage: slippagePct / 100,
      })

      const quoteData = quote.data as any

      return {
        swapType:        'fixed-input',
        assetInId:       metalAsaId,
        assetOutId:      ASSET_IDS.ALGO,
        amountIn:        BigInt(quoteData.assetInAmount ?? 0),
        amountOut:       BigInt(quoteData.assetOutAmount ?? 0),
        priceImpactPct:  parseFloat(String(quoteData.priceImpact ?? quoteData.price_impact ?? 0)) * 100,
        slippagePct,
        quote,
      }
    }
  } catch (err) {
    console.error('getTinymanQuote error:', err)
    return null
  }
}

// ── BUILD TRADE TRANSACTION GROUP ──────────────────────────────────────
/**
 * Builds the complete atomic transaction group:
 *   Tx 0..N: Tinyman v2 swap transactions (2–4 txns)
 *   Tx N+1:  Platform fee payment to xpc.algo treasury (0.7% of trade value)
 *
 * All transactions are unsigned — pass to wallet's signTransactions().
 *
 * The platform fee is calculated on the trade value in USD, then paid
 * in ALGO at the current ALGO/USD rate (simplified: fees collected in ALGO).
 */
export async function buildTinymanTradeTxns(
  asset:        TradeAsset,
  side:         TradeSide,
  amountGrams:  number,
  walletAddr:   string,
  spotTroyOz:   number,
  slippagePct   = 0.5,
): Promise<{
  txns:          algosdk.Transaction[]
  quote:         TradeQuote
  tinymanQuote:  TinymanQuote | null
  source:        'tinyman' | 'fallback'
}> {
  const aurorQuote = buildQuote(asset, side, amountGrams, spotTroyOz)

  // Try to get a live Tinyman quote
  const tinymanQuote = await getTinymanQuote(asset, side, amountGrams, slippagePct)

  const suggestedParams = await algodClient.getTransactionParams().do()
  const treasuryAddr    = process.env.NEXT_PUBLIC_TREASURY_ADDRESS

  if (tinymanQuote) {
    // PATH A: Tinyman DEX swap
    // Generate Tinyman swap txns
    const swapTxnGroup = await Swap.v2.generateTxns({
      client:          algodClient,
      network:         'mainnet',
      quote:           tinymanQuote.quote,
      swapType:        tinymanQuote.swapType === 'fixed-input' ? SwapType.FixedInput : SwapType.FixedOutput,
      slippage:        slippagePct / 100,
      initiatorAddr:   walletAddr,
    })

    const txns = swapTxnGroup.map(({ txn }) => txn)

    // Append platform fee tx (0.7% in ALGO)
    if (treasuryAddr && aurorQuote.platformFee > 0) {
      // Fee in ALGO — rough: platformFeeUSD / ALGO_USD_PRICE
      // For now: send a flat minimum fee in microALGO; proper conversion needs live ALGO price
      const feeInMicroAlgo = Math.floor(aurorQuote.platformFee * 1_000_000 / 0.30)  // approximate
      const feeTx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender:          walletAddr,
        receiver:        treasuryAddr,
        amount:          Math.max(feeInMicroAlgo, 1000),   // 1000 microALGO minimum
        note:            new TextEncoder().encode(
          `AO/v1/{"type":"fee","asset":"${aurorQuote.symbol}","grams":${amountGrams}}`
        ),
        suggestedParams: { ...suggestedParams, fee: 1000 },
      })
      txns.push(feeTx)
    }

    // Re-assign group ID to include the fee tx
    algosdk.assignGroupID(txns)

    return { txns, quote: aurorQuote, tinymanQuote, source: 'tinyman' }
  }

  // PATH B: Fallback — direct ASA opt-in only (Tinyman pool may be empty)
  // In this case we guide the user to Tinyman's web UI
  console.warn('Tinyman pool unavailable — falling back to redirect flow')
  return {
    txns:         [],
    quote:        aurorQuote,
    tinymanQuote: null,
    source:       'fallback',
  }
}

// ── TINYMAN DEEP LINK ─────────────────────────────────────────────────
// When Tinyman pool has no liquidity, send user directly to Tinyman UI

export function getTinymanDeepLink(asset: TradeAsset, side: TradeSide): string {
  const metalAsaId = asset === 'gold' ? ASSET_IDS.MCAU : ASSET_IDS.MSOS
  if (side === 'buy') {
    return `https://app.tinyman.org/#/swap?asset_in=0&asset_out=${metalAsaId}`
  } else {
    return `https://app.tinyman.org/#/swap?asset_in=${metalAsaId}&asset_out=0`
  }
}

// ── ASA OPT-IN ─────────────────────────────────────────────────────────
// Users must opt-in to MCAU/MSOS ASAs before receiving them in a swap

export async function isOptedIntoASA(
  walletAddr: string,
  asset:      TradeAsset,
): Promise<boolean> {
  try {
    const asaId  = MELD_ASSETS[asset].asaId
    const info   = await algodClient.accountInformation(walletAddr).do()
    const assets = info.assets ?? []
    return assets.some((a: any) => Number(a.assetId) === asaId)
  } catch {
    return false
  }
}

export async function buildASAOptInTx(
  walletAddr: string,
  asset:      TradeAsset,
): Promise<algosdk.Transaction> {
  const asaId           = MELD_ASSETS[asset].asaId
  const suggestedParams = await algodClient.getTransactionParams().do()
  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender:          walletAddr,
    receiver:        walletAddr,
    assetIndex:      asaId,
    amount:          0,
    suggestedParams,
  })
}

// ── POOL PRICE (on-chain) ─────────────────────────────────────────────
/**
 * Fetch the live MCAU or MSOS price directly from the Tinyman pool.
 * This is the actual on-chain DEX price — useful for spread calculations.
 */
export async function getOnChainPoolPrice(asset: TradeAsset): Promise<number | null> {
  try {
    const metalAsaId = asset === 'gold' ? ASSET_IDS.MCAU : ASSET_IDS.MSOS
    const poolInfo   = await getPool(ASSET_IDS.ALGO, metalAsaId)
    if (!poolInfo) return null

    // Pool price = asset1 reserves / asset2 reserves (adjusted for decimals)
    const asset1Reserve = poolInfo.asset1Reserves
    const asset2Reserve = poolInfo.asset2Reserves
    if (!asset1Reserve || !asset2Reserve) return null

    const dec1 = ASSET_DECIMALS[ASSET_IDS.ALGO]
    const dec2 = ASSET_DECIMALS[metalAsaId]

    // Price of MCAU in ALGO
    const priceInAlgo = (Number(asset1Reserve) / 10 ** dec1) /
                        (Number(asset2Reserve) / 10 ** dec2)

    return priceInAlgo   // ALGO per gram — caller multiplies by ALGO/USD price
  } catch {
    return null
  }
}
