import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
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
    pathname.startsWith('/settings')

  if (isAppRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
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
