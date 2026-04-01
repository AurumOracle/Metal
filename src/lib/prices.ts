import type { SpotPrice, MeldTokenPrice, PriceApiResponse } from '@/types'
import { TROY_OZ_TO_GRAMS } from '@/types'

// ── PRICE SOURCE PRIORITY ─────────────────────────────────────────────
// 1. GoldAPI.io     — spot metals (XAU, XAG, XPT, XPD) — recommended
// 2. Metals-API     — fallback spot source
// 3. CoinGecko      — PAXG, XAUT, MCAU token prices (free tier)
// 4. AlgoNode       — MCAU/MSOS on-chain via ASA metadata

// ── GOLDAPI.IO INTEGRATION ────────────────────────────────────────────
// Signup: https://www.goldapi.io — free tier: 1000 req/month
// Headers: x-access-token: YOUR_KEY
// GET https://www.goldapi.io/api/XAU/USD

interface GoldAPIResponse {
  timestamp:   number
  metal:       string
  currency:    string
  price:       number
  ch:          number    // change amount
  chp:         number    // change percent
}

async function fetchGoldAPI(symbol: 'XAU' | 'XAG' | 'XPT' | 'XPD'): Promise<{ price: number; change: number } | null> {
  const key = process.env.GOLDAPI_KEY
  if (!key) return null
  try {
    const res = await fetch(`https://www.goldapi.io/api/${symbol}/USD`, {
      headers: { 'x-access-token': key, 'Content-Type': 'application/json' },
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const data: GoldAPIResponse = await res.json()
    return { price: data.price, change: data.chp }
  } catch {
    return null
  }
}

// ── COINGECKO INTEGRATION ─────────────────────────────────────────────
// Free tier: 30 req/min, no key required for public endpoints
// Pro: https://www.coingecko.com/api — key in header x-cg-pro-api-key

interface CoinGeckoPrice {
  usd:              number
  usd_24h_change?:  number
}

async function fetchCoinGecko(
  ids: string[]
): Promise<Record<string, CoinGeckoPrice>> {
  try {
    const key = process.env.COINGECKO_API_KEY
    const base = key
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3'
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (key) headers['x-cg-pro-api-key'] = key

    const res = await fetch(
      `${base}/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      { headers, next: { revalidate: 60 } }
    )
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

// CoinGecko IDs for our tokens
const COINGECKO_IDS = {
  PAXG: 'pax-gold',
  XAUT: 'tether-gold',
  MCAU: 'meld-gold',       // MCAU on CoinGecko
} as const

// ── FALLBACK PRICES ────────────────────────────────────────────────────
// Used when APIs are unavailable — last known reasonable values

const FALLBACK: Record<string, number> = {
  XAU: 3142.80, XAG:  33.42, XPT:  984.10, XPD: 1042.50,
  XRH: 4820.00, XIR: 5200.00,
  Cu:  4.82,    Al:   1.18,   Zn:   1.38,   Ni:  7.14,
  Pb:  0.95,    Sn:  13.20,
}

// ── MAIN PRICE FETCHER ────────────────────────────────────────────────

export async function fetchPrices(): Promise<PriceApiResponse> {
  // Fetch precious metals from GoldAPI (or fall back to hardcoded)
  const [xau, xag, xpt, xpd] = await Promise.all([
    fetchGoldAPI('XAU'),
    fetchGoldAPI('XAG'),
    fetchGoldAPI('XPT'),
    fetchGoldAPI('XPD'),
  ])

  const spotPrices = {
    XAU: xau?.price ?? FALLBACK.XAU,
    XAG: xag?.price ?? FALLBACK.XAG,
    XPT: xpt?.price ?? FALLBACK.XPT,
    XPD: xpd?.price ?? FALLBACK.XPD,
  }

  // Fetch token prices from CoinGecko
  const geckoData = await fetchCoinGecko(Object.values(COINGECKO_IDS))

  const paxgPrice = geckoData[COINGECKO_IDS.PAXG]?.usd ?? spotPrices.XAU * 0.9994
  const xautPrice = geckoData[COINGECKO_IDS.XAUT]?.usd ?? spotPrices.XAU * 0.9997
  const mcauSpot  = geckoData[COINGECKO_IDS.MCAU]?.usd
    ? geckoData[COINGECKO_IDS.MCAU].usd * TROY_OZ_TO_GRAMS   // CoinGecko gives per-gram, convert to ozt
    : spotPrices.XAU

  const now = new Date().toISOString()

  const metals: SpotPrice[] = [
    { symbol:'XAU', priceUSD: spotPrices.XAU, change24h: xau?.change ?? 0,  updatedAt: now },
    { symbol:'XAG', priceUSD: spotPrices.XAG, change24h: xag?.change ?? 0,  updatedAt: now },
    { symbol:'XPT', priceUSD: spotPrices.XPT, change24h: xpt?.change ?? 0,  updatedAt: now },
    { symbol:'XPD', priceUSD: spotPrices.XPD, change24h: xpd?.change ?? 0,  updatedAt: now },
    { symbol:'XRH', priceUSD: FALLBACK.XRH,   change24h: 0.20,              updatedAt: now },
    { symbol:'XIR', priceUSD: FALLBACK.XIR,   change24h: 0.00,              updatedAt: now },
    { symbol:'Cu',  priceUSD: FALLBACK.Cu,    change24h: 0.44,              updatedAt: now },
    { symbol:'Al',  priceUSD: FALLBACK.Al,    change24h: -0.15,             updatedAt: now },
    { symbol:'Zn',  priceUSD: FALLBACK.Zn,    change24h: -0.18,             updatedAt: now },
    { symbol:'Ni',  priceUSD: FALLBACK.Ni,    change24h: 0.62,              updatedAt: now },
    { symbol:'Pb',  priceUSD: FALLBACK.Pb,    change24h: 0.10,              updatedAt: now },
    { symbol:'Sn',  priceUSD: FALLBACK.Sn,    change24h: 0.38,              updatedAt: now },
  ]

  const tokens: MeldTokenPrice[] = [
    {
      symbol:       'MCAU',
      spotTroyOz:   mcauSpot,
      pricePerGram: +(mcauSpot / TROY_OZ_TO_GRAMS).toFixed(6),
      change24h:    xau?.change ?? 0,
      asaId:        6547014,
      chain:        'algorand',
    },
    {
      symbol:       'MSOS',
      spotTroyOz:   spotPrices.XAG,
      pricePerGram: +(spotPrices.XAG / TROY_OZ_TO_GRAMS).toFixed(6),
      change24h:    xag?.change ?? 0,
      asaId:        137594422,
      chain:        'algorand',
    },
    {
      symbol:       'PAXG',
      spotTroyOz:   paxgPrice,
      pricePerGram: +(paxgPrice / TROY_OZ_TO_GRAMS).toFixed(6),
      change24h:    geckoData[COINGECKO_IDS.PAXG]?.usd_24h_change ?? 0,
      asaId:        0,
      chain:        'algorand',
    },
    {
      symbol:       'XAUT',
      spotTroyOz:   xautPrice,
      pricePerGram: +(xautPrice / TROY_OZ_TO_GRAMS).toFixed(6),
      change24h:    geckoData[COINGECKO_IDS.XAUT]?.usd_24h_change ?? 0,
      asaId:        0,
      chain:        'xrpl',
    },
  ]

  return {
    metals,
    tokens,
    ratios: {
      goldSilver: +(spotPrices.XAU / spotPrices.XAG).toFixed(2),
      goldOil:    +(spotPrices.XAU / 74.20).toFixed(2),
    },
  }
}

// ── SPREAD CALCULATOR ─────────────────────────────────────────────────

export function calcSpread(
  tokenPricePerGram: number,
  spotTroyOz: number
): { spreadGram: number; spreadPct: number } {
  const spotPerGram = spotTroyOz / TROY_OZ_TO_GRAMS
  const spreadGram  = +(tokenPricePerGram - spotPerGram).toFixed(6)
  const spreadPct   = +((spreadGram / spotPerGram) * 100).toFixed(4)
  return { spreadGram, spreadPct }
}

// ── FORMATTERS ────────────────────────────────────────────────────────

export function formatUSD(price: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price)
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export function changeClass(change: number): string {
  if (change > 0) return 'text-up'
  if (change < 0) return 'text-down'
  return 'text-muted'
}

// Compact number formatter for large values
export function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}
