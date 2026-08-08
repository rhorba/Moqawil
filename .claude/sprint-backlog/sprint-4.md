# Sprint 4 — E-Invoicing Format Readiness (UBL 2.1 / CII export + clearance adapter)

**Goal**: Generate DGI-compliant structured e-invoice XML (UBL 2.1) from existing invoice data, behind a pluggable `ClearanceProvider` adapter that defaults to a no-op — so Moqawil can honestly claim "e-invoicing format ready" without depending on DGI/xHub API access that isn't confirmed available yet.
**Depends on**: Sprint 3 (⚠️ not yet closed — S3-08 DoD final check is still `in-progress`, owned by USER. This sprint's code doesn't depend on S3-08's outcome, but v0.1 shouldn't be tagged until it closes.)
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: NOT STARTED

---

## Design

**PRD**: `docs/prd-sprint4-e-invoicing.md`
**Architecture**: `docs/architecture-sprint4-e-invoicing.md`

This sprint adds a new external-system boundary (DGI/xHub clearance, even though only the no-op path ships now), so Framework Rules 1 and 6 require the full PRD + Architecture pair above, produced and committed before code. Summary: generate UBL 2.1 XML from existing invoice data via a pure `packages/tax-engine` function, behind a `ClearanceProvider` adapter defaulting to a no-op — real DGI submission and Barid eSign signing are explicitly out of scope until external access is confirmed.

---

## Sprint Backlog

### BATCH 1 — Foundations
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S4-01 | ADR-1 confirmation + UBL 2.1 schema research (which XSD version, which fields map to which CGI Art. 145 mentions) | Software Architect | S | todo | DBA |
| S4-02 | Schema delta: `clearanceStatus` enum + `ublXmlPath` on `invoices`; migration | DBA | S | todo | Backend Dev |

### BATCH 2 — XML Generation (pure, zero I/O)
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S4-03 | `packages/tax-engine/src/e-invoicing/ubl-mapper.ts` — Invoice → UBL 2.1 XML string | Backend Dev | L | todo | Tester |
| S4-04 | Unit tests: XML validity against public UBL 2.1 XSD, all CGI Art. 145 fields present, bilingual mention handling | Tester | M | todo | Software Architect |

### BATCH 3 — Adapter + Route
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S4-05 | `apps/web/lib/clearance/provider.ts` — `ClearanceProvider` interface + `NoOpClearanceProvider` | Software Architect | S | todo | Backend Dev |
| S4-06 | `/api/invoices/[id]/ubl/route.ts` — auth-gated XML download, sets `clearanceStatus='ready'` on first generation | Backend Dev | M | todo | Security Engineer |
| S4-07 | Security review: auth parity with PDF route, no data leakage | Security Engineer | S | todo | Frontend Dev |

### BATCH 4 — UI + Docs
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S4-08 | Invoice-detail page: "Télécharger XML (UBL 2.1)" button + "Format e-facturation prêt" badge | Frontend Dev | S | todo | Tester |
| S4-09 | FR doc: `docs/docs/guide-e-facturation.md` — what UBL export is, what it is NOT (not DGI-cleared, not a certification claim) | Frontend Dev | S | todo | Project Monitor |
| S4-10 | Sprint 4 snapshot + coverage report (Framework Rule 2: ≥80% combined) | Project Monitor | S | todo | USER |

---

## Definition of Done (Sprint 4 closes)
- [ ] Any `sent`/`paid` invoice can be downloaded as a UBL 2.1 XML that validates against the public XSD
- [ ] XML contains every CGI Art. 145 mandatory field already present in the PDF
- [ ] `ClearanceProvider` interface exists; `NoOpClearanceProvider` is wired as the v0.1 default; zero coupling between it and invoice creation
- [ ] No UI copy anywhere claims DGI certification or clearance — "format-ready" language only, reviewed against §3/§17 (ask-before-deviating on tax-rule-adjacent claims)
- [ ] Unit tests pass; combined coverage ≥80% (Framework Rule 2)
- [ ] `git push origin master` at sprint close (Framework Rule 3)

## Blockers tracked, not owned by this sprint (owner: Mohamed)
1. **Legal scope verification** — get a citation-backed answer from a chartered accountant/OEC on whether AE-status entrepreneurs fall under the Jan 2027 wave. Required before any marketing claim beyond "format-ready", per CLAUDE.md §13 governance rule (tax-rule changes require a citation).
2. **DGI/xHub sandbox registration** — pursue developer/sandbox access so Sprint 5+ can build the real `DgiXhubClearanceProvider`. Business/registration step, not something Claude Code can do unattended.
3. **Barid eSign account** — needed before real QES/AES signing can be implemented. Same category as #2.
