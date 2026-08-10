# System Design — Accountant Multi-Client Dashboard (Sprint 9)

**Author**: System Designer (autonomous)
**Status**: Draft for Software Architect handoff
**Scope**: Read-only accountant view across multiple entrepreneurs within a single self-hosted install.

## 1. What this is not

This is **not** a multi-tenant SaaS redesign. Moqawil stays a single-tenant-per-install, self-hosted monolith (CLAUDE.md §6, §16 — no managed cloud tier exists yet). "Multi-client" here means: one `users` row (the accountant, Hicham) can read aggregate data belonging to several `entrepreneurs` rows *on the same install*, with each entrepreneur's explicit, revocable consent. No new external system, no new `packages/*` runtime dependency, no queue, no separate service. Topology diagram (Caddy → Next.js → Postgres) is unchanged.

## 2. Core design question: who grants access, and how

**Decision: entrepreneur-initiated share, not accountant-initiated invite.**

Reasoning: the entrepreneur owns the data (revenue, clients, cap status) and must be the consenting party — an accountant should never be able to attach themselves to an AE's account unilaterally. This mirrors how every real accounting-firm tool works (client invites accountant) and avoids building an admin/approval layer we don't need.

Flow:
1. From Settings, the entrepreneur enters their accountant's email → creates a `pending` link + invite token (expires in 7 days).
2. If SMTP is configured, an email is sent with the invite link (same graceful-degrade pattern as existing email-PDF feature, CLAUDE.md §4 Feature 1). If SMTP is not configured, the invite link/code is shown on-screen to copy/share manually — invite creation must never depend on SMTP being present.
3. Accountant opens the link, signs in (Google OAuth or magic link — same Auth.js flow, no new auth mechanism), and if their session's email matches the invited email, the link flips to `active`.
4. Entrepreneur can revoke a link at any time from Settings; revocation takes effect on the accountant's very next request (no cached authorization state).

## 3. Data model impact (for DBA / Software Architect)

One new table, no changes to existing tables, no `role` field on `users`:

```
accountant_links:
  id                uuid pk
  entrepreneurId    uuid fk -> entrepreneurs.id
  accountantUserId  uuid fk -> users.id  nullable   -- null until invite accepted
  invitedEmail      text
  status            enum('pending', 'active', 'revoked')
  inviteToken       text unique nullable
  inviteExpiresAt   timestamp nullable
  createdAt, updatedAt

  unique (entrepreneurId, invitedEmail)  -- one live invite per email per entrepreneur
```

Why no `role` enum on `users`: a user can simultaneously be an AE (own `entrepreneurs` row) and an accountant for others (rows in `accountant_links`). Forcing a single role would block the realistic case of an accountant who is also self-employed. Access is capability-based (does a link exist and is it active?), not identity-based (is this user "an accountant"?).

## 4. Authorization boundary — the security-critical part

Every existing query in the app is scoped via the 1:1 `session.user.id → entrepreneurs.userId` relationship. **That path does not change.** The accountant view is an entirely additive, parallel read path:

- New route group `apps/web/app/(app)/accountant/` — its own layout-level guard: session user must have ≥1 `accountant_links` row with `status = 'active'`, else redirect to dashboard.
- Every query inside that route group joins through `accountant_links` (`accountantUserId = session.user.id AND status = 'active'`) to resolve the set of visible `entrepreneurId`s — never trusts a client-supplied entrepreneur ID without that join.
- No write paths. This dashboard is read-only for v0.2 (matches the Hicham persona in CLAUDE.md §2: "wants multi-client view"). Creating/editing invoices, clients, or declarations as an accountant is explicitly out of scope for this sprint — would require a much bigger permission model (impersonation, audit trail) that isn't justified yet.
- Nav shows an "Espace comptable" entry only when the session user has ≥1 active link (cheap existence check at layout render).

## 5. NFRs

| Concern | Target | Why |
|---|---|---|
| Revocation latency | Immediate (next request) | No cached role/claim in JWT for this — must be a live DB check, since accountant access to financial data must be revocable in real time |
| Invite token entropy | ≥128-bit random, single-use, 7-day expiry | Prevents guessable/replayable invite links |
| Aggregate query shape | One batched query across all accessible entrepreneurs, not N+1 per-entrepreneur loops | Accountant may have 30 clients (CLAUDE.md §2); dashboard must stay responsive |
| No new external dependency | Confirmed | Pure internal DB + existing Auth.js session flow |

## 6. Handoff → Software Architect

Needed next:
- Module/query boundary: where `accountant_links` schema + queries live in `packages/db`, and where the authorization-check helper (`getAccessibleEntrepreneurIds(accountantUserId)`) lives in `apps/web/lib` — should be a single reusable function, not duplicated per route.
- Design the aggregate dashboard query (cap status + threshold status + declaration status per entrepreneur) as one efficient query path reusing the existing `tax-engine` pure functions — do not fork cap/threshold logic for the accountant view.
- Confirm invite-token generation/verification lives with existing Auth.js token utilities rather than a bespoke implementation.

## 7. Handoff → Security Engineer (before SHIP, per Framework Rule 5)

- IDOR check: every accountant-route query must be verified to filter through `accountant_links`, never accept a raw `entrepreneurId` from the URL/body without that join.
- Invite token: confirm entropy source, single-use enforcement, expiry enforcement, and that revoked/expired tokens fail closed.
- Confirm revocation is checked live (not cached in the JWT session claim) — this is the one place this feature deviates from the app's existing JWT-strategy session (CLAUDE.md /project-state notes `session: { strategy: 'jwt' }`).
- Rate-limit invite creation per entrepreneur to prevent invite-spam/enumeration of accountant emails.
