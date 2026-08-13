import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { accounts, db, sessions, users, verificationTokens } from '@moqawil/db'
import { eq } from 'drizzle-orm'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'

const config: NextAuthConfig = {
  // Required for self-hosted deployments (Docker Compose behind Caddy, not Vercel) — Auth.js
  // otherwise rejects every request with UntrustedHost. Safe here: single-operator,
  // single-tenant self-host, not a multi-tenant host-header-spoofing risk.
  trustHost: true,
  // Without an explicit schema, DrizzleAdapter falls back to its own internal table definitions
  // ("user"/"account", singular) instead of ours ("users"/"accounts") — every adapter query
  // (OAuth account linking, in particular) fails with a Postgres "relation does not exist" error.
  // Never caught before: the JWT session strategy below means the adapter is barely touched by
  // the Credentials/email flows this project's tests actually exercise, and Google sign-in
  // (the one path that genuinely needs it) had never been configured until now.
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    // Google OAuth — only enabled when both credentials are configured
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    // Email magic link — only enabled when Resend API key is configured
    ...(process.env.AUTH_RESEND_KEY
      ? [
          Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.SMTP_FROM ?? 'noreply@moqawil.ma',
          }),
        ]
      : []),
    // Test-only credentials provider — gated solely on E2E_TEST_SECRET (see the matching
    // comment in api/e2e/signin/route.ts for why NODE_ENV isn't also part of this check).
    ...(process.env.E2E_TEST_SECRET
      ? [
          Credentials({
            id: 'test-credentials',
            name: 'Test',
            credentials: { email: {}, secret: {} },
            async authorize(credentials) {
              if (
                (credentials?.secret as string | undefined)?.trim() !==
                process.env.E2E_TEST_SECRET?.trim()
              )
                return null
              const email = credentials.email as string
              const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
              if (user) return { id: user.id, email: user.email, name: user.name }
              // Auto-create test user on first use
              const { randomUUID } = await import('node:crypto')
              const [created] = await db
                .insert(users)
                .values({ id: randomUUID(), email, name: 'Test User' })
                .returning()
              return { id: created.id, email: created.email, name: created.name }
            },
          }),
        ]
      : []),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    // With JWT strategy, user data lives in the token (no DB lookup per request)
    jwt: ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.id as string },
    }),
  },
  pages: {
    signIn: '/sign-in',
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(config)
