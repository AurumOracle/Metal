import { NextRequest, NextResponse } from 'next/server'
import type { Market } from '@/types'

// ── DATABASE ──────────────────────────────────────────────────────────
// Uses postgres (node-postgres) when DATABASE_URL is set.
// Falls back to the static seed data for local dev without a DB.

async function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) return null
  try {
    // Dynamic import so the server still starts without pg installed
    const { default: postgres } = await import('postgres')
    return postgres(url, { max: 5, idle_timeout: 20 })
  } catch {
    return null
  }
}

// ── STATIC SEED (local dev / no DB) ──────────────────────────────────

function getNextFriday(hourUTC: number): Date {
  const d = new Date(); const day = d.getUTCDay()
  const daysUntil = (5 - day + 7) % 7 || 7
  d.setUTCDate(d.getUTCDate() + daysUntil); d.setUTCHours(hourUTC, 0, 0, 0)
  return d
}

function getNextMonday(hourUTC: number): Date {
  const d = new Date(); const day = d.getUTCDay()
  const daysUntil = (1 - day + 7) % 7 || 7
  d.setUTCDate(d.getUTCDate() + daysUntil); d.setUTCHours(hourUTC, 0, 0, 0)
  return d
}

const STATIC_MARKETS: Market[] = [
  { id:'mkt-001', question:'Will spot gold close above $3,150 this Friday?',           tag:'Gold · Weekly',    closesAt: getNextFriday(21).toISOString(),  status:'open', yesPct:62, noPct:38, totalVotes:841,  xpcReward:50  },
  { id:'mkt-002', question:'Will silver outperform gold on a percentage basis this week?', tag:'Silver · Weekly', closesAt: getNextFriday(21).toISOString(),  status:'open', yesPct:44, noPct:56, totalVotes:613,  xpcReward:50  },
  { id:'mkt-003', question:'Will MCAU trade at a premium to spot gold on Monday open?', tag:'MCAU · Tokenised', closesAt: getNextMonday(9).toISOString(),   status:'open', yesPct:38, noPct:62, totalVotes:290,  xpcReward:75  },
  { id:'mkt-004', question:'Will gold set a new all-time high before end of March 2026?',tag:'Macro · ATH Watch',closesAt: new Date('2026-03-31T23:59:00Z').toISOString(), status:'open', yesPct:71, noPct:29, totalVotes:1204, xpcReward:100 },
  { id:'mkt-005', question:'Will the gold/silver ratio drop below 90 before April?',    tag:'Gold/Silver Ratio',closesAt: new Date('2026-03-31T23:59:00Z').toISOString(), status:'open', yesPct:33, noPct:67, totalVotes:188,  xpcReward:60  },
]

// ── ROUTE HANDLERS ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'open'
  const tag    = searchParams.get('tag')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  const sql = await getDb()

  if (sql) {
    // Live DB query
    try {
      const rows = await sql<Market[]>`
        SELECT
          id, question, tag,
          closes_at     AS "closesAt",
          status,
          outcome,
          yes_pct       AS "yesPct",
          no_pct        AS "noPct",
          total_votes   AS "totalVotes",
          xpc_reward    AS "xpcReward",
          resolve_tx_id AS "algoTxId"
        FROM markets
        WHERE status = ${status}
        ${tag ? sql`AND tag ILIKE ${'%' + tag + '%'}` : sql``}
        ORDER BY closes_at ASC
        LIMIT ${limit}
      `
      await sql.end()
      return NextResponse.json(
        { markets: rows, total: rows.length, timestamp: new Date().toISOString(), source: 'db' },
        { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' } }
      )
    } catch (err) {
      console.error('DB query error:', err)
      // Fall through to static data
    }
  }

  // Static fallback
  let markets = STATIC_MARKETS.filter(m => !status || m.status === status)
  if (tag) markets = markets.filter(m => m.tag.toLowerCase().includes(tag.toLowerCase()))
  markets = markets.slice(0, limit)

  return NextResponse.json(
    { markets, total: markets.length, timestamp: new Date().toISOString(), source: 'static' },
    { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' } }
  )
}

export async function POST(req: NextRequest) {
  // Validate oracle JWT from session cookie
  const session = req.cookies.get('ao_session')?.value
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = await getDb()
  if (!sql) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const body = await req.json()
    const { id, question, tag, closesAt, xpcReward = 50 } = body
    if (!question || !closesAt) return NextResponse.json({ error: 'question and closesAt required' }, { status: 400 })

    const marketId = id ?? `mkt-${Date.now()}`
    await sql`
      INSERT INTO markets (id, question, tag, closes_at, status, xpc_reward)
      VALUES (${marketId}, ${question}, ${tag ?? ''}, ${closesAt}, 'open', ${xpcReward})
      ON CONFLICT (id) DO NOTHING
    `
    await sql.end()
    return NextResponse.json({ id: marketId, created: true })
  } catch (err) {
    console.error('Market create error:', err)
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 })
  }
}
