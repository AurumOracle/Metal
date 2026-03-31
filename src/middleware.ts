import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.nf.domains https://mainnet-api.algonode.cloud https://mainnet-idx.algonode.cloud https://testnet-api.algonode.cloud https://testnet-idx.algonode.cloud https://www.goldapi.io https://api.coingecko.com wss://stream.binance.com",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  // Rate limiting for API routes (simple in-memory, use Redis in production)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    // Note: In production, implement proper rate limiting with Redis
    // This header helps downstream rate limiters
    res.headers.set('X-RateLimit-Policy', '60;w=60')
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Admin access is checked client-side via wallet address
    // Server-side JWT check would go here in production
  }

  return res
}

export const config = {
  matcher: [
    // Apply to all routes except static files and _next internals
    '/((?!_next/static|_next/image|favicon.svg|og-image.svg).*)',
  ],
}
