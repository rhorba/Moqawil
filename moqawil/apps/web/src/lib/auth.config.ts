/**
 * Edge-compatible Auth.js config — no DB adapter, no Node.js APIs.
 * Used by middleware. Full config (with adapter) is in auth.ts.
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: { signIn: '/sign-in' },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth
    },
  },
} satisfies NextAuthConfig
