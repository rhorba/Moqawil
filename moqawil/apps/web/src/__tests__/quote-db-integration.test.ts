/**
 * Sprint 6 (S6-05): DB-integration tests for devis (quote) management.
 * Requires DATABASE_URL env var and are skipped otherwise (see
 * invoice-numbering.test.ts for the same pattern).
 *
 * `createQuote`/`updateQuote`/`convertQuoteToInvoice` (quotes/actions.ts)
 * call Next.js `redirect()`, which — same as `createInvoice`/`updateInvoice`
 * in invoices/actions.ts — isn't safely callable outside a real request
 * context. Following this codebase's existing pattern (see
 * invoice-numbering.test.ts), the DB-level mechanics those actions rely on
 * are tested directly instead: the shared `createInvoiceInTransaction`
 * helper (real function, not a reimplementation) for the convert-to-invoice
 * path, and an inline replica of `createQuote`'s own advisory-lock insert
 * for the quote-numbering path. Full action-with-redirect flows are covered
 * by the Playwright smoke test (S6-10).
 */

import { formatInvoiceNumber } from '@moqawil/tax-engine'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SKIP_INTEGRATION = !process.env.DATABASE_URL

describe.skipIf(SKIP_INTEGRATION)('Quotes — DB integration', () => {
  // Dynamic import to avoid failing when DB is unavailable — see invoice-numbering.test.ts.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let db: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let quotesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let quoteLinesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let invoicesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let entrepreneursTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let clientsTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let usersTable: any

  const TEST_USER_ID = 'test-quote-user-001'
  const OTHER_USER_ID = 'test-quote-user-002'
  const TEST_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000601'
  const OTHER_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000602'
  const TEST_CLIENT_ID = '00000000-0000-0000-0000-000000000611'
  const QUOTE_A_ID = '00000000-0000-0000-0000-000000000621'
  const QUOTE_B_ID = '00000000-0000-0000-0000-000000000622'
  const TEST_YEAR = 2094

  beforeAll(async () => {
    const mod = await import('@moqawil/db')
    db = mod.db
    quotesTable = mod.quotes
    quoteLinesTable = mod.quoteLines
    invoicesTable = mod.invoices
    entrepreneursTable = mod.entrepreneurs
    clientsTable = mod.clients
    usersTable = mod.users

    await db
      .insert(usersTable)
      .values([
        { id: TEST_USER_ID, email: 'quote-test@moqawil.test', name: 'Quote Test User' },
        { id: OTHER_USER_ID, email: 'quote-test-2@moqawil.test', name: 'Other Quote User' },
      ])
      .onConflictDoNothing()

    await db
      .insert(entrepreneursTable)
      .values([
        {
          id: TEST_ENTREPRENEUR_ID,
          userId: TEST_USER_ID,
          fullName: 'Test AE Quote',
          ice: '000000000000009',
          ifNumber: '88888888',
          activityType: 'service',
          address: '1 Rue Test',
          city: 'Agadir',
          registrationDate: '2024-01-01',
          invoicePrefix: 'QTE',
        },
        {
          id: OTHER_ENTREPRENEUR_ID,
          userId: OTHER_USER_ID,
          fullName: 'Other AE Quote',
          ice: '000000000000010',
          ifNumber: '99999999',
          activityType: 'service',
          address: '2 Rue Test',
          city: 'Agadir',
          registrationDate: '2024-01-01',
          invoicePrefix: 'OTQ',
        },
      ])
      .onConflictDoNothing()

    await db
      .insert(clientsTable)
      .values({
        id: TEST_CLIENT_ID,
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        name: 'Quote Client',
        type: 'individual',
      })
      .onConflictDoNothing()

    await db.insert(quotesTable).values([
      {
        id: QUOTE_A_ID,
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        quoteNumber: `DEVIS-${TEST_YEAR}-001`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 1,
        issueDate: `${TEST_YEAR}-01-10`,
        validUntilDate: `${TEST_YEAR}-02-10`,
        status: 'sent',
        currency: 'MAD',
        subtotalOriginal: '100000.00',
        subtotalMad: '100000.00',
        totalMad: '100000.00',
      },
      {
        id: QUOTE_B_ID,
        entrepreneurId: TEST_ENTREPRENEUR_ID,
        clientId: TEST_CLIENT_ID,
        quoteNumber: `DEVIS-${TEST_YEAR}-002`,
        fiscalYear: TEST_YEAR,
        sequenceNumber: 2,
        issueDate: `${TEST_YEAR}-02-10`,
        validUntilDate: `${TEST_YEAR}-03-10`,
        status: 'draft',
        currency: 'MAD',
        subtotalOriginal: '5000.00',
        subtotalMad: '5000.00',
        totalMad: '5000.00',
      },
    ])

    await db.insert(quoteLinesTable).values([
      {
        quoteId: QUOTE_A_ID,
        position: 1,
        description: 'Refonte site web',
        quantity: '1',
        unitPriceOriginal: '100000.00',
        lineTotalOriginal: '100000.00',
        lineTotalMad: '100000.00',
      },
    ])
  })

  afterAll(async () => {
    const { eq } = await import('drizzle-orm')
    await db.delete(quoteLinesTable).where(eq(quoteLinesTable.quoteId, QUOTE_A_ID))
    await db.delete(quoteLinesTable).where(eq(quoteLinesTable.quoteId, QUOTE_B_ID))
    await db.delete(invoicesTable).where(eq(invoicesTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(quotesTable).where(eq(quotesTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(clientsTable).where(eq(clientsTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, OTHER_ENTREPRENEUR_ID))
    await db.delete(usersTable).where(eq(usersTable.id, TEST_USER_ID))
    await db.delete(usersTable).where(eq(usersTable.id, OTHER_USER_ID))
  })

  it('getQuotes returns quotes with joined client name, most recent first', async () => {
    const { getQuotes } = await import('@/lib/queries/quote')
    const rows = await getQuotes(TEST_ENTREPRENEUR_ID)
    expect(rows).toHaveLength(2)
    expect(rows[0].quote.id).toBe(QUOTE_B_ID) // most recent issueDate first
    expect(rows[0].clientName).toBe('Quote Client')
  })

  it('getQuoteWithLines returns the quote and its lines when owned by the requester', async () => {
    const { getQuoteWithLines } = await import('@/lib/queries/quote')
    const result = await getQuoteWithLines(QUOTE_A_ID, TEST_ENTREPRENEUR_ID)
    expect(result?.quote.id).toBe(QUOTE_A_ID)
    expect(result?.lines).toHaveLength(1)
    expect(result?.lines[0].description).toBe('Refonte site web')
  })

  it('getQuoteWithLines returns null for a quote owned by a different entrepreneur (IDOR guard)', async () => {
    const { getQuoteWithLines } = await import('@/lib/queries/quote')
    const result = await getQuoteWithLines(QUOTE_A_ID, OTHER_ENTREPRENEUR_ID)
    expect(result).toBeNull()
  })

  it("a 100,000 MAD quote never counts toward the client's 80K cap total", async () => {
    // Quote A is worth 100,000 MAD — well over the cap — but it must never
    // appear in the cap tracker, which only reads the invoices table.
    const { getClientAnnualTotal } = await import('@/lib/queries/client')
    const result = await getClientAnnualTotal(TEST_CLIENT_ID, TEST_YEAR)
    expect(result.totalInvoicedMad).toBe(0)
    expect(result.status).toBe('safe')
  })

  it("quotes never count toward the entrepreneur's annual turnover threshold", async () => {
    const { getYtdTurnover } = await import('@/lib/queries/invoice')
    const ytd = await getYtdTurnover(TEST_ENTREPRENEUR_ID, TEST_YEAR)
    expect(ytd).toBe(0)
  })

  it('quote numbering assigns sequential numbers with no gaps under genuine concurrency (own lock namespace)', async () => {
    const { sql, eq, and } = await import('drizzle-orm')
    const year = 2093
    const CONCURRENCY = 5

    const runOne = () =>
      db.transaction(async (tx: typeof db) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${TEST_ENTREPRENEUR_ID} || '-quote'))`
        )
        const [row] = await tx
          .select({ maxSeq: sql`COALESCE(MAX(${quotesTable.sequenceNumber}), 0)` })
          .from(quotesTable)
          .where(
            and(
              eq(quotesTable.entrepreneurId, TEST_ENTREPRENEUR_ID),
              eq(quotesTable.fiscalYear, year)
            )
          )
        const seqNum = (row?.maxSeq ?? 0) + 1

        await tx.insert(quotesTable).values({
          entrepreneurId: TEST_ENTREPRENEUR_ID,
          clientId: TEST_CLIENT_ID,
          quoteNumber: formatInvoiceNumber('DEVIS', year, seqNum),
          fiscalYear: year,
          sequenceNumber: seqNum,
          issueDate: '2093-01-01',
          validUntilDate: '2093-02-01',
          status: 'draft',
          currency: 'MAD',
          subtotalOriginal: '1000.00',
          subtotalMad: '1000.00',
          totalMad: '1000.00',
        })
        return seqNum
      })

    const sequences = await Promise.all(Array.from({ length: CONCURRENCY }, runOne))
    expect([...sequences].sort((a, b) => a - b)).toEqual(
      Array.from({ length: CONCURRENCY }, (_, i) => i + 1)
    )
    expect(new Set(sequences).size).toBe(CONCURRENCY)
  })

  it('convert-to-invoice path (createInvoiceInTransaction) produces correctly-numbered, correctly-totaled invoices from quote data', async () => {
    // Exercises the REAL shared helper both createInvoice (invoice form) and
    // convertQuoteToInvoice call — not a reimplementation. Simulates what
    // convertQuoteToInvoice does: reads a quote's lines, calls the shared
    // transaction with them.
    const { createInvoiceInTransaction } = await import('@/lib/invoice-creation')

    const invoice1 = await createInvoiceInTransaction({
      entrepreneurId: TEST_ENTREPRENEUR_ID,
      invoicePrefix: 'QTE',
      clientId: TEST_CLIENT_ID,
      issueDate: '2092-01-01',
      currency: 'MAD',
      subtotalOriginal: 100000,
      subtotalMad: 100000,
      totalMad: 100000,
      notes: null,
      lines: [
        {
          description: 'Refonte site web',
          quantity: 1,
          unitPriceOriginal: 100000,
          lineTotalOriginal: 100000,
          lineTotalMad: 100000,
        },
      ],
    })

    expect(invoice1.invoiceNumber).toBe('QTE-2092-001')
    expect(invoice1.sequenceNumber).toBe(1)
    expect(invoice1.totalMad).toBe('100000.00')

    // A second conversion in the same fiscal year continues the SAME sequence
    // invoices created directly through the invoice form would use — proving
    // there's exactly one numbering authority, not two that could collide.
    const invoice2 = await createInvoiceInTransaction({
      entrepreneurId: TEST_ENTREPRENEUR_ID,
      invoicePrefix: 'QTE',
      clientId: TEST_CLIENT_ID,
      issueDate: '2092-03-01',
      currency: 'MAD',
      subtotalOriginal: 5000,
      subtotalMad: 5000,
      totalMad: 5000,
      notes: null,
      lines: [
        {
          description: 'Maintenance',
          quantity: 1,
          unitPriceOriginal: 5000,
          lineTotalOriginal: 5000,
          lineTotalMad: 5000,
        },
      ],
    })

    expect(invoice2.invoiceNumber).toBe('QTE-2092-002')
    expect(invoice2.sequenceNumber).toBe(2)
  })

  it('createInvoiceInTransaction persists all optional fields when provided (dueDate, paymentMethod, foreign currency, notes)', async () => {
    const { createInvoiceInTransaction } = await import('@/lib/invoice-creation')

    const invoice = await createInvoiceInTransaction({
      entrepreneurId: TEST_ENTREPRENEUR_ID,
      invoicePrefix: 'QTE',
      clientId: TEST_CLIENT_ID,
      issueDate: '2091-01-01',
      dueDate: '2091-02-01',
      paymentMethod: 'virement',
      currency: 'EUR',
      exchangeRate: 10.75,
      subtotalOriginal: 1000,
      subtotalMad: 10750,
      totalMad: 10750,
      notes: 'Converted from devis DEVIS-2091-001',
      lines: [
        {
          description: 'Consulting',
          quantity: 1,
          unitPriceOriginal: 1000,
          lineTotalOriginal: 1000,
          lineTotalMad: 10750,
        },
      ],
    })

    expect(invoice.dueDate).toBe('2091-02-01')
    expect(invoice.paymentMethod).toBe('virement')
    expect(invoice.currency).toBe('EUR')
    expect(invoice.exchangeRate).toBe('10.7500')
    expect(invoice.notes).toBe('Converted from devis DEVIS-2091-001')
  })
})
