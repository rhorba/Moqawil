# Sprint 11 — SaaS Readiness: Multi-Tenant Hosting for Auto-Entrepreneurs (No Billing Yet)

**Goal**: Close the gap between "works for one self-hoster" and "safe to operate as a Moqawil-hosted product for many independent auto-entrepreneur tenants." Same persona (solo AE, Law 114-13), no new tax regime, no team accounts, no billing — those are explicitly out of scope this sprint. Full plan: `docs/prd-sprint11-saas-readiness.md`.

**Depends on**: Sprint 10 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE

**Note on numbering**: Sprint 10's backlog had reserved "Sprint 11" for launch/distribution content (root `CLAUDE.md` §16 — blog posts, Show HN, GitHub release). This sprint claims that slot for SaaS readiness instead; launch/distribution content is pushed to **Sprint 12**. Publicizing a hosted product before its hosting/security posture is ready would be backwards.

---

## Design

New posture, not new mission — root `CLAUDE.md` Framework Rules 1 + 6 apply (System Designer + Software Architect involvement, foundation docs before code). Both `docs/system-design-moqawil.md` and `docs/security-moqawil.md` had already flagged this exact moment ("revisit ... if a managed multi-tenant cloud tier is scoped") before this sprint started.

**Non-goals** (explicit): Stripe/CMI billing, registered-company (SARL/SA) support, team/multi-user accounts, actual VPS/domain provisioning (no infrastructure credentials held by this work — blocked-on-owner, same pattern as DGI/xHub sandbox access in Sprint 4).

---

## Sprint Backlog

### BATCH 1 — Foundation docs (before code, Framework Rule 6)
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S11-01 | Write `docs/prd-sprint11-saas-readiness.md` — goals, explicit non-goals, success criteria | PM | M | done | System Designer |
| S11-02 | Revise `docs/system-design-moqawil.md` §1/§4 — dual deployment modes, concurrent-user/uptime/backup targets for the hosted mode | System Designer | S | done | Security Engineer |
| S11-03 | Revise `docs/security-moqawil.md` §1/§2 + new §7/§8 — threat model flip (Moqawil becomes CNDP data controller for hosted tenants), IDOR elevated to CRITICAL, rate-limiting requirement | Security Engineer | M | done | DevOps |
| S11-04 | Revise `docs/devops-moqawil.md` §1/§4 + new §5 — backup/health-check/pool-size ownership shifts to Moqawil for the hosted instance | DevOps/DevSecOps | S | done | Backend Dev |

### BATCH 2 — Security hardening for the multi-tenant threat model
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S11-05 | IDOR re-audit: every function in `lib/queries/*.ts`, every server action, every PDF/UBL API route | Security Engineer | M | done | Tester |
| S11-06 | Add in-process sliding-window rate limiter (`lib/rate-limit.ts`) on `/api/auth/signin*` POST, wired into `middleware.ts` (matcher extended to include `/api/auth/:path*`) | Backend Dev | M | done | Tester |

### BATCH 3 — Production readiness
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S11-07 | `GET /api/health` — DB-connectivity liveness check | Backend Dev | S | done | DevOps |
| S11-08 | `DB_POOL_MAX` env var, `packages/db` pool size configurable (was hardcoded `max: 10`) | Backend Dev | S | done | DevOps |
| S11-09 | `scripts/backup-db.sh` — pg_dump + timestamped rotation, documented cron line | DevOps/DevSecOps | S | done | Project Monitor |

### BATCH 4 — Public landing page
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S11-10 | `apps/web/src/app/page.tsx` — FR/AR landing page on the existing design system, no pricing | Frontend Dev + Copywriter | M | done | Tester |

### BATCH 5 — Verify & ship
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S11-11 | typecheck + lint + full vitest + Playwright suites green | Tester | M | done | Security Engineer |
| S11-12 | Security check before SHIP (Framework Rule 5) — IDOR findings + rate-limiter burst test | Security Engineer | S | done | Project Monitor |
| S11-13 | Sprint snapshot → `.logs/metrics.md`; `git push origin master` (Framework Rule 3) | Project Monitor | S | done | USER |

---

## Definition of Done (Sprint 11 closes)
- [x] PRD + 3 foundation docs revised and committed before code
- [x] IDOR re-audit complete, findings logged to `.logs/issues.md` regardless of outcome
- [x] Rate limiter throttles a scripted sign-in burst without affecting legitimate e2e traffic
- [x] `/api/health` returns 200 with real DB connectivity confirmed
- [x] `DB_POOL_MAX` configurable, documented in `.env.example`
- [x] `scripts/backup-db.sh` produces a restorable, timestamped, rotated dump
- [x] Public FR/AR landing page renders at `/` for unauthenticated visitors (previously 404)
- [x] 0 regressions — existing test suite + e2e stay green
- [x] `git push origin master` at sprint close

## Unplanned but resolved this sprint (found during execution)
- **Real IDOR defense-in-depth gap**: `getClientAnnualTotal(clientId, year)` in `client.ts` had no `entrepreneurId` filter of its own — the one function that broke the ownership-check pattern every other query follows. Not currently exploitable (all 5 call sites already verified ownership beforehand), but a latent landmine given the elevated multi-tenant stakes. Fixed: now requires `entrepreneurId` and filters on it directly; added a regression test. Full writeup: `.logs/issues.md`, 2026-08-11.
- **Stale cross-suite test fixture collision**: a leftover Playwright e2e fixture row (`accountant-dashboard.spec.ts`) collided with `quote-db-integration.test.ts`'s hardcoded ICE constant on the `entrepreneurs.ice` unique constraint, silently breaking that vitest file's setup. Cleaned up to unblock this session; the underlying fixture-value overlap between the Playwright and Vitest suites is pre-existing and flagged for future housekeeping, not fixed here (out of this sprint's scope).

## Explicitly out of scope for this sprint
- Stripe/CMI subscription billing and any plan/paywall gating — follow-up sprint
- Registered-company (SARL/SA) support, a second tax regime — not this product's mission
- Team/multi-user accounts — root `CLAUDE.md` still says "AE is by definition solo"
- Actual VPS/domain provisioning, DNS, going live — owner action, no infra credentials held by this work
- Terms of Service / Privacy Policy legal text, CNDP data-controller registration — legal/administrative, flagged as a launch blocker in the PRD, not drafted by engineering
- Formal penetration test / third-party security audit — flagged as a launch blocker, not performed here
- Launch/distribution content (blog posts, Show HN, GitHub release) — moved to Sprint 12
