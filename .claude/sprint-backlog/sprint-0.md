# Sprint 0 — Moqawil Scaffold

**Goal**: `pnpm install && docker compose up -d && pnpm dev` works. Auth page loads. DB migrates. No features yet.
**Duration**: 1 session (~3-4 hours)
**Auto-handoff**: ENABLED — orchestrator proceeds without user confirmation between tasks.
**Design choices**: 🟡 BALANCED selected by default.

---

## Definition of Done (Sprint 0)

- [ ] Monorepo boots: `pnpm install` succeeds
- [ ] `pnpm dev` starts Next.js on port 3000 with no TS errors
- [ ] `docker compose up -d` starts Postgres + Caddy
- [ ] `pnpm db:migrate` applies initial schema
- [ ] Auth page renders (Google OAuth + magic link — unconfigured providers gracefully degrade)
- [ ] `packages/tax-engine` exports all constants + pure functions
- [ ] `pnpm test` runs Vitest and passes all tax-engine tests
- [ ] `fr.json` + `ar.json` translation stubs exist with `common` namespace
- [ ] `.env.example` documents every required env var
- [ ] `README.md` covers setup in 5 commands

---

## Sprint Backlog

### BATCH 1 — Monorepo Foundation
**Specialist**: DevOps/DevSecOps → auto-handoff to Tech Lead after DONE

| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S0-01 | Init pnpm workspaces + root `package.json` + Biome config | DevOps | S | ✅ done | Tech Lead |
| S0-02 | Create `tsconfig.base.json` (strict mode) shared by all packages | Tech Lead | S | ✅ done | DBA |
| S0-03 | Create `docker-compose.yml` (postgres16 + caddy) + `Caddyfile` | DevOps | M | ✅ done | Backend Dev |
| S0-04 | Create `.env.example` with all required vars documented | DevOps | S | ✅ done | — |

**Auto-handoff chain**: S0-01 → S0-02 → S0-03+S0-04 (parallel)

---

### BATCH 2 — Packages
**Specialist**: Tech Lead → DBA → auto-handoff to Backend Dev after DONE

| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S0-05 | Create `packages/tax-engine` with all constants + pure function exports (see CLAUDE.md §9) | Tech Lead | M | ✅ done | Tester |
| S0-06 | Create `packages/db` with Drizzle schema (all 5 tables from CLAUDE.md §8) | DBA | L | ✅ done | Backend Dev |
| S0-07 | Create `packages/i18n` with next-intl shared utils | Tech Lead | S | ✅ done | Frontend Dev |
| S0-08 | Create `packages/pdf-templates` stub (empty React-PDF export, filled in Sprint 1) | Tech Lead | S | ✅ done | — |

**Auto-handoff chain**: S0-05 (Tax Engine) → Tester for unit tests. S0-06 (DB) → Backend Dev for migration runner.

---

### BATCH 3 — Next.js App
**Specialist**: Backend Dev + Frontend Dev (parallel after Batch 2)

| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S0-09 | Scaffold `apps/web` Next.js 15 App Router + install all deps from CLAUDE.md §6 | Backend Dev | M | ✅ done | Frontend Dev |
| S0-10 | Configure Auth.js v5 (Google OAuth + email magic link + Drizzle adapter) | Backend Dev | M | ✅ done | Tester |
| S0-11 | Create root layout with next-intl provider (fr-MA default, AR switchable, RTL) | Frontend Dev | M | ✅ done | Tester |
| S0-12 | Create stub pages: `/`, `/dashboard`, `/invoices`, `/clients`, `/declarations`, `/settings` | Frontend Dev | M | ✅ done | Tester |
| S0-13 | `fr.json` + `ar.json` translation files — `common`, `auth`, `entrepreneur` + all namespaces | Frontend Dev | S | ✅ done | — |

**Auto-handoff chain**: All Backend tasks → Tester. All Frontend tasks → Tester (UI smoke).

---

### BATCH 4 — Quality Gate
**Specialist**: Tester → Test Architect (strategy review)

| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S0-14 | Vitest config + unit tests for ALL `tax-engine` exports (100% function coverage) | Tester | M | ✅ done | Test Architect |
| S0-15 | Playwright config + smoke test: homepage loads, auth page loads | Tester | S | ✅ done | Project Monitor |
| S0-16 | Test strategy doc for Sprint 1 (80K cap feature is highest risk) | Test Architect | S | ✅ done (in test-architect/SKILL.md) | Project Monitor |

**Auto-handoff chain**: S0-14+S0-15 pass → S0-16 → Project Monitor for sprint snapshot.

---

### BATCH 5 — Sprint Close
**Specialist**: Project Monitor

| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S0-17 | Write `README.md` covering 5-command setup + stack overview | Tech Lead | S | ✅ done | — |
| S0-18 | Sprint 0 snapshot: log metrics, generate Sprint 1 backlog seed | Project Monitor | S | ✅ done | USER |

---

## Execution Rules for Sprint 0

```
START:
  orchestrator reads this file
  picks first todo task in current batch
  loads specialist skill
  executes task
  marks DONE
  triggers handoff-to specialist automatically
  continues until batch complete
  logs BATCH_COMPLETE to .logs/activity.md
  starts next batch
  REPEAT until S0-18 DONE
  
STOP CONDITION:
  S0-18 marked DONE
  → generate sprint summary
  → present to user
  → ask: "Sprint 0 complete. Approve Sprint 1 plan?"
```

## Risk Register (Sprint 0)

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| pnpm workspace config errors | M | M | Use pnpm v9 workspace protocol exactly |
| Drizzle schema type mismatches | M | H | Run `drizzle-kit check` after schema write |
| Auth.js v5 breaking changes | H | M | Pin to known-good version, check docs |
| BAM scraper blocks in dev | L | L | Skip for Sprint 0, add stub |
| RTL layout breaks on initial setup | M | M | Add `dir` attribute from day 1, don't retrofit |
