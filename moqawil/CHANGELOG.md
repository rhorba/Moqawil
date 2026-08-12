# Changelog

All notable changes to Moqawil are documented in this file. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are sprint-close dates
from `.claude/.logs/metrics.md`, the project's authoritative sprint record. No git tags
have been cut yet; versions below match the `version` field already committed in
`package.json` across the monorepo.

## [Unreleased] — Sprint 12 (Launch Readiness & Distribution)

### Added
- Legal drafts for a Moqawil-operated hosted instance: Terms of Service, Privacy Policy
  (both FR + EN, explicitly marked pending lawyer review, not in effect), CNDP
  data-controller registration checklist.
- Pentest/security-audit scope document and a one-page security-posture summary for
  handing to an external auditor or a security-conscious prospective hosted customer.
- Step-by-step deployment runbook (VPS sizing, DNS, `docker compose up -d`, Caddy HTTPS,
  `scripts/backup-db.sh` on cron, uptime monitoring against `GET /api/health`).
- Three bilingual (FR + AR) SEO articles on the docs site: quarterly declaration
  walkthrough, the 80,000 MAD per-client cap explained, and how to avoid losing
  auto-entrepreneur status.
- This changelog.

### Fixed
- `LICENSE` at the repo root was still MIT from initial scaffolding; corrected to the
  AGPL-3.0 text that root `CLAUDE.md` §13 and the README badge have always specified.

## [0.2.0] — 2026-08-11 (Sprint 11: SaaS Readiness — Multi-Tenant Hosting)

Reframes the app's deployment posture from self-host-only to also support a
Moqawil-operated multi-tenant hosted instance — same solo auto-entrepreneur persona, no
billing yet.

### Added
- Public FR/AR landing page at `/` for unauthenticated visitors (previously 404).
- `GET /api/health` liveness check (real DB-connectivity probe).
- In-process sliding-window rate limiter on `/api/auth/signin*`, wired into
  `middleware.ts`.
- `scripts/backup-db.sh` (pg_dump + timestamped rotation) and a documented cron line.
- `DB_POOL_MAX` env var — connection pool size is now configurable instead of a
  hardcoded `max: 10`.

### Security
- Full IDOR re-audit of every query in `lib/queries/*.ts`, every server action, and
  every PDF/UBL API route (Framework Rule 5).
- Closed a real defense-in-depth gap: `getClientAnnualTotal(clientId, year)` had no
  `entrepreneurId` filter of its own, breaking the ownership-check pattern every other
  query follows. Not exploitable at the time (all call sites already verified ownership
  upstream) but a latent risk under the elevated multi-tenant threat model — fixed, with
  a regression test.

## [0.2.0] — 2026-08-10 (Sprints 6–10: v0.2 feature set + hardening)

### Added
- **Devis (quotes)** — Sprint 6. Full quote data layer, PDF template, conversion to
  invoice in one click, sharing the same advisory-lock sequential-numbering transaction
  as direct invoicing.
- **Accountant multi-client dashboard** — Sprint 9. Entrepreneur-initiated invite flow
  (`accountant_links` table, bespoke invite-token flow separate from Auth.js sessions),
  accountant-side read-only multi-client view with per-client 80K cap badges, instant
  access revocation.
- **UBL 2.1 e-invoicing export** — Sprint 4, validated against the real OASIS UBL 2.1
  XSD schema set in Sprint 5 (replacing an earlier hand-rolled structural check).
- Real `next-intl` FR/AR translation of page content — Sprint 7. Arabic support before
  this sprint was RTL layout only; page copy itself was hardcoded French.

### Fixed
- All four PDF/XML generation routes (invoice, quote, declaration, UBL export) were
  returning HTTP 500 in both dev and production — a stacked `@react-pdf/renderer`
  bundling/version bug, silently broken since Sprint 1 until a walkthrough recording
  first exercised the routes in Sprint 10. Fixed; added a permanent regression test that
  checks real `%PDF` magic bytes.
- No Arabic font had ever been registered for the mandatory bilingual legal PDF
  mentions — fixed alongside the above with an embedded Noto Sans Arabic font
  (Sprint 10).
- BAM exchange-rate scraper's hardcoded URL was a live 404 in production since
  Sprint 2, silently falling back to manual entry on every request — found and fixed
  in Sprint 5.
- Zod validation-message i18n retrofit — remaining hardcoded French validation
  messages converted to per-request translated schemas (Sprint 8).

## [0.1.0] — 2026-05-20 (Sprints 0–3: MVP)

Initial public-facing release. All 15 root `CLAUDE.md` §14 Definition-of-Done items
complete.

### Added
- `packages/tax-engine` (Apache-2.0): 80K MAD per-client cap tracker, annual revenue
  thresholds, quarterly tax calculation, ICE/IF validation — all pure functions, fully
  unit-tested.
- Compliant invoice generator: every CGI Article 145 + auto-entrepreneur mandatory
  field, strict sequential numbering with no gaps, bilingual (FR/AR) PDF output.
- Foreign-currency invoicing with Bank Al-Maghrib reference-rate conversion.
- Quarterly declaration generator, pre-filled to match the Barid Al-Maghrib paper form.
- Annual threshold dashboard widget (200K services / 500K commercial-industrial-
  artisanal) with three-color status.
- Bilingual FR/AR UI including full RTL layout.
- `docker compose up -d` self-host install with Caddy automatic HTTPS.
- Docusaurus documentation site (FR primary).
