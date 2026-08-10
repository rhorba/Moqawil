import { db, invoiceLines, invoices } from '@moqawil/db'
import { formatInvoiceNumber } from '@moqawil/tax-engine'
import { and, eq, sql } from 'drizzle-orm'

export interface InvoiceLineInput {
  description: string
  quantity: number
  unitPriceOriginal: number
  lineTotalOriginal: number
  lineTotalMad: number
}

export interface CreateInvoiceInTransactionInput {
  entrepreneurId: string
  invoicePrefix: string
  clientId: string
  issueDate: string
  dueDate?: string | null
  paymentMethod?: 'virement' | 'cheque' | 'espece' | 'effet' | 'carte' | 'other' | null
  currency: string
  exchangeRate?: number
  subtotalOriginal: number
  subtotalMad: number
  totalMad: number
  notes?: string | null
  lines: InvoiceLineInput[]
}

/**
 * The advisory-lock + sequential-numbering transaction (CGI Article 145: no
 * gaps, ever) — the single implementation shared by direct invoice creation
 * (`invoices/actions.ts`'s `createInvoice`) and quote-to-invoice conversion
 * (`quotes/actions.ts`'s `convertQuoteToInvoice`, Sprint 6). Do not duplicate
 * this logic elsewhere — every new "create a real invoice" path must call
 * this function so the numbering guarantee only has one implementation to
 * get right (and to test — see invoice-numbering.test.ts's concurrency test).
 */
export async function createInvoiceInTransaction(input: CreateInvoiceInTransactionInput) {
  const fiscalYear = new Date(input.issueDate).getFullYear()

  return db.transaction(async (tx) => {
    // PostgreSQL advisory lock — keyed on hash of entrepreneurId to prevent concurrent inserts
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.entrepreneurId}))`)

    const [seqRow] = await tx
      .select({
        maxSeq: sql<number>`COALESCE(MAX(${invoices.sequenceNumber}), 0)`,
      })
      .from(invoices)
      .where(
        and(eq(invoices.entrepreneurId, input.entrepreneurId), eq(invoices.fiscalYear, fiscalYear))
      )

    const seqNumber = (seqRow?.maxSeq ?? 0) + 1
    const invoiceNumber = formatInvoiceNumber(input.invoicePrefix, fiscalYear, seqNumber)

    const [newInvoice] = await tx
      .insert(invoices)
      .values({
        entrepreneurId: input.entrepreneurId,
        clientId: input.clientId,
        invoiceNumber,
        fiscalYear,
        sequenceNumber: seqNumber,
        issueDate: input.issueDate,
        dueDate: input.dueDate || null,
        status: 'draft',
        paymentMethod: input.paymentMethod ?? null,
        currency: input.currency,
        exchangeRate: input.currency !== 'MAD' ? String(input.exchangeRate ?? 1) : null,
        subtotalOriginal: String(input.subtotalOriginal),
        subtotalMad: String(input.subtotalMad),
        totalMad: String(input.totalMad),
        notes: input.notes || null,
      })
      .returning()

    await tx.insert(invoiceLines).values(
      input.lines.map((l, i) => ({
        invoiceId: newInvoice.id,
        position: i + 1,
        description: l.description,
        quantity: String(l.quantity),
        unitPriceOriginal: String(l.unitPriceOriginal),
        lineTotalOriginal: String(l.lineTotalOriginal),
        lineTotalMad: String(l.lineTotalMad),
      }))
    )

    return newInvoice
  })
}
