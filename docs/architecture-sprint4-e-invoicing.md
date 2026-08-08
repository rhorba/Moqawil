# Architecture: E-Invoicing Format Readiness (UBL 2.1 export)
**PRD**: `docs/prd-sprint4-e-invoicing.md`
**Owners**: Software Architect + System Designer + DBA + Security Engineer

## ADR-1: UBL 2.1 as the only supported format for v0.1 (not CII)
- **Status**: Accepted
- **Context**: DGI accepts both UBL 2.1 (OASIS) and CII (UN/CEFACT) XML formats for e-invoicing.
- **Decision**: Implement UBL 2.1 only. Design the XML-generation function so a CII implementation can be added later behind the same call signature.
- **Alternatives considered**: CII-first (rejected — smaller open-source tooling/validator ecosystem, harder to unit-test against a public schema); both formats simultaneously (rejected — doubles v0.1 surface area for no confirmed user need yet).
- **Consequences**: (+) broader open-source tooling/validator support, smaller v0.1 surface area. (−) a future client requiring CII specifically isn't served until a later sprint.
- **Re-evaluate when**: a real user needs CII, or DGI publishes final technical specs favoring one format.

## ADR-2: External clearance isolated behind a `ClearanceProvider` adapter
- **Status**: Accepted
- **Context**: DGI/xHub clearance submission and Barid eSign signing both depend on external systems whose public API availability is unconfirmed as of 2026-08.
- **Decision**: Define `ClearanceProvider` as an interface in `apps/web/lib/clearance/provider.ts`; ship only `NoOpClearanceProvider` in v0.1. Real submission logic is added later as a second implementation, with zero changes to invoice creation flow.
- **Consequences**: (+) core invoicing never blocks on an external dependency that may not even be usable yet. (−) no real clearance happens in v0.1 — by design, not an oversight.

## System Design
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
        └── [future] DgiXhubClearanceProvider (later sprint, blocked on API access)
        │
        ▼
/api/invoices/[id]/ubl  ← auth-gated download route (mirrors existing PDF route)
```
No new external network call in this sprint — XML generation is entirely local, matching Moqawil's existing precedent (BAM scraper failure never blocks invoice creation; the clearance adapter follows the same rule).

## Data Model Delta
Add to `invoices` table (`packages/db/src/schema.ts`):
```typescript
clearanceStatus: pgEnum('clearance_status', ['not_applicable', 'ready', 'submitted', 'cleared', 'rejected'])
  .default('not_applicable').notNull()   // v0.1: always 'ready' after XML generated, never progresses further
ublXmlPath: text('ubl_xml_path').nullable()
```
No new table for v0.1 — there is no submission history to track yet (that becomes relevant once a real `ClearanceProvider` exists).

## Security Considerations
- XML route reuses the exact auth check as the PDF route (session-scoped, entrepreneur must own the invoice) — no new attack surface introduced.
- XML must not leak data beyond what the PDF already exposes (same mandatory-fields set — no internal-only fields like the 80K cap status).
- No credentials to protect in v0.1 — `NoOpClearanceProvider` holds no secrets. Revisit when a real provider is added: API keys go through env vars per Framework Rule 4, never hardcoded.
- CI's `security` job (Semgrep SAST, Trivy dependency scan, Gitleaks secrets scan — see `.github/workflows/ci.yml`) covers this sprint's new code like any other; no exemptions.
