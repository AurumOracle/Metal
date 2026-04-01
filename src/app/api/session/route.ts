import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

// ── JWT-LITE SESSION SYSTEM ────────────────────────────────────────────
// We use a simple HMAC-signed token rather than a full JWT library.
// The token payload is: base64(JSON({ address, nfd, exp })) + "." + HMAC
//
// In production: replace with iron-session or NextAuth for more features.
// We never store the private key on-chain — only the Algorand address is verified.

const SECRET = process.env.SESSION_SECRET ?? randomBytes(32).toString('hex')
const COOKIE = 'ao_session'
const EXPIRY = 7 * 24 * 60 * 60 * 1000   // 7 days in ms

export interface SessionPayload {
  address:    string
  nfdName?:   string
  xpcBalance: number
  rank:       string
  premium:    boolean
  iat:        number   // issued at (ms)
  exp:        number   // expires at (ms)
}

// ── TOKEN HELPERS ─────────────────────────────────────────────────────

function sign(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const hmac = createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${hmac}`
}

function verify(token: string): SessionPayload | null {
  try {
    const [data, hmac] = token.split('.')
    if (!data || !hmac) return null

    const expected = createHmac('sha256', SECRET).update(data).digest('base64url')
    const expectedBuf = Buffer.from(expected)
    const hmacBuf     = Buffer.from(hmac)

    if (expectedBuf.length !== hmacBuf.length) return null
    if (!timingSafeEqual(expectedBuf, hmacBuf)) return null

    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

// ── ALGORAND SIGNATURE VERIFICATION ───────────────────────────────────
// The wallet signs a challenge message, we verify the signature on-chain.
// This proves the user controls the private key for the address.

async function verifyAlgorandSignature(
  address:   string,
  message:   string,
  signature: string,   // base64-encoded Ed25519 signature
): Promise<boolean> {
  try {
    const algosdk = (await import('algosdk')).default
    const msgBytes = new TextEncoder().encode(message)
    const sigBytes = Buffer.from(signature, 'base64')
    return algosdk.verifyBytes(msgBytes, sigBytes, address)
  } catch {
    return false
  }
}

// ── CHALLENGE ENDPOINT ────────────────────────────────────────────────
// GET /api/session?address=ALGO_ADDRESS
// Returns a one-time challenge the wallet must sign

const challenges = new Map<string, { nonce: string; expiresAt: number }>()

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 })
  }

  // Check if already authenticated
  const token   = req.cookies.get(COOKIE)?.value
  const session = token ? verify(token) : null
  if (session && session.address === address) {
    return NextResponse.json({ authenticated: true, session })
  }

  // Issue a new challenge nonce
  const nonce     = randomBytes(16).toString('hex')
  const expiresAt = Date.now() + 5 * 60_000   // 5 min to sign

  challenges.set(address, { nonce, expiresAt })

  // Auto-clean expired challenges
  for (const [addr, c] of challenges.entries()) {
    if (Date.now() > c.expiresAt) challenges.delete(addr)
  }

  const message = `Aurum Oracle sign-in\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`

  return NextResponse.json({ challenge: message, nonce, expiresAt })
}

// ── SIGN-IN ENDPOINT ──────────────────────────────────────────────────
// POST /api/session
// Body: { address, signature, nfdName?, xpcBalance?, rank? }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      address:    string
      signature:  string
      nfdName?:   string
      xpcBalance?: number
      rank?:      string
    }

    const { address, signature } = body
    if (!address || !signature) {
      return NextResponse.json({ error: 'address and signature required' }, { status: 400 })
    }

    // Get the challenge for this address
    const challenge = challenges.get(address)
    if (!challenge || Date.now() > challenge.expiresAt) {
      return NextResponse.json({ error: 'Challenge expired — request a new one' }, { status: 401 })
    }

    // Reconstruct the exact challenge message
    const message = `Aurum Oracle sign-in\nAddress: ${address}\nNonce: ${challenge.nonce}\nTimestamp: ${new Date().toISOString()}`

    // Verify the Ed25519 signature
    const valid = await verifyAlgorandSignature(address, message, signature)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Consume the challenge (one-time use)
    challenges.delete(address)

    // Check XPC balance for premium access
    // Premium: hold ≥ 1000 XPC or have paid subscription (extend here)
    const xpcBalance = body.xpcBalance ?? 0
    const premium    = xpcBalance >= 1000

    // Create session
    const payload: SessionPayload = {
      address,
      nfdName:    body.nfdName,
      xpcBalance,
      rank:       body.rank ?? 'Apprentice Assayer',
      premium,
      iat:        Date.now(),
      exp:        Date.now() + EXPIRY,
    }

    const token = sign(payload)

    const res = NextResponse.json({ authenticated: true, session: payload })
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   EXPIRY / 1000,
      path:     '/',
    })

    return res
  } catch (err) {
    console.error('Session POST error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

// ── SIGN-OUT ENDPOINT ─────────────────────────────────────────────────
// DELETE /api/session

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false })
  res.cookies.delete(COOKIE)
  return res
}

// ── VERIFY HELPER (for middleware) ────────────────────────────────────
export { verify as verifySession }
