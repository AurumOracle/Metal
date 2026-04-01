/**
 * Aurum Oracle — Critical business logic tests
 *
 * Run with: npm test
 * These cover the pieces where bugs cost real money.
 */

import { buildQuote, getRank, TROY_OZ_TO_GRAMS, RANK_THRESHOLDS } from '../types'
import { calcSpread, formatUSD } from '../lib/prices'
import { calcExpectedPayout } from '../lib/contracts/client'

// ── PRICING TESTS ─────────────────────────────────────────────────────

describe('buildQuote — per-gram pricing', () => {
  const XAU_SPOT = 3142.80   // $/troy oz

  test('calculates correct per-gram price from troy oz', () => {
    const quote = buildQuote('gold', 'buy', 1, XAU_SPOT)
    const expectedPerGram = XAU_SPOT / TROY_OZ_TO_GRAMS

    expect(quote.spotPerGram).toBeCloseTo(expectedPerGram, 4)
    expect(quote.spotPerGram).toBeCloseTo(101.0433, 2)   // known good value
  })

  test('calculates correct fee for 1g gold buy', () => {
    const quote = buildQuote('gold', 'buy', 1, XAU_SPOT)

    expect(quote.subtotal).toBeCloseTo(quote.spotPerGram * 1, 4)
    expect(quote.platformFee).toBeCloseTo(quote.subtotal * 0.007, 6)
    expect(quote.meldFee).toBeCloseTo(quote.subtotal * 0.001, 6)
    expect(quote.total).toBeCloseTo(quote.subtotal + quote.platformFee + quote.meldFee, 4)
  })

  test('platform fee is exactly 0.7%', () => {
    const quote = buildQuote('gold', 'buy', 10, XAU_SPOT)
    const feeRatio = quote.platformFee / quote.subtotal
    expect(feeRatio).toBeCloseTo(0.007, 6)
    expect(quote.feePercent).toBe(0.007)
  })

  test('silver gram price is correct', () => {
    const XAG_SPOT = 33.42
    const quote    = buildQuote('silver', 'buy', 1, XAG_SPOT)
    expect(quote.spotPerGram).toBeCloseTo(XAG_SPOT / TROY_OZ_TO_GRAMS, 4)
    expect(quote.spotPerGram).toBeCloseTo(1.0748, 3)
  })

  test('amount in grams converts correctly to troy oz', () => {
    const quote = buildQuote('gold', 'buy', 31.1035, XAU_SPOT)
    expect(quote.amountTroyOz).toBeCloseTo(1.0, 4)   // 31.1035g = 1 troy oz
  })

  test('zero amount returns zero fees', () => {
    const quote = buildQuote('gold', 'buy', 0, XAU_SPOT)
    expect(quote.subtotal).toBe(0)
    expect(quote.platformFee).toBe(0)
    expect(quote.total).toBe(0)
  })
})

// ── RANK TESTS ────────────────────────────────────────────────────────

describe('getRank — XPC rank progression', () => {
  test('returns Apprentice Assayer at 0 XPC', () => {
    expect(getRank(0)).toBe('Apprentice Assayer')
  })

  test('returns correct rank at threshold boundaries', () => {
    expect(getRank(250)).toBe('Junior Assayer')
    expect(getRank(750)).toBe('Assayer')
    expect(getRank(2000)).toBe('Senior Assayer')
    expect(getRank(5000)).toBe('Master Assayer')
    expect(getRank(12000)).toBe('Alchemist')
    expect(getRank(30000)).toBe('Grand Alchemist')
    expect(getRank(75000)).toBe('Oracle of the Vault')
  })

  test('stays at lower rank just below threshold', () => {
    expect(getRank(249)).toBe('Apprentice Assayer')
    expect(getRank(749)).toBe('Junior Assayer')
    expect(getRank(74999)).toBe('Grand Alchemist')
  })

  test('Oracle of the Vault at high values', () => {
    expect(getRank(1_000_000)).toBe('Oracle of the Vault')
  })
})

// ── SPREAD TESTS ──────────────────────────────────────────────────────

describe('calcSpread — token vs spot', () => {
  const spotTroyOz = 3142.80
  const spotPerGram = spotTroyOz / TROY_OZ_TO_GRAMS   // ~101.0433

  test('detects premium correctly', () => {
    const { spreadGram, spreadPct } = calcSpread(101.15, spotTroyOz)
    expect(spreadGram).toBeGreaterThan(0)
    expect(spreadPct).toBeGreaterThan(0)
  })

  test('detects discount correctly', () => {
    const { spreadGram, spreadPct } = calcSpread(100.90, spotTroyOz)
    expect(spreadGram).toBeLessThan(0)
    expect(spreadPct).toBeLessThan(0)
  })

  test('zero spread when token = spot', () => {
    const { spreadGram } = calcSpread(spotPerGram, spotTroyOz)
    expect(Math.abs(spreadGram)).toBeLessThan(0.001)
  })
})

// ── PAYOUT CALCULATOR TESTS ───────────────────────────────────────────

describe('calcExpectedPayout — prediction market', () => {
  const baseState = {
    question: 'Test',
    closesAt: 0,
    status:   2 as const,   // resolved
    yesPool:  1_000_000_000,   // 1000 XPC in raw units
    noPool:   500_000_000,    // 500 XPC in raw units
    outcome:  1 as const,   // YES won
  }

  test('YES winner receives stake + pro-rata share', () => {
    const userState = { yesStake: 100_000_000, noStake: 0, claimed: false }
    const payout = calcExpectedPayout(baseState, userState)
    // Should be stake + (100/1000 * 500 * 0.9905) net of fees
    expect(payout).toBeGreaterThan(userState.yesStake)
  })

  test('NO loser receives nothing', () => {
    const userState = { yesStake: 0, noStake: 100_000_000, claimed: false }
    const payout = calcExpectedPayout(baseState, userState)
    expect(payout).toBe(0)
  })

  test('unresolved market returns 0', () => {
    const unresolvedState = { ...baseState, outcome: 0 as const }
    const userState = { yesStake: 100_000_000, noStake: 0, claimed: false }
    expect(calcExpectedPayout(unresolvedState, userState)).toBe(0)
  })

  test('fee reduces payout below gross amount', () => {
    const userState = { yesStake: 100_000_000, noStake: 0, claimed: false }
    const grossPayout  = userState.yesStake + (userState.yesStake / baseState.yesPool) * baseState.noPool
    const netPayout    = calcExpectedPayout(baseState, userState)
    expect(netPayout).toBeLessThan(grossPayout)
  })
})

// ── FORMAT TESTS ──────────────────────────────────────────────────────

describe('formatUSD', () => {
  test('formats standard amounts', () => {
    expect(formatUSD(3142.80)).toBe('$3,142.80')
    expect(formatUSD(101.04)).toBe('$101.04')
    expect(formatUSD(1.0748, 4)).toBe('$1.0748')
  })

  test('handles zero', () => {
    expect(formatUSD(0)).toBe('$0.00')
  })
})

// ── NOTE ENCODING TESTS ───────────────────────────────────────────────

describe('note field encoding', () => {
  // Import dynamically to avoid server-only module issues in test env
  it('encodes and decodes comment round-trip', async () => {
    const { encodeNote, decodeNote, NOTE_PREFIX } = await import('../lib/algorand')

    const payload = {
      type:     'comment' as const,
      marketId: 'mkt-001',
      body:     'Gold is heading to $3,200 by end of week — DXY weakness confirms.',
    }

    const encoded = encodeNote(payload)
    const decoded = decodeNote(encoded)

    expect(decoded).toBeTruthy()
    expect(decoded?.type).toBe('comment')
    expect((decoded as any).body).toBe(payload.body)
    expect((decoded as any).marketId).toBe(payload.marketId)
  })

  it('note starts with AO/v1/ prefix', async () => {
    const { encodeNote, NOTE_PREFIX } = await import('../lib/algorand')
    const encoded = encodeNote({ type: 'comment', marketId: 'x', body: 'test' })
    const str = new TextDecoder().decode(encoded)
    expect(str.startsWith(NOTE_PREFIX)).toBe(true)
  })

  it('throws when note exceeds 1KB', async () => {
    const { encodeNote } = await import('../lib/algorand')
    const longBody = 'x'.repeat(1100)
    expect(() => encodeNote({ type: 'comment', marketId: 'x', body: longBody })).toThrow()
  })
})
