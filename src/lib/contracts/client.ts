/**
 * Aurum Oracle — Contract Client
 * TypeScript interface to the on-chain prediction market and XPC treasury contracts.
 * All methods return unsigned transactions for the wallet to sign via use-wallet-react.
 */

import algosdk from 'algosdk'
import { algodClient, encodeNote } from '@/lib/algorand'
import type { VoteSide } from '@/types'

// ── CONTRACT APP IDs ──────────────────────────────────────────────────
// Set these after deploying the contracts to mainnet

export const CONTRACT_IDS = {
  treasury:       parseInt(process.env.NEXT_PUBLIC_TREASURY_APP_ID  ?? '0'),
  marketRegistry: parseInt(process.env.NEXT_PUBLIC_REGISTRY_APP_ID  ?? '0'),
  xpcAsaId:       parseInt(process.env.NEXT_PUBLIC_XPC_ASA_ID       ?? '0'),
  mcauAsaId:      6547014,
  msosAsaId:      137594422,
}

// Platform fee wallet (xpc.algo treasury address)
export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS ?? ''

// ── MARKET STATE ──────────────────────────────────────────────────────

export interface MarketOnChainState {
  question:   string
  closesAt:   number
  status:     0 | 1 | 2           // open | closed | resolved
  yesPool:    number              // XPC staked YES (raw, 6 decimals)
  noPool:     number
  outcome:    0 | 1 | 2           // none | YES | NO
}

export async function readMarketState(appId: number): Promise<MarketOnChainState | null> {
  try {
    const state = await algodClient.getApplicationByID(appId).do()
    const gs    = state.params.globalState ?? []
    const kv    = new Map(gs.map((e: any) => [
      new TextDecoder().decode(e.key),
      e.value,
    ]))

    const get = (k: string) => kv.get(k) as any
    return {
      question: new TextDecoder().decode(get('question')?.bytes ?? new Uint8Array()),
      closesAt: Number(get('closes_at')?.uint ?? 0),
      status:   Number(get('status')?.uint ?? 0) as 0 | 1 | 2,
      yesPool:  Number(get('yes_pool')?.uint ?? 0),
      noPool:   Number(get('no_pool')?.uint  ?? 0),
      outcome:  Number(get('outcome')?.uint ?? 0) as 0 | 1 | 2,
    }
  } catch {
    return null
  }
}

// ── USER MARKET STATE ─────────────────────────────────────────────────

export interface UserMarketState {
  yesStake: number
  noStake:  number
  claimed:  boolean
}

export async function readUserMarketState(
  appId:   number,
  address: string
): Promise<UserMarketState | null> {
  try {
    const info = await algodClient.accountApplicationInformation(address, appId).do()
    const ls   = ((info.appLocalState as any)?.keyValue ?? []) as Array<any>
    const kv   = new Map(ls.map((e: any) => [new TextDecoder().decode(e.key), e.value]))
    return {
      yesStake: Number(kv.get('yes_stake')?.uint ?? 0),
      noStake:  Number(kv.get('no_stake')?.uint  ?? 0),
      claimed:  Number(kv.get('claimed')?.uint  ?? 0) === 1,
    }
  } catch {
    return null
  }
}

// ── BUILD VOTE TRANSACTION GROUP ──────────────────────────────────────
/**
 * Builds an atomic group of 2 transactions for voting:
 *   Tx 0: ApplicationCall to market contract ["vote", side]
 *   Tx 1: AssetTransfer of XPC from user to contract
 *
 * Returns unsigned txns — pass to wallet.signTransaction() via use-wallet-react.
 */
export async function buildVoteTxns(
  appId:       number,
  senderAddr:  string,
  side:        VoteSide,
  stakeXPC:    number        // in whole XPC (will be multiplied by 10^6)
): Promise<algosdk.Transaction[]> {
  const suggestedParams = await algodClient.getTransactionParams().do()
  const contractAddr    = algosdk.getApplicationAddress(appId)
  const stakeRaw        = Math.floor(stakeXPC * 1_000_000)   // 6 decimal places

  const appCallTx = algosdk.makeApplicationNoOpTxnFromObject({
    sender:            senderAddr,
    appIndex:          appId,
    appArgs:           [
      new TextEncoder().encode('vote'),
      new TextEncoder().encode(side),
    ],
    // Also record vote in note field for indexer
    note: encodeNote({ type: 'vote', marketId: appId.toString(), side, stakeXPC: stakeRaw }),
    suggestedParams:   { ...suggestedParams, fee: 2000 },   // extra fee for inner txns
  })

  const xferTx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender:    senderAddr,
    receiver:  contractAddr,
    assetIndex: CONTRACT_IDS.xpcAsaId,
    amount:    stakeRaw,
    suggestedParams,
  })

  // Group them atomically
  const group = algosdk.assignGroupID([appCallTx, xferTx])
  return group
}

// ── OPT IN TO MARKET ──────────────────────────────────────────────────

export async function buildMarketOptInTx(
  appId:      number,
  senderAddr: string
): Promise<algosdk.Transaction> {
  const suggestedParams = await algodClient.getTransactionParams().do()
  return algosdk.makeApplicationOptInTxnFromObject({
    sender:          senderAddr,
    appIndex:        appId,
    suggestedParams,
  })
}

// ── CLAIM PAYOUT ──────────────────────────────────────────────────────

export async function buildClaimTx(
  appId:      number,
  senderAddr: string
): Promise<algosdk.Transaction> {
  const suggestedParams = await algodClient.getTransactionParams().do()
  return algosdk.makeApplicationNoOpTxnFromObject({
    sender:          senderAddr,
    appIndex:        appId,
    appArgs:         [new TextEncoder().encode('claim')],
    suggestedParams: { ...suggestedParams, fee: 3000 },   // fee covers inner txn
  })
}

// ── TRADE FEE ROUTING ─────────────────────────────────────────────────
/**
 * When a user buys/sells MCAU or MSOS via Meld Gold, we collect 0.7% fee.
 * This builds the fee transfer to the treasury address.
 *
 * In production this is an additional tx in the Meld atomic group,
 * or a separate post-trade fee transfer.
 */
export async function buildFeeTransferTx(
  senderAddr: string,
  feeAmountALGO: number   // fee in microALGO (platform fee converted to ALGO)
): Promise<algosdk.Transaction> {
  const suggestedParams = await algodClient.getTransactionParams().do()
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender:          senderAddr,
    receiver:        TREASURY_ADDRESS,
    amount:          Math.floor(feeAmountALGO * 1_000_000),   // convert to microALGO
    note:            new TextEncoder().encode('AO/v1/' + JSON.stringify({ type: 'trade_fee' })),
    suggestedParams,
  })
}

// ── PAYOUT CALCULATOR ─────────────────────────────────────────────────
/**
 * Calculate a user's expected payout before claiming.
 * Mirrors the smart contract logic for UI display.
 */
export function calcExpectedPayout(
  state:      MarketOnChainState,
  userState:  UserMarketState,
  feeBps      = 70,
  burnBps     = 25,
): number {
  const netBps    = 10_000 - feeBps - burnBps   // 9905
  const { yesPool, noPool, outcome } = state

  if (outcome === 0) return 0   // not resolved

  if (outcome === 1 && userState.yesStake > 0) {
    const netNoPool = (noPool * netBps) / 10_000
    return userState.yesStake + (userState.yesStake * netNoPool) / yesPool
  }
  if (outcome === 2 && userState.noStake > 0) {
    const netYesPool = (yesPool * netBps) / 10_000
    return userState.noStake + (userState.noStake * netYesPool) / noPool
  }
  return 0   // on wrong side
}

// ── XPC TOKEN DECIMALS ────────────────────────────────────────────────

export const XPC_DECIMALS = 6

export function rawToXPC(raw: number):  number { return raw / 10 ** XPC_DECIMALS }
export function xpcToRaw(xpc: number):  number { return Math.floor(xpc * 10 ** XPC_DECIMALS) }
