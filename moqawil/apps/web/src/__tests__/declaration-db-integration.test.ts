/**
 * DB-integration tests for the query functions in src/lib/queries/declaration.ts
 * that touch the database (getQuarterlyTurnover, getDeclarationsForYear,
 * computeAndUpsertDeclaration). The pure helpers (quarterDateRange,
 * declarationDeadline, daysUntilDeadline) are covered separately in
 * declaration-queries.test.ts via a mocked @moqawil/db.
 *
 * Requires DATABASE_URL env var and are skipped otherwise (see invoice-numbering.test.ts
 * for the same pattern).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SKIP_INTEGRATION = !process.env.DATABASE_URL

describe.skipIf(SKIP_INTEGRATION)('Declaration queries — DB integration', () => {
  // Dynamic import to avoid failing when DB is unavailable — see invoice-numbering.test.ts.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let db: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let invoicesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let entrepreneursTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let quarterlyDeclarationsTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let clientsTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let usersTable: any

  const TEST_USER_ID = 'test-decl-user-001'
  const TEST_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000201'
  const TEST_CLIENT_ID = '00000000-0000-0000-0000-000000000202'
  const TEST_YEAR = 2097

  beforeAll(async () => {
    const mod = await import('@moqawil/db')
    db = mod.db
    invoicesTable = mod.invoices
    entrepreneursTable = mod.entrepreneurs
    quarterlyDeclarationsTable = mod.quarterlyDeclarations
    clientsTable = mod.clients
    usersTable = mod.users

    await db
      .insert(usersTable)
      .values({ id: TEST_USER_ID, email: 'decl-test@moqawil.test', name: 'Decl Test User' })
      .onConflictDoNothing()

    await db
      .insert(entrepreneursTable)
      .values({
        id: TEST_ENTREPRENEUR_ID,
        userId: TEST_USER_ID,
        fullName: 'Test AE Decl',
        ice: '000000000000002',
        ifNumber: '87654321',
        activityType: 'service',
        address: '1 Rue Test',
        city: 'Rabat',
        registrationDate: '2024-01-01',
        invoicePrefix: 'DCL',
      })
      .onConflictDoNothing()

    await db
      .insert(clientsTable)
      .values({
        id: TEST_CLIENT_ID,
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        name: 'Test Client Decl',
        type: 'individual',
      })
      .onConflictDoNothing()

    // Two paid invoices in Q1 (Jan + Feb), one unpaid (should be excluded), one paid in Q2 (excluded from Q1 total)
    await db.insert(invoicesTable).values([
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        invoiceNumber: `DCL-${TEST_YEAR}-001`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 1,
        issueDate: `${TEST_YEAR}-01-10`,
        status: 'paid',
        paymentDate: `${TEST_YEAR}-01-15`,
        currency: 'MAD',
        subtotalOriginal: '10000.00',
        subtotalMad: '10000.00',
        totalMad: '10000.00',
      },
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        invoiceNumber: `DCL-${TEST_YEAR}-002`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 2,
        issueDate: `${TEST_YEAR}-02-10`,
        status: 'paid',
        paymentDate: `${TEST_YEAR}-02-20`,
        currency: 'MAD',
        subtotalOriginal: '5000.00',
        subtotalMad: '5000.00',
        totalMad: '5000.00',
      },
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        invoiceNumber: `DCL-${TEST_YEAR}-003`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 3,
        issueDate: `${TEST_YEAR}-03-01`,
        status: 'sent',
        currency: 'MAD',
        subtotalOriginal: '2000.00',
        subtotalMad: '2000.00',
        totalMad: '2000.00',
      },
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        invoiceNumber: `DCL-${TEST_YEAR}-004`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 4,
        issueDate: `${TEST_YEAR}-04-05`,
        status: 'paid',
        paymentDate: `${TEST_YEAR}-04-05`,
        currency: 'MAD',
        subtotalOriginal: '3000.00',
        subtotalMad: '3000.00',
        totalMad: '3000.00',
      },
    ])
  })

  afterAll(async () => {
    const { eq } = await import('drizzle-orm')
    await db
      .delete(quarterlyDeclarationsTable)
      .where(eq(quarterlyDeclarationsTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(invoicesTable).where(eq(invoicesTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(clientsTable).where(eq(clientsTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, TEST_ENTREPRENEUR_ID))
    await db.delete(usersTable).where(eq(usersTable.id, TEST_USER_ID))
  })

  it('getQuarterlyTurnover sums only paid invoices within the quarter window', async () => {
    const { getQuarterlyTurnover } = await import('@/lib/queries/declaration')
    const q1 = await getQuarterlyTurnover(TEST_ENTREPRENEUR_ID, TEST_YEAR, 1)
    expect(q1).toBe(15000) // 10000 + 5000 (paid) — excludes the 'sent' 2000 invoice
    const q2 = await getQuarterlyTurnover(TEST_ENTREPRENEUR_ID, TEST_YEAR, 2)
    expect(q2).toBe(3000)
  })

  it('getQuarterlyTurnover returns 0 for a quarter with no paid invoices', async () => {
    const { getQuarterlyTurnover } = await import('@/lib/queries/declaration')
    const q3 = await getQuarterlyTurnover(TEST_ENTREPRENEUR_ID, TEST_YEAR, 3)
    expect(q3).toBe(0)
  })

  it('computeAndUpsertDeclaration inserts a new declaration with the correct tax rate', async () => {
    const { computeAndUpsertDeclaration } = await import('@/lib/queries/declaration')
    const result = await computeAndUpsertDeclaration(TEST_ENTREPRENEUR_ID, TEST_YEAR, 1, 'service')
    expect(result.turnover).toBe(15000)
    expect(result.taxRate).toBe(0.01) // service rate
    expect(result.taxDue).toBe(150)
    expect(result.id).toBeTruthy()
  })

  it('computeAndUpsertDeclaration updates the existing row on a second call (no duplicate)', async () => {
    const { computeAndUpsertDeclaration } = await import('@/lib/queries/declaration')
    const first = await computeAndUpsertDeclaration(TEST_ENTREPRENEUR_ID, TEST_YEAR, 2, 'service')
    const second = await computeAndUpsertDeclaration(TEST_ENTREPRENEUR_ID, TEST_YEAR, 2, 'service')
    expect(second.id).toBe(first.id)
    expect(second.turnover).toBe(3000)
  })

  it('getDeclarationsForYear returns all 4 quarters, filling gaps with pending/zero rows', async () => {
    const { getDeclarationsForYear } = await import('@/lib/queries/declaration')
    const rows = await getDeclarationsForYear(TEST_ENTREPRENEUR_ID, TEST_YEAR)
    expect(rows).toHaveLength(4)
    expect(rows.map((r) => r.quarter)).toEqual([1, 2, 3, 4])

    const q1 = rows.find((r) => r.quarter === 1)
    expect(q1?.totalTurnoverMad).toBe(15000)
    expect(q1?.status).toBe('pending')

    // Q3 was never computed — should be a zero-filled placeholder, not a DB row
    const q3 = rows.find((r) => r.quarter === 3)
    expect(q3?.id).toBeNull()
    expect(q3?.totalTurnoverMad).toBe(0)
  })
})
