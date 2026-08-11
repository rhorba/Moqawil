/**
 * Sprint 5 (S5-06): DB-integration tests for the read-path functions in
 * src/lib/queries/invoice.ts that aren't already covered by
 * invoice-numbering.test.ts (getNextSequenceNumber + the advisory-lock
 * numbering flow). Requires DATABASE_URL env var and are skipped otherwise.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SKIP_INTEGRATION = !process.env.DATABASE_URL

describe.skipIf(SKIP_INTEGRATION)('Invoice queries — DB integration', () => {
  // Dynamic import to avoid failing when DB is unavailable — see invoice-numbering.test.ts.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let db: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let invoicesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let invoiceLinesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let entrepreneursTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let clientsTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let usersTable: any

  const TEST_USER_ID = 'test-invq-user-001'
  const OTHER_USER_ID = 'test-invq-user-002'
  const TEST_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000501'
  const OTHER_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000502'
  const TEST_CLIENT_ID = '00000000-0000-0000-0000-000000000511'
  const TEST_INVOICE_ID_A = '00000000-0000-0000-0000-000000000521'
  const TEST_INVOICE_ID_B = '00000000-0000-0000-0000-000000000522'
  const TEST_YEAR = 2095

  beforeAll(async () => {
    const mod = await import('@moqawil/db')
    db = mod.db
    invoicesTable = mod.invoices
    invoiceLinesTable = mod.invoiceLines
    entrepreneursTable = mod.entrepreneurs
    clientsTable = mod.clients
    usersTable = mod.users

    await db
      .insert(usersTable)
      .values([
        { id: TEST_USER_ID, email: 'invq-test@moqawil.test', name: 'InvQ Test User' },
        { id: OTHER_USER_ID, email: 'invq-test-2@moqawil.test', name: 'Other InvQ User' },
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
          fullName: 'Test AE InvQ',
          ice: '000000000000051', // Sprint 11 fixture-collision fix: block 051/052 reserved for this file — see docs/test-strategy-moqawil.md
          ifNumber: '66666666',
          activityType: 'service',
          address: '1 Rue Test',
          city: 'Tanger',
          registrationDate: '2024-01-01',
          invoicePrefix: 'IVQ',
        },
        {
          id: OTHER_ENTREPRENEUR_ID,
          userId: OTHER_USER_ID,
          fullName: 'Other AE InvQ',
          ice: '000000000000052',
          ifNumber: '77777777',
          activityType: 'service',
          address: '2 Rue Test',
          city: 'Tanger',
          registrationDate: '2024-01-01',
          invoicePrefix: 'OIQ',
        },
      ])
      .onConflictDoNothing({ target: entrepreneursTable.id })

    await db
      .insert(clientsTable)
      .values({
        id: TEST_CLIENT_ID,
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        name: 'InvQ Client',
        type: 'individual',
      })
      .onConflictDoNothing()

    await db.insert(invoicesTable).values([
      {
        id: TEST_INVOICE_ID_A,
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        invoiceNumber: `IVQ-${TEST_YEAR}-001`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 1,
        issueDate: `${TEST_YEAR}-01-10`,
        status: 'paid',
        paymentDate: `${TEST_YEAR}-01-15`,
        currency: 'MAD',
        subtotalOriginal: '12000.00',
        subtotalMad: '12000.00',
        totalMad: '12000.00',
      },
      {
        id: TEST_INVOICE_ID_B,
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        invoiceNumber: `IVQ-${TEST_YEAR}-002`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 2,
        issueDate: `${TEST_YEAR}-02-10`,
        status: 'sent',
        currency: 'MAD',
        subtotalOriginal: '8000.00',
        subtotalMad: '8000.00',
        totalMad: '8000.00',
      },
    ])

    await db.insert(invoiceLinesTable).values([
      {
        invoiceId: TEST_INVOICE_ID_A,
        position: 1,
        description: 'Développement site web',
        quantity: '1',
        unitPriceOriginal: '12000.00',
        lineTotalOriginal: '12000.00',
        lineTotalMad: '12000.00',
      },
    ])
  })

  afterAll(async () => {
    const { eq } = await import('drizzle-orm')
    await db.delete(invoiceLinesTable).where(eq(invoiceLinesTable.invoiceId, TEST_INVOICE_ID_A))
    await db.delete(invoicesTable).where(eq(invoicesTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(clientsTable).where(eq(clientsTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, OTHER_ENTREPRENEUR_ID))
    await db.delete(usersTable).where(eq(usersTable.id, TEST_USER_ID))
    await db.delete(usersTable).where(eq(usersTable.id, OTHER_USER_ID))
  })

  it('getInvoices returns invoices with joined client name, most recent first', async () => {
    const { getInvoices } = await import('@/lib/queries/invoice')
    const rows = await getInvoices(TEST_ENTREPRENEUR_ID)
    expect(rows).toHaveLength(2)
    expect(rows[0].invoice.id).toBe(TEST_INVOICE_ID_B) // most recent issueDate first
    expect(rows[0].clientName).toBe('InvQ Client')
  })

  it('getInvoiceWithLines returns the invoice and its lines when owned by the requester', async () => {
    const { getInvoiceWithLines } = await import('@/lib/queries/invoice')
    const result = await getInvoiceWithLines(TEST_INVOICE_ID_A, TEST_ENTREPRENEUR_ID)
    expect(result?.invoice.id).toBe(TEST_INVOICE_ID_A)
    expect(result?.lines).toHaveLength(1)
    expect(result?.lines[0].description).toBe('Développement site web')
  })

  it('getInvoiceWithLines returns null for an invoice owned by a different entrepreneur (IDOR guard)', async () => {
    const { getInvoiceWithLines } = await import('@/lib/queries/invoice')
    const result = await getInvoiceWithLines(TEST_INVOICE_ID_A, OTHER_ENTREPRENEUR_ID)
    expect(result).toBeNull()
  })

  it('getYtdTurnover sums only paid invoices for the year', async () => {
    const { getYtdTurnover } = await import('@/lib/queries/invoice')
    const ytd = await getYtdTurnover(TEST_ENTREPRENEUR_ID, TEST_YEAR)
    expect(ytd).toBe(12000) // excludes the 8000 'sent' invoice
  })

  it('getThresholdWidget combines YTD turnover with the correct activity-type threshold status', async () => {
    const { getThresholdWidget } = await import('@/lib/queries/invoice')
    const widget = await getThresholdWidget(TEST_ENTREPRENEUR_ID, TEST_YEAR, 'service')
    expect(widget.ytd).toBe(12000)
    expect(widget.status).toBe('safe') // 12,000 / 200,000 service threshold
  })
})
