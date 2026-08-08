# PRD: E-Invoicing Format Readiness (UBL 2.1 export)
**Version**: 1.0 | **Date**: 2026-08-08 | **Author**: PM | **Status**: Draft — Sprint 4

## 1. Problem Statement
Morocco's DGI e-invoicing mandate reaches self-employed with turnover above 500,000 MAD and non-exempt SMEs/TPEs on 2027-01-01 (large companies: already in force since 2026-01-01; mid-size: 2026-07-01). Whether Moqawil's core auto-entrepreneur user (capped at 200K MAD services / 500K MAD commercial by Loi 114-13 itself) falls inside this scope is **not yet confirmed** — flat-rate liberal professions are reported as temporarily exempt in secondary sources, but AE is a distinct regime from the general "régime du forfait" and hasn't been explicitly addressed in any DGI circular found so far. Two things hold regardless of that open question: commercial/artisanal AEs near the 500K ceiling may cross into scope, and AE users' B2B clients (who face the mandate earlier) increasingly expect invoices in a structured format their own systems can process. Shipping UBL 2.1 export is valuable either way and carries no legal risk on its own — it is implementing a public OASIS standard, not claiming DGI certification.

## 2. Goals & Success Metrics
| Goal | Metric | Target |
|---|---|---|
| Invoices exportable as compliant XML | UBL 2.1 schema validation | 100% of `sent`/`paid` invoices pass validation against the public UBL 2.1 XSD |
| No regression to core invoicing | Existing test suite | 0 failures |
| Adapter ready for real clearance later | `ClearanceProvider` interface + `NoOpClearanceProvider` | Swappable without touching invoice creation flow |
| Coverage gate holds | Combined unit coverage | ≥ 80% (Framework Rule 2) |

## 3. Key Roles (existing personas, CLAUDE.md §2)
- **Karim** — freelance dev with EU + MA clients, wants to hand a client a structured e-invoice their accounting system can ingest.
- **Hicham** — chartered accountant managing ~30 AE clients, needs the XML to carry the exact same legal mentions as the PDF so he can trust it without cross-checking by hand.

## 4. User Stories
- [ ] As Karim, I want to download a UBL 2.1 XML alongside the PDF, so I can hand it to a client whose accounting system requires structured e-invoices.
- [ ] As Hicham, I want the XML to carry the same legal mentions as the PDF (CGI Art. 145 fields), so I can trust it without cross-checking by hand.
- [ ] As any AE user, I want the UI to never imply DGI has certified or cleared my invoice, so I don't accidentally misrepresent my compliance status to a client or inspector.

## 5. Scope
**In**: UBL 2.1 XML generation from existing invoice data; auth-gated download route; invoice-detail UI entry point; `ClearanceProvider` interface + no-op default implementation; unit tests + schema validation.

**Out** (explicitly, until legal scope + DGI API access are confirmed — do not build without owner instruction): actual submission to the DGI/xHub clearance platform; Barid eSign QES/AES signing; CII format (UBL only for v0.1, see ADR-1 in `docs/architecture-sprint4-e-invoicing.md`); any change to invoice creation flow that assumes clearance succeeded.

## 6. Requirements
- FR-1: Given a `sent` or `paid` invoice, generate a UBL 2.1 Invoice XML document containing every CGI Art. 145 mandatory field already present in the PDF.
- FR-2: XML generation is a pure function in `packages/tax-engine` — zero I/O, unit-testable, no framework imports.
- FR-3: `/api/invoices/[id]/ubl` route streams the XML, auth-gated identically to the existing PDF route.
- FR-4: `ClearanceProvider` interface exists with one implementation, `NoOpClearanceProvider` (returns `not_applicable`). Real DGI/xHub provider is explicitly future work.
- NFR-1: XML generation adds no more than 500ms to invoice-detail interactions (generate on-demand at download time, not on every page load).

## 7. Moqawil Business Rules Touched (CLAUDE.md §3)
Mandatory invoice fields (CGI Art. 145), the "TVA non applicable" mention. The 80K per-client cap is an internal compliance feature, not a legal invoice field — it must NOT appear in the XML output.

## 8. Risks
| Risk | P | I | Mitigation |
|---|---|---|---|
| AE legal scope for the e-invoicing mandate is unconfirmed | Med | Med | Position as "format-ready" only; never claim DGI certification in UI copy; get an accountant's citation before any stronger marketing claim |
| DGI/xHub API spec still not fully public | High | Low | `ClearanceProvider` adapter isolates this — ships independently of this sprint's work, wired in later at zero cost |
| UBL 2.1 vs CII choice wrong | Low | Low | ADR-1 picks UBL 2.1 with reasoning; a CII implementation can be added later behind the same interface |
