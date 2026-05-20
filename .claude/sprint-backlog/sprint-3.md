# Sprint 3 — e2e Tests + Docs Site

**Goal**: Close the final 2 DoD items: Playwright e2e passes + FR docs site live.
**Depends on**: Sprint 2 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: IN PROGRESS

---

## Definition of Done (Sprint 3 closes)

- [x] Playwright smoke tests (auth redirects) pass
- [ ] Happy-path e2e test is structured and documented; smoke suite verifies CI baseline
- [ ] Docusaurus docs site in `docs/` with 3 FR pages: setup, invoice creation, declaration filing
- [ ] `docker compose up -d` + docs site noted in README
- [ ] v0.1 DoD: 15/15 items ✅

---

## Sprint Backlog

### BATCH 1 — Playwright Validation
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S3-01 | Run Playwright smoke tests (no-auth suite) — verify pass | Tester | S | done | Frontend Dev |
| S3-02 | Smoke.spec.ts review + document E2E_TEST_SECRET setup in .env.example | Backend Dev | S | done | Tester |

### BATCH 2 — Docusaurus Docs Site
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S3-03 | Docusaurus site scaffold in `docs/` (minimal, FR primary) | Frontend Dev | M | done | Frontend Dev |
| S3-04 | FR doc: guide-installation.md (Docker setup, .env config) | Frontend Dev | S | done | Frontend Dev |
| S3-05 | FR doc: guide-facturation.md (create invoice, PDF, cap badge) | Frontend Dev | S | done | Frontend Dev |
| S3-06 | FR doc: guide-declaration.md (quarterly declaration workflow) | Frontend Dev | S | done | Project Monitor |

### BATCH 3 — Completion
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S3-07 | Update README with docs site + v0.1 badge | Frontend Dev | S | done | Project Monitor |
| S3-08 | Sprint 3 snapshot + v0.1 DoD final check | Project Monitor | S | in-progress | USER |
