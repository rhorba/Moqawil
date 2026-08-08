# Database: Moqawil
**References**: docs/architecture-moqawil.md, docs/security-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: DBA | **Status**: Current (matches `packages/db/src/schema.ts` as of Sprint 3)

## 1. Sizing Inputs
Single-tenant self-host, one AE per install (occasionally a handful). Thousands of invoices per user over years, not millions. **PostgreSQL 16** is correct — no case for anything else; the data is fully relational (invoices reference clients reference an entrepreneur reference a user) and the write volume is trivial (an AE issues, at most, a few invoices a day).

## 2. Entities & Relationships
```
User (Auth.js) ──1:1──► Entrepreneur (AE profile: ICE, IF, activity type, invoice prefix)
Entrepreneur ──1:N──► Client (individual / company_ma / company_foreign)
Entrepreneur ──1:N──► Invoice ──N:1──► Client
Invoice ──1:N──► InvoiceLine
Entrepreneur ──1:N──► QuarterlyDeclaration
```

## 3. Schema (Drizzle, `packages/db/src/schema.ts`)
9 tables total: `users`, `accounts`, `sessions`, `verification_tokens` (Auth.js-managed), plus the 5 domain tables below.

```typescript
entrepreneurs:
  id, userId (fk→users, unique), fullName, ice (unique, 15 digits), ifNumber,
  activityType (enum: commercial|industrial|artisanal|service), activityDescription,
  address, city, phone, bankIban, registrationDate, fiscalYearStart, invoicePrefix

clients:
  id, entrepreneurId (fk), name, type (enum: individual|company_ma|company_foreign),
  ice (nullable, required by app logic if type=company_ma), ifNumber, email, phone,
  address, countryCode (default 'MA')

invoices:
  id, entrepreneurId (fk), clientId (fk), invoiceNumber, fiscalYear, sequenceNumber,
  issueDate, dueDate, status (enum: draft|sent|paid|cancelled),
  paymentMethod, paymentDate, currency (default MAD), exchangeRate,
  subtotalOriginal, subtotalMad, totalMad, notes, pdfPath
  UNIQUE(entrepreneurId, invoiceNumber)
  UNIQUE(entrepreneurId, fiscalYear, sequenceNumber)

invoiceLines:
  id, invoiceId (fk, cascade delete), position, description, quantity,
  unitPriceOriginal, lineTotalOriginal, lineTotalMad

quarterlyDeclarations:
  id, entrepreneurId (fk), year, quarter (1-4), totalTurnoverMad, taxRate,
  taxDueMad, status (enum: pending|submitted), submittedAt, pdfPath
  UNIQUE(entrepreneurId, year, quarter)
```

## 4. Critical Indexes
```sql
-- Client cap tracker (most frequent query in the app)
CREATE INDEX idx_invoices_client_year ON invoices(client_id, fiscal_year)
  WHERE status != 'cancelled';

-- Annual threshold queries
CREATE INDEX idx_invoices_entrepreneur_year ON invoices(entrepreneur_id, fiscal_year)
  WHERE status = 'paid';

-- Quarterly declaration queries
CREATE INDEX idx_invoices_quarter ON invoices(entrepreneur_id, fiscal_year, issue_date)
  WHERE status = 'paid';
```

## 5. Invoice Sequence Integrity — the one hard invariant in this schema
CGI Art. 145 requires sequential invoice numbers with no gaps. Enforced via PostgreSQL advisory lock inside a Drizzle transaction (`pg_advisory_xact_lock` keyed on entrepreneur ID), not just a unique constraint — a unique constraint alone would let two concurrent requests both fail rather than one succeeding with the correct next number. See `docs/architecture-moqawil.md` ADR-3 pattern discussion; full code pattern lives in the `dba` skill (`.claude/skills/dba/SKILL.md`).

## 6. Migration Discipline
- One migration file per schema change, generated via `drizzle-kit generate`, applied via `drizzle-kit migrate`.
- Backward-compatible first pass for any breaking-looking change (nullable → backfill → constrain).
- **`packages/db/drizzle/meta/` (journal + snapshots) is tracked in git, not ignored** — this was a real bug found and fixed 2026-08-08 (see `.logs/activity.md`): a `.gitignore` rule excluded `meta/_journal.json`, which `drizzle-kit migrate` requires to know what migrations exist. A fresh checkout had no way to migrate until this was fixed.
- Never modify a migration file that has already been applied anywhere.

## 7. Known Gap
`src/lib/queries/{client,entrepreneur,invoice}.ts` have DB-touching functions with no unit-test coverage today (only the pure/mockable helpers in `queries/declaration.ts` and `threshold-alerts.ts` are tested — see `docs/test-strategy-moqawil.md`). Not hidden by widening the coverage config to claim otherwise; tracked honestly as a gap to close with real integration tests, not yet scheduled to a sprint.

## Handoff
→ Backend Dev: schema exports, migration commands, query helper contracts
→ Security Engineer: `docs/security-moqawil.md`
