import { NextRequest, NextResponse } from 'next/server'

// ── SECURITY HEADERS ──────────────────────────────────────────────────
// Applied to every response. These are production-grade headers that
// protect against XSS, clickjacking, MIME sniffing, etc.

const SECURITY_HEADERS: Record<string, string> = {
  'X-DNS-Prefetch-Control':    'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options':           'SAMEORIGIN',
  'X-Content-Type-Options':    'nosniff',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection':          '1; mode=block',
  // CSP — allow Algorand nodes, NF Domains, Google Fonts, CDNs
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.algonode.cloud https://api.nf.domains https://api.coingecko.com https://www.goldapi.io https://meld.gold wss:",
    "frame-ancestors 'none'",
  ].join('; '),
}

// ── IN-MEMORY RATE LIMITER ────────────────────────────────────────────
// Simple sliding window — replace with Redis/Upstash in production
// for distributed rate limiting across multiple instances

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  '/api/prices':   { requests: 60,  windowMs: 60_000  },   // 60/min
  '/api/markets':  { requests: 120, windowMs: 60_000  },   // 120/min
  '/api/comments': { requests: 60,  windowMs: 60_000  },   // 60/min
  '/api/nfd':      { requests: 60,  windowMs: 60_000  },   // 60/min
  'default':       { requests: 200, windowMs: 60_000  },
}

function checkRateLimit(ip: string, pathname: string): boolean {
  const key    = `${ip}:${pathname}`
  const limit  = RATE_LIMITS[pathname] ?? RATE_LIMITS['default']
  const now    = Date.now()
  const entry  = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + limit.windowMs })
    return true
  }

  if (entry.count >= limit.requests) return false

  entry.count++
  return true
}

// Clean up stale entries periodically (runs on each request, cheap check)
function cleanRateLimitMap() {
  if (rateLimitMap.size < 1000) return
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}

// ── PREMIUM AUTH CHECK ────────────────────────────────────────────────
// Premium routes require a valid session token in the cookie.
// Token is set after wallet connection + XPC balance verification.
//
// In production: use JWT signed with a server secret,
// or integrate with a session provider (iron-session, NextAuth, etc.)

const PREMIUM_ROUTES = [
  '/api/premium/',
  '/premium',
]

function isPremiumRoute(pathname: string): boolean {
  return PREMIUM_ROUTES.some(r => pathname.startsWith(r))
}

function hasPremiumAccess(req: NextRequest): boolean {
  const token = req.cookies.get('ao_session')?.value
  if (!token) return false
  try {
    // Inline the verification logic to avoid importing from route files
    // (route files can't be imported in middleware due to edge runtime)
    const [data, hmac] = token.split('.')
    if (!data || !hmac) return false

    const secret = process.env.SESSION_SECRET ?? ''
    if (!secret) return false   // No secret = no auth in dev; set in prod

    const { createHmac, timingSafeEqual } = require('crypto') as typeof import('crypto')
    const expected    = createHmac('sha256', secret).update(data).digest('base64url')
    const expectedBuf = Buffer.from(expected)
    const hmacBuf     = Buffer.from(hmac)

    if (expectedBuf.length !== hmacBuf.length) return false
    if (!timingSafeEqual(expectedBuf, hmacBuf)) return false

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (!payload || Date.now() > payload.exp) return false
    return payload.premium === true
  } catch {
    return false
  }
}

// ── CORS FOR API ROUTES ───────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://www.AurumOracle.com',
  'https://AurumOracle.com',
  process.env.NEXT_PUBLIC_APP_URL ?? '',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
].filter(Boolean)

function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
  }
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'

  cleanRateLimitMap()

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(req),
    })
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: 60 },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  // Premium route protection
  if (isPremiumRoute(pathname) && !hasPremiumAccess(req)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      )
    }
    // Redirect UI routes to premium signup
    return NextResponse.redirect(new URL('/premium', req.url))
  }

  // Build response with security headers
  const res = NextResponse.next()

  // Security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value)
  }

  // CORS for API routes
  if (pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders(req)
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.headers.set(key, value)
    }
  }

  return res
}

export const config = {
  matcher: [
    // Apply to all routes except static files and Next internals
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
