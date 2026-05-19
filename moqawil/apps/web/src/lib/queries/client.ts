import { db, clients, invoices } from '@moqawil/db'
import { eq, and, sql } from 'drizzle-orm'
import { getCapStatus, PER_CLIENT_CAP_MAD } from '@moqawil/tax-engine'

export async function getClients(entrepreneurId: string) {
  return db
    .select()
    .from(clients)
    .where(eq(clients.entrepreneurId, entrepreneurId))
    .orderBy(clients.name)
}

export async function getClientById(clientId: string, entrepreneurId: string) {
  const [row] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.entrepreneurId, entrepreneurId)))
    .limit(1)
  return row ?? null
}

/**
 * S1-04: Cap tracker query — per-client annual invoice totals.
 * Returns totalInvoicedMad (all non-cancelled), totalPaidMad, cap status.
 * Only relevant for service-type AEs (CGI Article 73-II-G-8°).
 */
export async function getClientAnnualTotal(clientId: string, year: number) {
  const [row] = await db
    .select({
      totalInvoicedMad: sql<string>`
        COALESCE(SUM(CASE WHEN ${invoices.status} != 'cancelled' THEN ${invoices.totalMad}::numeric ELSE 0 END), 0)
      `,
      totalPaidMad: sql<string>`
        COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalMad}::numeric ELSE 0 END), 0)
      `,
    })
    .from(invoices)
    .where(and(eq(invoices.clientId, clientId), eq(invoices.fiscalYear, year)))

  const totalInvoicedMad = parseFloat(row?.totalInvoicedMad ?? '0')
  const totalPaidMad = parseFloat(row?.totalPaidMad ?? '0')
  const capStatus = getCapStatus(totalInvoicedMad)

  return {
    totalInvoicedMad,
    totalPaidMad,
    remainingToCapMad: Math.max(0, PER_CLIENT_CAP_MAD - totalInvoicedMad),
    percentOfCap: capStatus.percentOfCap,
    status: capStatus.status,
  }
}

/** Batch: cap totals for all clients of an entrepreneur in a given year. */
export async function getAllClientAnnualTotals(entrepreneurId: string, year: number) {
  const rows = await db
    .select({
      clientId: invoices.clientId,
      totalInvoicedMad: sql<string>`
        COALESCE(SUM(CASE WHEN ${invoices.status} != 'cancelled' THEN ${invoices.totalMad}::numeric ELSE 0 END), 0)
      `,
      totalPaidMad: sql<string>`
        COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalMad}::numeric ELSE 0 END), 0)
      `,
    })
    .from(invoices)
    .where(and(eq(invoices.entrepreneurId, entrepreneurId), eq(invoices.fiscalYear, year)))
    .groupBy(invoices.clientId)

  return Object.fromEntries(
    rows.map((r) => {
      const total = parseFloat(r.totalInvoicedMad)
      const cap = getCapStatus(total)
      return [
        r.clientId,
        {
          totalInvoicedMad: total,
          totalPaidMad: parseFloat(r.totalPaidMad),
          remainingToCapMad: Math.max(0, PER_CLIENT_CAP_MAD - total),
          percentOfCap: cap.percentOfCap,
          status: cap.status,
        },
      ]
    })
  )
}
