# Sprint 4 — E-Invoicing Format Readiness (UBL 2.1 / CII export + clearance adapter)

**Goal**: Generate DGI-compliant structured e-invoice XML (UBL 2.1) from existing invoice data, behind a pluggable `ClearanceProvider` adapter that defaults to a no-op — so Moqawil can honestly claim "e-invoicing format ready" without depending on DGI/xHub API access that isn't confirmed available yet.
**Depends on**: Sprint 3 (⚠️ not yet closed — S3-08 DoD final check is still `in-progress`, owned by USER. This sprint's code doesn't depend on S3-08's outcome, but v0.1 shouldn't be tagged until it closes.)
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: NOT STARTED

---

## Design (required — this sprint adds a new external-system boundary, per Framework Rule 1 & 6)

### Problem statement
Morocco's DGI e-invoicing mandate reaches self-employed with turnover >500K MAD and non-exempt SMEs/TPEs on 2027-01-01 (large companies: already in force; mid-size: 2026-07-01). Whether Moqawil's core AE user (capped at 200K services / 500K commercial by law) falls inside this is **not yet confirmed** — flat-rate liberal professions are reported as temporarily exempt, but AE (Loi 114-13) is a distinct regime and hasn't been explicitly confirmed either way in any DGI circular found so far. Two things are true regardless of that answer: (1) commercial/artisanal AEs near the 500K ceiling may cross into scope, and (2) AE users' B2B clients (who face the mandate earlier) increasingly expect invoices in a format their own systems can process. Shipping UBL 2.1 export is valuable either way and carries no legal risk — it's a public OASIS standard, not a claim of DGI certification.

### Goals
| Goal | Metric | Target |
|---|---|---|
| Invoices exportable as compliant XML | UBL 2.1 schema validation | 100% of `sent`/`paid` invoices pass validation |
| No regression to core invoicing | Existing test suite | 0 failures |
| Adapter ready for real clearance later | `ClearanceProvider` interface + `NoOpClearanceProvider` | Swappable without touching invoice creation flow |

### User stories
- As **Karim** (freelance dev with EU + MA clients), I want to download a UBL 2.1 XML alongside the PDF, so I can hand it to a client whose accounting system requires structured e-invoices.
- As **Hicham** (chartered accountant), I want the XML to carry the same legal mentions as the PDF (CGI Art. 145 fields), so I can trust it without cross-checking by hand.

### Scope
**In**: UBL 2.1 XML generation from existing invoice data; download route; invoice-detail UI entry point; `ClearanceProvider` interface + no-op default implementation; unit tests + schema validation.
**Out** (explicitly, until legal scope + DGI API access are confirmed — do not build without owner instruction): actual submission to DGI/xHub clearance platform; Barid eSign QES/AES signing; CII format (UBL only for v0.1 — see ADR below); any change to invoice creation flow that assumes clearance succeeded.

### Requirements
- FR-1: Given a `sent` or `paid` invoice, generate a UBL 2.1 Invoice XML document containing all CGI Art. 145 mandatory fields already in the PDF.
- FR-2: XML generation is a pure function in `packages/tax-engine` (or a new sibling pure package) — zero I/O, unit-testable, no framework imports (Dependency Rule, Software Architect skill).
- FR-3: `/api/invoices/[id]/ubl` route streams the XML, auth-gated identically to the existing PDF route.
- FR-4: `ClearanceProvider` interface exists with one implementation: `NoOpClearanceProvider` (returns `not_applicable` — no real submission attempted). Real DGI/xHub provider is future work, explicitly out of scope this sprint.
- NFR-1: XML generation adds no more than 500ms to invoice-detail page load (generate on-demand at download, not on every page view).

### Moqawil business rules this touches (CLAUDE.md §3)
Mandatory invoice fields (CGI Art. 145), TVA non-applicable mention, per-client 80K cap context is NOT part of the XML (it's an internal compliance feature, not a legal invoice field) — do not add it to the XML output.

### Risks
| Risk | P | I | Mitigation |
|---|---|---|---|
| AE legal scope for e-invoicing mandate is unconfirmed | Med | Med | Position as "format-ready", never claim DGI certification in UI copy; get accountant citation before any marketing claim |
| DGI/xHub API spec still not fully public | High | Low | `ClearanceProvider` adapter isolates this — ships independently, wired in later at zero cost to this sprint's work |
| UBL 2.1 vs CII choice wrong | Low | Low | ADR below picks UBL 2.1 with reasoning; CII adapter can be added later behind the same interface |

---

## ADR-1: UBL 2.1 as the only supported format for v0.1 (not CII)
**Status**: Accepted
**Context**: DGI accepts both UBL 2.1 (OASIS) and CII (UN/CEFACT) XML formats for e-invoicing.
**Decision**: Implement UBL 2.1 only. Design the XML-generation function so a CII implementation can be added later behind the same call signature.
**Consequences**:
  + UBL 2.1 has broader open-source tooling/validator support, easier to unit-test against a public XSD
  + Smaller surface area for v0.1
  - Any future client whose system specifically requires CII isn't served until a later sprint
**Re-evaluate when**: A real user needs CII, or DGI publishes final technical specs favoring one format.

## System Design (System Designer)
```
Invoice (Drizzle row + lines)
        │
        ▼
packages/tax-engine/src/e-invoicing/ubl-mapper.ts   ← pure function, zero I/O
        │
        ▼
   UBL 2.1 XML string
        │
        ▼
apps/web/lib/clearance/provider.ts  ← ClearanceProvider interface
        │
        ├── NoOpClearanceProvider (v0.1 default — no submission, XML only)
        └── [future] DgiXhubClearanceProvider (Sprint 5+, blocked on API access)
        │
        ▼
/api/invoices/[id]/ubl  ← auth-gated download route (mirrors existing PDF route)
```
No new external network call in this sprint — XML generation is entirely local. Matches System Designer's rule: never let an unconfirmed external dependency block a shippable feature.

## Data Model Delta (DBA — review before Backend starts)
Add to `invoices` table:
```typescript
clearanceStatus: pgEnum('clearance_status', ['not_applicable', 'ready', 'submitted', 'cleared', 'rejected'])
  .default('not_applicable').notNull()   // v0.1: always 'ready' after XML generated, never progresses further
ublXmlPath: text('ubl_xml_path').nullable()
```
No new table needed for v0.1 (no submission history to track yet — that's Sprint 5+ scope when a real provider exists).

## Security Considerations (Security Engineer — review before ship)
- XML route reuses the exact auth check as the PDF route (session-scoped, entrepreneur owns invoice) — no new attack surface.
- XML must not leak data beyond what's already in the PDF (same mandatory-fields set).
- No credentials to protect yet — `NoOpClearanceProvider` has no secrets. Revisit when a real provider is added (API keys → env vars, per Framework Rule 4).

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
