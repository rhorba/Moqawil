# Sprint 9 — Accountant Multi-Client Dashboard (read-only, v0.2)

**Goal**: Hicham (chartered accountant, ~30 AE clients) can be invited by an entrepreneur, accept the invite, and see a read-only multi-client dashboard (YTD threshold status + declaration status list, per-entrepreneur cap drill-down). No mutation from the accountant view.

**Depends on**: Sprint 8 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: TODO

---

## Design

Full design in two committed foundation docs (Framework Rule 6) — do not re-derive here:
- `docs/system-design-accountant-dashboard.md` — access model, authorization boundary, NFRs
- `docs/architecture-accountant-dashboard.md` — schema, query/module boundary, invite-token design

Locked decisions (do not revisit mid-sprint): entrepreneur-initiated invite (not accountant-initiated); `accountant_links` table, no `role` field on `users`; every accountant-route query joins through `accountant_links`; bespoke invite token via `node:crypto.randomBytes`, **not** Auth.js's `verificationTokens`; reuse `getThresholdStatus` from `@moqawil/tax-engine`, don't fork it; read-only, no write paths from the accountant view.

---

## Sprint Backlog

### BATCH 1 — Data layer
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S9-01 | Add `accountantLinkStatusEnum` + `accountantLinks` table + relations to `packages/db/src/schema.ts` exactly as specified in architecture doc §1; generate + apply Drizzle migration | DBA | M | done | Backend Dev |

### BATCH 2 — Authorization + business logic
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S9-02 | `apps/web/src/lib/invite-token.ts` — `generateInviteToken()` per architecture doc §4 | Backend Dev | S | done | Tester |
| S9-03 | `apps/web/src/lib/queries/accountant.ts` — `getAccessibleEntrepreneurs`, `assertAccountantAccess`, `getAccountantDashboardRows` per architecture doc §2-3 (batched queries, no N+1) | Backend Dev | M | done | Tester |
| S9-04 | `apps/web/src/app/(app)/settings/accountant-links/actions.ts` — `inviteAccountant(email)`, `revokeAccountantLink(linkId)` server actions; email send via existing SMTP helper (`lib/email.ts` pattern) with graceful on-screen-link fallback when SMTP unset | Backend Dev | M | done | Tester |
| S9-05 | Invite-accept flow: token-driven route/action reachable for a signed-in user whose session email matches `invitedEmail` — flips link to `active`. Model on `api/e2e/signin` route's token-handling shape but production-real (no `E2E_TEST_SECRET`, no bypass of normal Auth.js session establishment). Also required: `middleware.ts` gains `/accountant` to its app-route matcher + preserves `callbackUrl`; `(app)/layout.tsx` onboarding redirect exempts `/accountant` (accountants may have no AE profile); sign-in page honors `callbackUrl`. | Backend Dev | M | done | Tester |
| S9-06 | Unit + integration tests for S9-02 through S9-05: token generation entropy/format, `getAccessibleEntrepreneurs` returns only active links, `assertAccountantAccess` rejects revoked/foreign entrepreneurId, race-safe accept UPDATE verified under concurrent submission, dashboard query returns `[]` immediately (no invoice/declaration query) when zero accessible entrepreneurs | Tester | M | done | Frontend Dev |

### BATCH 3 — UI
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S9-07 | Entrepreneur-side Settings UI: `apps/web/src/app/(app)/settings/accountant-links/` — invite form, pending/active/revoked list, revoke button with confirm | Frontend Dev | M | done | Tester |
| S9-08 | Accountant-side route group `apps/web/src/app/(app)/accountant/`: `layout.tsx` guard (redirect if zero active links), `page.tsx` list view (entrepreneur name/activity + threshold status + declaration status), `[entrepreneurId]/page.tsx` drill-down (per-client 80K cap badges via existing `getAllClientAnnualTotals`) | Frontend Dev | L | done | Tester |
| S9-09 | Nav entry "Espace comptable" gated on ≥1 active link (cheap existence check at layout render, per architecture doc §5) | Frontend Dev | S | done | Tester |
| S9-10 | i18n: new `accountant` namespace in `messages/fr.json` + `messages/ar.json` (invite form, status labels, empty states, dashboard headers) — RTL-safe, reuse existing `cap`/`threshold` string patterns where the concept overlaps | Frontend Dev | S | done | Tester |
| S9-11 | Playwright e2e: two-user flow — entrepreneur invites accountant email, accountant (separate session) accepts, sees dashboard row for that entrepreneur only (not others), entrepreneur revokes, accountant's next request loses access | Tester | M | done | Security Engineer |

### BATCH 4 — Security review (Framework Rule 5 — mandatory, not optional)
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S9-12 | IDOR audit: every accountant-route query traced to confirm it joins through `accountant_links` — no code path accepts a raw `entrepreneurId` from URL/body without that join | Security Engineer | M | done | Security Engineer |
| S9-13 | Invite-token audit: entropy source, single-use enforcement (token cleared/invalidated on accept), expiry enforcement (7 days), revoked/expired tokens fail closed | Security Engineer | S | done | Security Engineer |
| S9-14 | Revocation-latency check: confirm accountant access is a live DB check on every accountant-route request, not cached in the JWT session claim (this is the one place this feature deviates from the app's existing `session: { strategy: 'jwt' }` — flag if any code path caches the link status) | Security Engineer | S | done | Security Engineer |
| S9-15 | Invite-spam / email-enumeration check: is there any rate limit or is `inviteAccountant` callable unlimited times to probe arbitrary emails? Fix if not addressed, or explicitly log as an accepted risk with reasoning (self-hosted single-tenant install, not internet-scale) | Security Engineer | S | done | Tester |

### BATCH 5 — Verification
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S9-16 | Full verification: `pnpm build`, full Vitest suite + coverage gate (≥80%, Framework Rule 2), full Playwright suite with `--workers=1` against a real `next start` server | Tester | S | done | Project Monitor |

### BATCH 6 — Wrap
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S9-17 | Sprint snapshot → `.logs/metrics.md`; log security review outcome → `.logs/activity.md`; `git push origin master` (Framework Rule 3) | Project Monitor | S | todo | USER |

---

## Definition of Done (Sprint 9 closes)
- [x] Entrepreneur can invite an accountant by email from Settings; invite works with and without SMTP configured (on-screen link fallback verified, not just coded)
- [x] Accountant (separate account) can accept and see a read-only dashboard listing only entrepreneurs who granted access — verified with a real two-user Playwright flow (isolated browser contexts), not just unit tests
- [x] Per-entrepreneur drill-down shows threshold status + per-client 80K cap badges (reusing existing tax-engine functions, not forked logic)
- [x] Revocation takes effect on the very next accountant request — live-checked, not JWT-cached (confirmed by code audit AND by the Playwright test's revoke step)
- [x] No write path exists from any `accountant/` route — audited (S9-12)
- [x] Security Engineer review complete (S9-12 through S9-15) — IDOR/token/revocation CONFIRMED OK, invite-spam ACCEPTED RISK with logged reasoning, 2 low-severity issues found+fixed same session
- [x] `pnpm build` green; Sprint 9's own new code clears the 80% coverage gate in isolation (92.85%/100%); full-suite local coverage blocked by 3 pre-existing, already-flagged local-DB-only fixture collisions unrelated to this sprint (see `.logs/metrics.md`) — CI's fresh-DB run is the authoritative full-suite signal, matching this project's established pattern
- [x] Full Playwright suite 19/19 green (3 intentionally skipped) with `--workers=1` against a real `next start` server
- [x] FR + AR strings for all new UI, RTL-safe (reuses existing RTL-audited component patterns)
- [ ] `git push origin master` at sprint close — next step

## Explicitly out of scope for this sprint
- Any write/mutation capability for the accountant (create/edit invoices, clients, declarations as/for the entrepreneur) — CLAUDE.md §2 only specifies "multi-client view" for Hicham
- Accountant-initiated invites (entrepreneur must always be the one granting access)
- Multi-accountant-per-entrepreneur UI polish beyond a simple list (data model supports it since it's just multiple `accountant_links` rows, but no special UI beyond the list is planned)
- Any change to the existing solo-AE dashboard, invoice, client, or declaration flows
