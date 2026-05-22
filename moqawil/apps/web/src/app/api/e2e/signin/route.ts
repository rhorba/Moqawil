import { NextRequest, NextResponse } from 'next/server'
import { encode } from '@auth/core/jwt'
import { randomUUID } from 'crypto'

// Test-only sign-in endpoint — never active in production
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || !process.env.E2E_TEST_SECRET) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  let body: { email?: string; secret?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const expectedSecret = (process.env.E2E_TEST_SECRET ?? '').trim()
  const providedSecret = (body.secret ?? '').trim()
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const email = body.email ?? 'e2e-test@moqawil.test'

  // Find or create the test user
  const { db, users } = await import('@moqawil/db')
  const { eq } = await import('drizzle-orm')

  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ id: randomUUID(), email, name: 'Test User' })
      .returning()
    user = created
  }

  // Encode an Auth.js v5 session JWT
  const secret = process.env.AUTH_SECRET!
  const token = await encode({
    token: { sub: user.id, id: user.id, name: user.name, email: user.email },
    secret,
    salt: 'authjs.session-token',
  })

  const response = NextResponse.json({ ok: true, userId: user.id })
  // Auth.js uses __Secure- prefix on HTTPS; in dev (HTTP) it's bare
  const cookieName =
    request.nextUrl.protocol === 'https:'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: request.nextUrl.protocol === 'https:',
  })

  return response
}
