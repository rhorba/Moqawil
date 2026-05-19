# Sprint 2 — Declarations + BAM Rate + RTL + Docker

**Goal**: Quarterly declarations printable, BAM rate live, Arabic RTL works, Docker self-host validated.
**Depends on**: Sprint 1 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: IN PROGRESS

---

## Definition of Done (Sprint 2 additions)

- [ ] Quarterly declarations page shows Q1-Q4 cards with turnover, tax, deadline, status
- [ ] Declaration generates printable PDF matching Barid Al-Maghrib form layout
- [ ] BAM exchange rate fetched from bkam.ma, cached, fallback to manual entry
- [ ] Arabic RTL locale switcher works; all Sprint 1 pages verified in RTL
- [ ] `docker compose up -d` produces a working install (tested locally)
- [ ] `pnpm build` passes with zero errors

---

## Sprint Backlog

### BATCH 1 — Quarterly Declarations
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S2-01 | Declaration query helpers (quarterly turnover from paid invoices, auto-upsert) | DBA | M | todo | Backend Dev |
| S2-02 | Declaration server actions (generate, mark submitted) | Backend Dev | M | todo | Tester |
| S2-03 | Declarations page UI — Q1-Q4 cards, deadline countdown, status | Frontend Dev | M | todo | Tester |
| S2-04 | Declaration PDF template (Barid Al-Maghrib form layout, bilingual) | Backend Dev | L | todo | Tester |

### BATCH 2 — BAM Exchange Rate
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S2-05 | BAM rate scraper — fetch bkam.ma, cache daily, fallback to manual | Backend Dev | M | todo | Tester |
| S2-06 | Wire exchange rate into invoice form (auto-fill + manual override) | Frontend Dev | S | todo | Tester |

### BATCH 3 — RTL + i18n
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S2-07 | Locale switcher in nav (FR ↔ AR), persisted via cookie | Frontend Dev | S | todo | Tester |
| S2-08 | RTL audit — verify all pages work in dir=rtl | Frontend Dev | M | todo | Tester |

### BATCH 4 — Docker + Quality Gate
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S2-09 | Docker production build validation (next build + compose up) | DevOps | M | todo | Tester |
| S2-10 | pnpm build zero-error check + Sprint 2 tests | Tester | M | todo | Project Monitor |
| S2-11 | Sprint 2 snapshot | Project Monitor | S | todo | USER |
