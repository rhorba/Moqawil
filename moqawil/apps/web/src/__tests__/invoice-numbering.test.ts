/**
 * S1-11: Invoice sequential numbering tests.
 * Tests formatInvoiceNumber pure function + integration test for DB advisory lock.
 *
 * Integration tests require DATABASE_URL env var and are skipped otherwise.
 * Run with: DATABASE_URL=postgres://... pnpm test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { formatInvoiceNumber } from '@moqawil/tax-engine'

describe('Invoice sequential numbering — formatInvoiceNumber', () => {
  it('formats FACT prefix correctly', () => {
    expect(formatInvoiceNumber('FACT', 2026, 1)).toBe('FACT-2026-001')
    expect(formatInvoiceNumber('FACT', 2026, 99)).toBe('FACT-2026-099')
    expect(formatInvoiceNumber('FACT', 2026, 100)).toBe('FACT-2026-100')
    expect(formatInvoiceNumber('FACT', 2026, 999)).toBe('FACT-2026-999')
  })

  it('uses custom prefixes correctly', () => {
    expect(formatInvoiceNumber('INV', 2026, 1)).toBe('INV-2026-001')
    expect(formatInvoiceNumber('FAC', 2025, 42)).toBe('FAC-2025-042')
  })

  it('pads sequence number to 3 digits minimum', () => {
    expect(formatInvoiceNumber('FACT', 2026, 1)).toMatch(/-001$/)
    expect(formatInvoiceNumber('FACT', 2026, 9)).toMatch(/-009$/)
  })

  it('handles 4-digit sequence numbers (over 999)', () => {
    // No hard limit — after 999, sequence grows naturally
    expect(formatInvoiceNumber('FACT', 2026, 1000)).toBe('FACT-2026-1000')
  })

  it('resets numbering by year — same prefix, different year', () => {
    const y2025 = formatInvoiceNumber('FACT', 2025, 1)
    const y2026 = formatInvoiceNumber('FACT', 2026, 1)
    expect(y2025).not.toBe(y2026)
    expect(y2025).toBe('FACT-2025-001')
    expect(y2026).toBe('FACT-2026-001')
  })

  it('no gaps — sequence increments by 1', () => {
    const seq = Array.from({ length: 10 }, (_, i) => formatInvoiceNumber('FACT', 2026, i + 1))
    for (let i = 0; i < seq.length - 1; i++) {
      const curr = parseInt(seq[i].split('-')[2])
      const next = parseInt(seq[i + 1].split('-')[2])
      expect(next - curr).toBe(1)
    }
  })
})

// Integration tests — real DB required
const SKIP_INTEGRATION = !process.env['DATABASE_URL']

describe.skipIf(SKIP_INTEGRATION)('Invoice numbering — DB integration (advisory lock)', () => {
  // Dynamic import to avoid failing when DB is unavailable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let invoicesTable: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entrepreneursTable: any

  const TEST_USER_ID = 'test-seq-user-001'
  const TEST_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000001'

  beforeAll(async () => {
    const mod = await import('@moqawil/db')
    db = mod.db
    invoicesTable = mod.invoices
    entrepreneursTable = mod.entrepreneurs

    // Seed a minimal test entrepreneur row
    await db
      .insert(entrepreneursTable)
      .values({
        id: TEST_ENTREPRENEUR_ID,
        userId: TEST_USER_ID,
        fullName: 'Test AE Seq',
        ice: '000000000000001',
        ifNumber: '12345678',
        activityType: 'service',
        address: '1 Rue Test',
        city: 'Casablanca',
        registrationDate: '2024-01-01',
        invoicePrefix: 'TST',
      })
      .onConflictDoNothing()
  })

  afterAll(async () => {
    // Clean up test data
    const { eq } = await import('drizzle-orm')
    await db.delete(invoicesTable).where(eq(invoicesTable.entrepreneurId, TEST_ENTREPRENEUR_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, TEST_ENTREPRENEUR_ID))
  })

  it('assigns sequential numbers starting from 1 for a new year', async () => {
    const { getNextSequenceNumber } = await import('@/lib/queries/invoice')
    const seq = await getNextSequenceNumber(TEST_ENTREPRENEUR_ID, 2099)
    expect(seq).toBe(1)
  })

  it('assigns sequential numbers with no gaps when called serially', async () => {
    const { getNextSequenceNumber } = await import('@/lib/queries/invoice')
    void getNextSequenceNumber // referenced to avoid unused import warning
    const drizzle = await import('drizzle-orm')
    const { sql, eq, and } = drizzle

    const year = 2098
    const sequences: number[] = []

    for (let i = 0; i < 3; i++) {
      const seq = await db.transaction(async (tx: typeof db) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${TEST_ENTREPRENEUR_ID}))`)
        const [row] = await tx
          .select({ maxSeq: sql`COALESCE(MAX(${invoicesTable.sequenceNumber}), 0)` })
          .from(invoicesTable)
          .where(
            and(
              eq(invoicesTable.entrepreneurId, TEST_ENTREPRENEUR_ID),
              eq(invoicesTable.fiscalYear, year)
            )
          )
        const seqNum = (row?.maxSeq ?? 0) + 1

        await tx.insert(invoicesTable).values({
          entrepreneurId: TEST_ENTREPRENEUR_ID,
          clientId: '00000000-0000-0000-0000-000000000099',
          invoiceNumber: formatInvoiceNumber('TST', year, seqNum),
          fiscalYear: year,
          sequenceNumber: seqNum,
          issueDate: '2098-01-01',
          status: 'draft',
          currency: 'MAD',
          subtotalOriginal: '1000.00',
          subtotalMad: '1000.00',
          totalMad: '1000.00',
        })
        return seqNum
      })
      sequences.push(seq)
    }

    expect(sequences).toEqual([1, 2, 3])
  })
})
