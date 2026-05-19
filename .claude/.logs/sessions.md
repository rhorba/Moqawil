# Session Log

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
