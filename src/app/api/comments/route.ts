import { NextRequest, NextResponse } from 'next/server'

// In-memory comment store (replace with PostgreSQL in production)
const comments: Record<string, any[]> = {}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const marketId = searchParams.get('market_id')

  if (!marketId) {
    return NextResponse.json({ error: 'market_id required' }, { status: 400 })
  }

  const marketComments = comments[marketId] || []
  return NextResponse.json(marketComments, {
    headers: { 'Cache-Control': 'public, max-age=10, stale-while-revalidate=30' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { market_id, author, content, vote, txn_id } = body

    if (!market_id || !author || !content || !vote) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (content.length > 900) {
      return NextResponse.json({ error: 'Comment exceeds 900 character limit' }, { status: 400 })
    }

    if (!['YES', 'NO'].includes(vote)) {
      return NextResponse.json({ error: 'Vote must be YES or NO' }, { status: 400 })
    }

    const comment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      market_id,
      author,
      vote,
      content,
      txn_id: txn_id || null,
      likes: 0,
      timestamp: Date.now() / 1000,
      replies: [],
    }

    if (!comments[market_id]) comments[market_id] = []
    comments[market_id].push(comment)

    return NextResponse.json(comment, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
