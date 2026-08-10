import { randomBytes } from 'node:crypto'

/**
 * Accountant-invite tokens are deliberately NOT Auth.js's `verificationTokens` —
 * that table answers "is this person who they claim to be" for sign-in, this
 * answers "has this already-authenticated person been granted read access to
 * this entrepreneur's data." See docs/architecture-accountant-dashboard.md §4.
 */
export function generateInviteToken() {
  return randomBytes(32).toString('base64url') // 256 bits, URL-safe
}

export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function inviteExpiresAt() {
  return new Date(Date.now() + INVITE_TOKEN_TTL_MS)
}
