import { NextRequest, NextResponse } from 'next/server'

// ── NFD PROXY ─────────────────────────────────────────────────────────
// Proxies requests to https://api.nf.domains server-side.
// Benefits:
//   1. Avoids CORS issues in browser
//   2. Server-side cache (Next.js revalidate) reduces NFD API load
//   3. Single place to add auth headers if NFD ever requires them
//   4. Can add rate limiting / abuse protection here

const NFD_API = 'https://api.nf.domains'

// GET /api/nfd?address=ALGO_ADDRESS
// GET /api/nfd?name=john.xpc.algo
// GET /api/nfd?addresses=ADDR1,ADDR2,ADDR3  (bulk lookup)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const address   = searchParams.get('address')
  const name      = searchParams.get('name')
  const addresses = searchParams.get('addresses')

  try {
    let nfdUrl: string

    if (name) {
      // Fetch single NFD by name
      nfdUrl = `${NFD_API}/nfd/${encodeURIComponent(name)}?view=thumbnail`
    } else if (addresses) {
      // Bulk lookup — comma-separated addresses
      const addrList = addresses.split(',').slice(0, 20)   // max 20
      const params   = addrList.map(a => `address=${a.trim()}`).join('&')
      nfdUrl = `${NFD_API}/nfd/lookup?${params}&view=thumbnail`
    } else if (address) {
      // Single address lookup
      nfdUrl = `${NFD_API}/nfd/lookup?address=${address}&view=thumbnail`
    } else {
      return NextResponse.json({ error: 'Provide address, name, or addresses param' }, { status: 400 })
    }

    const res = await fetch(nfdUrl, {
      headers: { 'Accept': 'application/json' },
      next:    { revalidate: 300 },   // cache 5 min — NFDs rarely change
    })

    if (res.status === 404) {
      return NextResponse.json({ result: null }, { status: 200 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'NFD API error', status: res.status }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('NFD proxy error:', err)
    return NextResponse.json({ error: 'NFD lookup failed' }, { status: 500 })
  }
}
