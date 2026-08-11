/**
 * Sprint 5 (S5-05): DB-integration tests for src/lib/queries/entrepreneur.ts.
 * Requires DATABASE_URL env var and are skipped otherwise (see
 * invoice-numbering.test.ts for the same pattern).
 *
 * Note: profile create/update itself lives in the `upsertProfile` server
 * action (app/(app)/settings/actions.ts), not in queries/entrepreneur.ts —
 * that file only exports the read path (`getEntrepreneur`). This suite
 * covers that read path plus the DB-level ICE uniqueness constraint, which
 * is the actual data-integrity guarantee regardless of which layer of the
 * app happens to trigger a violation of it.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SKIP_INTEGRATION = !process.env.DATABASE_URL

describe.skipIf(SKIP_INTEGRATION)('Entrepreneur queries — DB integration', () => {
  // Dynamic import to avoid failing when DB is unavailable — see invoice-numbering.test.ts.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let db: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let entrepreneursTable: any
  // biome-ignore lint/suspicious/noExplicitAny: see comment above.
  let usersTable: any

  const TEST_USER_ID = 'test-entr-user-001'
  const NO_PROFILE_USER_ID = 'test-entr-user-002'
  const DUPLICATE_ICE_USER_ID = 'test-entr-user-003'
  const TEST_ENTREPRENEUR_ID = '00000000-0000-0000-0000-000000000401'
  // Sprint 11 fixture-collision fix: block 041/042 reserved for this file — see docs/test-strategy-moqawil.md
  const SHARED_ICE = '000000000000041'

  beforeAll(async () => {
    const mod = await import('@moqawil/db')
    db = mod.db
    entrepreneursTable = mod.entrepreneurs
    usersTable = mod.users

    await db
      .insert(usersTable)
      .values([
        { id: TEST_USER_ID, email: 'entr-test@moqawil.test', name: 'Entr Test User' },
        { id: NO_PROFILE_USER_ID, email: 'entr-test-2@moqawil.test', name: 'No Profile User' },
        {
          id: DUPLICATE_ICE_USER_ID,
          email: 'entr-test-3@moqawil.test',
          name: 'Duplicate ICE User',
        },
      ])
      // Sprint 11: explicit target so a real conflict (e.g. stale ICE from another
      // suite) fails loudly instead of silently no-oping on the wrong constraint.
      .onConflictDoNothing({ target: usersTable.id })

    await db
      .insert(entrepreneursTable)
      .values({
        id: TEST_ENTREPRENEUR_ID,
        userId: TEST_USER_ID,
        fullName: 'Test AE Entrepreneur',
        ice: SHARED_ICE,
        ifNumber: '33333333',
        activityType: 'service',
        address: '1 Rue Test',
        city: 'Marrakech',
        registrationDate: '2024-01-01',
        invoicePrefix: 'ENT',
      })
      .onConflictDoNothing({ target: entrepreneursTable.id })
  })

  afterAll(async () => {
    const { eq } = await import('drizzle-orm')
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.userId, TEST_USER_ID))
    await db.delete(entrepreneursTable).where(eq(entrepreneursTable.userId, DUPLICATE_ICE_USER_ID))
    await db.delete(usersTable).where(eq(usersTable.id, TEST_USER_ID))
    await db.delete(usersTable).where(eq(usersTable.id, NO_PROFILE_USER_ID))
    await db.delete(usersTable).where(eq(usersTable.id, DUPLICATE_ICE_USER_ID))
  })

  it('getEntrepreneur returns the profile for a user that has one', async () => {
    const { getEntrepreneur } = await import('@/lib/queries/entrepreneur')
    const row = await getEntrepreneur(TEST_USER_ID)
    expect(row?.id).toBe(TEST_ENTREPRENEUR_ID)
    expect(row?.ice).toBe(SHARED_ICE)
  })

  it('getEntrepreneur returns null for a user with no profile (pre-onboarding state)', async () => {
    const { getEntrepreneur } = await import('@/lib/queries/entrepreneur')
    const row = await getEntrepreneur(NO_PROFILE_USER_ID)
    expect(row).toBeNull()
  })

  it('the DB rejects a second entrepreneur profile reusing an already-registered ICE', async () => {
    // ICE is meant to be a unique national business identifier (CLAUDE.md §3) —
    // the DB-level unique constraint is the actual enforcement backstop
    // regardless of what app-layer validation checks before the insert.
    await expect(
      db.insert(entrepreneursTable).values({
        userId: DUPLICATE_ICE_USER_ID,
        fullName: 'Duplicate ICE AE',
        ice: SHARED_ICE,
        ifNumber: '44444444',
        activityType: 'service',
        address: '2 Rue Test',
        city: 'Marrakech',
        registrationDate: '2024-01-01',
        invoicePrefix: 'DUP',
      })
    ).rejects.toThrow()
  })

  it('the DB rejects a second entrepreneur profile for the same user (one-per-user invariant)', async () => {
    await expect(
      db.insert(entrepreneursTable).values({
        userId: TEST_USER_ID,
        fullName: 'Second Profile Same User',
        ice: '000000000000042',
        ifNumber: '55555555',
        activityType: 'commercial',
        address: '3 Rue Test',
        city: 'Marrakech',
        registrationDate: '2024-01-01',
        invoicePrefix: 'SEC',
      })
    ).rejects.toThrow()
  })
})
