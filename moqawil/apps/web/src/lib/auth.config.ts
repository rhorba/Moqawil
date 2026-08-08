/**
 * Edge-compatible Auth.js config — no DB adapter, no Node.js APIs.
 * Used by middleware. Full config (with adapter) is in auth.ts.
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  // Required for self-hosted deployments — see the matching comment in auth.ts. Middleware
  // uses this separate Edge-compatible config, not auth.ts's, so it needs its own trustHost.
  trustHost: true,
  pages: { signIn: '/sign-in' },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth
    },
  },
} satisfies NextAuthConfig
