import { NextRequest, NextResponse } from 'next/server'
import { fetchMarketComments, fetchMarketVotes } from '@/lib/algorand'

// ── COMMENTS API ──────────────────────────────────────────────────────
// GET  /api/comments?marketId=mkt-001&limit=50
// POST /api/comments — not used (comments are submitted directly on-chain
//                      by the client signing a tx, not via this server)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const marketId = searchParams.get('marketId')
  const mode     = searchParams.get('mode') ?? 'comments'   // 'comments' | 'votes'
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  if (!marketId) {
    return NextResponse.json({ error: 'marketId required' }, { status: 400 })
  }

  try {
    if (mode === 'votes') {
      const votes = await fetchMarketVotes(marketId)
      return NextResponse.json({ votes, total: votes.length }, {
        headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      })
    }

    const comments = await fetchMarketComments(marketId, limit)
    return NextResponse.json({ comments, total: comments.length }, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    })
  } catch (err) {
    console.error('Comments API error:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
