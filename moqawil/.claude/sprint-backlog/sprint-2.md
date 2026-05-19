# Sprint 2 — Declarations · BAM Rate · RTL · Docker

**Goal**: Quarterly declarations with printable PDF, BAM exchange-rate scraper, AR/FR locale toggle, RTL CSS audit, Docker production build validated.

**Status**: COMPLETE ✅  
**Completed**: 2026-05-19

---

## Backlog

| ID    | Task                                             | Specialist    | Size | Status   |
|-------|--------------------------------------------------|---------------|------|----------|
| S2-01 | Quarterly declaration DB query helpers           | Backend Dev   | M    | ✅ done  |
| S2-02 | `computeAndUpsertDeclaration` server action      | Backend Dev   | M    | ✅ done  |
| S2-03 | `DeclarationDocument` React-PDF template         | PDF Templates | L    | ✅ done  |
| S2-04 | `/api/declarations/[id]/pdf` route               | Backend Dev   | S    | ✅ done  |
| S2-05 | `/declarations` page — year selector + Q1-Q4 grid| Frontend Dev  | M    | ✅ done  |
| S2-06 | `DeclarationCard` component                      | Frontend Dev  | M    | ✅ done  |
| S2-07 | BAM exchange rate scraper (`/api/exchange-rate`) | Backend Dev   | M    | ✅ done  |
| S2-08 | Locale toggle (FR↔AR) + RTL audit                | Frontend Dev  | M    | ✅ done  |
| S2-09 | Dockerfile — two-stage build (tax-engine first)  | DevOps        | S    | ✅ done  |
| S2-10 | TypeScript check + unit tests (declaration + BAM)| Tester        | M    | ✅ done  |
| S2-11 | Sprint 2 snapshot                                | Project Monitor| S   | ✅ done  |

---

## Deliverables

### Quarterly declarations
- `src/lib/queries/declaration.ts`: `quarterDateRange`, `declarationDeadline`, `daysUntilDeadline`, `getQuarterlyTurnover`, `getDeclarationsForYear`, `computeAndUpsertDeclaration`
- `src/app/(app)/declarations/page.tsx`: year selector, 4-card grid
- `src/app/(app)/declarations/declaration-card.tsx`: status, deadline countdown, generate/print/submit actions
- `src/app/(app)/declarations/actions.ts`: `generateDeclaration` (returns id), `markDeclarationSubmitted`
- `src/app/api/declarations/[id]/pdf/route.ts`: auth-gated PDF stream
- `packages/pdf-templates/src/declaration-template.tsx`: bilingual Barid Al-Maghrib form

### BAM exchange rate
- `src/app/api/exchange-rate/route.ts`: HTML scraper with 24h `unstable_cache`, 8s timeout, graceful null fallback
- Auto-fill in invoice form with failure warning

### Locale / RTL
- `src/lib/i18n.ts`: reads `NEXT_LOCALE` cookie
- `src/app/actions/locale.ts`: sets cookie, revalidates layout
- `src/components/app-nav.tsx`: FR↔AR toggle, `border-e` logical property
- Root layout sets `lang` + `dir` attributes

### Docker
- `Dockerfile`: builds `@moqawil/tax-engine` before `@moqawil/web` (dist/ required)

### Tests
- `src/__tests__/declaration-queries.test.ts`: 15 tests (pure functions + 5 DB-skipped)
- `src/__tests__/bam-scraper.test.ts`: 9 tests

---

## Known issues
- `pnpm build` fails locally on Windows (EPERM symlink). TypeScript compiles cleanly (0 errors), 12/12 pages generate. Standalone file tracing is a Windows symlink-permission limitation; build succeeds in Docker/Linux.
- jose/CompressionStream Edge Runtime warning from next-auth — cosmetic only, does not affect runtime.
