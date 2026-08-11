/**
 * Sprint 5 (S5-04): DB-integration tests for src/lib/queries/client.ts.
 * Requires DATABASE_URL env var and are skipped otherwise (see
 * invoice-numbering.test.ts for the same pattern).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SKIP_INTEGRATION = !process.env.DATABASE_URL

describe.skipIf(SKIP_INTEGRATION)('Client queries — DB integration', () => {
  // Dynamic import to avoid failing when DB is unavailable — see invoice-numbering.test.ts.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let db: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let invoicesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let entrepreneursTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let clientsTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let usersTable: any

  const TEST_USER_ID = 'test-client-user-001'
  const TEST_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000301'
  const OTHER_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000302'
  const OTHER_USER_ID = 'test-client-user-002'
  const CLIENT_SAFE_ID = '00000000-0000-0000-0000-000000000311'
  const CLIENT_WARNING_ID = '00000000-0000-0000-0000-000000000312'
  const CLIENT_OVER_ID = '00000000-0000-0000-0000-000000000313'
  const TEST_YEAR = 2096

  beforeAll(async () => {
    const mod = await import('@moqawil/db')
    db = mod.db
    invoicesTable = mod.invoices
    entrepreneursTable = mod.entrepreneurs
    clientsTable = mod.clients
    usersTable = mod.users

    await db
      .insert(usersTable)
      .values([
        { id: TEST_USER_ID, email: 'client-test@moqawil.test', name: 'Client Test User' },
        { id: OTHER_USER_ID, email: 'client-test-2@moqawil.test', name: 'Other Test User' },
      ])
      // Sprint 11: explicit target so a real conflict (e.g. stale ICE from another
      // suite) fails loudly instead of silently no-oping on the wrong constraint.
      .onConflictDoNothing({ target: usersTable.id })

    await db
      .insert(entrepreneursTable)
      .values([
        {
          id: TEST_ENTREPRENEUR_ID,
          userId: TEST_USER_ID,
          fullName: 'Test AE Client',
          ice: '000000000000031', // Sprint 11 fixture-collision fix: block 031/032 reserved for this file — see docs/test-strategy-moqawil.md
          ifNumber: '11111111',
          activityType: 'service',
          address: '1 Rue Test',
          city: 'Fes',
          registrationDate: '2024-01-01',
          invoicePrefix: 'CLT',
        },
        {
          id: OTHER_ENTREPRENEUR_ID,
          userId: OTHER_USER_ID,
          fullName: 'Other AE',
          ice: '000000000000032',
          ifNumber: '22222222',
          activityType: 'service',
          address: '2 Rue Test',
          city: 'Fes',
          registrationDate: '2024-01-01',
          invoicePrefix: 'OTH',
        },
      ])
      .onConflictDoNothing({ target: entrepreneursTable.id })

    await db
      .insert(clientsTable)
      .values([
        // Zeta/Alpha/Beta names on purpose to verify getClients orders by name, not insert order
        {
          id: CLIENT_SAFE_ID,
          entrepreneurId: TEST_ENTREPRENEUR_ID,
          name: 'Zeta Safe Client',
          type: 'individual',
        },
        {
          id: CLIENT_WARNING_ID,
          entrepreneurId: TEST_ENTREPRENEUR_ID,
          name: 'Alpha Warning Client',
          type: 'individual',
        },
        {
          id: CLIENT_OVER_ID,
          entrepreneurId: TEST_ENTREPRENEUR_ID,
          name: 'Beta Over Client',
          type: 'individual',
        },
      ])
      .onConflictDoNothing()

    // Safe: 30,000 MAD invoiced (< 70% of 80K cap)
    // Warning: 75,000 MAD invoiced (70-99% of cap)
    // Over: 90,000 MAD invoiced, only 40,000 paid — totalInvoicedMad vs totalPaidMad must differ
    await db.insert(invoicesTable).values([
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: CLIENT_SAFE_ID,
        invoiceNumber: `CLT-${TEST_YEAR}-001`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 1,
        issueDate: `${TEST_YEAR}-01-10`,
        status: 'paid',
        paymentDate: `${TEST_YEAR}-01-15`,
        currency: 'MAD',
        subtotalOriginal: '30000.00',
        subtotalMad: '30000.00',
        totalMad: '30000.00',
      },
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: CLIENT_WARNING_ID,
        invoiceNumber: `CLT-${TEST_YEAR}-002`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 2,
        issueDate: `${TEST_YEAR}-02-10`,
        status: 'sent',
        currency: 'MAD',
        subtotalOriginal: '75000.00',
        subtotalMad: '75000.00',
        totalMad: '75000.00',
      },
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: CLIENT_OVER_ID,
        invoiceNumber: `CLT-${TEST_YEAR}-003`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 3,
        issueDate: `${TEST_YEAR}-03-01`,
        status: 'paid',
        paymentDate: `${TEST_YEAR}-03-05`,
        currency: 'MAD',
        subtotalOriginal: '40000.00',
        subtotalMad: '40000.00',
        totalMad: '40000.00',
      },
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: CLIENT_OVER_ID,
        invoiceNumber: `CLT-${TEST_YEAR}-004`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 4,
        issueDate: `${TEST_YEAR}-04-01`,
        status: 'sent',
        currency: 'MAD',
        subtotalOriginal: '50000.00',
        subtotalMad: '50000.00',
        totalMad: '50000.00',
      },
      {
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: CLIENT_OVER_ID,
        invoiceNumber: `CLT-${TEST_YEAR}-005`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 5,
        issueDate: `${TEST_YEAR}-05-01`,
        status: 'cancelled',
        currency: 'MAD',
        subtotalOriginal: '99999.00',
        subtotalMad: '99999.00',
        totalMad: '99999.00',
      },
    ])
  })

  afterAll(async () => {
    const { eq } = await import('drizzle-orm')
    await db.delete(invoicesTable).where(eq(invoicesTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(clientsTable).where(eq(clientsTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, OTHER_ENTREPRENEUR_ID))
    await db.delete(usersTable).where(eq(usersTable.id, TEST_USER_ID))
    await db.delete(usersTable).where(eq(usersTable.id, OTHER_USER_ID))
  })

  it('getClients returns clients ordered by name, not insertion order', async () => {
    const { getClients } = await import('@/lib/queries/client')
    const rows = await getClients(TEST_ENTREPRENEUR_ID)
    const names = rows.map((r) => r.name)
    expect(names).toEqual(['Alpha Warning Client', 'Beta Over Client', 'Zeta Safe Client'])
  })

  it('getClientById returns the client when it belongs to the requesting entrepreneur', async () => {
    const { getClientById } = await import('@/lib/queries/client')
    const row = await getClientById(CLIENT_SAFE_ID, TEST_ENTREPRENEUR_ID)
    expect(row?.id).toBe(CLIENT_SAFE_ID)
  })

  it('getClientById returns null for a client owned by a different entrepreneur (IDOR guard)', async () => {
    const { getClientById } = await import('@/lib/queries/client')
    const row = await getClientById(CLIENT_SAFE_ID, OTHER_ENTREPRENEUR_ID)
    expect(row).toBeNull()
  })

  it('getClientAnnualTotal reports "safe" status well under the 80K cap', async () => {
    const { getClientAnnualTotal } = await import('@/lib/queries/client')
    const result = await getClientAnnualTotal(CLIENT_SAFE_ID, TEST_ENTREPRENEUR_ID, TEST_YEAR)
    expect(result.totalInvoicedMad).toBe(30000)
    expect(result.totalPaidMad).toBe(30000)
    expect(result.status).toBe('safe')
    expect(result.remainingToCapMad).toBe(50000)
  })

  it('getClientAnnualTotal reports "warning" status between 70-99% of the cap', async () => {
    const { getClientAnnualTotal } = await import('@/lib/queries/client')
    const result = await getClientAnnualTotal(CLIENT_WARNING_ID, TEST_ENTREPRENEUR_ID, TEST_YEAR)
    expect(result.totalInvoicedMad).toBe(75000)
    expect(result.status).toBe('warning')
  })

  it('getClientAnnualTotal reports "over" status at/above the cap, excludes cancelled invoices, and distinguishes invoiced from paid', async () => {
    const { getClientAnnualTotal } = await import('@/lib/queries/client')
    const result = await getClientAnnualTotal(CLIENT_OVER_ID, TEST_ENTREPRENEUR_ID, TEST_YEAR)
    // 40,000 (paid) + 50,000 (sent) = 90,000 — the 99,999 cancelled invoice must be excluded
    expect(result.totalInvoicedMad).toBe(90000)
    expect(result.totalPaidMad).toBe(40000)
    expect(result.status).toBe('over')
    expect(result.remainingToCapMad).toBe(0)
  })

  it('getClientAnnualTotal returns zero for a client requested under a different entrepreneur (IDOR guard, Sprint 11)', async () => {
    const { getClientAnnualTotal } = await import('@/lib/queries/client')
    const result = await getClientAnnualTotal(CLIENT_OVER_ID, OTHER_ENTREPRENEUR_ID, TEST_YEAR)
    expect(result.totalInvoicedMad).toBe(0)
    expect(result.status).toBe('safe')
  })

  it('getAllClientAnnualTotals batch result matches the per-client results', async () => {
    const { getAllClientAnnualTotals, getClientAnnualTotal } = await import('@/lib/queries/client')
    const all = await getAllClientAnnualTotals(TEST_ENTREPRENEUR_ID, TEST_YEAR)
    const single = await getClientAnnualTotal(CLIENT_OVER_ID, TEST_ENTREPRENEUR_ID, TEST_YEAR)
    expect(all[CLIENT_OVER_ID].totalInvoicedMad).toBe(single.totalInvoicedMad)
    expect(all[CLIENT_OVER_ID].status).toBe('over')
    expect(all[CLIENT_SAFE_ID].status).toBe('safe')
    expect(all[CLIENT_WARNING_ID].status).toBe('warning')
  })
})
