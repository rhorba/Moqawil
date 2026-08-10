# Session Log

### 2026-08-10 SESSION_END — Sprint 9 (Accountant Multi-Client Dashboard, v0.2) COMPLETE, CI confirmed green
- **Completed**: Sprint 9 all 17 tasks (S9-01 through S9-17) across 6 batches.
- **Key deliverables**:
  - Foundation docs first (Framework Rule 6): `docs/system-design-accountant-dashboard.md` + `docs/architecture-accountant-dashboard.md`, committed before any implementation code
  - `accountant_links` table (entrepreneur-initiated invite, capability-based access, no `role` column on `users`), authorization boundary (`getAccessibleEntrepreneurs`/`assertAccountantAccess`) joined into every accountant-route query, bespoke race-safe invite-token flow deliberately separate from Auth.js's `verificationTokens`
  - Entrepreneur-side Settings UI (invite/list/revoke) + accountant-side route group (list + per-entrepreneur drill-down reusing existing tax-engine threshold/cap functions), nav gating, FR/AR i18n
  - Mandatory Security Engineer review (Framework Rule 5): IDOR/token/revocation-latency all CONFIRMED OK with evidence; invite-spam logged as an accepted risk with reasoning; 2 low-severity issues found and fixed same session (fail-closed email check, narrowed entrepreneur SELECTs)
  - Two real bugs found and fixed during verification, not deferred: accountant drill-down's wrong empty-state copy; a pre-existing bug in the test-only `/api/e2e/cleanup` route (never deleted `quotes`, blocking a converted invoice's deletion in later runs)
  - New two-actor Playwright test using isolated browser contexts (not same-browser tabs, which share cookies) to genuinely verify cross-user invite/accept/revoke/immediate-access-loss
  - CI run `31425107581`: all 6 jobs green (Unit Tests w/ coverage, TypeCheck, Security, Lint, Build, E2E)
- **Blocked**: None (Docker Desktop hung on its first startup this session — force-restarted, resolved; not a code issue)
- **Local-environment note, not a Sprint 9 defect**: this session's local Postgres dev volume has accumulated real manual-testing data (an entrepreneur profile literally named after the CLAUDE.md persona) that collides with three pre-existing test files' hardcoded fixture ICE values, causing local full-suite runs to show 3 failing suites unrelated to this sprint's own code. Flagged to the user mid-session; declined a full volume wipe and declined deleting the specific colliding row (looked like real data, not disposable debris). Sprint 9's own new test suite passed 9/9 in isolation every run; CI's fresh-per-run database confirmed the full suite (including coverage) is genuinely green — this local pollution is worth a dedicated cleanup pass in a future session but does not block anything.
- **Next session**: No Sprint 10 backlog exists yet. Sprint 9 was the last big v0.2 feature area explicitly named in prior session logs (accountant multi-client dashboard). Open items to raise with the owner: (1) local dev-DB cleanup (see above), (2) what's next for v0.2/launch-prep now that the major planned features are done — options from earlier scoping still open: launch-prep/distribution content (CLAUDE.md §16), or further hardening.
- **Open risks**: invite-spam/email-enumeration on the new accountant-invite flow (accepted risk, logged in `.logs/risks.md`, revisit if a multi-tenant cloud tier ships)
---

### 2026-08-10 SESSION_END — Sprint 8 (Close Remaining Small Gaps) COMPLETE, CI confirmed green
- **Completed**: Sprint 8 all 8 tasks (S8-01 through S8-08) across 4 batches.
- **Key deliverables**:
  - Every module-scope Zod schema in `invoices/`, `quotes/`, `clients/`, `settings/actions.ts` converted to a per-request schema builder using `getTranslations()` — validation messages now genuinely render in the active locale (14 new keys across `invoice`/`quote`/`client`/`settings` namespaces in both `fr.json`/`ar.json`)
  - `packageManager: "pnpm@9.15.4"` pinned in root `package.json`, matching CI exactly — closes the Sprint 5 local/CI pnpm-version divergence
  - Stale "tax rate citations" risk (open since Sprint 0) closed with grep evidence — the citations were already there
  - Found and cleaned up genuine stale local Postgres test data (two leftover e2e entrepreneur rows colliding with Vitest fixture ICE values) while running full verification — root-caused and documented as local-only, not a CI/code issue
  - Full verification, not just typecheck: `pnpm build` green, Vitest 103/103 passing (3 skipped) at 100% stmts/funcs/lines + 89% branch coverage, Playwright 18/18 passing (3 skipped) run with `--workers=1` against a real `next start` server
- **Blocked**: None (Docker Desktop wasn't running at session start — started it directly rather than treating it as a hard blocker, since this project's own `docker-compose.yml` is the documented dev-DB path)
- **CI**: first push caught a real formatting drift (corepack's package.json rewrite broke Biome formatting, missed because local lint verification was scoped to `apps/web` instead of the full repo) — fixed in a follow-up commit, second CI run (`31398029763`) all 6 jobs green
- **Next session**: No Sprint 9 backlog exists yet. Owner has already confirmed the next sprint is the accountant multi-client dashboard (the last big v0.2 feature) — per `sprint-8.md`'s own Design section.
- **Open risks**: none new this sprint
---

### 2026-08-10 SESSION_END — Sprint 7 (i18n Retrofit) COMPLETE, CI confirmed green
- **Completed**: Sprint 7 all 12 tasks (S7-01 through S7-12) across 4 batches, plus one unplanned bugfix.
- **Key deliverables**:
  - Every `(app)`/`(auth)` page, all shared components, and ~26 server-action messages converted from hardcoded French to real `useTranslations`/`getTranslations` — the AR locale now genuinely translates page content, not just the nav sidebar and RTL layout direction (the gap found at the end of Sprint 6)
  - `app-nav.tsx` simplified from its own parallel i18n system to the standard mechanism, with one deliberate documented exception (locale names shown in their own script)
  - Found and fixed a real pre-existing bug: email-send result banner color was picked by string-matching the French success message instead of using the action's own `success` boolean
  - Verified live (not just typecheck): curl against a real running server confirmed zero i18n errors + genuine Arabic headings on 9 pages × 2 locales; new Playwright test clicks the real locale toggle and asserts genuine Arabic content + `dir="rtl"`
  - Documented remaining gap: Zod validation-schema messages still French-only (module-scope schemas can't easily be made per-request)
  - CI run `31391975644`: all 6 jobs green
- **Blocked**: None
- **Next session**: No Sprint 8 backlog exists yet. Remaining options from earlier scoping: accountant multi-client dashboard, launch-prep/distribution content. Also open: Zod validation-message translation (documented gap), local pnpm-version supply-chain-hardening quirk (Sprint 5)
- **Open risks**: none new this sprint (the i18n gap risk from Sprint 6 is now closed)
---

### 2026-08-10 SESSION_END — Sprint 6 (Devis/Quote Management) COMPLETE, CI confirmed green
- **Completed**: Sprint 6 all 13 tasks (S6-01 through S6-13) across 4 batches, plus one unplanned fix.
- **Key deliverables**:
  - `quotes`/`quote_lines` schema with their own numbering sequence and lock namespace, separate from invoices
  - Extracted invoice numbering's advisory-lock transaction into a shared `createInvoiceInTransaction` helper — quote-to-invoice conversion reuses it exactly, no second implementation of the "no gaps, ever" guarantee
  - Full quote lifecycle: create/edit(draft-only)/delete(draft-only)/send/accept/reject, convert-to-invoice re-running the same 80K cap check direct invoice creation does
  - Quote PDF (visually distinct, explicit "not an invoice" disclaimer), full UI (list/create/detail/edit), nav entry, i18n namespace
  - 15 new tests (real DB integration, including the explicit "quotes never affect cap/threshold" invariant and a 5-way numbering concurrency test); full Playwright e2e suite run locally AND confirmed in CI (17/17 pass) including a new devis→invoice conversion flow test
  - Discovered and documented (not fixed) a pre-existing gap: next-intl configured but never used for page-content translation anywhere in the app, since Sprint 1
  - CI run `31385872973`: all 6 jobs green
- **Blocked**: None
- **Next session**: No Sprint 7 backlog exists yet. Remaining options from earlier scoping: accountant multi-client dashboard, launch-prep/distribution content. Also open: the next-intl gap (would need a dedicated i18n-retrofit sprint), and the local-pnpm-version supply-chain-hardening-enforcement quirk noted in Sprint 5
- **Open risks**: next-intl i18n gap (new, documented), local pnpm 10.28.1 enforces settings CI's pinned 9.15.4 doesn't (documented in Sprint 5)
---

### 2026-08-10 SESSION_END — Sprint 5 (Close Known Gaps) COMPLETE, CI confirmed green
- **Completed**: Sprint 5 all 13 tasks (S5-01 through S5-13) across 4 batches.
- **Key deliverables**:
  - Fixed a real production bug: BAM exchange-rate scraper's URL was a live 404 since Sprint 2, silently falling back to manual entry on every request
  - Closed 2 long-open risks (BAM scraper, Auth.js v5) with concrete evidence
  - Added real DB-integration tests for `client.ts`/`entrepreneur.ts`/`invoice.ts` queries (16 new tests) plus a genuine-concurrency test proving invoice numbering has no gaps under contention
  - Closed Sprint 4's documented known gap: UBL 2.1 export now validates against the real, live-fetched OASIS XSD schema set via `xmllint`
  - Cleaned up a stray duplicate `.claude/` folder under `moqawil/`
  - CI run `31381010461` confirmed all 6 jobs green (Lint, TypeCheck, Unit Tests, Security, Build, E2E) after the push
- **Blocked**: None
- **Next session**: No Sprint 6 backlog exists yet — options discussed earlier remain open (devis/quote management, accountant multi-client dashboard, launch-prep/distribution content), or continue hardening
- **Open risks**: local pnpm (10.28.1) enforces supply-chain hardening settings that were assumed no-ops on CI's pinned 9.15.4 — worth a closer look
---

### 2026-08-10 SESSION_START — resuming, catching up unlogged prior-session work
- **Context**: Resumed via "continue". Verified real repo/CI state rather than trusting stale logs: working tree clean, `master` up to date with `origin/master`, last 5 CI runs on GitHub Actions all green (most recent: `ce4005e`, run `31278744178`, 3m44s).
- **Found**: The most recent commit (`ce4005e` — sign-in RSC redirect bugfix, walkthrough recording tooling, trilingual pitch deck/memo) was never logged to `.logs/activity.md` or `.logs/sessions.md` in a prior session. Backfilled to `activity.md`.
- **Resuming from**: Sprint 4 (e-invoicing format readiness) is COMPLETE and CI-confirmed. No Sprint 5 backlog exists yet. `sprint-3.md`'s own checkboxes are stale/inconsistent with reality (shows "IN PROGRESS" though v0.1 DoD was confirmed 15/15 complete per the 2026-05-20 session log) — cosmetic only, not blocking.
- **Open items carried forward, all owner-decision, not autonomously actionable**:
  1. Legal scope citation (chartered accountant / OEC) on whether AE status falls under the Jan 2027 DGI e-invoicing wave — required before any marketing claim beyond "format-ready" (CLAUDE.md §13).
  2. DGI/xHub sandbox registration — needed before a real `DgiXhubClearanceProvider` can be built.
  3. Barid eSign account — needed before real QES/AES signing.
  4. Stale duplicate `moqawil/.claude/sprint-backlog/` (sprint-2.md, sprint-3.md, showing false "COMPLETE" status) — flagged since 2026-08-08, still not resolved; needs owner decision to delete or keep.
- **Plan**: Present state to user, ask what to work on next (no auto-continuable sprint task exists).
---

### 2026-05-20 00:30 SESSION_END — v0.1 COMPLETE
- **Completed**: Sprint 3 all 8 tasks done. v0.1 DoD 15/15.
- **Key deliverables**:
  - Playwright smoke tests: 4/4 pass (Chromium); playwright.config.ts fixed for pre-existing server
  - Chromium browser installed for CI/local
  - Docusaurus docs site: scaffold + 4 FR pages (intro, installation, facturation, déclaration)
  - README updated: v0.1 badge, correct GitHub URL (rhorba/Moqawil), docs links
  - 115 total tests passing (111 Vitest + 4 Playwright smoke)
- **Blocked**: None
- **Next session**: Launch prep — Show HN post, r/MoroccanDevs announcement, SEO blog posts (per CLAUDE.md §16)
- **v0.1 DoD**: ✅ COMPLETE
---

### 2026-05-19 23:20 SESSION_END
- **Completed**: Sprint 2 all 11 tasks done. Project pushed to GitHub (rhorba/Moqawil).
- **Key deliverables**:
  - S2-08: RTL audit — 6 files fixed (text-start/end, rtl:rotate-180 on arrows, direction-aware nav)
  - S2-09: Docker build unblocked — `output: standalone` now conditional on `DOCKER_BUILD=1` (Windows symlink fix)
  - S2-10: 111 tests passing (59 tax-engine + 52 web), 5 skipped (DB integration)
  - Initial GitHub push: 128 files, rhorba/Moqawil master
- **Blocked**: None
- **Next session**: Sprint 3 — Playwright e2e test + Docusaurus docs site (2 remaining DoD items)
- **Open risks**: BAM scraper not live-tested against production bkam.ma
---

### 2026-05-19 20:00 SESSION_START
- **Context**: Resuming after Sprint 1 completion + initial GitHub push (rhorba/Moqawil).
- **Resuming from**: Sprint 1 all done (88 tests passing). Starting Sprint 2.
- **Plan**: Execute Sprint 2 — S2-01 through S2-11 (Declarations, BAM rate, RTL, Docker)
- **Auto-handoff**: ENABLED — 🟡 BALANCED
---

### 2026-05-19 19:05 SESSION_END
- **Completed**: Sprint 1 all 14 tasks (S1-01 through S1-14). App live on port 3005.
- **Key deliverables**:
  - AE profile onboarding (ICE/IF validation, activity type, invoice prefix)
  - Client CRUD with cap badge (🟢🟡🔴) visible on list + detail + invoice form
  - Invoice creation with advisory-lock sequential numbering + server-side cap check
  - Blocking 80K cap confirmation dialog with WHT surplus calculation
  - Invoice PDF (React-PDF, bilingual FR+AR legal mentions, all CGI Article 145 fields)
  - Dashboard with annual threshold widget + quarterly timeline
  - 88 tests passing (59 tax-engine + 29 web app; 2 integration tests skip without TEST DB)
  - TypeScript strict: zero errors
- **Blocked**: None
- **Next session**: Sprint 2 — quarterly declarations + BAM exchange rate + onboarding improvements
- **Open risks**: Edge middleware auth split (resolved), BAM rate scraper still stub
---

### 2026-05-19 18:20 SESSION_END
- **Completed**: .claude framework (14 skills, settings, CLAUDE.md, logs) + Sprint 0 all 18 tasks + Sprint 1 backlog seeded
- **In progress**: Sprint 1 ready to execute (S1-01 is next)
- **Blocked**: None
- **Next session**: `pnpm install && docker compose up -d postgres && pnpm db:migrate` then execute Sprint 1 starting at S1-01
- **Open issues**: 0
- **Open risks**: 3 (Auth.js v5 pin, BAM scraper stub, tax citations — all logged in risks.md)
---

### 2026-05-19 00:00 SESSION_START
- **Context**: .claude framework created. Sprint 0 backlog defined. Project: Moqawil v0.1 (Moroccan AE compliance toolkit).
- **Resuming from**: Fresh project start — no previous sessions
- **Plan**: Execute Sprint 0 (scaffold) — pnpm monorepo + tax-engine + Drizzle schema + Next.js app + Docker Compose
- **Auto-handoff**: ENABLED — 🟡 BALANCED choices throughout
---
