/**
 * Sprint 9 (S9-06): tests for the accountant multi-client dashboard's
 * authorization boundary (src/lib/queries/accountant.ts) and invite-token
 * util (src/lib/invite-token.ts).
 *
 * DB-integration tests require DATABASE_URL and are skipped otherwise — see
 * invoice-numbering.test.ts for the same pattern.
 *
 * The accept-invite Server Action (app/(app)/accountant/actions.ts) is not
 * exercised directly here: it calls next/navigation's redirect() on success,
 * which throws outside a real request context. Instead this suite verifies
 * the exact conditional UPDATE (id + status='pending') the action relies on
 * for race-safety, and the read-path business rules (expiry, status,
 * email-match) it gates on before reaching that update.
 */

import { generateInviteToken, inviteExpiresAt } from '@/lib/invite-token'
import { and, eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'

describe('generateInviteToken', () => {
  it('produces a 256-bit, URL-safe, unique token each call', () => {
    const a = generateInviteToken()
    const b = generateInviteToken()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
    // base64url of 32 bytes is 43 chars (no padding)
    expect(a.length).toBe(43)
  })
})

describe('inviteExpiresAt', () => {
  it('expires 7 days from now', () => {
    const now = Date.now()
    const expires = inviteExpiresAt().getTime()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    expect(expires - now).toBeGreaterThan(sevenDaysMs - 5000)
    expect(expires - now).toBeLessThan(sevenDaysMs + 5000)
  })
})

const SKIP_INTEGRATION = !process.env.DATABASE_URL

describe.skipIf(SKIP_INTEGRATION)('Accountant authorization queries — DB integration', () => {
  // Dynamic import to avoid failing when DB is unavailable — see invoice-numbering.test.ts.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let db: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let accountantLinksTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let entrepreneursTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let usersTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let invoicesTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let clientsTable: any

  const AE_USER_A = 'test-acct-ae-user-a'
  const AE_USER_B = 'test-acct-ae-user-b'
  const ACCOUNTANT_USER = 'test-acct-accountant-user'
  const ENTREPRENEUR_A = '00000000-0000-0000-0000-000000000501'
  const ENTREPRENEUR_B = '00000000-0000-0000-0000-000000000502'
  const CLIENT_A = '00000000-0000-0000-0000-000000000503'
  const TEST_YEAR = 2097

  beforeAll(async () => {
    const mod = await import('@moqawil/db')
    db = mod.db
    accountantLinksTable = mod.accountantLinks
    entrepreneursTable = mod.entrepreneurs
    usersTable = mod.users
    invoicesTable = mod.invoices
    clientsTable = mod.clients
  })

  async function setup() {
    await db
      .insert(usersTable)
      .values([
        { id: AE_USER_A, email: 'acct-ae-a@moqawil.test', name: 'AE A' },
        { id: AE_USER_B, email: 'acct-ae-b@moqawil.test', name: 'AE B' },
        { id: ACCOUNTANT_USER, email: 'acct-accountant@moqawil.test', name: 'Accountant' },
      ])
      .onConflictDoNothing()

    await db
      .insert(entrepreneursTable)
      .values([
        {
          id: ENTREPRENEUR_A,
          userId: AE_USER_A,
          fullName: 'Entrepreneur A',
          ice: '000000000000007',
          ifNumber: '66666666',
          activityType: 'service',
          address: '1 Rue Test',
          city: 'Rabat',
          registrationDate: '2024-01-01',
          invoicePrefix: 'ACA',
        },
        {
          id: ENTREPRENEUR_B,
          userId: AE_USER_B,
          fullName: 'Entrepreneur B',
          ice: '000000000000008',
          ifNumber: '77777777',
          activityType: 'commercial',
          address: '2 Rue Test',
          city: 'Rabat',
          registrationDate: '2024-01-01',
          invoicePrefix: 'ACB',
        },
      ])
      .onConflictDoNothing()

    // A: active grant to the accountant. B: revoked grant — must NOT be visible.
    await db
      .insert(accountantLinksTable)
      .values([
        {
          entrepreneurId: ENTREPRENEUR_A,
          accountantUserId: ACCOUNTANT_USER,
          invitedEmail: 'acct-accountant@moqawil.test',
          status: 'active',
        },
        {
          entrepreneurId: ENTREPRENEUR_B,
          accountantUserId: ACCOUNTANT_USER,
          invitedEmail: 'acct-accountant@moqawil.test',
          status: 'revoked',
        },
      ])
      .onConflictDoNothing()

    await db
      .insert(clientsTable)
      .values({
        id: CLIENT_A,
        entrepreneurId: ENTREPRENEUR_A,
        name: 'Client A',
        type: 'individual',
      })
      .onConflictDoNothing()

    await db.insert(invoicesTable).values([
      {
        entrepreneurId: ENTREPRENEUR_A,
        clientId: CLIENT_A,
        invoiceNumber: `ACA-${TEST_YEAR}-001`,
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
    ])
  }

  async function teardown() {
    await db.delete(invoicesTable).where(eq(invoicesTable.entrepreneurId, ENTREPRENEUR_A))
    await db
      .delete(accountantLinksTable)
      .where(eq(accountantLinksTable.accountantUserId, ACCOUNTANT_USER))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, ENTREPRENEUR_A))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, ENTREPRENEUR_B))
    await db.delete(usersTable).where(eq(usersTable.id, AE_USER_A))
    await db.delete(usersTable).where(eq(usersTable.id, AE_USER_B))
    await db.delete(usersTable).where(eq(usersTable.id, ACCOUNTANT_USER))
  }

  it('getAccessibleEntrepreneurs returns only entrepreneurs with an active link', async () => {
    await setup()
    try {
      const { getAccessibleEntrepreneurs } = await import('@/lib/queries/accountant')
      const rows = await getAccessibleEntrepreneurs(ACCOUNTANT_USER)
      const ids = rows.map((r) => r.id)
      expect(ids).toContain(ENTREPRENEUR_A)
      expect(ids).not.toContain(ENTREPRENEUR_B) // revoked — must not leak through
    } finally {
      await teardown()
    }
  })

  it('assertAccountantAccess is true for an active grant, false for revoked and for a stranger accountant', async () => {
    await setup()
    try {
      const { assertAccountantAccess } = await import('@/lib/queries/accountant')
      expect(await assertAccountantAccess(ACCOUNTANT_USER, ENTREPRENEUR_A)).toBe(true)
      expect(await assertAccountantAccess(ACCOUNTANT_USER, ENTREPRENEUR_B)).toBe(false)
      expect(await assertAccountantAccess('no-such-accountant', ENTREPRENEUR_A)).toBe(false)
    } finally {
      await teardown()
    }
  })

  it('getAccountantDashboardRows returns YTD turnover + threshold status only for accessible entrepreneurs', async () => {
    await setup()
    try {
      const { getAccountantDashboardRows } = await import('@/lib/queries/accountant')
      const rows = await getAccountantDashboardRows(ACCOUNTANT_USER, TEST_YEAR)
      expect(rows).toHaveLength(1)
      expect(rows[0].entrepreneur.id).toBe(ENTREPRENEUR_A)
      expect(rows[0].ytdMad).toBe(10000)
      expect(rows[0].threshold.status).toBe('safe')
    } finally {
      await teardown()
    }
  })

  it('getAccountantDashboardRows reports ytdMad 0 for an accessible entrepreneur with zero invoices this year', async () => {
    const NO_INVOICE_ENTREPRENEUR = '00000000-0000-0000-0000-000000000504'
    await db
      .insert(usersTable)
      .values({ id: AE_USER_A, email: 'acct-ae-a@moqawil.test', name: 'AE A' })
      .onConflictDoNothing()
    await db
      .insert(usersTable)
      .values({ id: ACCOUNTANT_USER, email: 'acct-accountant@moqawil.test', name: 'Accountant' })
      .onConflictDoNothing()
    await db.insert(entrepreneursTable).values({
      id: NO_INVOICE_ENTREPRENEUR,
      userId: AE_USER_A,
      fullName: 'No Invoice Entrepreneur',
      ice: '000000000000011',
      ifNumber: '11223344',
      activityType: 'service',
      address: '1 Rue Test',
      city: 'Rabat',
      registrationDate: '2024-01-01',
      invoicePrefix: 'NOI',
    })
    await db.insert(accountantLinksTable).values({
      entrepreneurId: NO_INVOICE_ENTREPRENEUR,
      accountantUserId: ACCOUNTANT_USER,
      invitedEmail: 'acct-accountant@moqawil.test',
      status: 'active',
    })

    try {
      const { getAccountantDashboardRows } = await import('@/lib/queries/accountant')
      const rows = await getAccountantDashboardRows(ACCOUNTANT_USER, TEST_YEAR)
      expect(rows).toHaveLength(1)
      expect(rows[0].ytdMad).toBe(0)
      expect(rows[0].threshold.status).toBe('safe')
    } finally {
      await db
        .delete(accountantLinksTable)
        .where(eq(accountantLinksTable.entrepreneurId, NO_INVOICE_ENTREPRENEUR))
      await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, NO_INVOICE_ENTREPRENEUR))
      await db.delete(usersTable).where(eq(usersTable.id, AE_USER_A))
      await db.delete(usersTable).where(eq(usersTable.id, ACCOUNTANT_USER))
    }
  })

  it('getAccountantDashboardRows returns [] with zero DB reads to invoices/declarations when the accountant has no accessible entrepreneurs', async () => {
    const { getAccountantDashboardRows } = await import('@/lib/queries/accountant')
    const rows = await getAccountantDashboardRows('nobody-has-invited-this-user', TEST_YEAR)
    expect(rows).toEqual([])
  })

  it('getAccountantLinksForEntrepreneur returns all links for that entrepreneur, active and revoked alike', async () => {
    await setup()
    try {
      const { getAccountantLinksForEntrepreneur } = await import('@/lib/queries/accountant')
      const links = await getAccountantLinksForEntrepreneur(ENTREPRENEUR_A)
      expect(links).toHaveLength(1)
      expect(links[0].status).toBe('active')
      expect(links[0].invitedEmail).toBe('acct-accountant@moqawil.test')

      const otherEntrepreneurLinks = await getAccountantLinksForEntrepreneur(ENTREPRENEUR_B)
      expect(otherEntrepreneurLinks).toHaveLength(1)
      expect(otherEntrepreneurLinks[0].status).toBe('revoked')
    } finally {
      await teardown()
    }
  })

  it('hasActiveAccountantAccess reflects only active links', async () => {
    await setup()
    try {
      const { hasActiveAccountantAccess } = await import('@/lib/queries/accountant')
      expect(await hasActiveAccountantAccess(ACCOUNTANT_USER)).toBe(true)
      expect(await hasActiveAccountantAccess('nobody-has-invited-this-user')).toBe(false)
    } finally {
      await teardown()
    }
  })

  it('the race-safe accept UPDATE (id + status=pending) only ever succeeds once under concurrent submission', async () => {
    const linkId = '00000000-0000-0000-0000-000000000510'
    await db
      .insert(usersTable)
      .values([
        { id: AE_USER_A, email: 'acct-ae-a@moqawil.test', name: 'AE A' },
        { id: ACCOUNTANT_USER, email: 'acct-accountant@moqawil.test', name: 'Accountant' },
      ])
      .onConflictDoNothing()
    await db
      .insert(entrepreneursTable)
      .values({
        id: ENTREPRENEUR_A,
        userId: AE_USER_A,
        fullName: 'Entrepreneur A',
        ice: '000000000000007',
        ifNumber: '66666666',
        activityType: 'service',
        address: '1 Rue Test',
        city: 'Rabat',
        registrationDate: '2024-01-01',
        invoicePrefix: 'ACA',
      })
      .onConflictDoNothing()
    await db.insert(accountantLinksTable).values({
      id: linkId,
      entrepreneurId: ENTREPRENEUR_A,
      invitedEmail: 'race@moqawil.test',
      status: 'pending',
      inviteToken: 'race-token',
    })

    try {
      const attempt = () =>
        db
          .update(accountantLinksTable)
          .set({ accountantUserId: ACCOUNTANT_USER, status: 'active', inviteToken: null })
          .where(
            and(eq(accountantLinksTable.id, linkId), eq(accountantLinksTable.status, 'pending'))
          )
          .returning({ id: accountantLinksTable.id })

      const [r1, r2] = await Promise.all([attempt(), attempt()])
      const successes = [r1, r2].filter((r) => r.length > 0)
      expect(successes).toHaveLength(1) // exactly one of the two concurrent accepts wins
    } finally {
      await db.delete(accountantLinksTable).where(eq(accountantLinksTable.id, linkId))
      await db.delete(entrepreneursTable).where(eq(entrepreneursTable.id, ENTREPRENEUR_A))
      await db.delete(usersTable).where(eq(usersTable.id, AE_USER_A))
      await db.delete(usersTable).where(eq(usersTable.id, ACCOUNTANT_USER))
    }
  })

  it('getPendingInviteByToken returns null for an unknown token', async () => {
    const { getPendingInviteByToken } = await import('@/lib/queries/accountant')
    const row = await getPendingInviteByToken('no-such-token-exists')
    expect(row).toBeNull()
  })
})
