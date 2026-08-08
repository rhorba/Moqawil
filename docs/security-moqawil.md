# Security: Moqawil
**References**: docs/architecture-moqawil.md, docs/database-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: Security Engineer | **Status**: Draft

## 1. Threat Model Summary
Moqawil is self-hosted, single-tenant-per-install financial/compliance software handling one AE's invoicing data and their clients' personal/business identifiers (names, ICE, addresses, sometimes IBANs). The realistic threat surface is narrower than a multi-tenant SaaS (no cross-tenant data leakage risk within one install) but the *consequence* of a breach is high (financial fraud potential, client PII exposure, CNDP data-protection exposure since client personal data is processed).

## 2. Authentication & Session
- Auth.js v5 (NextAuth), Google OAuth + email magic link. No password storage — reduces credential-stuffing/breach-reuse risk entirely.
- Session-scoped access: every query for invoices/clients/declarations filters by the authenticated user's `entrepreneurId`, not by a client-supplied ID alone — this is the primary IDOR defense given there's no RLS layer (single-tenant-per-install makes row-level security less critical than in Kasb/Wassalha's multi-tenant model, but ownership checks in every query/action are still mandatory, not optional).
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
- No formal penetration test or third-party security audit has been performed — appropriate to schedule before any managed-cloud-tier launch (post-v0.1), not required for the self-host-only v0.1.
- CNDP filing/registration guidance for self-hosters is not yet written — should land in the docs site (`moqawil/docs/`) before a "made for Morocco" positioning claim gets stronger marketing weight.

## Handoff
→ Backend Dev: auth/session enforcement patterns per query
→ DevOps/DevSecOps: `docs/devops-moqawil.md` — secrets handling in deployment
