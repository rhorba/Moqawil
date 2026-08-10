import { accountantLinks, db, entrepreneurs, invoices, quarterlyDeclarations } from '@moqawil/db'
import { getThresholdStatus } from '@moqawil/tax-engine'
import { and, eq, inArray, sql } from 'drizzle-orm'

/**
 * The authorization boundary for the entire accountant dashboard. Every
 * accountant-route Server Component and Server Action must go through this
 * (or assertAccountantAccess below) — never query entrepreneurs/clients/
 * invoices directly with a client-supplied entrepreneurId.
 * See docs/architecture-accountant-dashboard.md §2.
 */
export async function getAccessibleEntrepreneurs(accountantUserId: string) {
  const rows = await db
    .select({
      entrepreneur: {
        id: entrepreneurs.id,
        fullName: entrepreneurs.fullName,
        activityType: entrepreneurs.activityType,
      },
    })
    .from(accountantLinks)
    .innerJoin(entrepreneurs, eq(accountantLinks.entrepreneurId, entrepreneurs.id))
    .where(
      and(
        eq(accountantLinks.accountantUserId, accountantUserId),
        eq(accountantLinks.status, 'active')
      )
    )
  return rows.map((r) => r.entrepreneur)
}

/** Single-entrepreneur variant for detail pages — still joins through the grant. */
export async function assertAccountantAccess(accountantUserId: string, entrepreneurId: string) {
  const [row] = await db
    .select({ id: entrepreneurs.id })
    .from(accountantLinks)
    .innerJoin(entrepreneurs, eq(accountantLinks.entrepreneurId, entrepreneurs.id))
    .where(
      and(
        eq(accountantLinks.accountantUserId, accountantUserId),
        eq(accountantLinks.status, 'active'),
        eq(entrepreneurs.id, entrepreneurId)
      )
    )
    .limit(1)
  return row !== undefined
}

/**
 * Aggregate dashboard rows: YTD threshold status + current-year declarations
 * per accessible entrepreneur. Always 2 batched queries regardless of N
 * accessible entrepreneurs (NFR — accountant may have ~30 clients).
 * Reuses tax-engine's getThresholdStatus, does not fork cap/threshold logic.
 */
export async function getAccountantDashboardRows(accountantUserId: string, year: number) {
  const accessible = await getAccessibleEntrepreneurs(accountantUserId)
  if (accessible.length === 0) return []

  const entrepreneurIds = accessible.map((e) => e.id)

  const turnoverRows = await db
    .select({
      entrepreneurId: invoices.entrepreneurId,
      ytdMad: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalMad}::numeric ELSE 0 END), 0)`,
    })
    .from(invoices)
    .where(and(inArray(invoices.entrepreneurId, entrepreneurIds), eq(invoices.fiscalYear, year)))
    .groupBy(invoices.entrepreneurId)

  const declarationRows = await db
    .select()
    .from(quarterlyDeclarations)
    .where(
      and(
        inArray(quarterlyDeclarations.entrepreneurId, entrepreneurIds),
        eq(quarterlyDeclarations.year, year)
      )
    )

  const ytdByEntrepreneur = new Map(
    turnoverRows.map((r) => [r.entrepreneurId, Number.parseFloat(r.ytdMad)])
  )

  return accessible.map((entrepreneur) => {
    const ytd = ytdByEntrepreneur.get(entrepreneur.id) ?? 0
    return {
      entrepreneur,
      ytdMad: ytd,
      threshold: getThresholdStatus(ytd, entrepreneur.activityType),
      declarations: declarationRows.filter((d) => d.entrepreneurId === entrepreneur.id),
    }
  })
}

/** Entrepreneur-side: list this entrepreneur's own granted/pending/revoked links (Settings page). */
export async function getAccountantLinksForEntrepreneur(entrepreneurId: string) {
  return db
    .select()
    .from(accountantLinks)
    .where(eq(accountantLinks.entrepreneurId, entrepreneurId))
    .orderBy(accountantLinks.createdAt)
}

/** Read-only lookup for the accept-invite confirmation screen — does not mutate. */
export async function getPendingInviteByToken(token: string) {
  const [row] = await db
    .select({ link: accountantLinks, entrepreneur: { fullName: entrepreneurs.fullName } })
    .from(accountantLinks)
    .innerJoin(entrepreneurs, eq(accountantLinks.entrepreneurId, entrepreneurs.id))
    .where(eq(accountantLinks.inviteToken, token))
    .limit(1)
  return row ?? null
}

/** Cheap existence check for nav gating — does this user have any active accountant access. */
export async function hasActiveAccountantAccess(accountantUserId: string) {
  const [row] = await db
    .select({ id: accountantLinks.id })
    .from(accountantLinks)
    .where(
      and(
        eq(accountantLinks.accountantUserId, accountantUserId),
        eq(accountantLinks.status, 'active')
      )
    )
    .limit(1)
  return row !== undefined
}
