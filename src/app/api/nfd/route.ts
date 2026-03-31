import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const name = searchParams.get('name')

  if (!address && !name) {
    return NextResponse.json({ error: 'Provide ?address= or ?name=' }, { status: 400 })
  }

  try {
    if (name) {
      // Resolve name to address
      const res = await fetch(
        `https://api.nf.domains/nfd/${encodeURIComponent(name)}`,
        { next: { revalidate: 300 } }
      )
      if (!res.ok) return NextResponse.json({ error: 'NFD not found' }, { status: 404 })
      const data = await res.json()
      return NextResponse.json({
        name: data.name,
        address: data.depositAccount || data.caAlgo?.[0],
        avatar: data.properties?.userDefined?.avatar,
        verified: data.properties?.verified || false,
      })
    }

    // Resolve address to name (reverse lookup)
    const res = await fetch(
      `https://api.nf.domains/nfd/lookup?address=${encodeURIComponent(address!)}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return NextResponse.json({ name: null })
    const data = await res.json()
    const nfd = Object.values(data)[0] as any
    return NextResponse.json({
      name: nfd?.name || null,
      avatar: nfd?.properties?.userDefined?.avatar || null,
    })
  } catch {
    return NextResponse.json({ error: 'NFD lookup failed' }, { status: 502 })
  }
}
