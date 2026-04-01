// ── METALS & PRICES ───────────────────────────────────────────────────

export const TROY_OZ_TO_GRAMS = 31.1035

export type MetalSymbol =
  | 'XAU' | 'XAG' | 'XPT' | 'XPD' | 'XRH' | 'XIR'
  | 'Cu'  | 'Al'  | 'Zn'  | 'Ni'  | 'Pb'  | 'Sn'

export type TokenSymbol = 'MCAU' | 'MSOS' | 'PAXG' | 'XAUT'

export interface SpotPrice {
  symbol:    string
  priceUSD:  number          // per troy oz for metals, per gram for Meld tokens
  change24h: number          // percentage
  updatedAt: string          // ISO timestamp
}

export interface MeldTokenPrice {
  symbol:      TokenSymbol
  pricePerGram: number       // USD per gram  = spotTroyOz / TROY_OZ_TO_GRAMS
  spotTroyOz:  number        // underlying spot price per troy oz
  change24h:   number
  asaId:       number        // Algorand Standard Asset ID
  chain:       'algorand' | 'xrpl'
}

export const MELD_ASSETS: Record<'gold' | 'silver', Omit<MeldTokenPrice, 'pricePerGram' | 'spotTroyOz' | 'change24h'>> = {
  gold:   { symbol: 'MCAU', asaId: 6547014,   chain: 'algorand' },
  silver: { symbol: 'MSOS', asaId: 137594422, chain: 'algorand' },
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL'
export type ChartView = 'line' | 'area' | 'bar'

export interface OHLCV {
  timestamp: number
  open:      number
  high:      number
  low:       number
  close:     number
  volume:    number
}

// ── TRADE ─────────────────────────────────────────────────────────────

export type TradeSide = 'buy' | 'sell'
export type TradeAsset = 'gold' | 'silver'

export interface TradeQuote {
  asset:        TradeAsset
  symbol:       TokenSymbol
  side:         TradeSide
  amountGrams:  number
  amountTroyOz: number       // amountGrams / TROY_OZ_TO_GRAMS
  spotPerGram:  number
  spotPerTroyOz: number
  subtotal:     number       // amountGrams * spotPerGram
  platformFee:  number       // subtotal * 0.007  → xpc.algo treasury
  meldFee:      number       // subtotal * 0.001  → Meld protocol
  total:        number       // subtotal + platformFee + meldFee
  feePercent:   0.007        // immutable
}

export function buildQuote(
  asset: TradeAsset,
  side: TradeSide,
  amountGrams: number,
  spotTroyOz: number,
): TradeQuote {
  const symbol = asset === 'gold' ? 'MCAU' : 'MSOS'
  const spotPerGram   = +(spotTroyOz / TROY_OZ_TO_GRAMS).toFixed(6)
  const amountTroyOz  = +(amountGrams / TROY_OZ_TO_GRAMS).toFixed(6)
  const subtotal      = +(amountGrams * spotPerGram).toFixed(6)
  const platformFee   = +(subtotal * 0.007).toFixed(6)
  const meldFee       = +(subtotal * 0.001).toFixed(6)
  const total         = +(subtotal + platformFee + meldFee).toFixed(6)
  return { asset, symbol, side, amountGrams, amountTroyOz, spotPerGram, spotPerTroyOz: spotTroyOz, subtotal, platformFee, meldFee, total, feePercent: 0.007 }
}

// ── PREDICTION MARKET ─────────────────────────────────────────────────

export type MarketStatus = 'open' | 'closed' | 'resolved'
export type VoteSide = 'yes' | 'no'

export interface Market {
  id:          string
  question:    string
  tag:         string
  closesAt:    string        // ISO timestamp
  status:      MarketStatus
  yesPct:      number        // 0–100
  noPct:       number
  totalVotes:  number
  xpcReward:   number        // XPC awarded on correct call
  outcome?:    VoteSide      // set on resolution
  algoTxId?:   string        // on-chain tx that resolved the market
}

export interface Vote {
  marketId:    string
  walletAddr:  string
  nfdName?:    string        // e.g. "john.xpc.algo"
  side:        VoteSide
  stakeXPC:    number
  txId:        string        // Algorand tx ID
  timestamp:   string
}

export interface Comment {
  id:          string
  marketId:    string
  walletAddr:  string
  nfdName?:    string
  rankBadge?:  string
  voteSide?:   VoteSide      // shown alongside comment
  body:        string
  likes:       number
  txId:        string        // Algorand tx ID (note field)
  timestamp:   string
  replies:     Comment[]
  replyToId?:  string        // parent comment tx ID
}

// ── IDENTITY ──────────────────────────────────────────────────────────

export interface NFDProfile {
  name:         string        // e.g. "john.xpc.algo"
  address:      string        // Algorand wallet address
  avatarUrl?:   string
  bio?:         string
  twitter?:     string
  website?:     string
  verified:     boolean
  isSegment:    boolean       // true if *.xpc.algo
}

export interface UserProfile {
  walletAddress: string
  nfd?:          NFDProfile
  xpcBalance:    number
  rank:          PlayerRank
  totalXPC:      number       // all-time earned
  predictionHistory: Vote[]
}

export type PlayerRank =
  | 'Apprentice Assayer'
  | 'Junior Assayer'
  | 'Assayer'
  | 'Senior Assayer'
  | 'Master Assayer'
  | 'Alchemist'
  | 'Grand Alchemist'
  | 'Oracle of the Vault'

export const RANK_THRESHOLDS: Record<PlayerRank, number> = {
  'Apprentice Assayer':  0,
  'Junior Assayer':      250,
  'Assayer':             750,
  'Senior Assayer':      2000,
  'Master Assayer':      5000,
  'Alchemist':           12000,
  'Grand Alchemist':     30000,
  'Oracle of the Vault': 75000,
}

export function getRank(xpc: number): PlayerRank {
  const ranks = Object.entries(RANK_THRESHOLDS) as [PlayerRank, number][]
  return ranks.reduce((acc, [rank, threshold]) =>
    xpc >= threshold ? rank : acc,
    'Apprentice Assayer' as PlayerRank
  )
}

// ── XPC TOKEN ─────────────────────────────────────────────────────────

export interface XPCTokenStats {
  totalSupply:   number       // 100_000_000
  burned:        number
  circulating:   number       // totalSupply - burned
  priceUSD:      number
  marketCapUSD:  number
  saleProgress:  number       // 0–1 (fraction of public sale distributed)
}

// ── API RESPONSES ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:      T
  timestamp: string
  cached:    boolean
}

export interface PriceApiResponse {
  metals:  SpotPrice[]
  tokens:  MeldTokenPrice[]
  ratios: {
    goldSilver:  number
    goldOil:     number
  }
}
