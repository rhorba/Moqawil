/**
 * Sprint 2 — Declaration query helper tests.
 * Pure function tests run everywhere; DB tests are skipped without DATABASE_URL.
 *
 * vi.mock('@moqawil/db') must be declared before any import that transitively
 * requires it — Vitest hoists vi.mock calls to the top of the file so the
 * stub is in place before module resolution runs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Stub out @moqawil/db so the pure-function helpers can be imported without
// a live DATABASE_URL (the DB package throws at module-load time if absent).
vi.mock('@moqawil/db', () => ({
  db: {},
  invoices: {},
  quarterlyDeclarations: {},
}))

import {
  quarterDateRange,
  declarationDeadline,
  daysUntilDeadline,
} from '@/lib/queries/declaration'

// ── quarterDateRange ─────────────────────────────────────────────────────────

describe('quarterDateRange', () => {
  it('returns correct range for Q1', () => {
    expect(quarterDateRange(2026, 1)).toEqual({ start: '2026-01-01', end: '2026-03-31' })
  })
  it('returns correct range for Q2', () => {
    expect(quarterDateRange(2026, 2)).toEqual({ start: '2026-04-01', end: '2026-06-30' })
  })
  it('returns correct range for Q3', () => {
    expect(quarterDateRange(2026, 3)).toEqual({ start: '2026-07-01', end: '2026-09-30' })
  })
  it('returns correct range for Q4', () => {
    expect(quarterDateRange(2026, 4)).toEqual({ start: '2026-10-01', end: '2026-12-31' })
  })
})

// ── declarationDeadline ──────────────────────────────────────────────────────

describe('declarationDeadline', () => {
  it('Q1 deadline is April 30 of same year', () => {
    expect(declarationDeadline(2026, 1)).toBe('2026-04-30')
  })
  it('Q2 deadline is July 31 of same year', () => {
    expect(declarationDeadline(2026, 2)).toBe('2026-07-31')
  })
  it('Q3 deadline is October 31 of same year', () => {
    expect(declarationDeadline(2026, 3)).toBe('2026-10-31')
  })
  it('Q4 deadline is January 31 of the NEXT year', () => {
    // CGI: end of month following quarter — Q4 ends Dec 31, deadline = Jan 31+1
    expect(declarationDeadline(2026, 4)).toBe('2027-01-31')
  })
  it('Q4 deadline year rolls over correctly across year boundary', () => {
    expect(declarationDeadline(2025, 4)).toBe('2026-01-31')
  })
})

// ── daysUntilDeadline ────────────────────────────────────────────────────────

describe('daysUntilDeadline', () => {
  beforeEach(() => {
    // Freeze time to 2026-05-19
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-19T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns positive number for a future deadline', () => {
    const days = daysUntilDeadline('2026-07-31')
    expect(days).toBeGreaterThan(0)
  })

  it('returns negative number for an overdue deadline', () => {
    const days = daysUntilDeadline('2026-04-30')
    expect(days).toBeLessThan(0)
  })

  it('returns 0 or 1 for a deadline today', () => {
    // Ceiling rounding: exactly midnight today → 1, same-moment → 0
    const days = daysUntilDeadline('2026-05-19')
    expect(days).toBeGreaterThanOrEqual(0)
    expect(days).toBeLessThanOrEqual(1)
  })

  it('Q1 2026 deadline (Apr 30) is overdue as of May 19', () => {
    expect(daysUntilDeadline('2026-04-30')).toBeLessThan(0)
  })

  it('Q2 2026 deadline (Jul 31) has days left as of May 19', () => {
    expect(daysUntilDeadline('2026-07-31')).toBeGreaterThan(0)
  })
})

// ── DB integration tests ─────────────────────────────────────────────────────

const DB_AVAILABLE = !!process.env.DATABASE_URL

describe.skipIf(!DB_AVAILABLE)('getQuarterlyTurnover (integration)', () => {
  it('returns 0 for a non-existent entrepreneur', async () => {
    const { getQuarterlyTurnover } = await import('@/lib/queries/declaration')
    const total = await getQuarterlyTurnover('00000000-0000-0000-0000-000000000000', 2026, 1)
    expect(total).toBe(0)
  })
})

describe.skipIf(!DB_AVAILABLE)('computeAndUpsertDeclaration (integration)', () => {
  it('returns correct taxRate for service activity (1%)', async () => {
    const { computeAndUpsertDeclaration } = await import('@/lib/queries/declaration')
    // Use a non-existent entrepreneurId — turnover will be 0, but tax rate is still computed
    const result = await computeAndUpsertDeclaration(
      '00000000-0000-0000-0000-000000000000',
      2026,
      2,
      'service'
    )
    expect(result.taxRate).toBe(0.01)
    expect(result.taxDue).toBe(0)
  })

  it('returns correct taxRate for commercial activity (0.5%)', async () => {
    const { computeAndUpsertDeclaration } = await import('@/lib/queries/declaration')
    const result = await computeAndUpsertDeclaration(
      '00000000-0000-0000-0000-000000000000',
      2026,
      2,
      'commercial'
    )
    expect(result.taxRate).toBe(0.005)
  })
})
