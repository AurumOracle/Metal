import { NextResponse } from 'next/server'

// Mock markets data
const MOCK_MARKETS = [
  {
    id: '1',
    question: 'Will gold close above $3,150 on Friday?',
    closes_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    yes_pool: 15000,
    no_pool: 12000,
    status: 'OPEN',
    category: 'spot',
  },
  {
    id: '2',
    question: 'Will silver outperform gold this week?',
    closes_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    yes_pool: 8000,
    no_pool: 10000,
    status: 'OPEN',
    category: 'ratio',
  },
  {
    id: '3',
    question: 'Will MCAU trade at a premium on Monday?',
    closes_at: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60,
    yes_pool: 5000,
    no_pool: 6000,
    status: 'OPEN',
    category: 'tokenized',
  },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let markets = MOCK_MARKETS

  if (status) {
    markets = markets.filter((m) => m.status === status)
  }

  return NextResponse.json(markets, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
