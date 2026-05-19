---
name: dba
description: >
  Database skill for Drizzle ORM schema design, PostgreSQL migrations, query optimization, and
  database operations. Trigger on: "schema", "migration", "drizzle", "postgres", "database",
  "query", "index", "relation", "db migrate", "drizzle-kit", "slow query", or data model work.
---

# DBA — Moqawil (Drizzle + PostgreSQL 16)

## Role
Design and maintain the Drizzle schema in `packages/db/src/schema.ts`. Write migrations. Optimize queries. Protect invoice sequence integrity.

## Stack

- ORM: Drizzle ORM (NOT TypeORM, NOT Prisma)
- DB: PostgreSQL 16
- CLI: `pnpm db:migrate` (drizzle-kit push / migrate)
- Studio: `pnpm db:studio` (drizzle-kit studio)
- Config: `packages/db/drizzle.config.ts`

## Schema Location

`packages/db/src/schema.ts` — all 5 core tables defined in CLAUDE.md §8.

## Drizzle Patterns

```typescript
// Table definition
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const activityTypeEnum = pgEnum('activity_type', ['commercial', 'industrial', 'artisanal', 'service'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'cancelled'])

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  entrepreneurId: uuid('entrepreneur_id').notNull().references(() => entrepreneurs.id),
  invoiceNumber: text('invoice_number').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  sequenceNumber: integer('sequence_number').notNull(),
  issueDate: date('issue_date').notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  totalMad: numeric('total_mad', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  // Unique constraints
  uniqueInvoiceNumber: unique().on(t.entrepreneurId, t.invoiceNumber),
  uniqueSequence: unique().on(t.entrepreneurId, t.fiscalYear, t.sequenceNumber),
}))
```

## Invoice Sequence Integrity (CRITICAL)

Sequential invoice numbers with no gaps is a LEGAL requirement (CGI Article 145).
Use PostgreSQL advisory locks + Drizzle transaction:

```typescript
// Always use this pattern for invoice number generation
await db.transaction(async (tx) => {
  // Advisory lock per entrepreneur (prevents race conditions)
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${entrepreneurId.hashCode()})`)
  
  const last = await tx.select({ seq: max(invoices.sequenceNumber) })
    .from(invoices)
    .where(and(eq(invoices.entrepreneurId, entrepreneurId), eq(invoices.fiscalYear, year)))
  
  const nextSeq = (last[0]?.seq ?? 0) + 1
  // ... create invoice with nextSeq
})
```

## Migration Rules

1. One migration file per schema change
2. Always backward-compatible first pass (nullable columns → backfill → add constraint)
3. Test with `drizzle-kit check` before applying
4. Never modify production-applied migrations

## Critical Indexes

```sql
-- Client cap tracker queries (most frequent)
CREATE INDEX idx_invoices_client_year ON invoices(client_id, fiscal_year) 
  WHERE status != 'cancelled';

-- Annual threshold queries
CREATE INDEX idx_invoices_entrepreneur_year ON invoices(entrepreneur_id, fiscal_year)
  WHERE status = 'paid';

-- Quarterly declaration queries
CREATE INDEX idx_invoices_quarter ON invoices(entrepreneur_id, fiscal_year, issue_date)
  WHERE status = 'paid';
```

## Cap Tracker Query Pattern

```typescript
// getClientAnnualTotal — used in cap badge everywhere
async function getClientAnnualTotal(clientId: string, year: number) {
  const result = await db
    .select({
      totalInvoicedMad: sum(invoices.totalMad),
      totalPaidMad: sql`SUM(CASE WHEN status = 'paid' THEN total_mad ELSE 0 END)`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.clientId, clientId),
      eq(invoices.fiscalYear, year),
      ne(invoices.status, 'cancelled')
    ))
  return result[0]
}
```

## YAGNI Database Design

- Don't add tables not in CLAUDE.md §8 without explicit instruction
- Don't add indexes preemptively — add when query is proven slow
- Don't denormalize — Postgres handles the load at AE scale (thousands of invoices)
- Don't add Redis cache — not needed for v0.1

## Handoff Points
- **← From Tech Lead**: Data requirements, performance targets
- **→ Backend Dev**: Schema exports, migration commands, query helpers
- **→ DevOps**: Postgres container config, backup requirements
