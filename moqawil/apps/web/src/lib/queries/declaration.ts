import { db, invoices, quarterlyDeclarations } from '@moqawil/db'
import { eq, and, between, sql } from 'drizzle-orm'
import { getTaxRate } from '@moqawil/tax-engine'
import type { ActivityType } from '@moqawil/tax-engine'

/** ISO date range for a given quarter (1-based). */
export function quarterDateRange(year: number, quarter: number): { start: string; end: string } {
  const starts = ['', `${year}-01-01`, `${year}-04-01`, `${year}-07-01`, `${year}-10-01`]
  const ends = ['', `${year}-03-31`, `${year}-06-30`, `${year}-09-30`, `${year}-12-31`]
  return { start: starts[quarter], end: ends[quarter] }
}

/** Declaration filing deadline — end of month following quarter end. */
export function declarationDeadline(year: number, quarter: number): string {
  const deadlines: Record<number, string> = {
    1: `${year}-04-30`,
    2: `${year}-07-31`,
    3: `${year}-10-31`,
    4: `${year + 1}-01-31`,
  }
  return deadlines[quarter]
}

/** Days until deadline (negative = overdue). */
export function daysUntilDeadline(deadline: string): number {
  const now = new Date()
  const due = new Date(deadline)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** Paid turnover for a specific quarter from the invoices table. */
export async function getQuarterlyTurnover(
  entrepreneurId: string,
  year: number,
  quarter: number
): Promise<number> {
  const { start, end } = quarterDateRange(year, quarter)

  const [row] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${invoices.totalMad}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.entrepreneurId, entrepreneurId),
        eq(invoices.status, 'paid'),
        between(invoices.paymentDate, start, end)
      )
    )

  return parseFloat(row?.total ?? '0')
}

/** All 4 declarations for a year (creates missing rows with 0 turnover for display). */
export async function getDeclarationsForYear(
  entrepreneurId: string,
  year: number
): Promise<
  Array<{
    id: string | null
    year: number
    quarter: number
    totalTurnoverMad: number
    taxRate: number
    taxDueMad: number
    status: 'pending' | 'submitted'
    submittedAt: Date | null
    deadline: string
    daysLeft: number
  }>
> {
  const rows = await db
    .select()
    .from(quarterlyDeclarations)
    .where(
      and(
        eq(quarterlyDeclarations.entrepreneurId, entrepreneurId),
        eq(quarterlyDeclarations.year, year)
      )
    )

  const byQuarter = Object.fromEntries(rows.map((r) => [r.quarter, r]))

  return [1, 2, 3, 4].map((q) => {
    const row = byQuarter[q]
    const deadline = declarationDeadline(year, q)
    return {
      id: row?.id ?? null,
      year,
      quarter: q,
      totalTurnoverMad: row ? parseFloat(row.totalTurnoverMad) : 0,
      taxRate: row ? parseFloat(row.taxRate) : 0,
      taxDueMad: row ? parseFloat(row.taxDueMad) : 0,
      status: (row?.status ?? 'pending') as 'pending' | 'submitted',
      submittedAt: row?.submittedAt ?? null,
      deadline,
      daysLeft: daysUntilDeadline(deadline),
    }
  })
}

/** Compute a declaration from paid invoices and upsert it. */
export async function computeAndUpsertDeclaration(
  entrepreneurId: string,
  year: number,
  quarter: number,
  activityType: ActivityType
) {
  const turnover = await getQuarterlyTurnover(entrepreneurId, year, quarter)
  const taxRate = getTaxRate(activityType)
  const taxDue = turnover * taxRate

  const existing = await db
    .select({ id: quarterlyDeclarations.id })
    .from(quarterlyDeclarations)
    .where(
      and(
        eq(quarterlyDeclarations.entrepreneurId, entrepreneurId),
        eq(quarterlyDeclarations.year, year),
        eq(quarterlyDeclarations.quarter, quarter)
      )
    )
    .limit(1)

  if (existing[0]) {
    await db
      .update(quarterlyDeclarations)
      .set({
        totalTurnoverMad: String(turnover),
        taxRate: String(taxRate),
        taxDueMad: String(taxDue),
        updatedAt: new Date(),
      })
      .where(eq(quarterlyDeclarations.id, existing[0].id))
    return { id: existing[0].id, turnover, taxRate, taxDue }
  }

  const [row] = await db
    .insert(quarterlyDeclarations)
    .values({
      entrepreneurId,
      year,
      quarter,
      totalTurnoverMad: String(turnover),
      taxRate: String(taxRate),
      taxDueMad: String(taxDue),
      status: 'pending',
    })
    .returning()

  return { id: row.id, turnover, taxRate, taxDue }
}
