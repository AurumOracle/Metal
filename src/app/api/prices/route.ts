import { NextResponse } from 'next/server'
import { fetchPrices } from '@/lib/prices'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await fetchPrices()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('Price API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
