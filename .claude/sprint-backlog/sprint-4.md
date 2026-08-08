# Sprint 4 — E-Invoicing Format Readiness (UBL 2.1 / CII export + clearance adapter)

**Goal**: Generate DGI-compliant structured e-invoice XML (UBL 2.1) from existing invoice data, behind a pluggable `ClearanceProvider` adapter that defaults to a no-op — so Moqawil can honestly claim "e-invoicing format ready" without depending on DGI/xHub API access that isn't confirmed available yet.
**Depends on**: Sprint 3 (⚠️ not yet closed — S3-08 DoD final check is still `in-progress`, owned by USER. This sprint's code doesn't depend on S3-08's outcome, but v0.1 shouldn't be tagged until it closes.)
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE ✅ (pending CI confirmation on push)
**Completed**: 2026-08-08

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
| S4-01 | ADR-1 confirmation + UBL 2.1 schema research (which XSD version, which fields map to which CGI Art. 145 mentions) | Software Architect | S | done | DBA |
| S4-02 | Schema delta: `clearanceStatus` enum + `ublXmlPath` on `invoices`; migration | DBA | S | done | Backend Dev |

### BATCH 2 — XML Generation (pure, zero I/O)
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S4-03 | `packages/tax-engine/src/e-invoicing/ubl-mapper.ts` — Invoice → UBL 2.1 XML string | Backend Dev | L | done | Tester |
| S4-04 | Unit tests: XML well-formedness, schema element order, all CGI Art. 145 fields present, bilingual mention handling, XML-injection escaping | Tester | M | done | Software Architect |

### BATCH 3 — Adapter + Route
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S4-05 | `apps/web/lib/clearance/provider.ts` — `ClearanceProvider` interface + `NoOpClearanceProvider` | Software Architect | S | done | Backend Dev |
| S4-06 | `/api/invoices/[id]/ubl/route.ts` — auth-gated XML download, sets `clearanceStatus='ready'` on first generation | Backend Dev | M | done | Security Engineer |
| S4-07 | Security review: auth parity with PDF route, no data leakage | Security Engineer | S | done | Frontend Dev |

### BATCH 4 — UI + Docs
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S4-08 | Invoice-detail page: "Télécharger XML (UBL 2.1)" button + "Format e-facturation prêt" badge | Frontend Dev | S | done | Tester |
| S4-09 | FR doc: `docs/docs/guide-e-facturation.md` — what UBL export is, what it is NOT (not DGI-cleared, not a certification claim) | Frontend Dev | S | done | Project Monitor |
| S4-10 | Sprint 4 snapshot + coverage report (Framework Rule 2: ≥80% combined) | Project Monitor | S | done | USER |

---

## Definition of Done (Sprint 4 closes)
- [x] Any `sent`/`paid` invoice can be downloaded as a UBL 2.1 XML — well-formedness and OASIS schema *element order* verified by tests; **not** validated against the real bundled multi-file XSD (Invoice-2.xsd + CommonAggregateComponents + CommonBasicComponents), which would need a real XML schema validator dependency this sprint didn't add. Known gap, not hidden — tracked below.
- [x] XML contains every CGI Art. 145 mandatory field already present in the PDF
- [x] `ClearanceProvider` interface exists; `NoOpClearanceProvider` is wired as the v0.1 default (actually called from the route, not dead code); zero coupling between it and invoice creation
- [x] No UI copy anywhere claims DGI certification or clearance — "format-ready" language only; the invoice-detail badge and the docs guide both explicitly state what this is NOT
- [x] Unit tests pass (9 new UBL tests + all 68 existing); coverage verified locally where a local DB is available — final combined-coverage confirmation happens in CI, which has the Postgres service this DB-touching code partially depends on
- [x] `git push origin master` at sprint close (Framework Rule 3)

### Known gap carried forward (not silently dropped)
Real XSD schema validation was not implemented — the test suite checks well-formedness, namespace declarations, and top-level element ordering by hand-encoding the schema sequence, not by validating against the actual OASIS XSD files. If UBL export becomes more central (e.g., once real DGI/xHub submission is built in a later sprint), add a real XSD validator (e.g., `libxmljs2` or shelling out to `xmllint`) and validate against the bundled UBL 2.1 schema set. Not done here to avoid adding a new dependency for a v0.1 feature whose main audience is "download and hand to a client's accounting system," not a strict validator.

## Blockers tracked, not owned by this sprint (owner: Mohamed)
1. **Legal scope verification** — get a citation-backed answer from a chartered accountant/OEC on whether AE-status entrepreneurs fall under the Jan 2027 wave. Required before any marketing claim beyond "format-ready", per CLAUDE.md §13 governance rule (tax-rule changes require a citation).
2. **DGI/xHub sandbox registration** — pursue developer/sandbox access so Sprint 5+ can build the real `DgiXhubClearanceProvider`. Business/registration step, not something Claude Code can do unattended.
3. **Barid eSign account** — needed before real QES/AES signing can be implemented. Same category as #2.
