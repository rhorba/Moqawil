# Project Metrics

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
