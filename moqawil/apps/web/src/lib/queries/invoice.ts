import { db, invoices, invoiceLines, clients } from '@moqawil/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { getThresholdStatus } from '@moqawil/tax-engine'
import type { ActivityType } from '@moqawil/tax-engine'

export async function getInvoices(entrepreneurId: string) {
  return db
    .select({
      invoice: invoices,
      clientName: clients.name,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.entrepreneurId, entrepreneurId))
    .orderBy(desc(invoices.issueDate), desc(invoices.sequenceNumber))
}

export async function getInvoiceWithLines(invoiceId: string, entrepreneurId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.entrepreneurId, entrepreneurId)))
    .limit(1)

  if (!invoice) return null

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId))
    .orderBy(invoiceLines.position)

  return { invoice, lines }
}

/** YTD turnover from paid invoices — for the annual threshold widget. */
export async function getYtdTurnover(entrepreneurId: string, year: number) {
  const [row] = await db
    .select({
      totalPaidMad: sql<string>`
        COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalMad}::numeric ELSE 0 END), 0)
      `,
    })
    .from(invoices)
    .where(and(eq(invoices.entrepreneurId, entrepreneurId), eq(invoices.fiscalYear, year)))

  return parseFloat(row?.totalPaidMad ?? '0')
}

export async function getThresholdWidget(
  entrepreneurId: string,
  year: number,
  activityType: ActivityType
) {
  const ytd = await getYtdTurnover(entrepreneurId, year)
  return {
    ytd,
    ...getThresholdStatus(ytd, activityType),
  }
}

/** Next sequence number for the given fiscal year — used inside the advisory-lock transaction. */
export async function getNextSequenceNumber(
  entrepreneurId: string,
  fiscalYear: number
): Promise<number> {
  const [row] = await db
    .select({
      maxSeq: sql<number>`COALESCE(MAX(${invoices.sequenceNumber}), 0)`,
    })
    .from(invoices)
    .where(and(eq(invoices.entrepreneurId, entrepreneurId), eq(invoices.fiscalYear, fiscalYear)))

  return (row?.maxSeq ?? 0) + 1
}
