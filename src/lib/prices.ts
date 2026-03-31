// Price feed aggregation from GoldAPI.io and CoinGecko

import type { PricePoint } from '@/types'

const TROY_OZ_TO_GRAMS = 31.1035

export async function fetchPrices(): Promise<Record<string, PricePoint>> {
  const now = Date.now() / 1000
  const prices: Record<string, PricePoint> = {}

  try {
    const goldApiKey = process.env.GOLDAPI_KEY
    if (!goldApiKey) throw new Error('GOLDAPI_KEY not set')

    // Spot metals from GoldAPI
    const resp = await fetch(`https://www.goldapi.io/api/XAU/USD`, {
      headers: { 'x-access-token': goldApiKey },
    })
    if (resp.ok) {
      const data = await resp.json()
      const spotGoldPerOz = data.price
      const spotGoldPerGram = spotGoldPerOz / TROY_OZ_TO_GRAMS

      prices['SPOT_GOLD'] = {
        asset: 'SPOT_GOLD',
        price: spotGoldPerGram, // per gram
        timestamp: now,
        source: 'GoldAPI',
      }

      // Derive MCAU price (1g = 1 token)
      prices['MCAU'] = {
        asset: 'MCAU',
        price: spotGoldPerGram,
        timestamp: now,
        source: 'GoldAPI',
      }
    }

    const respSilver = await fetch(`https://www.goldapi.io/api/XAG/USD`, {
      headers: { 'x-access-token': goldApiKey },
    })
    if (respSilver.ok) {
      const data = await respSilver.json()
      const spotSilverPerOz = data.price
      const spotSilverPerGram = spotSilverPerOz / TROY_OZ_TO_GRAMS

      prices['SPOT_SILVER'] = {
        asset: 'SPOT_SILVER',
        price: spotSilverPerGram, // per gram
        timestamp: now,
        source: 'GoldAPI',
      }

      prices['MSOS'] = {
        asset: 'MSOS',
        price: spotSilverPerGram,
        timestamp: now,
        source: 'GoldAPI',
      }
    }

    // Tokenized and derivatives from CoinGecko
    const coingecko = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=paxos-gold,tether-gold,wrapped-algorand&vs_currencies=usd`
    )
    if (coingecko.ok) {
      const data = await coingecko.json()
      // These are per unit, assume 1 unit ≈ 1 troy oz for now (PAXG, XAUT)
      if (data['paxos-gold']) {
        prices['PAXG'] = {
          asset: 'PAXG',
          price: (data['paxos-gold'].usd || 0) / TROY_OZ_TO_GRAMS,
          timestamp: now,
          source: 'CoinGecko',
        }
      }
      if (data['tether-gold']) {
        prices['XAUT'] = {
          asset: 'XAUT',
          price: (data['tether-gold'].usd || 0) / TROY_OZ_TO_GRAMS,
          timestamp: now,
          source: 'CoinGecko',
        }
      }
    }
  } catch (err) {
    console.error('Price fetch error:', err)
  }

  // Ensure all assets have a price (fallback)
  if (!prices['SPOT_GOLD'])
    prices['SPOT_GOLD'] = { asset: 'SPOT_GOLD', price: 101, timestamp: now, source: 'fallback' }
  if (!prices['SPOT_SILVER'])
    prices['SPOT_SILVER'] = { asset: 'SPOT_SILVER', price: 1.07, timestamp: now, source: 'fallback' }
  if (!prices['MCAU']) prices['MCAU'] = { asset: 'MCAU', price: 101, timestamp: now, source: 'fallback' }
  if (!prices['MSOS']) prices['MSOS'] = { asset: 'MSOS', price: 1.07, timestamp: now, source: 'fallback' }
  if (!prices['PAXG']) prices['PAXG'] = { asset: 'PAXG', price: 101, timestamp: now, source: 'fallback' }
  if (!prices['XAUT']) prices['XAUT'] = { asset: 'XAUT', price: 101, timestamp: now, source: 'fallback' }

  return prices
}
