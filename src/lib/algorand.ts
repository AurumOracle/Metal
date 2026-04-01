import algosdk from 'algosdk'
import type { NFDProfile, Comment, Vote } from '@/types'

// ── ALGORAND CLIENTS ───────────────────────────────────────────────────
// Using Algonode free public endpoints — no API key required for mainnet

const ALGOD_SERVER   = process.env.NEXT_PUBLIC_ALGOD_SERVER   ?? 'https://mainnet-api.algonode.cloud'
const ALGOD_PORT     = parseInt(process.env.NEXT_PUBLIC_ALGOD_PORT ?? '443')
const ALGOD_TOKEN    = process.env.NEXT_PUBLIC_ALGOD_TOKEN    ?? ''

const INDEXER_SERVER = process.env.NEXT_PUBLIC_INDEXER_SERVER ?? 'https://mainnet-idx.algonode.cloud'
const INDEXER_PORT   = parseInt(process.env.NEXT_PUBLIC_INDEXER_PORT ?? '443')

export const algodClient   = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
export const indexerClient = new algosdk.Indexer(ALGOD_TOKEN, INDEXER_SERVER, INDEXER_PORT)

// ── NFD API ────────────────────────────────────────────────────────────
// Docs: https://api-docs.nf.domains
// Views: tiny | thumbnail | brief (default) | full
// thumbnail = tiny + avatar links, ideal for UI display

const NFD_API    = 'https://api.nf.domains'
const XPC_PARENT = 'xpc.algo'

// Raw NFD API response shapes (from OpenAPI spec)
interface NFDApiEntry {
  name:           string
  owner?:         string
  depositAccount?: string
  state?:         string
  category?:      string
  parentAppID?:   number
  properties?: {
    userDefined?: {
      avatar?: string
      bio?:    string
      twitter?: string
      discord?: string
      website?: string
    }
    verified?: {
      caAlgo?: string
    }
  }
  caAlgo?:           string[]
  unverifiedCaAlgo?: string[]
}

function parseNFDEntry(entry: NFDApiEntry, address: string): NFDProfile {
  return {
    name:      entry.name,
    address:   entry.owner ?? entry.depositAccount ?? address,
    avatarUrl: entry.properties?.userDefined?.avatar,
    bio:       entry.properties?.userDefined?.bio,
    verified:  entry.state === 'owned',
    isSegment: entry.parentAppID != null, // segments have a parentAppID
    twitter:   entry.properties?.userDefined?.twitter,
    website:   entry.properties?.userDefined?.website,
  }
}

/**
 * Resolve an Algorand wallet address to its NFD profile.
 * Uses the /nfd/lookup endpoint which accepts multiple addresses.
 * Returns null if no NFD is found.
 */
export async function resolveNFD(walletAddress: string): Promise<NFDProfile | null> {
  try {
    const url = `${NFD_API}/nfd/lookup?address=${walletAddress}&view=thumbnail`
    const res = await fetch(url, {
      next:    { revalidate: 300 },      // cache 5 min
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const data: Record<string, NFDApiEntry> = await res.json()
    const entry = data[walletAddress]
    if (!entry) return null
    return parseNFDEntry(entry, walletAddress)
  } catch {
    return null
  }
}

/**
 * Resolve multiple wallet addresses to NFD profiles in one API call.
 * More efficient than calling resolveNFD() in a loop.
 */
export async function resolveNFDBulk(
  addresses: string[]
): Promise<Map<string, NFDProfile>> {
  const result = new Map<string, NFDProfile>()
  if (addresses.length === 0) return result
  try {
    const params = addresses.map(a => `address=${a}`).join('&')
    const res = await fetch(`${NFD_API}/nfd/lookup?${params}&view=thumbnail`, {
      next:    { revalidate: 300 },
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return result
    const data: Record<string, NFDApiEntry> = await res.json()
    for (const [addr, entry] of Object.entries(data)) {
      result.set(addr, parseNFDEntry(entry, addr))
    }
  } catch { /* return empty map */ }
  return result
}

/**
 * Fetch an NFD by its full name (e.g. "john.xpc.algo")
 */
export async function lookupNFDByName(name: string): Promise<NFDProfile | null> {
  try {
    const res = await fetch(
      `${NFD_API}/nfd/${encodeURIComponent(name)}?view=thumbnail`,
      { next: { revalidate: 300 }, headers: { 'Accept': 'application/json' } }
    )
    if (!res.ok) return null
    const data: NFDApiEntry = await res.json()
    return parseNFDEntry(data, data.owner ?? '')
  } catch {
    return null
  }
}

/**
 * List all xpc.algo segments (users who have minted a segment).
 * Uses the /nfd/browse endpoint filtered by parentAppID of xpc.algo.
 */
export async function listXPCSegments(limit = 20): Promise<NFDProfile[]> {
  try {
    const res = await fetch(
      `${NFD_API}/nfd/browse?parentAppID=xpc.algo&view=thumbnail&limit=${limit}`,
      { next: { revalidate: 60 }, headers: { 'Accept': 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.nfds ?? []).map((e: NFDApiEntry) => parseNFDEntry(e, e.owner ?? ''))
  } catch {
    return []
  }
}

/**
 * Build the NF.Domains URL to mint a xpc.algo segment.
 */
export function getXPCSegmentMintURL(desiredHandle?: string): string {
  const base = `https://app.nf.domains/name/${XPC_PARENT}?view=segments`
  if (desiredHandle) {
    const safe = desiredHandle.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 28)
    return `${base}&mint=${safe}`
  }
  return base
}

// ── ASA BALANCES ───────────────────────────────────────────────────────

export async function getASABalance(
  walletAddress: string,
  asaId: number
): Promise<number> {
  try {
    const info = await algodClient.accountInformation(walletAddress).do()
    const asset = (info.assets ?? []).find(
      (a: any) => Number(a.assetId) === asaId
    )
    return Number(asset?.amount ?? 0)
  } catch {
    return 0
  }
}

export async function getXPCBalance(walletAddress: string): Promise<number> {
  const XPC_ASA_ID = parseInt(process.env.NEXT_PUBLIC_XPC_ASA_ID ?? '0')
  if (!XPC_ASA_ID) return 0
  return getASABalance(walletAddress, XPC_ASA_ID)
}

// ── NOTE FIELD — COMMENT & VOTE STORAGE ───────────────────────────────
// Protocol: all Aurum Oracle on-chain data uses the prefix "AO/v1/"
// This makes it queryable via AlgoIndexer notePrefix search.
//
// Comment tx: zero-ALGO payment, sender = commenter, receiver = self
//   note = "AO/v1/" + JSON({ type:"comment", marketId, body, replyTo? })
//
// Vote tx: routed through the market smart contract
//   note = "AO/v1/" + JSON({ type:"vote", marketId, side, stakeXPC })

export const NOTE_PREFIX      = 'AO/v1/'
export const NOTE_PREFIX_B64  = Buffer.from(NOTE_PREFIX).toString('base64')
export const MAX_NOTE_BYTES   = 1024

export type NotePayload =
  | { type: 'comment'; marketId: string; body: string; replyTo?: string }
  | { type: 'vote';    marketId: string; side: 'yes' | 'no'; stakeXPC: number }
  | { type: 'like';    marketId: string; commentTxId: string }

export function encodeNote(payload: NotePayload): Uint8Array {
  const json  = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(NOTE_PREFIX + json)
  if (bytes.length > MAX_NOTE_BYTES) {
    throw new Error(`Note too large: ${bytes.length} bytes (max ${MAX_NOTE_BYTES})`)
  }
  return bytes
}

export function decodeNote(noteBytes: Uint8Array): NotePayload | null {
  try {
    const str = new TextDecoder().decode(noteBytes)
    if (!str.startsWith(NOTE_PREFIX)) return null
    return JSON.parse(str.slice(NOTE_PREFIX.length)) as NotePayload
  } catch {
    return null
  }
}

// ── INDEXER — FETCH COMMENTS FOR A MARKET ─────────────────────────────

interface RawAlgoTx {
  id:        string
  sender:    string
  note?:     string            // base64 encoded
  'round-time'?: number
}

export async function fetchMarketComments(
  marketId: string,
  limit    = 50
): Promise<Comment[]> {
  try {
    const prefixBytes = Buffer.from(NOTE_PREFIX)
    const txns = await indexerClient
      .searchForTransactions()
      .notePrefix(prefixBytes)
      .limit(limit)
      .do()

    const comments: Comment[] = []
    const nfdCache = new Map<string, NFDProfile | null>()

    for (const tx of (txns.transactions ?? []) as RawAlgoTx[]) {
      if (!tx.note) continue
      const noteBytes = Buffer.from(tx.note, 'base64')
      const payload   = decodeNote(new Uint8Array(noteBytes))
      if (!payload || payload.type !== 'comment') continue
      if (payload.marketId !== marketId) continue

      // Resolve NFD for sender (cached)
      if (!nfdCache.has(tx.sender)) {
        nfdCache.set(tx.sender, await resolveNFD(tx.sender))
      }
      const nfd = nfdCache.get(tx.sender) ?? null

      comments.push({
        id:          tx.id,
        marketId:    payload.marketId,
        walletAddr:  tx.sender,
        nfdName:     nfd?.name,
        body:        payload.body,
        likes:       0,           // likes fetched separately via like txns
        txId:        tx.id,
        timestamp:   tx['round-time']
          ? new Date(tx['round-time'] * 1000).toISOString()
          : new Date().toISOString(),
        replies:     [],
        replyToId:   payload.replyTo,
      })
    }

    // Nest replies under parent comments
    return nestComments(comments)
  } catch (err) {
    console.error('fetchMarketComments error:', err)
    return []
  }
}

function nestComments(flat: Comment[]): Comment[] {
  const map = new Map(flat.map(c => [c.id, { ...c, replies: [] as Comment[] }]))
  const roots: Comment[] = []
  for (const c of map.values()) {
    if (c.replyToId && map.has(c.replyToId)) {
      map.get(c.replyToId)!.replies.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}

// ── INDEXER — FETCH VOTES FOR A MARKET ────────────────────────────────

export async function fetchMarketVotes(marketId: string): Promise<Vote[]> {
  try {
    const prefixBytes = Buffer.from(NOTE_PREFIX)
    const txns = await indexerClient
      .searchForTransactions()
      .notePrefix(prefixBytes)
      .limit(200)
      .do()

    const votes: Vote[] = []
    for (const tx of (txns.transactions ?? []) as RawAlgoTx[]) {
      if (!tx.note) continue
      const noteBytes = Buffer.from(tx.note, 'base64')
      const payload   = decodeNote(new Uint8Array(noteBytes))
      if (!payload || payload.type !== 'vote') continue
      if (payload.marketId !== marketId) continue
      votes.push({
        marketId:   payload.marketId,
        walletAddr: tx.sender,
        side:       payload.side,
        stakeXPC:   payload.stakeXPC,
        txId:       tx.id,
        timestamp:  tx['round-time']
          ? new Date(tx['round-time'] * 1000).toISOString()
          : new Date().toISOString(),
      })
    }
    return votes
  } catch {
    return []
  }
}

// ── BUILD COMMENT TX (for signing by wallet) ───────────────────────────

export async function buildCommentTx(
  senderAddress: string,
  payload: Extract<NotePayload, { type: 'comment' }>
): Promise<algosdk.Transaction> {
  const suggestedParams = await algodClient.getTransactionParams().do()
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender:         senderAddress,
    receiver:       senderAddress,   // self-send
    amount:         0,
    note:           encodeNote(payload),
    suggestedParams,
  })
}

// ── TX EXPLORER ────────────────────────────────────────────────────────

export const EXPLORER_BASE = 'https://allo.info'

export function txExplorerLink(txId: string): string {
  return `${EXPLORER_BASE}/tx/${txId}`
}

export function addressExplorerLink(address: string): string {
  return `${EXPLORER_BASE}/account/${address}`
}

export function truncateAddress(addr: string, chars = 6): string {
  if (!addr) return ''
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`
}

export function truncateTxId(txId: string, chars = 8): string {
  if (!txId) return ''
  return `${txId.slice(0, chars)}…`
}
