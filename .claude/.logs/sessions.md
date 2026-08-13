# Session Log

### 2026-08-13 SESSION_END — Preprod DB wipe + fresh detailed walkthrough recording (ended abruptly, not by normal close)
- Previous session was cut off by mistake before it could commit its own wrap-up; this entry backfills it at the start of the next session so continuity isn't lost.
- **This session's work**: added opt-in `wipe_data` input to `.github/workflows/deploy-preprod.yml` (truncates app tables via existing SSH secrets); fixed a real GH Actions boolean-vs-string gotcha (`if: inputs.wipe_data == 'true'` silently false → `if: ${{ inputs.wipe_data }}`); wiped preprod and recorded a genuinely fresh ~40-minute walkthrough from an empty account (`.recordings/v0.2-2026-08-13.mp4`, ffprobe-verified valid) covering onboarding, all 3 cap states + blocking dialog on both entry points, a cancelled invoice, foreign-currency/BAM-fallback, quarterly declarations, accountant invite lifecycle, and FR/AR RTL. Full detail in `.logs/activity.md`'s matching entry.
- **State at cutoff**: work itself fully resolved and verified. Left uncommitted: the `.logs/activity.md` write-up of this work, and `.claude/settings.local.json`'s accumulated permission diff (ffmpeg/ssh-keygen/gh workflow entries). `.recordings/v0.2-2026-08-13.mp4` is untracked.
- **Next session**: decide whether to commit the activity-log entry (and whether `.recordings/` should be gitignored) — nothing else was pending.
---

- User ended the session here.
- Everything committed and pushed to `origin master` (final commit `5e4be5d`, plus this entry's own follow-up commit recording it); working tree clean except the local, never-committed `.claude/settings.local.json` permission-allowlist diff (as at every prior session start).
- **This session's work, in order**: (1) Advisory conversation (no code/infra) continuing the 2026-08-12 business-structure thread — walked through selling Moqawil privately to self-hosting AE clients (AE registration timing, cash-vs-transfer payment, confirmed CNDP does *not* apply to a "buyer self-hosts" model), then a friend-as-nominee structure the owner proposed and explicitly walked back from after it surfaced the real driver: owner is a government employee (fonctionnaire), and Moroccan civil-service rules generally bar a private commercial activity without authorization. Declined to help design the concealment mechanics; confirmed instead that a move to private-sector employment removes that specific restriction (subject to checking the new contract for exclusivity/non-compete clauses). Full reasoning logged in `.logs/decisions.md`'s 2026-08-13 entry — AE/CNDP path is parked pending the owner's employment situation, not actioned. (2) Owner asked to continue the sprint backlog with the preprod-CI/CD-test item flagged as a follow-up; scoped and executed Sprint 13 in full — see the SPRINT_SNAPSHOT below. (3) Owner indicated next session they'll grant browser access (card + Gmail) so Claude Code can drive the actual VPS/domain provisioning end-to-end rather than leaving it as an owner-executed doc — agreed working style: Claude Code drives and narrates, pauses for explicit go at real purchase-confirmation moments, owner monitors and accepts; budget ceiling set at ~$5-10/mo VPS + ~$15/yr domain, above which Claude Code stops and checks in first. This authorization is scoped to the preprod VPS+domain task specifically, not blanket for unrelated future spending (e.g. a CNDP filing fee or a production launch would be raised fresh).
- **Next session**: pick up Sprint 13's owner-executed setup (`docs/preprod-deployment-moqawil.md` §1-5) live in-browser with Claude Code driving: Hetzner/Scaleway/OVH VPS signup → domain purchase → DNS → GitHub Environment (`preprod`) secrets → first `workflow_dispatch` run of `.github/workflows/deploy-preprod.yml`. No new sprint backlog beyond Sprint 13 exists yet — Sprint 14 scope (if any) still open (candidates carried from Sprint 12: Stripe/CMI billing, or whatever the preprod test surfaces).
- **Open items carried forward, all owner-decision, not autonomously actionable**: AE registration + CNDP filing (parked on employment change, see above), DGI e-invoicing legal citation, DGI/xHub sandbox registration, Barid eSign account, the pitch deck's unverified visual layout (open since Sprint 10/11), the Caddyfile-vs-caddy-docker-proxy wiring inconsistency (open since Sprint 12, unaffected by Sprint 13's preprod-only compose file).
- **Open risks**: none new from Sprint 13's own code (the one real finding — command injection via unsanitized `workflow_dispatch` ref interpolation — was found and fixed same session, not left open). Pre-existing risks unchanged.
---

### 2026-08-11 SESSION_END — Sprint 11 shipped + ICE fixture-collision fix + Sprint 12 planned
- User ended the session here; explicitly asked to plan Sprint 12 and defer, not execute.
- Everything committed and pushed to `origin master` (final commit `def5627`); working tree clean except the local, never-committed-this-session `.claude/settings.local.json` permission-allowlist diff (as at every prior session start).
- **This session's work, in order**: (1) Sprint 11 — SaaS readiness (multi-tenant hosting, no billing) shipped in full, commit `a62a293` — see the MILESTONE entry below for detail. (2) User asked to properly fix the recurring ICE test-fixture collision (hit 4 times across Sprints 10-11) instead of continuing to manually patch it — root-caused to overlapping hardcoded fixture ICE values plus untargeted `onConflictDoNothing()` silently swallowing the real conflict; fixed with a reserved per-file ICE block scheme (`docs/test-strategy-moqawil.md` §7), explicit `onConflictDoNothing({ target: ... })` everywhere, and `fileParallelism: false` in `vitest.config.ts` after finding a second, unrelated flakiness source. Full suite verified green (Vitest 14/14 files, Playwright 21/21 non-skipped under `--workers=1` matching CI). Commit `def5627`. Full writeup: `.logs/issues.md`. (3) User asked what's left before Sprint 12, then asked to fold the four Sprint-11-deferred owner-action blockers (ToS/Privacy Policy, CNDP registration, pentest, infra provisioning) into Sprint 12 rather than leaving them as a separate undated list, and to plan the full Sprint 12 scope. Wrote `.claude/sprint-backlog/sprint-12.md` (5 batches: legal drafts, security-audit prep, infra runbook, launch/distribution content, verify-and-close) — planning only, nothing executed. Decision rationale logged in `.logs/decisions.md`.
- **Also this session, after the above**: user asked to refresh the pitch deck/memo before closing again. `pitch/Moqawil-Pitch-Deck.pptx` + `pitch/Moqawil-Pitch-Memo.docx` updated (Business Model + Roadmap sections, FR/EN) to reflect Sprint 11 shipped work and the Sprint 12 plan, replacing the stale "Next: mobile PWA, public launch" line. Edited via python-pptx/python-docx (no Office/LibreOffice on this machine) — **layout not visually verified**, only structural validity confirmed (clean reload, correct slide/paragraph counts, zip integrity). Flag to the user: worth a real visual check before this deck is presented, same unresolved gap as Sprint 10's slides 8-9. Final commit this session: see below.
- **Next session**: Sprint 12 is scoped and ready to start (`.claude/sprint-backlog/sprint-12.md`). Batches 1-3 (legal/security/infra) produce owner-facing drafts and checklists, not finished deliverables — flag this distinction to the user again when execution starts. Batch 4's announcement-post drafts (S12-09) must not be submitted to any third-party platform without explicit per-post user confirmation in chat, even once the sprint is "done." Blocked-on-owner items carried forward unchanged: DGI e-invoicing legal citation, DGI/xHub sandbox registration, Barid eSign account (all pre-existing, unrelated to Sprint 12). Also carried forward: the pitch deck's visual layout (see above) is unverified and should be checked before use.
- **Open risks**: none new this session (invite-spam/email-enumeration from Sprint 9 and the CNDP/pentest/infra gaps from Sprint 11 remain open, now tracked as Sprint 12 scope rather than an undated side-list).
---

### 2026-08-11 SESSION_END — Session close (Sprint 10 + pitch deck refresh, all pushed)
- User ended the session here; explicitly deferred further work to next session.
- Everything committed and pushed to `origin master` (final commit `030ea67`); working tree clean (only the local, never-committed-this-session `.claude/settings.local.json` permission-allowlist diff remains, as at session start).
- Since the Sprint 10 SESSION_END entry below, one more deliverable shipped: the pitch deck (`pitch/Moqawil-Pitch-Deck.pptx`) and memo (`pitch/Moqawil-Pitch-Memo.docx`) were updated to replace the stale v0.1-era Roadmap with accurate v0.2-shipped scope (devis, UBL 2.1 e-invoicing, accountant dashboard) and a corrected "blocked on external access" line for DGI/xHub + Barid eSign. Deck slide 7's two dashboard screenshots were refreshed (lossless, MD5-verified swap); slides 8-9 were deliberately left untouched — their screenshots predate Sprint 6-9 but replacing them needs image cropping to a different aspect ratio that couldn't be visually verified on this machine (no LibreOffice/renderer available). Worth a follow-up pass with visual verification tooling if the deck needs to look fully current end-to-end.
- Local production server (`next start`, was serving the walkthrough recordings on port 3000) stopped as end-of-session cleanup.
- **Next session**: Sprint 11 (launch/distribution content per CLAUDE.md §16) is scoped and ready to start — this is the explicit next item the user named. Optionally also: finish the deck's slides 8-9 screenshot refresh if wanted. Blocked-on-owner items remain untouched: DGI e-invoicing legal citation, DGI/xHub sandbox registration, Barid eSign account.
---

### 2026-08-11 SESSION_END — Sprint 10 (Hardening/Polish + Full Walkthrough Refresh) COMPLETE, CI confirmed green
- **Completed**: Sprint 10 all 11 tasks (S10-01 through S10-11) across 4 batches.
- **Key deliverables**:
  - Doc-nav/README hardening: orphaned `guide-devis` page reconnected, new `guide-comptable.md` written, README version/feature-list refreshed, `.env.example`/`biome.json` gaps closed, coverage-gap spots reviewed with per-spot verdicts
  - Walkthrough script extended from 22 to 34 screenshots: full devis flow, real rendered-PDF views for every generated document (invoice, invoice UBL, quote, declaration — previously just click-and-close), full accountant multi-actor flow (invite → accept → dashboard → drill-down → revoke)
  - **Critical bug found and fixed, not in original scope**: all 4 PDF/XML generation routes had been silently returning HTTP 500 in both dev and production since Sprint 1 — never caught because no test had ever checked real PDF bytes. Root cause: a webpack/RSC bundling incompatibility with `@react-pdf/renderer`'s reconciler architecture, plus an upstream `@react-pdf/renderer` regression across `4.1.6`-`4.5.1`. Fixed via `webpack.externals` + an exact version pin to `4.6.0`. A genuinely separate pre-existing gap found alongside it — no Arabic font was ever registered despite mandatory bilingual legal text — fixed with a base64-embedded Noto Sans Arabic (SIL OFL 1.1) font. New regression test `pdf-templates.test.ts` asserts real `%PDF` magic bytes, the first test in the project's history to check actual PDF output. Full incident detail in `.logs/risks.md`.
  - Mid-sprint user feedback addressed: "dont forget to scrolldown in the video and the screenshots" — walkthrough screenshots were viewport-only, truncating long pages (Settings' accountant section worst affected). Fixed with `fullPage: true` + a `scrollThroughPage()` helper.
  - Post-push user feedback addressed: recorded video only showed the browser window's top-left corner. Root cause: this machine's 150% Windows display scaling (1920x1080 physical / 1280x720 logical) made Chromium's `--window-size` argument render larger in physical pixels than ffmpeg's fixed 1280x720 physical-pixel capture region. Fixed with `--force-device-scale-factor=1`; verified by extracting and visually inspecting frames from the re-recorded video.
  - Fresh screenshot set (34 PNGs) + fresh 94.6s screen-recorded video committed, replacing the stale pre-Sprint-6 set.
  - CI run `31460125281` (final commit `1d7fa67`): all 6 jobs green (Unit Tests, TypeCheck, Security, Lint, Build, E2E).
- **Blocked**: None.
- **Real bugs found and fixed during verification, not deferred**: the critical PDF-generation bug (above); a test fixture ICE collision (`accountant-db-integration.test.ts` reused an ICE already used by `quote-db-integration.test.ts`) that CI's fresh database caught but the persistent local dev DB did not reproduce; the video-capture DPI-scaling bug (above).
- **Next session**: Sprint 11 (launch/distribution content, per CLAUDE.md §16) is scoped and ready to start. Separately, the user has requested an updated pitch presentation in both `.docx` and `.pptx` formats, to be produced now that Sprint 10 is closed — not yet started. Blocked-on-owner items remain untouched: DGI e-invoicing legal citation, DGI/xHub sandbox registration, Barid eSign account.
- **Open risks**: none new this sprint (invite-spam/email-enumeration accepted risk from Sprint 9 still open, unchanged).
---

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

### 2026-08-12 SESSION_START
- **Context**: Resuming after Sprint 12 was planned-but-not-started last session (explicit instruction to stop after planning).
- **Resuming from**: Sprint 12 backlog fully drafted (Batches 1-5), 0 tasks executed.
- **Plan**: Execute Sprint 12 Batches 1-5 top to bottom per auto-handoff protocol.
- **Auto-handoff**: ENABLED — BALANCED
---

### 2026-08-13 SESSION_END — Preprod pipeline live end-to-end, working Google sign-in, real VPS+domain provisioned
- User ended the session here.
- Everything committed and pushed to `origin master` (final commit `78d9dd5`); working tree clean except the local, never-committed `.claude/settings.local.json` diff (as at every prior session start).
- **This session's work, in order**: (1) Picked up Sprint 13's owner-executed setup live in-browser, Claude Code driving, owner handling every account-creation/password/payment/token step personally per the hard credential boundary (held throughout, including under direct pressure — see `.logs/decisions.md`). (2) Provisioned for real: Hetzner CX23 VPS (`moqawil-preprod`, Helsinki, $7.09/mo) behind a Hetzner Cloud Firewall (default-deny, SSH/48122+80+443 only); `moqawiil.com` domain via Namecheap ($11.48/yr, after Porkbun's email-verification flow proved unworkable) with `preprod.moqawiil.com` → `204.168.132.138`. VPS hardened beyond the original doc scope at owner's explicit request: dedicated non-root `deploy` user, root SSH disabled, password auth disabled, sshd moved off port 22 (required working around Ubuntu 26.04's `ssh.socket` systemd override). GitHub Environment `preprod` created, all 6 secrets set (5 by Claude Code — plain config, not credentials — `PREPROD_SSH_PRIVATE_KEY` left for the owner; the harness's own classifier correctly blocked even typing that field's *name*). (3) First real pipeline run surfaced 4 previously-latent Docker build bugs (build-time env vars, `NEXT_PUBLIC_APP_URL` client-inlining broken since the pattern was introduced — affects self-host too, untracked `apps/web/public/`, `drizzle-kit` missing from the runner image) — all found and fixed via the pipeline's actual first end-to-end run, not deferred. Pipeline went green (`31673769873`), site verified live (`/api/health` 200, real Let's Encrypt cert). (4) Owner then tried the live sign-in page and found "Continuer avec Google" broken — root-caused to a missing `AUTH_URL` (Auth.js fell back to the container's own `HOSTNAME:PORT` for redirect construction) plus sign-in buttons that rendered unconditionally despite comments claiming otherwise. Fixed and redeployed; that surfaced a second, deeper bug: `DrizzleAdapter(db)` was called without a schema argument, silently defaulting to its own internal table names (`"user"`/`"account"`, singular) instead of ours (`users`/`accounts`) — every OAuth-adapter query failed with a Postgres "relation does not exist" error, undetected until now because the JWT session strategy and Credentials-only test coverage never touched that code path. Fixed by passing the real schema (which also required renaming 5 `accounts` table JS properties to snake_case to match Auth.js's adapter type exactly — DB columns unchanged, no migration needed). (5) Created a dedicated Google Cloud project + OAuth consent screen + client ID/secret live (Claude Code drove all non-sensitive config; owner entered the Client Secret directly into the VPS `.env` via their own terminal, never through chat). Verified for real in-browser: reached Google's actual "Choose an account" screen with correct `client_id`/`redirect_uri` — Claude Code stopped there deliberately (selecting the account and completing sign-in is an authentication action for the owner alone).
- **Security incidents during the session, both self-caught and corrected same-session**: (1) a freshly-generated Postgres password leaked into Claude Code's own tool output via an incomplete redaction regex on `DATABASE_URL` — caught immediately, rotated before use, never actually deployed. (2) the owner pasted a live GitHub PAT into chat while completing the GHCR-login step themselves — flagged immediately, owner revoked and reissued before continuing. Neither secret reached a persisted, still-valid state.
- **User naming request handled by clarifying, not executing**: owner asked to rename "moqawil" to "moqawiil" throughout the app to match the purchased domain; Claude Code flagged this as a real branding decision (repo name, `@moqawil/*` packages, legal PDF mentions, pitch deck) rather than a mechanical fix, and the owner chose to keep "Moqawil" as the product name — `moqawiil.com` (double-i) remains just the domain, a deliberate, common mismatch. No rename performed.
- **Next session**: preprod is live and the pipeline is proven end-to-end. Open items: (1) owner still needs to actually complete the Google sign-in click-through they were mid-way through when the session ended — confirm it lands cleanly on `/settings?onboarding=1` and the onboarding flow itself works against this live box. (2) `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` GitHub secrets were never added (session ended before that step) — add them to the `preprod` environment if the pipeline should keep deploying with Google sign-in working, otherwise a future redeploy's `.env` on the VPS is untouched by the pipeline so it should persist regardless. (3) Docker's buildkit linter's `SecretsUsedInArgOrEnv` warning on the Dockerfile's `AUTH_SECRET` ARG/ENV (harmless today — placeholder value only — but worth a cleanup pass, logged in `.logs/activity.md`). (4) A dedicated migrator Docker stage could restore most of the "lean standalone" image-size savings given up to fix the `drizzle-kit` bug, logged as a known follow-up. (5) Business-structure/CNDP path remains parked pending the owner's employment situation (unchanged, pre-existing).
- **Open risks**: none new beyond what's already logged in `.logs/activity.md`'s entry for this session — the 4 Docker bugs and 2 auth bugs are all fixed and verified live, not just believed-fixed.
---

### 2026-08-12 SESSION_END
- **Completed**: Sprint 12 (Launch Readiness & Distribution) -- all 12 tasks, 5 batches, 100%.
- **State**: 0 blockers code-side. Every owner-only step (sign ToS/Privacy into effect, file CNDP, hire pentest vendor, buy VPS/domain, run the runbook, submit any of the 5 announcement drafts, pick real accountant names) is left exactly that -- owner action.
- **Next session**: no code sprint queued. Candidates for the owner to choose from: Stripe/CMI billing (explicitly deferred from Sprint 11), or executing Sprint 12's owner-only launch steps and then coming back for whatever real usage surfaces.
- **Verification**: typecheck/lint clean, Vitest 192 passing/7 skipped, coverage gate clears (100/100/100/92.78%), Playwright 21/21 passing/3 skipped verified against a real next-start build.
---
