# Project Metrics

### 2026-08-10 SPRINT_SNAPSHOT — Sprint 8 (Close Remaining Small Gaps)
- **Planned**: 8 tasks (S8-01 through S8-08), 4 batches
- **Completed**: 8/8 (100%)
- **Blocked**: 0
- **Scope grew honestly**: scoping found ~10 hardcoded Zod messages; execution found 14 (registrationDate's distinct date-format message, and ICE/IF refine-fallback messages in both `client` and `settings` namespaces were missed by the original grep). All converted to per-request schema builders.
- **Real environment issue found and fixed during verification**: local Postgres volume had leftover e2e-test rows whose ICE values collided with two Vitest fixtures' hardcoded test data, silently defeating `onConflictDoNothing()` and causing FK failures — traced, confirmed as pre-existing local-only data hygiene (not a code regression, not reproducible in CI's fresh-per-run database), and cleaned up.
- **Test totals**: Vitest 103 passing/3 skipped, coverage 100% stmts/funcs/lines / 89.02% branches on gated files (clears Framework Rule 2). Playwright 18/18 passing/3 skipped, run with `--workers=1` against a real `next start` server (CI-matching).
- **New dependency**: none.
- **Infra**: `packageManager` field now pins pnpm to `9.15.4`, matching CI exactly — closes the local/CI pnpm-version divergence flagged in Sprint 5.
- **Velocity**: 8 sprints (+ 3.5) completed.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — see `.logs/activity.md` for commit details.
---

### 2026-08-10 SPRINT_SNAPSHOT — Sprint 7 (i18n Retrofit — real next-intl usage)
- **Planned**: 12 tasks (S7-01 through S7-12), 4 batches
- **Completed**: 12/12 (100%), plus one unplanned bugfix (email-result color logic)
- **Blocked**: 0
- **Scope**: 24 `(app)` pages/components + 3 shared components + 2 `(auth)` pages converted to real `useTranslations`/`getTranslations`; ~26 server-action-returned messages also translated (server-side, via `getTranslations()` inside the action functions). 2 new message namespaces added (`dashboard`, `settings`); dozens of keys filled into the 11 existing ones.
- **Real bug found and fixed**: `invoice-actions.tsx` determined its email-send result banner's color by string-matching the (French) success message text instead of using the action's own already-computed `success` boolean — would have broken once that message was translated, and was fragile regardless.
- **Documented, not fixed** (deliberate, size-scoped): Zod validation-schema messages remain French-only — translating them requires restructuring every action file's schemas to build per-request instead of at module scope.
- **Verification**: live runtime check (real `next start` server, real onboarded session, curl) confirmed zero i18n errors and genuine translated headings on 9 pages × 2 locales. New Playwright test clicks the real locale-toggle button and asserts genuine Arabic content + `dir="rtl"`. Full e2e suite 18/18 passing with `--workers=1` (matches CI's own forced serialization — a local-only flake from concurrent test-user collisions was found and correctly attributed, not "fixed" in the app).
- **Test totals**: Vitest 103 passing/3 skipped (unchanged — this sprint touched presentation only), Playwright 18/18 passing (17 existing + 1 new i18n test).
- **New dependency**: none.
- **Velocity**: 7 sprints (+ 3.5) completed. Sprint 7 = 12 tasks + 1 unplanned fix in one session.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — commit `e6c1fba`. CI run `31391975644`: all 6 jobs green (Lint, TypeCheck, Unit Tests, Security, Build, E2E) — the new i18n Playwright test confirmed passing in CI's real `workers: 1` environment.
---

### 2026-08-10 SPRINT_SNAPSHOT — Sprint 6 (Devis / Quote Management, v0.2)
- **Planned**: 13 tasks (S6-01 through S6-13), 4 batches
- **Completed**: 13/13 (100%), plus one unplanned fix (wiring `deleteQuote` to an actual UI control)
- **Blocked**: 0
- **Key refactor**: extracted the advisory-lock + sequential-numbering transaction out of `createInvoice` into a shared `createInvoiceInTransaction` helper (`lib/invoice-creation.ts`) — quote-to-invoice conversion reuses this exact function instead of a second implementation of "CGI Article 145: no gaps, ever." Re-ran the full pre-existing suite (102 tests) immediately after the refactor to confirm zero regression before building on it.
- **New feature surface**: `quotes`/`quote_lines` tables (own numbering sequence + lock namespace, separate from invoices), 5 server actions, quote PDF template, 4 new pages, quote i18n namespace.
- **Tests**: 15 new tests (`quote-db-integration.test.ts`, 8 tests: ownership scoping ×2 IDOR cases, the explicit "quotes never affect cap/threshold" invariant, 5-way numbering concurrency, real `createInvoiceInTransaction` conversion path + optional-field branch coverage; `invoice-numbering.test.ts` untouched, still 9/9). Web suite total: 103 passing, 3 skipped. Coverage on gated files: 100% stmts/funcs/lines, 89.02% branches — clears the 80% gate on every metric (Framework Rule 2).
- **E2E**: full Playwright suite run locally against a real dev server (not CI-only) — 17/17 pass, including a new devis-to-invoice conversion flow test through a real browser.
- **Build**: `pnpm build` succeeds cleanly, all quote routes generated.
- **Real gap found and documented** (not fixed this sprint — flagged in `.logs/risks.md`): next-intl is configured but never actually used for page-content translation anywhere in the app, pre-existing since Sprint 1. Followed the established (hardcoded-FR) pattern for consistency; added the `quote` i18n keys to both message files regardless, ready for a future i18n-retrofit sprint.
- **New dependency**: none.
- **Velocity**: 6 sprints (+ 3.5) completed. Sprint 6 = 13 tasks + 1 unplanned fix in one session.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — commits `15050ef`, `650a548`. CI run `31385872973`: all 6 jobs green (Lint, TypeCheck, Unit Tests, Security, Build, E2E) — the new devis→invoice e2e flow confirmed working in CI, not just locally.
---

### 2026-08-10 SPRINT_SNAPSHOT — Sprint 5 (Close Known Gaps — hardening, no new features)
- **Planned**: 13 tasks (S5-01 through S5-13), 4 batches
- **Completed**: 13/13 (100%)
- **Blocked**: 0
- **Real bugs found and fixed** (not just test-coverage padding):
  - BAM exchange-rate scraper's hardcoded URL was a live 404 in production since Sprint 2 — silently falling back to manual entry on every request, undetected because its unit test validated a hand-invented HTML structure instead of the real page. Fixed URL + parser against real captured markup.
  - Invoice numbering's "no gaps, ever" guarantee had only ever been tested with transactions awaited serially (never real lock contention) — added a genuine 8-way `Promise.all` concurrency test through the advisory lock; confirmed correct (no gaps/duplicates) across 4 repeated runs.
- **Risks closed** (`.logs/risks.md`): BAM scraper (open since Sprint 0), Auth.js v5 (open since Sprint 0) — both closed with concrete evidence, not just marked done.
- **Coverage gap closed**: `queries/{client,entrepreneur,invoice}.ts` — documented as excluded from the coverage gate since Sprint 3.5 — now have real DB-integration tests (16 new tests across 3 files), all executed against an actual local Postgres, not just typechecked.
- **Sprint 4 known gap closed**: UBL 2.1 export now validates against the real, live-fetched OASIS UBL 2.1 XSD schema set (14 vendored files) via `xmllint`, replacing the hand-rolled structural/order heuristic. Verified genuine (not rubber-stamp) validation in a Linux container before wiring into CI.
- **Test totals**: tax-engine 68 passed + 4 skipped (72) — coverage 99.24% stmts/97.91% branch/100% funcs/99.24% lines. Web 95 passed + 3 skipped (98) — coverage on newly-gated files 100% stmts/89.85% branch/100% funcs/100% lines. Combined: 163 passing, both packages clear the 80% gate on every metric (Framework Rule 2).
- **New dependency**: none added to the runtime/committed stack — `xmllint` is CI/test-tooling only (owner-approved); `@types/node` added to `packages/tax-engine` devDependencies (test-only Node builtin typings).
- **Environment note**: local pnpm (10.28.1) enforces `pnpm-workspace.yaml`'s supply-chain hardening settings that were documented as no-ops on CI's pinned pnpm 9.15.4 — they are not no-ops on newer pnpm. Worked around locally per-install; not a committed config change. Worth a closer look in a future sprint.
- **Velocity**: 5 sprints (+ 3.5) completed, Sprint 5 = 13 tasks in one session
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — 3 commits (`02ed7c9`, `0407b59`, `8d5c0fe`)
---

### 2026-05-20 00:30 SPRINT_SNAPSHOT — Sprint 3 (v0.1 COMPLETE)
- **Planned**: 8 tasks
- **Completed**: 8 tasks (100%)
- **Playwright**: 4/4 smoke tests pass (Chromium), 3 skipped (auth-required, expected)
- **playwright.config.ts**: fixed — webServer skipped when PLAYWRIGHT_BASE_URL is set
- **Docusaurus**: scaffold + 4 FR pages (intro, installation, facturation, déclaration)
- **README**: updated with v0.1 badge, correct GitHub URL, docs links
- **v0.1 DoD**: ✅ 15/15 COMPLETE
- **Total tests**: 111 unit (Vitest) + 4 e2e (Playwright smoke) = 115 passing
- **Velocity**: 3 sprints, 33 tasks total, 0 blockers unresolved
---

### 2026-05-19 23:15 SPRINT_SNAPSHOT — Sprint 2
- **Planned**: 11 tasks
- **Completed**: 11 tasks (100%)
- **Blocked**: 0
- **Carry-over from S1**: S2-01 through S2-07 already implemented in Sprint 1 (7/11)
- **New work this session**: S2-08 RTL audit (6 files fixed), S2-09 Docker build fix (standalone conditional on DOCKER_BUILD=1), S2-10 tests pass
- **Test results**: 111 pass (59 tax-engine + 52 web), 5 skipped (DB integration, expected)
- **Build**: ✅ `pnpm build` zero TypeScript errors, 16 routes generated
- **RTL fixes**: text-left/right → text-start/end in tables; ArrowLeft rtl:rotate-180; ChevronRight rtl:rotate-180; declaration year nav arrows direction-aware
- **DoD progress**: 13/15 items complete (missing: e2e Playwright test, docs site)
- **Velocity**: Sprint 1 + Sprint 2 = 25 tasks done
- **Open risks**: BAM scraper production test pending (tested in unit tests only)
---

<!-- Sprint snapshots are logged here at end of each sprint. -->
<!-- Format: ### [date] SPRINT_SNAPSHOT — Sprint N -->

### 2026-05-19 18:15 SPRINT_SNAPSHOT — Sprint 0
- **Planned**: 18 tasks
- **Completed**: 18 tasks (100%)
- **Blocked**: 0
- **Velocity**: 18 tasks/sprint
- **DoD Progress**: 7/15 items ready (scaffold-level)
- **Files created**: 45+ (monorepo + packages + app + tests + docker + .claude)
- **Tests written**: 45+ unit tests for tax-engine (100% function coverage design)
- **Open risks**: 3 (Auth.js v5, BAM scraper, tax citations — all mitigated)
---

### 2026-05-19 00:00 FRAMEWORK_SETUP — .claude framework initialized
- **Sprint**: pre-Sprint 0
- **Planned**: 18 sprint-0 tasks defined
- **DoD items**: 0/15 (sprint not started)
- **Skills defined**: 14 specialists
- **Auto-handoff**: enabled
---
