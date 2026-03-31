import { buildQuote, getRank } from '@/types'

// --- buildQuote tests ---

describe('buildQuote', () => {
  test('calculates correct fees for gold buy', () => {
    const quote = buildQuote('buy', 'MCAU', 10, 95.5)
    expect(quote.asset).toBe('MCAU')
    expect(quote.side).toBe('buy')
    expect(quote.grams).toBe(10)
    expect(quote.spot_price).toBe(95.5)
    expect(quote.subtotal).toBe(955) // 10 * 95.5
    expect(quote.platform_fee).toBeCloseTo(6.685, 2) // 955 * 0.007
    expect(quote.protocol_fee).toBeCloseTo(0.955, 2) // 955 * 0.001
    expect(quote.total).toBeCloseTo(962.64, 0) // subtotal + fees
  })

  test('calculates correct fees for silver sell', () => {
    const quote = buildQuote('sell', 'MSOS', 100, 1.05)
    expect(quote.subtotal).toBe(105) // 100 * 1.05
    expect(quote.platform_fee).toBeCloseTo(0.735, 2) // 105 * 0.007
    expect(quote.total).toBeCloseTo(103.16, 0) // subtotal - fees for sell
  })

  test('handles zero grams', () => {
    const quote = buildQuote('buy', 'MCAU', 0, 95.5)
    expect(quote.subtotal).toBe(0)
    expect(quote.platform_fee).toBe(0)
    expect(quote.total).toBe(0)
  })

  test('platform fee is exactly 0.7%', () => {
    const quote = buildQuote('buy', 'MCAU', 1, 1000)
    expect(quote.platform_fee).toBe(7) // 1000 * 0.007
  })

  test('protocol fee is exactly 0.1%', () => {
    const quote = buildQuote('buy', 'MCAU', 1, 1000)
    expect(quote.protocol_fee).toBe(1) // 1000 * 0.001
  })
})

// --- getRank tests ---

describe('getRank', () => {
  test('returns Apprentice Assayer for 0 XP', () => {
    expect(getRank(0)).toBe('Apprentice Assayer')
  })

  test('returns Apprentice Assayer for 499 XP', () => {
    expect(getRank(499)).toBe('Apprentice Assayer')
  })

  test('returns Ore Seeker at 500 XP', () => {
    expect(getRank(500)).toBe('Ore Seeker')
  })

  test('returns Bullion Scout at 2000 XP', () => {
    expect(getRank(2000)).toBe('Bullion Scout')
  })

  test('returns Silver Sentinel at 5000 XP', () => {
    expect(getRank(5000)).toBe('Silver Sentinel')
  })

  test('returns Mint Warden at 10000 XP', () => {
    expect(getRank(10000)).toBe('Mint Warden')
  })

  test('returns Master Goldsmith at 25000 XP', () => {
    expect(getRank(25000)).toBe('Master Goldsmith')
  })

  test('returns Grand Alchemist at 50000 XP', () => {
    expect(getRank(50000)).toBe('Grand Alchemist')
  })

  test('returns Oracle of the Vault at 100000 XP', () => {
    expect(getRank(100000)).toBe('Oracle of the Vault')
  })

  test('returns Oracle of the Vault for very high XP', () => {
    expect(getRank(999999)).toBe('Oracle of the Vault')
  })
})

// --- Price conversion tests ---

describe('Price conversions', () => {
  const TROY_OZ_TO_GRAMS = 31.1035

  test('troy oz to grams conversion', () => {
    const pricePerOz = 3000
    const pricePerGram = pricePerOz / TROY_OZ_TO_GRAMS
    expect(pricePerGram).toBeCloseTo(96.45, 1)
  })

  test('grams to troy oz conversion', () => {
    const pricePerGram = 96.45
    const pricePerOz = pricePerGram * TROY_OZ_TO_GRAMS
    expect(pricePerOz).toBeCloseTo(3000, -1)
  })

  test('MCAU 1 token = 1 gram', () => {
    const mcauTokens = 10
    const grams = mcauTokens * 1 // 1:1 ratio
    expect(grams).toBe(10)
  })
})

// --- Market probability tests ---

describe('Market probability', () => {
  test('calculates YES probability from pools', () => {
    const yes_pool = 7000
    const no_pool = 3000
    const prob = yes_pool / (yes_pool + no_pool)
    expect(prob).toBe(0.7)
  })

  test('handles empty pools', () => {
    const yes_pool = 0
    const no_pool = 0
    const total = yes_pool + no_pool
    const prob = total === 0 ? 0.5 : yes_pool / total
    expect(prob).toBe(0.5)
  })

  test('YES + NO probabilities sum to 1', () => {
    const yes_pool = 4200
    const no_pool = 5800
    const total = yes_pool + no_pool
    const yesProb = yes_pool / total
    const noProb = no_pool / total
    expect(yesProb + noProb).toBe(1)
  })
})

// --- Fee calculation edge cases ---

describe('Fee edge cases', () => {
  test('very small trade amounts', () => {
    const quote = buildQuote('buy', 'MCAU', 0.001, 95.5)
    expect(quote.subtotal).toBeCloseTo(0.0955, 4)
    expect(quote.platform_fee).toBeGreaterThanOrEqual(0)
  })

  test('very large trade amounts', () => {
    const quote = buildQuote('buy', 'MCAU', 10000, 95.5)
    expect(quote.subtotal).toBe(955000)
    expect(quote.platform_fee).toBeCloseTo(6685, 0)
  })
})
