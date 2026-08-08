import { randomUUID } from 'node:crypto'
import { encode } from '@auth/core/jwt'
import { type NextRequest, NextResponse } from 'next/server'

// Test-only sign-in endpoint — gated solely on E2E_TEST_SECRET being set. Do NOT also gate on
// NODE_ENV: `next start` (used for CI e2e against a production build, and by self-hosters)
// always sets NODE_ENV=production internally regardless of intent, which made this route
// permanently 404 in CI once e2e switched from `next dev` to `next start`. The real, documented
// security boundary is E2E_TEST_SECRET itself — .env.example says "NEVER set in production",
// and a real deployment simply won't have it set, closing this route regardless of NODE_ENV.
export async function POST(request: NextRequest) {
  if (!process.env.E2E_TEST_SECRET) {
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
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'AUTH_SECRET not configured' }, { status: 500 })
  }
  const token = await encode({
    token: { sub: user.id, id: user.id, name: user.name, email: user.email },
    secret,
    salt: 'authjs.session-token',
  })

  const response = NextResponse.json({ ok: true, userId: user.id })
  // Auth.js uses __Secure- prefix on HTTPS; in dev (HTTP) it's bare
  const cookieName =
    request.nextUrl.protocol === 'https:' ? '__Secure-authjs.session-token' : 'authjs.session-token'

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: request.nextUrl.protocol === 'https:',
  })

  return response
}
