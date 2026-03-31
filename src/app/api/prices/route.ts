import { fetchPrices } from '@/lib/prices'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const prices = await fetchPrices()
    return NextResponse.json(prices, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('Prices API error:', err)
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
