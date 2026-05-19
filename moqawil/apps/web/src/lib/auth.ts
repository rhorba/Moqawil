import NextAuth, { type NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db, users } from '@moqawil/db'
import { eq } from 'drizzle-orm'

const config: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    // Google OAuth — only enabled when credentials are configured
    ...(process.env['AUTH_GOOGLE_ID']
      ? [Google({ clientId: process.env['AUTH_GOOGLE_ID'], clientSecret: process.env['AUTH_GOOGLE_SECRET']! })]
      : []),
    // Email magic link — only enabled when Resend API key is configured
    ...(process.env['AUTH_RESEND_KEY']
      ? [Resend({ apiKey: process.env['AUTH_RESEND_KEY'], from: process.env['SMTP_FROM'] ?? 'noreply@moqawil.ma' })]
      : []),
    // Test-only credentials provider — enabled only when E2E_TEST_SECRET is set
    // NEVER enable in production without this env var
    ...(process.env['E2E_TEST_SECRET'] && process.env['NODE_ENV'] !== 'production'
      ? [Credentials({
          id: 'test-credentials',
          name: 'Test',
          credentials: { email: {}, secret: {} },
          async authorize(credentials) {
            if (credentials?.secret !== process.env['E2E_TEST_SECRET']) return null
            const email = credentials.email as string
            const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
            if (user) return { id: user.id, email: user.email, name: user.name }
            // Auto-create test user on first use
            const { randomUUID } = await import('crypto')
            const [created] = await db.insert(users).values({ id: randomUUID(), email, name: 'Test User' }).returning()
            return { id: created.id, email: created.email, name: created.name }
          },
        })]
      : []),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
  pages: {
    signIn: '/sign-in',
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(config)
