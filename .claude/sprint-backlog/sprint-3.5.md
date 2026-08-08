# Sprint 3.5 — Infrastructure Hardening (CI/CD, honest coverage, docs deploy, video recording rule)

**Goal**: Close infra gaps found during the CTS framework sync that make Sprint 4's own DoD items (coverage ≥80%, push at sprint close) actually enforceable, and get the existing Docusaurus docs site live instead of source-only.
**Depends on**: none (pure infra, no product code touched)
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE ✅
**Completed**: 2026-08-08 (10 CI runs to find and fix every real pre-existing gap — see `.logs/activity.md` for the full list)

---

## Design (brief — infra sprint, not a new external system, but touches CI/deploy)

### Problem statement
The CTS framework sync (2026-08-08) added rules that assume infrastructure this project didn't have: an 80% coverage gate with nothing enforcing it, a "push at sprint close" rule with no CI to validate what's being pushed, and a video-recording rule that was missed in the sync entirely. Separately, the owner found the Docusaurus docs site (written in Sprint 3) was never actually deployed anywhere, and Playwright's video output was landing inside the public `docs/` folder, ungitignored.

### What this sprint does NOT do
Does not add new tests to raise coverage on untested files (`queries/{client,entrepreneur,invoice}.ts`) — that's real feature-adjacent test-writing work, tracked as a known gap in `vitest.config.ts`, not infra. Does not buy/configure a custom domain for docs.

### Risks
| Risk | P | I | Mitigation |
|---|---|---|---|
| CI env vars don't match real `.env.example` needs, first run fails | Med | Low | First push to `master` will surface this immediately; fix forward |
| GitHub Pages needs one-time repo setting (Source: GitHub Actions) | High | Low | Enabled via `gh api` as part of this sprint (owner is gh-authenticated) |

---

## Backlog

| ID | Task | Specialist | Size | Status |
|---|---|---|---|---|
| I-01 | Add missing Framework Rule 7 (video recording at version completion) to `.claude/CLAUDE.md` | Orchestrator | S | done |
| I-02 | Fix Playwright `outputDir` off `docs/test-recordings` → `.recordings/e2e-debug`; gitignore debug videos, allow versioned completion videos | DevOps/DevSecOps | S | done |
| I-03 | Fix `vitest.config.ts` coverage `include` — was scoped to 1 file only; broadened honestly to what's actually unit-tested, documented the DB-dependent gap instead of hiding it | Test Architect | S | done |
| I-04 | Add `typecheck` script to root + all 5 workspace packages (none existed before) | DevOps/DevSecOps | S | done |
| I-05 | `.github/workflows/ci.yml` — lint, typecheck, unit test (+coverage upload), build, e2e (Postgres service, migrations, Playwright) | DevOps/DevSecOps | L | done |
| I-06 | `.github/workflows/docs-deploy.yml` — GitHub Pages deploy for Docusaurus on push to `docs/` | DevOps/DevSecOps | M | done |
| I-07 | Fix `docusaurus.config.ts` baseUrl/url for default GH Pages project-site path (was assuming an unowned custom domain) | Frontend Dev | S | done |
| I-08 | Enable GitHub Pages (Source: GitHub Actions) on the repo via `gh api` | DevOps/DevSecOps | S | done |
| I-09 | Commit + push; confirm CI run triggers and reaches a result (green or a real, fixable failure) | Project Monitor | S | done — took 10 pushes to work through every real gap found |
| I-10 | Sprint 3.5 snapshot | Project Monitor | S | done |

---

## Definition of Done
- [x] `git push origin master` triggers `ci.yml` — lint/typecheck/test/build/e2e all run and all pass (as of run `31266792551`)
- [x] Docs site publishes via GitHub Pages Actions deploy, reachable at `https://rhorba.github.io/Moqawil/`
- [x] No debug video artifacts land in the public `docs/` folder going forward
- [x] Coverage config no longer silently narrows scope to hit a number — gaps are documented, not hidden; the real gap (`queries/declaration.ts`'s DB-touching functions) got closed with real DB-integration tests, not just documented
- [x] Framework Rule 7 (video recording) is present in `.claude/CLAUDE.md`
