// Core types for Aurum Oracle platform

export type PricePoint = {
  asset: 'MCAU' | 'MSOS' | 'PAXG' | 'XAUT' | 'SPOT_GOLD' | 'SPOT_SILVER'
  price: number // per gram
  timestamp: number
  source: string
}

export type Market = {
  id: string
  question: string
  closes_at: number
  resolved_at?: number
  outcome?: 'YES' | 'NO' | null
  yes_pool: number
  no_pool: number
  status: 'OPEN' | 'CLOSED' | 'RESOLVED'
  category: string
}

export type UserProfile = {
  address: string
  nfd?: string
  xpc_balance: number
  rank: 'Apprentice Assayer' | 'Junior Assayer' | 'Assayer' | 'Senior Assayer' | 'Master Assayer' | 'Alchemist' | 'Grand Alchemist' | 'Oracle of the Vault'
  xp: number
  streak: number
  created_at: number
}

export type Comment = {
  id: string
  market_id: string
  author: string
  author_nfd?: string
  vote: 'YES' | 'NO'
  content: string
  likes: number
  txn_id: string
  timestamp: number
  replies?: Comment[]
}

export type Vote = {
  id: string
  market_id: string
  user: string
  vote: 'YES' | 'NO'
  amount: number
  timestamp: number
}

export type TradeQuote = {
  asset: 'MCAU' | 'MSOS'
  amount: number // grams
  price_per_gram: number
  subtotal: number
  platform_fee: number // 0.7%
  protocol_fee: number // ~0.1%
  total: number
  slippage_percent: number
}

export function buildQuote(asset: 'MCAU' | 'MSOS', grams: number, spotPrice: number): TradeQuote {
  const price_per_gram = spotPrice
  const subtotal = grams * price_per_gram
  const platform_fee = subtotal * 0.007 // 0.7%
  const protocol_fee = subtotal * 0.001 // ~0.1%
  const total = subtotal + platform_fee + protocol_fee

  return {
    asset,
    amount: grams,
    price_per_gram,
    subtotal,
    platform_fee,
    protocol_fee,
    total,
    slippage_percent: 0.5,
  }
}

export function getRank(xp: number): UserProfile['rank'] {
  if (xp >= 50000) return 'Oracle of the Vault'
  if (xp >= 40000) return 'Grand Alchemist'
  if (xp >= 30000) return 'Alchemist'
  if (xp >= 20000) return 'Master Assayer'
  if (xp >= 10000) return 'Senior Assayer'
  if (xp >= 5000) return 'Assayer'
  if (xp >= 1000) return 'Junior Assayer'
  return 'Apprentice Assayer'
}

export type TxSigner = (txns: any[]) => Promise<Uint8Array[]>
