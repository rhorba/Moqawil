# Architecture — Accountant Multi-Client Dashboard (Sprint 9)

**Author**: Software Architect (autonomous)
**Depends on**: `docs/system-design-accountant-dashboard.md`
**Status**: Ready for DBA / Backend Dev

Package-by-feature, layered — same shape as every other feature in this codebase. No new pattern introduced.

## 1. Schema location: `packages/db`

`accountant_links` goes in `packages/db/src/schema.ts`, right after `quarterlyDeclarations`, following the existing enum + table + relations convention exactly:

```typescript
export const accountantLinkStatusEnum = pgEnum('accountant_link_status', [
  'pending',
  'active',
  'revoked',
])

export const accountantLinks = pgTable(
  'accountant_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entrepreneurId: uuid('entrepreneur_id')
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: 'cascade' }),
    // Null until the invite is accepted and matched to a real user.
    accountantUserId: text('accountant_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    invitedEmail: text('invited_email').notNull(),
    status: accountantLinkStatusEnum('status').default('pending').notNull(),
    inviteToken: text('invite_token').unique(),
    inviteExpiresAt: timestamp('invite_expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    unique('uq_accountant_link_invite').on(t.entrepreneurId, t.invitedEmail),
    // Dashboard authorization check: "which entrepreneurs can this accountant see" —
    // the hottest query path for the whole feature.
    index('idx_accountant_links_accountant').on(t.accountantUserId, t.status),
  ]
)

export const accountantLinksRelations = relations(accountantLinks, ({ one }) => ({
  entrepreneur: one(entrepreneurs, {
    fields: [accountantLinks.entrepreneurId],
    references: [entrepreneurs.id],
  }),
  accountantUser: one(users, {
    fields: [accountantLinks.accountantUserId],
    references: [users.id],
  }),
}))
```

`users.id` is `text` (Auth.js convention, already true for every FK to `users` in this schema) — `accountantUserId` must be `text`, not `uuid`, matching `entrepreneurs.userId`.

Note the unique constraint is on `(entrepreneurId, invitedEmail)`, not `(entrepreneurId, accountantUserId)` — it must hold even while `accountantUserId` is still null (pending invite), so it can't be keyed off a nullable column.

## 2. Authorization helper: `apps/web/src/lib/queries/accountant.ts`

New query file, same directory as `client.ts` / `entrepreneur.ts` / `invoice.ts`. One exported function is the entire authorization boundary for this feature — every accountant-route Server Component and Server Action calls this, never queries `entrepreneurs`/`clients`/`invoices` directly with a client-supplied ID:

```typescript
import { accountantLinks, db, entrepreneurs } from '@moqawil/db'
import { and, eq } from 'drizzle-orm'

/** The authorization boundary for the entire accountant dashboard. */
export async function getAccessibleEntrepreneurs(accountantUserId: string) {
  return db
    .select({ entrepreneur: entrepreneurs })
    .from(accountantLinks)
    .innerJoin(entrepreneurs, eq(accountantLinks.entrepreneurId, entrepreneurs.id))
    .where(
      and(eq(accountantLinks.accountantUserId, accountantUserId), eq(accountantLinks.status, 'active'))
    )
}

/** Single-entrepreneur variant for detail pages — still joins through the grant, never trusts the route param alone. */
export async function assertAccountantAccess(accountantUserId: string, entrepreneurId: string) {
  const [row] = await db
    .select({ id: entrepreneurs.id })
    .from(accountantLinks)
    .innerJoin(entrepreneurs, eq(accountantLinks.entrepreneurId, entrepreneurs.id))
    .where(
      and(
        eq(accountantLinks.accountantUserId, accountantUserId),
        eq(accountantLinks.status, 'active'),
        eq(entrepreneurs.id, entrepreneurId)
      )
    )
    .limit(1)
  return row !== undefined
}
```

The `apps/web/app/(app)/accountant/layout.tsx` guard calls `getAccessibleEntrepreneurs` once — zero results means "no active links" and redirects to the regular dashboard (mirrors the existing onboarding-redirect guard pattern already used for AE profile completion). Every `accountant/[entrepreneurId]/...` detail route calls `assertAccountantAccess` before rendering, same as `getClientById` today scopes by `entrepreneurId` for the solo-AE views.

## 3. Aggregate dashboard query — reuse `tax-engine`, don't fork it

The accountant list view needs, per accessible entrepreneur: name/activity type, YTD turnover + threshold status, and current-quarter declaration status. This is `getThresholdStatus` (already in `@moqawil/tax-engine`, used today by `threshold-alerts.ts` and the solo dashboard) applied N times, not a new tax rule.

```typescript
// apps/web/src/lib/queries/accountant.ts (continued)
import { getThresholdStatus } from '@moqawil/tax-engine'
import { invoices, quarterlyDeclarations } from '@moqawil/db'
import { sql } from 'drizzle-orm'

export async function getAccountantDashboardRows(accountantUserId: string, year: number) {
  const accessible = await getAccessibleEntrepreneurs(accountantUserId)
  if (accessible.length === 0) return []

  const entrepreneurIds = accessible.map((r) => r.entrepreneur.id)

  // One batched query for YTD turnover across all accessible entrepreneurs —
  // not a per-entrepreneur loop (NFR: accountant may have ~30 clients, CLAUDE.md §2).
  const turnoverRows = await db
    .select({
      entrepreneurId: invoices.entrepreneurId,
      ytdMad: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalMad}::numeric ELSE 0 END), 0)`,
    })
    .from(invoices)
    .where(and(inArray(invoices.entrepreneurId, entrepreneurIds), eq(invoices.fiscalYear, year)))
    .groupBy(invoices.entrepreneurId)

  // One batched query for current-quarter declaration status, same shape.
  const declarationRows = await db
    .select()
    .from(quarterlyDeclarations)
    .where(
      and(
        inArray(quarterlyDeclarations.entrepreneurId, entrepreneurIds),
        eq(quarterlyDeclarations.year, year)
      )
    )

  const ytdByEntrepreneur = new Map(turnoverRows.map((r) => [r.entrepreneurId, Number.parseFloat(r.ytdMad)]))

  return accessible.map(({ entrepreneur }) => {
    const ytd = ytdByEntrepreneur.get(entrepreneur.id) ?? 0
    return {
      entrepreneur,
      ytdMad: ytd,
      threshold: getThresholdStatus(ytd, entrepreneur.activityType), // reused, not forked
      declarations: declarationRows.filter((d) => d.entrepreneurId === entrepreneur.id),
    }
  })
}
```

This is 2 batched queries total regardless of how many entrepreneurs the accountant has — not 2×N. Per-client 80K cap status is deliberately **not** in this aggregate row: it's a per-client-of-an-entrepreneur metric (`getAllClientAnnualTotals`, already batched per-entrepreneur), surfaced on the accountant's entrepreneur-detail drill-down page, not the top-level list — same information density the AE's own dashboard already uses (cap badges live on the client list, threshold lives on the dashboard).

## 4. Invite token generation — bespoke, not Auth.js's `verificationTokens`

Confirmed: **do not reuse** `verificationTokens` / Auth.js's internal token machinery. That table is schema-owned by the Auth.js DrizzleAdapter and consumed atomically inside NextAuth's own sign-in callback for magic-link authentication — it answers "is this person who they claim to be," a different question from "has this already-authenticated person been granted read access to this entrepreneur's data." Coupling the two would mean an accountant-invite bug could corrupt sign-in state, and vice versa.

Instead, mirror the *pattern* Auth.js uses (random token, expiry, single-use) with the codebase's existing primitive — `node:crypto`, already used for secure IDs elsewhere (`auth.ts`, `api/e2e/signin/route.ts` use `randomUUID`):

```typescript
import { randomBytes } from 'node:crypto'

export function generateInviteToken() {
  return randomBytes(32).toString('base64url') // 256 bits, URL-safe
}
```

Store the raw token in `accountantLinks.inviteToken` (not hashed) — unlike password-reset tokens, this token grants a *read* link, not account takeover, and the existing `sessions.sessionToken` in this same schema is also stored raw, so this matches established practice in the codebase rather than introducing a new one. Security Engineer should confirm this equivalence during review (see system-design doc §7).

## 5. Route/module summary

```
apps/web/src/
  app/(app)/accountant/
    layout.tsx              # guard: getAccessibleEntrepreneurs, redirect if empty
    page.tsx                # list view — getAccountantDashboardRows
    [entrepreneurId]/page.tsx   # detail drill-down — assertAccountantAccess + getAllClientAnnualTotals
  app/(app)/settings/
    accountant-links/        # entrepreneur-side: invite form, pending/active/revoked list, revoke action
  lib/queries/accountant.ts  # all of §2-3 above
  lib/invite-token.ts        # §4
```

No new `packages/*`. No adapter interface — this isn't a pluggable external system, it's an internal read path with an authorization join, same complexity class as the existing client/invoice queries.

## 6. Handoff → DBA

Migration for `accountant_links` (+ enum), following the existing Drizzle migration workflow. No changes to any existing table.

## 6b. Handoff → Backend Dev

Server actions needed: `inviteAccountant(email)` (entrepreneur-side, Settings), `revokeAccountantLink(linkId)` (entrepreneur-side), `acceptAccountantInvite(token)` (accountant-side, called post-sign-in). All three live in `apps/web/src/app/(app)/settings/accountant-links/actions.ts` except accept, which needs a route reachable pre-session-check for the invite-link click-through — model it on how the existing `api/e2e/signin` route is structured for a token-driven, session-adjacent flow, but production-real (no `E2E_TEST_SECRET` shortcut).
