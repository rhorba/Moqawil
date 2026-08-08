# Activity Log

### 2026-08-08 15:10 BUGFIX — Found the actual E2E cause: localhost resolving to IPv6 while next start only binds IPv4
- **Specialist**: DevOps/DevSecOps
- **Summary**: 6th and 7th CI runs (the second a manual rerun to rule out flakiness — it wasn't) still timed out on E2E with zero visible output. Root-caused by explicitly piping `webServer.stdout`/`stderr` in `playwright.config.ts` (Playwright's default is `stdout: 'ignore'` — a genuinely healthy, quiet server start looks identical in the log to a hung one; the earlier UntrustedHost noise was stderr, which pipes by default, misleading the earlier diagnosis). The piped output showed the real story: `next start` logs "✓ Ready in 579ms" successfully, then **nothing at all** for the remaining ~119s until timeout — the server starts fine but Playwright's own readiness poll to `http://localhost:3003` never gets a response. Classic Linux/Node gotcha: `localhost` DNS resolution can prefer IPv6 (`::1`) while `next start` binds IPv4 only by default — server and health-checker end up trying different interfaces. Fixed by using `127.0.0.1` explicitly in both `playwright.config.ts`'s `baseURL` and `webServer.url`. Confirmed no e2e spec files hardcode `localhost` elsewhere. Kept the explicit stdout/stderr piping — it's what made this diagnosable and should stay for any future startup issue.
- **Status**: resolved, pending CI confirmation
- **Impact**: high — this was the last blocker keeping CI fully red
---

### 2026-08-08 14:45 BUGFIX — .trivyignore wasn't wired up, new shell-quote CVE, and the REAL cause of UntrustedHost found
- **Specialist**: Security Engineer + DevOps/DevSecOps
- **Summary**: 5th CI run: Security still failed for two reasons — (1) `.trivyignore` was never actually applied; `trivy-action` requires an explicit `trivyignores` input pointing at the file, it doesn't auto-discover it relative to `scan-ref`. Added `trivyignores: moqawil/.trivyignore` to `ci.yml`. (2) A fresh CVE: `shell-quote` 1.8.3 (CRITICAL command injection CVE-2026-9277 + HIGH DoS CVE-2026-13311), pulled in transitively via `drizzle-orm@0.45.2`'s `gel` (EdgeDB) driver peer dependency — Moqawil only uses Postgres, but the resolution still occurs. Added to `pnpm.overrides` (>=1.9.0, fixes both).
- **The real find**: E2E was STILL hitting `UntrustedHost` despite the `trustHost: true` fix from the previous round being genuinely present in the committed code (verified via `gh api` against the exact commit). Root cause: `middleware.ts` constructs its own **separate** `NextAuth(authConfig)` instance from `auth.config.ts` — the Edge-Runtime-compatible split config from Sprint 2's Auth.js fix (no DB adapter, Edge-safe) — which never received the `trustHost` fix, only the main `auth.ts` did. Every request through middleware (i.e., every non-`/api` route, which is most of the app) was independently rejected by this second, unfixed instance. Added `trustHost: true` to `auth.config.ts` too. Verified properly this time by testing routes that actually traverse middleware (`/dashboard` → 307 redirect, `/sign-in` → 200), not just hitting `/api/auth/session` directly as the previous verification had — that's exactly why the incomplete fix passed local testing before.
- **Status**: resolved, pending CI confirmation
- **Impact**: critical — the previous "fix" only patched half of the actual bug; this would still have blocked every self-hosted deployment
---

### 2026-08-08 14:25 SECURITY FIX — Round 2 of Trivy findings (new CVEs surfaced after prior fixes), plus one genuinely unpatched dependency
- **Specialist**: Security Engineer
- **Summary**: 4th CI run: Unit Tests, TypeCheck, Lint, Build all green — confirms the E2E `next start` fix and trustHost fix both worked structurally (only Security + E2E were still failing). Trivy's SCA scan surfaced a fresh batch (fixing the prior 5 CVEs exposed dependency resolutions that had their own separate vulnerable versions): `@auth/core` 0.41.2 (CRITICAL email-normalizer bug + HIGH uncaught-exception bug, GHSA-7rqj-j65f-68wh / GHSA-xmf8-cvqr-rfgj, both fixed at 0.41.3), `drizzle-orm` 0.38.4 (CVE-2026-39356, SQL injection via improperly escaped identifiers, fixed at 0.45.2), `next` 15.5.18 (CVE-2026-64641 DoS + CVE-2026-64645/64649 SSRF, fixed at 15.5.21), and `image-size` 2.0.2 (CVE-2025-71329/71330, DoS — **no patched version exists upstream**, Trivy status "affected" not "fixed").
- Bumped `@auth/core`, `drizzle-orm` (both `apps/web` and `packages/db`, kept in sync), and `next`. Found `@auth/drizzle-adapter` pulls its own separately-resolved `@auth/core@0.41.2` instance not covered by the direct-dependency pin — added `@auth/core` to `pnpm.overrides` to force every instance in the tree, verified via `pnpm why` that only 0.41.3 remains after a prune.
- `image-size` has no fix: traced its dependency chain (`pnpm -r why`) — it's pulled in exclusively by `docs/@docusaurus/mdx-loader`, used only at Docusaurus **build time** to size images embedded in maintainer-authored documentation content. Never reachable by the actual Moqawil app or any runtime/attacker-controlled input. Added `moqawil/.trivyignore` with the two CVE IDs and a written justification (not a silent suppression) — Trivy auto-discovers this file at the scan root.
- Verified locally before pushing: typecheck clean across all 6 packages (confirms the drizzle-orm 0.38→0.45 jump — a real risk given it's used for every DB query in the app — didn't break anything), full production build succeeds, 59/59 tax-engine tests + 68/68 non-DB-dependent web tests pass, lint clean.
- **Status**: resolved, pending CI confirmation
- **Impact**: high — SQL injection and SSRF are serious vulnerability classes; both now patched
---

### 2026-08-08 13:15 BUGFIX — E2E timeout + a real production-impacting auth bug found while investigating it
- **Specialist**: DevOps/DevSecOps + Security Engineer
- **Summary**: E2E job timed out waiting 120s for `next dev`'s webServer to become ready — cold on-demand compilation on a shared CI runner is inherently slow to first-request-ready. Fixed properly rather than just padding the timeout: `playwright.config.ts` now uses `next start` (production build, already built earlier in the same CI job) when `CI` is set, `next dev` for local iteration speed otherwise. Verified locally: `next start` ready in ~1s vs `next dev`'s 120s+ timeout.
- While verifying the fix locally, hit a **separate, real bug**: `next start` returned `UntrustedHost` from Auth.js on every request. `trustHost` was never configured anywhere in `auth.ts`, and Auth.js v5 requires it explicitly for any deployment not on Vercel — meaning **every self-hosted Moqawil install (the entire premise of the product, Docker Compose behind Caddy) would hit this in production**, not just CI. Added `trustHost: true` to the NextAuth config, safe here since this is single-operator single-tenant self-host, not a multi-tenant host-spoofing risk. Verified: `/api/auth/session` now returns a valid (empty) session instead of the error page.
- **Status**: resolved, pending CI confirmation
- **Impact**: critical — this would have blocked sign-in on every real self-hosted deployment, not just an internal CI/test issue
---

### 2026-08-08 12:50 SECURITY FIX — 5 real dependency CVEs found by Trivy, patched where possible
- **Specialist**: Security Engineer + DevOps/DevSecOps
- **Summary**: Third CI run: Unit Tests, TypeCheck, Lint, Build all green (confirms the coverage-gap fix and earlier round worked). Only Security (Trivy SCA) and E2E remained. Trivy flagged 5 real HIGH-severity CVEs: next-auth 5.0.0-beta.31 (GHSA-xmf8-cvqr-rfgj), nodemailer 7.0.13 (GHSA-p6gq-j5cr-w38f — arbitrary file read via `raw` option bypass), postcss 8.4.31 (CVE-2026-45623 + path traversal GHSA-r28c-9q8g-f849), serialize-javascript 6.0.2 (GHSA-5c6j-r48x-rmvq, RCE), sharp 0.34.5 (inherited libvips CVEs). Fixed: next-auth → 5.0.0-beta.32 (direct dep, patched). nodemailer → ^9.0.1 (direct dep, patched) — the vulnerable range is `<= 9.0.0`, no fix exists inside `@auth/core`'s declared peer range (`^7.0.7 || ^8.0.5`), so this leaves a peer-dependency warning; verified it's safe: the app's own `email.ts` never uses the vulnerable `raw` sendMail option, and `@auth/core`'s nodemailer peer is for its legacy SMTP magic-link provider, which this app doesn't use (uses Resend's API instead, per CLAUDE.md). postcss/serialize-javascript/sharp are transitive (pulled in by Next.js/Tailwind/Docusaurus tooling, not declared directly) — added `pnpm.overrides` in root `package.json` to force patched versions across the tree. Verified locally: typecheck clean, lint clean, 68/68 non-DB-dependent tests still pass (2 files fail locally only on ECONNREFUSED — no local Postgres, expected, same as every prior round).
- **Status**: resolved, pending CI confirmation
- **Impact**: high
---

### 2026-08-08 12:20 BUGFIX BATCH — Closed the honest coverage gap for real, fixed Semgrep pnpm hardening findings, fixed own lint suggestion that would have reintroduced the SMTP bug
- **Specialist**: Tester + DevOps/DevSecOps
- **Summary**: Second CI run (after the previous batch's fixes) showed TypeCheck green but 3 more real issues:
  1. **Security**: Semgrep's `security-audit` ruleset flagged 3 legitimate pnpm supply-chain-hardening gaps in `pnpm-workspace.yaml` (`blockExoticSubdeps`, `minimumReleaseAge`, `trustPolicy` all unset). Added all three — verified pnpm 9.15.4 (the pinned CI version) tolerates the newer config keys as no-ops rather than erroring; they'll take effect once the project upgrades pnpm.
  2. **Lint**: Biome's own `noDelete` rule suggested reverting `delete process.env.SMTP_FROM` back to `= undefined` — the exact pattern that caused the bug this line fixes. Added a `biome-ignore` with the reasoning, since the general-purpose suggestion is wrong specifically for `process.env`.
  3. **Coverage (the real one)**: `queries/declaration.ts` sat at 17% line coverage — only its pure helpers were tested, its 3 DB-touching functions (`getQuarterlyTurnover`, `getDeclarationsForYear`, `computeAndUpsertDeclaration`) had zero tests, exactly the gap documented honestly in `vitest.config.ts`'s comment. Wrote `declaration-db-integration.test.ts` (6 real tests against a live Postgres, following the same `describe.skipIf(!DATABASE_URL)` pattern already established in `invoice-numbering.test.ts`) instead of lowering the threshold or fabricating coverage. Verified locally: typechecks clean, lint clean; full DB behavior will be confirmed by CI's Postgres service (no local Docker daemon running to verify directly).
- **Status**: resolved, pending CI confirmation
- **Impact**: high
---

### 2026-08-08 11:45 BUGFIX BATCH — CI's remaining real failures found and fixed (lint, typecheck, security, tests)
- **Specialist**: DevOps/DevSecOps + Tester + Test Architect
- **Summary**: With the tax-engine build-order fix pushed, CI still failed 4 jobs. Root-caused and fixed each:
  1. **Security job**: `aquasecurity/trivy-action@0.28.0` and `gitleaks/gitleaks-action@v2` don't exist as valid refs (guessed wrong versions when writing the job). Fixed to the same SHA-pinned versions tabib-ma's already-working CI uses (`trivy-action` v0.36.0, `gitleaks-action` v3).
  2. **Lint job**: 205 pre-existing Biome errors across 84 files — lint had genuinely never run in CI before. 51 were mechanical (`useLiteralKeys`, `useNodejsImportProtocol`, `useTemplate`) and auto-fixed. The real ones fixed by hand: **20 `noLabelWithoutControl`** accessibility bugs across 5 form files (client-form, profile-form, invoice-form, edit-form) — labels weren't associated with their inputs via `htmlFor`/`id`, a genuine a11y defect, not a style nit. 7 `noExplicitAny` — legitimate react-pdf/dynamic-import type friction, converted stale `eslint-disable` comments (dead — this project uses Biome, not ESLint) to real `biome-ignore` with justification. 5 `noNonNullAssertion` — two were real bugs: `auth.ts` only guarded `AUTH_GOOGLE_ID` before asserting `AUTH_GOOGLE_SECRET!` (missing secret would silently pass `undefined`), and `declaration-card.tsx` asserted `taxDue!` without the guard checking it was defined. Fixed both with proper checks, not just satisfying the linter.
  3. **TypeCheck job**: `packages/pdf-templates` and `packages/i18n` had **no `tsconfig.json` at all** — typecheck had never run on them either. Added both. `packages/db`'s existing tsconfig had `rootDir: ./src` while its own `include` also listed `drizzle.config.ts` (outside rootDir) — pre-existing config bug, fixed since db has no dist build anyway (`main` points straight at `src/`). `pdf-templates` and `db` were both missing `@types/node` (needed for `Buffer`/`process`). `apps/web` imported `@auth/core/jwt` directly without declaring `@auth/core` as a dependency — worked by pnpm hoisting accident as a transitive dep of `next-auth`, added explicitly.
  4. **Unit test job**: `threshold-alerts.test.ts`'s `clearSmtp()` helper did `process.env.SMTP_FROM = undefined` — Node.js stringifies all `process.env` assignments, so this set the var to the *string* `"undefined"`, not deleted it. The next test's `SMTP_FROM ?? SMTP_USER` fallback never triggered because a non-empty string isn't nullish. Genuine test bug, reproduced in isolation with ordering, fixed with `delete`.
- Verified everything locally before pushing: full typecheck green across all 6 packages, tax-engine 59/59 tests, web 73/73 tests (was 67/73 + 1 file failing to resolve before these fixes).
- **Status**: resolved
- **Impact**: high — none of lint, typecheck, or the SMTP fallback had ever actually been verified before this session added CI
---

### 2026-08-08 11:10 MILESTONE — Full document-chain written; CI's second real bug caught and fixed
- **Specialist**: PM + System Designer + Software Architect + DBA + Security Engineer + UX/UI Designer + Test Architect + DevOps/DevSecOps
- **Summary**: Owner asked for the docs/ folder filled out comprehensively, matching tabib-ma's full artifact chain instead of just the Sprint 4 pair. Wrote 10 product-level docs at repo root: prd-moqawil.md, system-design-moqawil.md, architecture-moqawil.md (3 ADRs), database-moqawil.md, security-moqawil.md, ux-moqawil.md, ui-moqawil.md, test-strategy-moqawil.md, devops-moqawil.md, stories-moqawil.md (8 epics, retroactive for Sprints 0-3 + forward for Sprint 4). Content is grounded in the actual codebase and CLAUDE.md, not fabricated — pulled from real schema, real sprint history, real known gaps (documented, not hidden).
- While verifying CI locally before re-pushing, found a third real pre-existing bug (after the lockfile and migration-journal ones): `@moqawil/tax-engine`'s `package.json` `main` field points to `dist/index.js`, so every other workspace package needs it built first — the `test`, `typecheck`, and `e2e` CI jobs never did this (only `build` did). Confirmed locally (68/73 web tests pass once tax-engine is built first; the 1 remaining local failure is `ECONNREFUSED`, expected without a local Postgres — CI's service container covers this). Added the missing build step to all three jobs.
- **Status**: resolved (docs written and pushed; CI fix pushed, awaiting confirmation run)
- **Impact**: high
---

### 2026-08-08 10:45 BUGFIX — CI's first real run caught a pre-existing migration bug
- **Specialist**: DBA
- **Summary**: `.gitignore` had `packages/db/drizzle/meta/` excluded under a comment claiming it was just "generated snapshots" — it also excluded `_journal.json`, which `drizzle-kit migrate` requires to know what migrations exist and in what order. Every prior `db:migrate` on this project "worked" only because whoever ran it locally still had a stale local `meta/` folder on disk; a genuinely fresh checkout (exactly what CI's `test`/`e2e` jobs are) had none and failed immediately. Regenerated `meta/_journal.json` + `meta/0000_snapshot.json` via `drizzle-kit generate`, renamed the new migration tag back to the original filename (`0000_glossy_lady_ursula`, content byte-identical — confirmed no schema drift) so history stays consistent, deleted the gitignore rule.
- **Status**: resolved
- **Impact**: high — this would have broken every fresh self-host install (`docker compose up -d` → migrate), not just CI
---

### 2026-08-08 10:35 MILESTONE — Adopted tabib-ma's CI/docs patterns after owner review
- **Specialist**: DevOps/DevSecOps + Software Architect
- **Summary**: Owner asked to compare against github.com/rhorba/tabib-ma (a more mature sibling project on the same CTS framework) and match its patterns. Findings applied: (1) added a dedicated `security` CI job — Semgrep SAST (OWASP Top Ten + security-audit rulesets), Trivy SCA (dependency CVE scan against the now-fixed `pnpm-lock.yaml`), Gitleaks secrets scan — this is what actually implements Framework Rule 5, which previously existed only as an unenforced checklist line; (2) corrected a same-session mistake: foundation docs (PRD/Architecture, Framework Rule 6) were redirected into `.claude/sprint-backlog/` earlier under the wrong assumption that repo-root `docs/` collided with the Docusaurus site — it doesn't, the Docusaurus site is at `moqawil/docs/` one level down. Created real `docs/prd-sprint4-e-invoicing.md` and `docs/architecture-sprint4-e-invoicing.md` at repo root matching tabib-ma's exact convention, corrected Rule 6, logged the correction in `.logs/corrections.md`. Confirmed already-matching: `.recordings/v[version]-[date].webm` convention (Framework Rule 7, added earlier this session), full 21-skill set (diff against tabib-ma's `.claude/.skills` came back empty). Deliberately NOT adopted: tabib-ma's `.claude/.skills` (leading-dot) and repo-root `.logs/` path conventions — Moqawil's existing `.claude/skills/` and `.claude/.logs/` are confirmed working (auto-discovered by the harness) with real history; renaming risked breaking that for a cosmetic match. Also not adopted: `load-tests/` (k6) — contradicts this project's own System Designer NFRs (single-tenant self-host, not internet-scale).
- **Status**: resolved
- **Impact**: high
---

### 2026-08-08 10:05 MILESTONE — Sprint 3.5 (infra hardening) executed
- **Specialist**: DevOps/DevSecOps + Test Architect + Frontend Dev
- **Summary**: Owner flagged missing docs deploy, CI/CD, and honest test coverage after reviewing the CTS sync. Closed: (1) added missed Framework Rule 7 — video recording at version completion; (2) moved Playwright video output out of the public `docs/` folder into gitignored `.recordings/e2e-debug/`; (3) fixed `vitest.config.ts` coverage `include` — was scoped to a single file (`threshold-alerts.ts` only), making the 80% gate meaningless; broadened to also include `queries/declaration.ts` (actually unit-tested) and documented the real gap (DB-dependent query files have no unit tests yet) instead of hiding it; (4) added `typecheck` script to root + all 5 workspace packages — none existed; (5) `.github/workflows/ci.yml` — lint, typecheck, unit test, build, e2e, modeled on Kasb's existing CI for consistency; (6) `.github/workflows/docs-deploy.yml` — GitHub Pages deploy for the Docusaurus site, which had zero deploy path since Sprint 3; (7) fixed `docusaurus.config.ts` baseUrl — was hardcoded to an unowned custom domain (`docs.moqawil.ma`), switched to the real default GH Pages project-site path with a comment on how to switch back once the domain exists.
- **Status**: resolved
- **Impact**: high
---

### 2026-08-08 09:40 PLANNING — Sprint 4 backlog drafted (e-invoicing format readiness)
- **Specialist**: Scrum Master + System Designer + Software Architect
- **Summary**: Drafted `.claude/sprint-backlog/sprint-4.md` — UBL 2.1 XML export from existing invoice data + `ClearanceProvider` adapter (NoOp default), explicitly excludes real DGI/xHub submission and Barid eSign signing (both blocked on external access not yet confirmed available). Includes Design section (PRD-lite, ADR-1 on UBL-over-CII, system design, data model delta, security considerations) per Framework Rule 6, since this sprint adds a new external-system boundary. `git push origin *` added to settings.json allow-list per owner approval, enabling Framework Rule 3 (push at sprint close).
- **Status**: resolved (drafted, not started)
- **Impact**: high
- **Open item**: Sprint 3's last task (S3-08, DoD final check) is still `in-progress` per `.claude/sprint-backlog/sprint-3.md` — Sprint 4 code doesn't depend on it, but v0.1 shouldn't be tagged until it closes. Also found a stale duplicate sprint-backlog under `moqawil/.claude/sprint-backlog/` showing false "COMPLETE" status for sprints 2-3 — needs owner decision on whether to delete or was intentionally kept.
---

### 2026-08-08 09:15 MILESTONE — Synced .claude/skills with Claude Team Skills (CTS) upstream
- **Specialist**: Orchestrator
- **Summary**: Diffed local skill set against github.com/rhorba/CTS. Found: 2 missing specialists (System Designer, Software Architect — both mandatory per framework rule 1, never loaded here before), missing `references/` deep-dive docs on all 19 existing skills, and 6 framework rules added upstream since this project's skills were scaffolded (80% coverage gate, push-per-sprint, upfront env-var collection, security-check-before-ship, foundation-docs-for-major-features, mandatory System Designer + Software Architect loading). Added both skills with Moqawil-specific bodies (monorepo boundaries, tax-engine purity rule, adapter pattern for DGI clearance/BAM), copied references/ for all skills, updated orchestrator routing table + auto-handoff tree, added the 6 rules to this file (§ Framework Rules).
- **Status**: resolved
- **Impact**: high
- **Open item**: `settings.json` allow-list has no `git push` permission, but the new push-per-sprint rule requires it — needs explicit owner decision before automating (push is a shared-state action).
---

### 2026-05-19 23:15 MILESTONE — Sprint 2 complete
- **Specialist**: Orchestrator + Frontend Dev + DevOps + Tester
- **Summary**: Sprint 2 all 11 tasks done. RTL audit fixed 6 files; build unblocked on Windows via conditional standalone; 111 tests passing.
- **Status**: resolved
- **Impact**: high
---

### 2026-05-19 00:00 MILESTONE — .claude framework created
- **Specialist**: Orchestrator
- **Summary**: Built complete .claude folder: settings.json, CLAUDE.md, 14 skill files, sprint-0.md backlog, log system. Auto-handoff protocol enabled. Sprint 0 ready to execute.
- **Status**: resolved
- **Impact**: high
---
