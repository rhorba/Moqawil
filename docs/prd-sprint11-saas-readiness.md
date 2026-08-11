# PRD: SaaS Readiness — Multi-Tenant Hosting for Auto-Entrepreneurs
**Version**: 1.0 | **Date**: 2026-08-11 | **Author**: PM | **Status**: Draft — Sprint 11

## 1. Problem Statement
Moqawil today is self-host-only: one instance serves one auto-entrepreneur (root `CLAUDE.md` §16 mentions an "optional managed cloud tier post-launch" but nothing has been built toward it). The project owner wants to operate a hosted instance that many independent auto-entrepreneurs can sign up to and use directly, without each of them standing up their own VPS. This is explicitly a hosting/operations change, not a mission change: the customer is still the same solo AE persona (Law 114-13) the product has always served — not registered companies (SARL/SA, a different tax regime the tax-engine doesn't model) and not team/multi-user accounts (root `CLAUDE.md` still states "AE is by definition solo"). Subscription billing is deferred to a follow-up sprint; this sprint makes it *safe* to host many strangers' compliance data on shared infrastructure, which today's self-host-oriented docs explicitly flagged as needing a fresh look before that moment ("`docs/security-moqawil.md`: appropriate to schedule [a security review] before any managed-cloud-tier launch").

## 2. Goals & Success Metrics
| Goal | Metric | Target |
|---|---|---|
| No cross-tenant data exposure | IDOR re-audit of every query/action | 100% of data-access functions filter by the authenticated user's `entrepreneurId`; any gap found is fixed before ship |
| Public auth endpoints resist abuse | Rate limiter on `/api/auth/*` | A scripted burst is throttled; legitimate traffic (incl. the full Playwright e2e suite) is unaffected |
| Operator can tell if the hosted instance is down | `/api/health` | Returns 200 with DB connectivity confirmed |
| Hosted customers' data isn't lost | Automated backup script + documented cron | `scripts/backup-db.sh` produces a restorable, timestamped dump |
| A stranger can find and understand the product | Public landing page at `/` | Renders in FR (default) and AR/RTL; unauthenticated visitors no longer hit a 404 at the root |
| No regression to existing functionality | Existing test suite + e2e | 0 failures |
| Coverage gate holds | Combined unit coverage | ≥ 80% (Framework Rule 2) |

## 3. Key Roles (existing personas, root CLAUDE.md §2 — unchanged)
- **Karim** — freelance dev, would rather sign up to a hosted instance than run his own VPS.
- **Salma** — handicraft business owner, least technical persona; a hosted option removes the self-host barrier to entry entirely for her.
- **Hicham** — chartered accountant; unaffected by this sprint directly (his multi-client dashboard already exists), but benefits from more of his AE clients being reachable on one hosted instance instead of scattered self-hosted installs.

New here: **the project owner as SaaS operator** — this sprint makes *them* the data controller for hosted customers' client PII under CNDP, a responsibility that didn't exist under pure self-host (where each self-hoster is their own data controller).

## 4. User Stories
- [ ] As a prospective AE user, I want to land on a real page at the product's domain that explains what it does, so I can decide to sign up without reading source code.
- [ ] As any hosted user, I want assurance that another tenant on the same instance can never see my clients, invoices, or declarations, so I trust the product with real compliance/financial data.
- [ ] As the operator, I want an automated backup and a health check, so a hosting incident doesn't silently become permanent data loss.
- [ ] As the operator, I want auth endpoints to resist scripted abuse, so a public sign-up surface doesn't become a spam/credential-stuffing vector on day one.

## 5. Scope
**In**: IDOR re-audit (verification pass, not a rewrite — the ownership-filter pattern already exists everywhere sampled this session); an in-memory rate limiter on public auth endpoints; a DB health-check route; a configurable DB connection pool size; an automated backup script; a public FR/AR landing page at `/`; foundation-doc revisions (system design, security, devops) reflecting the shift from self-host to Moqawil-operated hosting.

**Out** (explicitly — do not build without owner instruction): Stripe/CMI subscription billing and any paywall/plan gating; registered-company (SARL/SA) support or a second tax regime; team/multi-user accounts; actually provisioning a VPS/domain (no infrastructure credentials held by the agent executing this sprint — tracked as a blocked-on-owner item, same pattern as DGI/xHub sandbox access in Sprint 4); drafting Terms of Service / Privacy Policy legal text (flagged as a launch blocker, not written here without the owner's explicit direction on what to promise).

## 6. Requirements
- FR-1: Every function reading or writing invoice/client/declaration/entrepreneur data is re-verified to filter by the authenticated user's `entrepreneurId` (or an equivalent ownership check for accountant-delegated access). Findings — including "no gap found" — are logged to `.logs/issues.md`.
- FR-2: `middleware.ts` rejects (HTTP 429) further requests from an IP that exceeds a defined threshold against `/api/auth/*` sign-in/magic-link paths within a sliding window; the limiter is in-process (no new external dependency — consistent with the existing single-VPS/no-horizontal-scaling NFR).
- FR-3: `GET /api/health` returns 200 and confirms a live DB query succeeds; returns non-200 if the DB is unreachable.
- FR-4: `packages/db`'s connection pool size is read from `DB_POOL_MAX` (env), defaulting to the current `10` if unset.
- FR-5: `scripts/backup-db.sh` produces a timestamped `pg_dump` output and rotates old backups; documented as a cron entry in `docs/devops-moqawil.md`.
- FR-6: `apps/web/src/app/page.tsx` renders a public, unauthenticated landing page in `fr-MA` (default) and `ar` (RTL), built on the existing design system (`components/ui/*`), explaining the product and linking to `/sign-in`. No pricing content.
- NFR-1: None of the above changes the deployment topology's shape (still single VPS, no queue, no CDN, no horizontal scaling) — only the operational ownership of uptime/backups shifts from "self-hoster's own problem" to "Moqawil's responsibility for the hosted instance."

## 7. Moqawil Business Rules Touched (root CLAUDE.md §3)
None of the AE-specific tax/compliance rules change. What changes is *who is responsible for data protection* of the client PII those rules already require Moqawil's app to store (name, ICE, address, sometimes IBAN) — under CNDP (Loi 09-08), the hosted instance's operator becomes the data controller for that data, where a self-hoster previously was.

## 8. Risks
| Risk | P | I | Mitigation |
|---|---|---|---|
| A missed ownership filter causes cross-tenant data exposure | Low (pattern already consistent everywhere sampled) | Critical | Full re-audit this sprint (Batch 2), logged regardless of outcome; Security Engineer review before SHIP (Framework Rule 5) |
| Public sign-up becomes a spam/abuse vector with no billing gate | Med | Med | Rate limiter this sprint; if abuse persists post-launch, an invite/waitlist gate is a fast follow-up (not built now — no signal yet that it's needed) |
| Owner publicizes the hosted instance before infra (real VPS/domain/backups) is actually live | Med | High | This PRD explicitly separates "code/config ready" (this sprint) from "actually deployed" (owner action) — do not treat this sprint's completion as "SaaS is live" |
| CNDP data-controller obligations aren't just technical (require filing/registration, a real Privacy Policy) | High (certain, if launched) | Med | Flagged as a launch blocker in this doc; not silently skipped, but explicitly deferred to the owner + legal counsel, not drafted by engineering |
