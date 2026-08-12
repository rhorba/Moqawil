# Project Metrics

### 2026-08-13 SPRINT_SNAPSHOT -- Sprint 13 (Preprod CI/CD Deployment Pipeline)
- **Planned**: 5 tasks (S13-01 through S13-05), 4 batches
- **Completed**: 5/5 (100%)
- **Blocked**: 0 code-side. Owner-only execution remains: provisioning the preprod VPS, DNS, GitHub Environment (`preprod`) + 5 secrets, and clicking "Run workflow" for the first live deploy (`docs/preprod-deployment-moqawil.md` §1-5).
- **Scope**: `docker-compose.preprod.yml` (new, additive, standalone -- self-host path untouched), `.github/workflows/deploy-preprod.yml` (manual-trigger build-push-to-GHCR then SSH-deploy-and-health-check pipeline), `docs/preprod-deployment-moqawil.md` (owner setup guide: cheap-VPS pick, DNS, secrets, first run, security notes).
- **Real issue found and fixed this sprint**: initial workflow draft interpolated the untrusted `workflow_dispatch` `ref` input directly into a `run:` shell script body for the remote SSH command -- a GitHub Actions command-injection class. Fixed before shipping: `ref` now only ever reaches `actions/checkout`'s `with:` parameter; the remote's compose config syncs from a fixed `origin/master`, and the deployed app version is pinned by a computed, injection-safe `DEPLOY_TAG` (git short-SHA).
- **Verification**: new YAML parses cleanly under `yaml.safe_load`; `pnpm lint` clean (143 files); `git status` confirms zero application-code files touched (only new sprint/workflow/compose/doc files + the pre-existing 2026-08-13 decisions.md entry from this session's earlier advisory conversation). No live deploy run this session -- requires owner-provisioned VPS/secrets.
- **New dependency**: none (uses existing Dockerfile; GHCR auth via the workflow's built-in `GITHUB_TOKEN`, no new registry service).
- **Velocity**: 13 sprints (+ 3.5) completed.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) -- commit `5e4be5d`.
---

### 2026-08-12 SPRINT_SNAPSHOT -- Sprint 12 (Launch Readiness & Distribution)
- **Planned**: 12 tasks (S12-01 through S12-12), 5 batches
- **Completed**: 12/12 (100%)
- **Blocked**: 0 code-side. All owner-only execution steps remain exactly that -- signing ToS/Privacy Policy into effect, filing with CNDP, hiring a pentest vendor, buying a VPS/domain, running the deployment runbook, submitting any of the 5 announcement drafts, and picking real named accountants off the sourcing list in docs/accountant-outreach-list-moqawil.md.
- **Scope**: Batch 1 legal drafts (ToS, Privacy Policy, CNDP checklist -- all explicitly pending-lawyer-review, not in effect). Batch 2 security audit prep (pentest scope doc citing the Sprint 9 + Sprint 11 internal IDOR audits, security-posture one-pager). Batch 3 deployment runbook (VPS/DNS/Docker/Caddy/backups/monitoring; flagged a real Caddyfile/caddy-docker-proxy wiring inconsistency, not fixed -- architecture decision for a future sprint). Batch 4 launch content: 3 bilingual (FR+AR) SEO articles wired into the docs site and build-verified for both locales, CHANGELOG.md (new), README/LICENSE verification (root LICENSE was stale MIT, corrected to AGPL-3.0), 5 announcement drafts (r/Maroc, r/MoroccanDevs, FB group, LinkedIn, Show HN -- all pointed at the self-hosted GitHub repo, not a not-yet-legally-ready hosted product), accountant outreach framework (deliberately not a fabricated name list -- a live web search couldn't surface independently verifiable individuals, so this batch produced a sourcing method + template instead per the same owner-verifies-real-identity pattern as Batches 1-3).
- **Real issue found and fixed this sprint**: root `LICENSE` file was still the original MIT scaffold text, contradicting root `CLAUDE.md` section 13 and the README's own AGPL-3.0 badge since Sprint 0. Replaced with the real AGPL-3.0 license text.
- **Verification**: `pnpm typecheck` clean across 6 workspace projects. `pnpm lint` clean (1 pre-existing formatting drift in `smoke.spec.ts` auto-fixed). Full Vitest 192 passing / 7 skipped (tax-engine 68/4, web 124/3). Coverage on gated files 100% stmts/100% funcs/100% lines/92.78% branch -- clears Framework Rule 2's 80% gate, unchanged from Sprint 11 (no regression). Playwright: 21/21 passing / 3 skipped, verified against a real `next start` production server (matching CI) after an initial `next dev` run hit the project's already-documented cold-compile flakiness class -- not a regression, confirmed by the clean production-server run. `moqawil/docs` Docusaurus build green for both `fr` and `ar` locales with the new articles live.
- **New dependency**: none.
- **Velocity**: 12 sprints (+ 3.5) completed.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) -- commit `f2ce579`.
---

### 2026-08-11 SPRINT_SNAPSHOT — Sprint 11 (SaaS Readiness: Multi-Tenant Hosting)
- **Planned**: 13 tasks (S11-01 through S11-13), 5 batches
- **Completed**: 13/13 (100%)
- **Blocked**: 0 code-side. 3 items explicitly deferred to the owner (VPS/domain provisioning, ToS/Privacy Policy legal text, formal pen-test) — see `docs/prd-sprint11-saas-readiness.md` §8.
- **Scope**: reframed the app's deployment posture from self-host-only to also support a Moqawil-operated multi-tenant hosted instance, same solo-AE persona, no billing yet. PRD + 3 foundation docs revised before code (Framework Rule 6). Full IDOR re-audit of every query/action/API route. In-process rate limiter on `/api/auth/signin*`. `/api/health` + configurable `DB_POOL_MAX`. `scripts/backup-db.sh`. Public FR/AR landing page at `/` (previously 404).
- **Unplanned but resolved this sprint**: a real IDOR defense-in-depth gap in `getClientAnnualTotal` (no `entrepreneurId` filter of its own — not currently exploitable, but broke the ownership-check pattern every other query follows). Fixed + regression test added. Full writeup: `.logs/issues.md`.
- **Recurring pattern confirmed, not new**: hit the same test-fixture ICE-collision class of bug Sprint 10 already fixed once (commit `f024466`, "not reproducible against the persistent local dev DB") — twice this sprint, different files/ICE values, same root cause (Playwright e2e fixtures and Vitest DB-integration fixtures share one persistent local dev DB with no cross-suite cleanup, so hardcoded fixture ICE values can collide across suites). Cleaned up both instances to unblock this session; the underlying fix (giving each suite non-overlapping fixture ranges, or running vitest against a disposable DB like CI already does) is flagged as a small future housekeeping task, not fixed here — two independent occurrences across two sprints is enough signal to flag, not yet enough to justify scope-creeping into this sprint.
- **Verification**: `pnpm --filter @moqawil/web typecheck` clean, `pnpm lint` clean (143 files). Full Vitest suite 120/120 passing (3 intentionally skipped) after fixture cleanup — the one file that failed before cleanup (`invoice-queries-db-integration.test.ts`) was re-confirmed passing 100% in isolation both before and after, consistent with the known parallel-DB-integration-test flakiness class diagnosed earlier this session (not a regression). Playwright e2e: 21/21 passing single-threaded (3 intentionally skipped), including 2 new landing-page smoke tests — confirms the rate limiter doesn't false-positive against legitimate e2e traffic. Manual: `/api/health` returns `{"status":"ok"}`; a 10-request burst against `/api/auth/signin/credentials` returned exactly 5×302 then 5×429, matching the configured `limit: 5` exactly.
- **New dependency**: none — rate limiter is in-process (no Redis/Upstash), consistent with the existing single-VPS/no-horizontal-scaling NFR.
- **Velocity**: 11 sprints (+ 3.5) completed.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — commit `a62a293`.
---

### 2026-08-11 SPRINT_SNAPSHOT — Sprint 10 (Hardening/Polish + Full Walkthrough Refresh)
- **Planned**: 11 tasks (S10-01 through S10-11), 4 batches
- **Completed**: 11/11 (100%)
- **Blocked**: 0
- **Scope**: doc-nav/README hardening (orphaned `guide-devis` page fixed, new `guide-comptable.md`, README version/feature-list refresh), coverage-gap review (6 flagged spots — all justified as unreachable defensive branches, one genuine gap closed with a new test), `.env.example`/`biome.json` completeness fixes, full walkthrough script extension (devis section, real PDF-viewer screenshots for all 4 generated-document types, full accountant multi-actor flow), fresh screenshot set (34 PNGs) + fresh screen-recorded video, replacing the stale pre-Sprint-6 set.
- **Unplanned critical fix (not in original scope)**: all 4 PDF/XML generation routes were returning HTTP 500 in both dev and production — a stacked bug (webpack/RSC bundling incompatibility for `@react-pdf/renderer`'s reconciler + an upstream `4.1.6`-`4.5.1` version bug) found only because writing the new PDF-viewer walkthrough steps actually exercised the routes for the first time. Fixed: `webpack.externals` override, exact-pin `@react-pdf/renderer@4.6.0`, plus a genuinely separate pre-existing gap (no Arabic font ever registered for mandatory bilingual legal text) fixed alongside it via a base64-embedded Noto Sans Arabic font. New regression test `pdf-templates.test.ts` checks real `%PDF` magic bytes — first test in the project's history to verify actual PDF output rather than just UI interaction. Full incident detail: `.logs/risks.md`.
- **User feedback addressed mid-sprint**: "dont forget to scrolldown in the video and the screenshots" — `shot()` helper was viewport-only (620px), truncating Settings' profile+accountant-links section below the fold. Fixed: `fullPage: true` on all screenshots, plus a `scrollThroughPage()` helper so the recorded video visibly scrolls through long pages, not just the screenshot silently capturing everything.
- **Verification**: `pnpm lint` clean (129 files). Full Vitest suite 119/119 passing (3 intentionally skipped). Coverage on included files: 100% stmts/lines, 100% funcs, 92.78% branch — comfortably over the 80% gate (Framework Rule 2). `pnpm build` clean on a freshly wiped `.next`. Walkthrough dry-run then real recording both passed 1/1, producing 34 screenshots + a 98s video, spot-checked visually (Arabic PDF text renders correctly, cap badges show real data, Settings page no longer truncated).
- **New dependency**: none (the `@react-pdf/renderer` version pin is an existing dependency's version change, not a new package).
- **Velocity**: 10 sprints (+ 3.5) completed.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — commit `1fa7271`, plus two same-session follow-up fixes surfaced by CI and by the user watching the recording: `f024466` (test fixture ICE collision CI's fresh DB caught, not reproducible against the persistent local dev DB) and `1d7fa67` (walkthrough video only showed the browser window's top-left corner — this machine's 150% Windows display scaling made Chromium's `--window-size` render larger in physical pixels than ffmpeg's fixed capture region; fixed with `--force-device-scale-factor=1`, re-recorded, verified via extracted frames). Final CI run `31460125281` on `1d7fa67`: all 6 jobs green (Unit Tests, TypeCheck, Security, Lint, Build, E2E).
---

### 2026-08-10 SPRINT_SNAPSHOT — Sprint 9 (Accountant Multi-Client Dashboard, v0.2)
- **Planned**: 17 tasks (S9-01 through S9-17), 6 batches
- **Completed**: 17/17 (100%)
- **Blocked**: 0 (Docker Desktop got stuck on first startup this session — force-restarted, resolved, not a code blocker)
- **Scope**: new `accountant_links` table (entrepreneur-initiated invite, no `role` column on `users`); authorization boundary (`getAccessibleEntrepreneurs`/`assertAccountantAccess`/batched dashboard query, all joining through `accountant_links`); bespoke invite-token flow deliberately separate from Auth.js's `verificationTokens`; entrepreneur-side Settings UI (invite/list/revoke); accountant-side route group (list + per-entrepreneur drill-down with 80K cap badges, reusing existing tax-engine functions); nav gating; FR/AR i18n. Framework Rules 1 and 6 applied — System Designer + Software Architect passes produced `docs/system-design-accountant-dashboard.md` + `docs/architecture-accountant-dashboard.md`, committed before implementation.
- **Security review (Framework Rule 5, mandatory)**: IDOR, invite-token entropy/single-use/race-safety/expiry, and revocation-latency all CONFIRMED OK with file:line evidence. Invite-spam/enumeration explicitly logged as an ACCEPTED RISK (self-hosted single-tenant threat model, reasoning in `.logs/risks.md`). Two low-severity issues found during review were fixed same-session, not deferred: email-mismatch check on the accept page now fails closed on a missing session email; entrepreneur `SELECT`s narrowed to avoid over-fetching `bankIban`/ICE/IF/address/phone into Server Component data.
- **Real bugs found and fixed during this sprint** (none deferred): (1) accountant drilldown reused the wrong empty-state copy for "no clients yet" (found via manual browser QA); (2) the pre-existing `/api/e2e/cleanup` test-only route never deleted `quotes`, so a quote converted to an invoice in one test run permanently blocked that invoice's deletion in the next (test-infra only, not production code, discovered while getting a clean Playwright run).
- **Verification**: `pnpm build` clean. Full Playwright suite 19/19 passing (3 intentionally skipped), run with `--workers=1` against a real `next start` server on a freshly rebuilt `.next` (a mid-session mistake — running `next build` against the same `.next` directory as a live `next dev` process — corrupted the dev server's chunk manifest; rebuilt clean, not a code defect). New two-actor Playwright test (`accountant-dashboard.spec.ts`) uses two isolated browser contexts to genuinely simulate the entrepreneur and accountant as separate signed-in users, covering invite → SMTP-fallback link → cross-user accept → scoped dashboard → drill-down → revoke → immediate access loss on the very next request.
- **Coverage**: new Sprint 9 files pass the 80% gate comfortably in isolation — `queries/accountant.ts` 92.85% stmts/90.9% branch/83.33% funcs, `invite-token.ts` 100% across the board (added to `vitest.config.ts`'s coverage-include list per this repo's established convention). Full-suite local coverage run blocked by 3 pre-existing, already-flagged-this-session local Postgres fixture collisions (real manual-testing data reusing tax-engine's placeholder ICE values, declined to delete — see mid-session exchange) — unrelated to Sprint 9 (all 3 files pre-date this sprint, none touched), confirmed by Sprint 9's own suite passing 9/9 cleanly every run. CI's fresh-DB run is the authoritative full-suite+coverage signal, per this project's established closing pattern.
- **New dependency**: none.
- **Velocity**: 9 sprints (+ 3.5) completed.
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — commit `4b06918`. CI run `31425107581`: all 6 jobs green (Unit Tests, TypeCheck, Security, Lint, Build, E2E) — confirms the coverage gate genuinely passes against CI's fresh-per-run database, validating this session's local-DB-pollution diagnosis (unrelated pre-existing fixture collisions, not reproducible in CI).
---

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
- **Pushed**: `git push origin master` at sprint close (Framework Rule 3) — commits `805f40f`, `ecdd6be`. CI run `31398029763`: all 6 jobs green (Unit Tests, Security, Lint, TypeCheck, Build, E2E) — first run (`31397631483`) caught a real `package.json` formatting drift from the pnpm pin, fixed in a follow-up commit (see `.logs/activity.md`).
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
