import { authConfig } from '@/lib/auth.config'
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
