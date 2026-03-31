import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import algosdk from 'algosdk'

// In-memory challenge store (replace with Redis in production)
const challenges: Map<string, { challenge: string; expires: number }> = new Map()

/**
 * Wallet-based session authentication:
 * 1. GET /api/session?address=ADDR  → returns a challenge string
 * 2. POST /api/session { address, signature } → verifies signature, returns JWT-like token
 * 3. The token is used in subsequent requests for authenticated actions
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address || !algosdk.isValidAddress(address)) {
    return NextResponse.json({ error: 'Valid Algorand address required' }, { status: 400 })
  }

  // Generate challenge
  const challenge = `AurumOracle:${Date.now()}:${randomBytes(16).toString('hex')}`
  const expires = Date.now() + 5 * 60 * 1000 // 5 minutes

  challenges.set(address, { challenge, expires })

  // Clean expired challenges
  for (const [addr, data] of challenges.entries()) {
    if (data.expires < Date.now()) challenges.delete(addr)
  }

  return NextResponse.json({ challenge })
}

export async function POST(req: NextRequest) {
  try {
    const { address, signature } = await req.json()

    if (!address || !signature) {
      return NextResponse.json({ error: 'address and signature required' }, { status: 400 })
    }

    const stored = challenges.get(address)
    if (!stored) {
      return NextResponse.json({ error: 'No challenge found. Request one first.' }, { status: 400 })
    }

    if (stored.expires < Date.now()) {
      challenges.delete(address)
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 })
    }

    // Verify signature
    // In production, verify that the signature was created by the address
    // using algosdk.verifyBytes or the wallet's signing verification
    const sigBytes = new Uint8Array(Buffer.from(signature, 'base64'))
    const msgBytes = new Uint8Array(Buffer.from(stored.challenge))

    try {
      const isValid = algosdk.verifyBytes(msgBytes, sigBytes, address)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    // Clean up used challenge
    challenges.delete(address)

    // Generate session token (in production, use proper JWT)
    const token = randomBytes(32).toString('hex')

    return NextResponse.json({
      token,
      address,
      expires_in: 86400, // 24 hours
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
