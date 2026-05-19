# Activity Log

## Sprint 0 (2026-05-18)
- [x] Monorepo scaffold (pnpm workspaces, Next.js 15, Drizzle, Auth.js, Tailwind v4)
- [x] `packages/tax-engine` — all exports + 59 unit tests
- [x] `packages/db` — Drizzle schema (9 tables) + migrations
- [x] `packages/i18n` — locale config
- [x] `packages/pdf-templates` — scaffold
- [x] Docker Compose + Caddyfile
- [x] `.env.example`

## Sprint 1 (2026-05-18/19)
- [x] AE profile onboarding (`/settings?onboarding=1`)
- [x] Client CRUD with 80K cap badge (`CapBadge`, `CapConfirmDialog`)
- [x] Invoice creation with advisory-lock sequential numbering
- [x] Invoice PDF (`InvoiceDocument`) — bilingual FR+AR, all CGI Article 145 fields
- [x] `/api/invoices/[id]/pdf` route
- [x] Dashboard threshold widget
- [x] Auth.js split-config fix (Edge Runtime compatibility)
- [x] Sprint 1 tests: cap-tracker (13), invoice-numbering (6), security (10)

## Sprint 2 (2026-05-19)
- [x] Declaration query helpers (`quarterDateRange`, `declarationDeadline`, `daysUntilDeadline`, `getQuarterlyTurnover`, `getDeclarationsForYear`, `computeAndUpsertDeclaration`)
- [x] `DeclarationDocument` React-PDF — Barid Al-Maghrib form layout, bilingual
- [x] `/declarations` page + `DeclarationCard` component
- [x] `generateDeclaration` + `markDeclarationSubmitted` server actions
- [x] `/api/declarations/[id]/pdf` route
- [x] BAM exchange rate scraper — HTML regex parse, 24h cache, graceful fallback
- [x] Invoice form BAM rate auto-fill
- [x] Locale toggle FR↔AR (cookie-based, server action, `window.location.reload`)
- [x] Root layout `lang`/`dir` attributes
- [x] Dockerfile two-stage build (tax-engine → web)
- [x] Sprint 2 tests: declaration-queries (15), bam-scraper (9)
- [x] TypeScript check: 0 errors
