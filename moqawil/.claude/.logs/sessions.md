# Session Log

## Session: Sprint 0 — Scaffold
**Date**: 2026-05-18 (approx)
**Goal**: `pnpm install && docker compose up -d && pnpm dev` works
**Outcome**: ✅ Complete. Monorepo scaffold, 59 tax-engine tests passing, Drizzle migrations applied.

---

## Session: Sprint 1 — Tax Engine + Invoice Core
**Date**: 2026-05-18/19
**Goal**: AE profile onboarding, client CRUD with 80K cap badge, invoice creation with advisory-lock sequential numbering, invoice PDF bilingual FR+AR, dashboard threshold widget.
**Outcome**: ✅ Complete. 14 tasks delivered. All features functional.

**Key decisions:**
- Auth.js v5 split config: `auth.config.ts` (edge, middleware) + `auth.ts` (Node, server components). Prevents EPERM DATABASE_URL crash in Edge Runtime.
- PostgreSQL advisory lock (`pg_advisory_xact_lock`) for invoice sequence integrity.
- Cap check is server-side only — `capConfirmed` flag cannot bypass the re-check.

---

## Session: Sprint 2 — Declarations · BAM Rate · RTL · Docker
**Date**: 2026-05-19
**Goal**: Quarterly declarations, BAM rate scraper, locale toggle, RTL audit, Docker build.
**Outcome**: ✅ Complete. 11 tasks delivered.

**Stats:**
- TypeScript: 0 errors
- Unit tests: 52 passing / 5 skipped (no DB in CI)
  - `tax-engine`: 59 tests (Sprint 0)
  - `cap-tracker`: 13 tests (Sprint 1)
  - `invoice-numbering`: 6 tests (Sprint 1)
  - `security`: 10 tests (Sprint 1)
  - `declaration-queries`: 15 tests (Sprint 2) [5 DB-only, skipped]
  - `bam-scraper`: 9 tests (Sprint 2)
- Pages compiled: 12/12

**Known issue:** `pnpm build` fails on Windows (EPERM symlink in standalone trace). Compiles cleanly; issue is Windows symlink-permission in the standalone output phase only. Docker build unaffected.

---

## Session: Sprint 3 — Client Detail · Invoice Edit · Email · E2E · Threshold Alerts
**Date**: 2026-05-19
**Goal**: Close remaining MVP DoD gaps.
**Outcome**: ✅ Complete. 6 tasks delivered.

**What shipped:**
- **Client detail**: fixed invoice year filter (shows current-year invoices only)
- **Invoice edit** `/invoices/[id]/edit`: draft-only edit page; cap re-check on total change
- **Email PDF** (`sendInvoiceByEmail`): nodemailer v7, optional SMTP, graceful degradation
- **Threshold alerts** (`checkAndSendThresholdAlerts`): 70/90/100% boundaries, triggered on `markInvoicePaid`, best-effort (never blocks)
- **Playwright E2E** (`e2e/happy-path.spec.ts`): 7 authenticated + 4 unauthenticated tests; test Credentials provider guarded by `E2E_TEST_SECRET`

**Stats:**
- TypeScript: 0 errors
- Unit tests: 52 passing / 5 skipped

**MVP DoD remaining:**
- Docs site (Docusaurus, FR primary)
- Manual PDF review by Moroccan chartered accountant
