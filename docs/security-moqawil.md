# Security: Moqawil
**References**: docs/architecture-moqawil.md, docs/database-moqawil.md, docs/prd-sprint11-saas-readiness.md | **Version**: 1.1 | **Date**: 2026-08-11 | **Author**: Security Engineer | **Status**: Draft

## 1. Threat Model Summary
Moqawil ships in two deployment modes (Sprint 11): **self-hosted, single-tenant-per-install** (original model, unchanged) and **Moqawil-operated hosted, multi-tenant** (new). Both handle financial/compliance data and clients' personal/business identifiers (names, ICE, addresses, sometimes IBANs) — the *consequence* of a breach was already high under self-host (financial fraud potential, client PII exposure, CNDP exposure) and stays high.

What changes for the hosted mode: the threat surface is no longer "narrower than multi-tenant SaaS" — **it is exactly a multi-tenant SaaS now**, and the framing must change accordingly. Under self-host, an IDOR bug is bad but contained (the operator is the only tenant, so a missing ownership filter can't leak a *different* customer's data — there isn't one). Under the hosted instance, the same class of bug means Company A's invoices, client list, or tax data becomes visible to Company B — a cross-tenant breach, not a single-install bug. **IDOR defense (§2) is therefore elevated from "primary defense, standard priority" to CRITICAL for the hosted deployment** — every data-access path was re-audited in Sprint 11 (findings in `.logs/issues.md`, dated 2026-08-11) specifically because of this shift, not as routine hygiene.

Also new: under self-host, "self-hosters are the data controller for their own instance, not Moqawil the project" (§3, unchanged for that mode). For the Moqawil-operated hosted instance, **Moqawil itself becomes the CNDP data controller/processor** for every hosted customer's client PII — this is a real legal obligation (registration, a real Privacy Policy, a lawful basis for processing), not just a documentation nuance. Tracked as a launch blocker in `docs/prd-sprint11-saas-readiness.md` §8, not silently absorbed into "self-hoster's problem" language that no longer applies once Moqawil operates the instance.

## 2. Authentication & Session
- Auth.js v5 (NextAuth), Google OAuth + email magic link. No password storage — reduces credential-stuffing/breach-reuse risk entirely.
- Session-scoped access: every query for invoices/clients/declarations filters by the authenticated user's `entrepreneurId`, not by a client-supplied ID alone — this is the primary IDOR defense, and for the Moqawil-operated hosted deployment (Sprint 11) it is the *only* thing preventing cross-tenant data exposure (no RLS layer exists). Re-audited 2026-08-11 across every function in `apps/web/src/lib/queries/*.ts` and every server action — the two-argument ownership-check pattern (e.g. `getClientById(clientId, entrepreneurId)`) was already consistent everywhere sampled; see `.logs/issues.md` for the dated finding.
- `E2E_TEST_SECRET` enables a test-only Credentials provider — must never be set outside CI/local dev. CI sets it explicitly per test run; production `.env.example` documents it as dangerous to enable.

## 3. Data Protection
- Client PII (name, ICE, address, sometimes phone/IBAN) falls under Morocco's Loi 09-08 (CNDP data protection law) — self-hosters are the data controller for their own instance, not Moqawil the project. Documentation should make this clear rather than implying Moqawil itself handles compliance obligations on the user's behalf.
- No payment processing, no card data — out of scope by design (CLAUDE.md §5), which removes an entire PCI-DSS-adjacent risk category.
- `.env` (secrets) is gitignored in both root and app-level `.gitignore` files — verified 2026-08-08 alongside the drizzle-meta gitignore fix.

## 4. Invoice/Declaration Integrity
- Sequential invoice numbering (advisory lock + transaction, see `docs/database-moqawil.md` §5) is a compliance-integrity control as much as a data-integrity one — CGI Art. 145 requires no gaps, and a race condition producing a gap or duplicate is a legal defect, not just a bug.
- A `paid` invoice cannot be edited (enforced in application logic) — protects the 10-year conservation requirement (CGI Art. 211) from accidental post-hoc tampering.

## 5. External Integration Trust Boundaries
| Integration | Trust boundary concern |
|---|---|
| BAM scraper (bkam.ma) | Untrusted HTML input — parse defensively, never `eval`/inject scraped content; failure degrades to manual entry, never silently uses stale/wrong data without a visible warning |
| SIMPL/DGI | No credentials stored — v0.1 never authenticates to DGI on the user's behalf, so there's no DGI credential to protect (yet) |
| Sprint 4+: DGI/xHub clearance, Barid eSign | Not built yet. When built: API keys/certificates go through env vars (Framework Rule 4), never hardcoded, never logged |

## 6. CI Enforcement (`.github/workflows/ci.yml`, `security` job)
- **SAST**: Semgrep with `p/owasp-top-ten` + `p/security-audit` rulesets, `--error` (fails the build on findings), scoped to `moqawil/`.
- **SCA**: Trivy filesystem scan against `moqawil/pnpm-lock.yaml`, `CRITICAL,HIGH` severity, fails the build.
- **Secrets**: Gitleaks scan on every push/PR.
- This is the concrete implementation of Framework Rule 5 ("security check before SHIP") — added 2026-08-08 after being an unenforced checklist line for one sprint. See `.logs/activity.md` and `.logs/decisions.md` for the history.

## 7. Open Items (tracked, not silently dropped)
- No formal penetration test or third-party security audit has been performed — **this is now a launch blocker for the Moqawil-operated hosted instance**, not just a nice-to-have (the "post-v0.1" deferral in earlier drafts of this doc meant exactly this moment). Not performed in Sprint 11 itself — flagged for the owner to schedule before publicizing the hosted product.
- CNDP filing/registration guidance for self-hosters is not yet written — unchanged gap, still relevant for that mode.
- CNDP data-controller registration **for Moqawil itself** (new, Sprint 11) — the operator must register with CNDP as data controller before hosting other businesses' client PII. Legal/administrative, not engineering; tracked in `docs/prd-sprint11-saas-readiness.md` §8.

## 8. Rate Limiting (new, Sprint 11)
Public sign-up (Google OAuth + Resend email magic link, no allowlist — confirmed in `auth.ts`) previously carried low abuse risk because reaching a self-hoster's instance at all required knowing its address; a Moqawil-operated hosted instance at a public, discoverable domain does not have that implicit gate. `middleware.ts` (which already gates authenticated routes) adds an in-process sliding-window rate limiter on `/api/auth/*` sign-in and magic-link-request paths — no new external dependency (Redis/Upstash), consistent with the existing single-VPS/no-horizontal-scaling posture (`docs/system-design-moqawil.md` §5). This is a basic abuse deterrent, not a substitute for the CAPTCHA/WAF layer a higher-traffic product would eventually need — revisit if real abuse is observed post-launch.

## Handoff
→ Backend Dev: auth/session enforcement patterns per query
→ DevOps/DevSecOps: `docs/devops-moqawil.md` — secrets handling in deployment
