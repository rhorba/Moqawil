import { authConfig } from '@/lib/auth.config'
import { checkRateLimit } from '@/lib/rate-limit'
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

// Sprint 11 (SaaS readiness): only the sign-in-attempt submission itself — GET
// /api/auth/session, /api/auth/csrf, /api/auth/providers are polled routinely by the client
// and must never be throttled, or the app breaks for legitimate users.
const RATE_LIMITED_PATH_PREFIX = '/api/auth/signin'
const RATE_LIMIT = { limit: 5, windowMs: 60_000 }

function getClientIp(req: NextRequest): string {
  // Behind Caddy (docs/devops-moqawil.md) — first entry is the original client.
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl

  if (req.method === 'POST' && pathname.startsWith(RATE_LIMITED_PATH_PREFIX)) {
    const allowed = checkRateLimit(`signin:${getClientIp(req)}`, RATE_LIMIT)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many sign-in attempts' }, { status: 429 })
    }
  }

  if (pathname.startsWith('/api')) {
    // Rate-limit check above (if applicable) already ran — nothing else in middleware
    // applies to API routes (auth-redirect logic below is for app pages only).
    return NextResponse.next()
  }

  const isAuthenticated = !!(req as { auth?: unknown }).auth

  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/invoices') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/declarations') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/accountant')

  if (isAppRoute && !isAuthenticated) {
    // Preserve the destination (incl. accountant invite tokens in the query string)
    // so the user lands back where they intended after signing in.
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
    return NextResponse.redirect(signInUrl)
  }

  if (pathname === '/sign-in' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Forward pathname to server components (used by (app) layout for onboarding check)
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)
  return response
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Sprint 11: only /api/auth needs middleware (rate limiting on sign-in) — every other
    // /api/* route stays excluded, unchanged from before.
    '/api/auth/:path*',
  ],
}
