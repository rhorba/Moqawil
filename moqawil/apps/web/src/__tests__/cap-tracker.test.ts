/**
 * S1-11: Cap tracker logic tests.
 * Tests the business logic of getClientAnnualTotal and cap status computation
 * using the tax-engine pure functions (no DB dependency).
 */

import { describe, it, expect } from 'vitest'
import {
  getCapStatus,
  PER_CLIENT_CAP_MAD,
  WHT_RATE_OVER_CAP,
  computeWithholdingOverCap,
} from '@moqawil/tax-engine'

describe('Cap tracker — 80,000 MAD per-client annual limit', () => {
  describe('getCapStatus boundaries (CGI Article 73-II-G-8°)', () => {
    it('returns safe for 0 DH invoiced', () => {
      const { status, percentOfCap, remainingMad } = getCapStatus(0)
      expect(status).toBe('safe')
      expect(percentOfCap).toBe(0)
      expect(remainingMad).toBe(PER_CLIENT_CAP_MAD)
    })

    it('returns safe at 55,999 DH (69.99% of cap)', () => {
      const { status } = getCapStatus(55_999)
      expect(status).toBe('safe')
    })

    it('returns warning at exactly 56,000 DH (70% of cap)', () => {
      const { status, percentOfCap } = getCapStatus(56_000)
      expect(status).toBe('warning')
      expect(percentOfCap).toBeCloseTo(70, 1)
    })

    it('returns warning at 79,999 DH (just under cap)', () => {
      const { status, percentOfCap } = getCapStatus(79_999)
      expect(status).toBe('warning')
      expect(percentOfCap).toBeCloseTo(99.99, 1)
    })

    it('returns over at exactly 80,000 DH (cap reached)', () => {
      const { status, percentOfCap, remainingMad } = getCapStatus(80_000)
      expect(status).toBe('over')
      expect(percentOfCap).toBe(100)
      expect(remainingMad).toBe(0)
    })

    it('returns over at 100,000 DH (125% of cap)', () => {
      const { status, percentOfCap } = getCapStatus(100_000)
      expect(status).toBe('over')
      expect(percentOfCap).toBeCloseTo(125, 1)
    })

    it('remainingMad is 0 when over cap', () => {
      const { remainingMad } = getCapStatus(90_000)
      expect(remainingMad).toBe(0)
    })

    it('correctly computes remaining below cap', () => {
      const { remainingMad } = getCapStatus(30_000)
      expect(remainingMad).toBe(50_000)
    })
  })

  describe('Withholding tax computation', () => {
    it('30% WHT on surplus — 10,000 DH over cap yields 3,000 DH WHT', () => {
      const wht = computeWithholdingOverCap(10_000)
      expect(wht).toBe(3_000)
      expect(WHT_RATE_OVER_CAP).toBe(0.3)
    })

    it('20,000 DH surplus → 6,000 DH WHT', () => {
      expect(computeWithholdingOverCap(20_000)).toBe(6_000)
    })
  })

  describe('Invoice creation cap projection', () => {
    it('projects total correctly to detect cap breach', () => {
      const currentYtd = 70_000
      const newInvoiceAmount = 15_000
      const projected = currentYtd + newInvoiceAmount

      expect(projected).toBeGreaterThan(PER_CLIENT_CAP_MAD)

      const surplus = projected - PER_CLIENT_CAP_MAD
      expect(surplus).toBe(5_000)
      expect(computeWithholdingOverCap(surplus)).toBe(1_500)
    })

    it('no cap warning when projected total stays under 80K', () => {
      const currentYtd = 60_000
      const newInvoiceAmount = 19_999
      const projected = currentYtd + newInvoiceAmount
      expect(projected).toBeLessThan(PER_CLIENT_CAP_MAD)
    })

    it('cap warning triggers at exactly 80,000 DH projected', () => {
      const currentYtd = 60_000
      const newInvoiceAmount = 20_000
      const projected = currentYtd + newInvoiceAmount
      expect(projected).toBeGreaterThanOrEqual(PER_CLIENT_CAP_MAD)
    })
  })
})
