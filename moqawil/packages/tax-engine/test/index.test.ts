import { describe, it, expect } from 'vitest'
import {
  // Constants
  PER_CLIENT_CAP_MAD,
  REVENUE_THRESHOLD_COMMERCIAL,
  REVENUE_THRESHOLD_SERVICE,
  TAX_RATE_COMMERCIAL,
  TAX_RATE_SERVICE,
  WHT_RATE_OVER_CAP,
  CASH_PAYMENT_LIMIT_MAD,
  CASH_PENALTY_THRESHOLD_MAD,
  // Functions
  getCapStatus,
  getThresholdStatus,
  getRevenueThreshold,
  getTaxRate,
  computeTax,
  computeWithholdingOverCap,
  validateICE,
  validateIF,
  formatInvoiceNumber,
  getMandatoryMentions,
  type ActivityType,
} from '../src/index'

// ── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('PER_CLIENT_CAP_MAD is 80,000', () => {
    expect(PER_CLIENT_CAP_MAD).toBe(80_000)
  })
  it('REVENUE_THRESHOLD_COMMERCIAL is 500,000', () => {
    expect(REVENUE_THRESHOLD_COMMERCIAL).toBe(500_000)
  })
  it('REVENUE_THRESHOLD_SERVICE is 200,000', () => {
    expect(REVENUE_THRESHOLD_SERVICE).toBe(200_000)
  })
  it('TAX_RATE_COMMERCIAL is 0.5%', () => {
    expect(TAX_RATE_COMMERCIAL).toBe(0.005)
  })
  it('TAX_RATE_SERVICE is 1%', () => {
    expect(TAX_RATE_SERVICE).toBe(0.010)
  })
  it('WHT_RATE_OVER_CAP is 30%', () => {
    expect(WHT_RATE_OVER_CAP).toBe(0.30)
  })
  it('CASH_PAYMENT_LIMIT_MAD is 5,000', () => {
    expect(CASH_PAYMENT_LIMIT_MAD).toBe(5_000)
  })
  it('CASH_PENALTY_THRESHOLD_MAD is 20,000', () => {
    expect(CASH_PENALTY_THRESHOLD_MAD).toBe(20_000)
  })
})

// ── getCapStatus ─────────────────────────────────────────────────────────────

describe('getCapStatus — CGI Article 73-II-G-8°', () => {
  it('returns safe when 0 MAD invoiced (fresh client)', () => {
    const result = getCapStatus(0)
    expect(result.status).toBe('safe')
    expect(result.percentOfCap).toBe(0)
    expect(result.remainingMad).toBe(80_000)
  })

  it('returns safe when invoiced < 70% of cap (55,999 MAD)', () => {
    const result = getCapStatus(55_999)
    expect(result.status).toBe('safe')
    expect(result.percentOfCap).toBeCloseTo(69.99875)
    expect(result.remainingMad).toBe(24_001)
  })

  it('returns warning at exactly 70% (56,000 MAD)', () => {
    const result = getCapStatus(56_000)
    expect(result.status).toBe('warning')
    expect(result.percentOfCap).toBe(70)
    expect(result.remainingMad).toBe(24_000)
  })

  it('returns warning when invoiced 70%-99% of cap', () => {
    expect(getCapStatus(70_000).status).toBe('warning')
    expect(getCapStatus(79_999).status).toBe('warning')
  })

  it('returns over at exactly 80,000 MAD (100%)', () => {
    const result = getCapStatus(80_000)
    expect(result.status).toBe('over')
    expect(result.percentOfCap).toBe(100)
    expect(result.remainingMad).toBe(0)
  })

  it('returns over when invoiced > 80,000 MAD', () => {
    const result = getCapStatus(100_000)
    expect(result.status).toBe('over')
    expect(result.percentOfCap).toBe(125)
    expect(result.remainingMad).toBe(0)  // clamped at 0, not negative
  })

  it('remaining is never negative when over cap', () => {
    expect(getCapStatus(200_000).remainingMad).toBe(0)
  })
})

// ── getThresholdStatus ───────────────────────────────────────────────────────

describe('getThresholdStatus — Law 114-13', () => {
  it('returns safe for service at 100,000 MAD YTD (50%)', () => {
    const result = getThresholdStatus(100_000, 'service')
    expect(result.status).toBe('safe')
    expect(result.percentOfThreshold).toBe(50)
    expect(result.remainingMad).toBe(100_000)
  })

  it('returns warning for service at 140,001 MAD (>70%)', () => {
    expect(getThresholdStatus(140_001, 'service').status).toBe('warning')
  })

  it('returns over for service at 200,000 MAD', () => {
    const result = getThresholdStatus(200_000, 'service')
    expect(result.status).toBe('over')
    expect(result.remainingMad).toBe(0)
  })

  it('returns safe for commercial at 300,000 MAD (60%)', () => {
    expect(getThresholdStatus(300_000, 'commercial').status).toBe('safe')
  })

  it('returns warning for commercial at 350,001 MAD (>70%)', () => {
    expect(getThresholdStatus(350_001, 'commercial').status).toBe('warning')
  })

  it('returns over for commercial at 500,000 MAD', () => {
    expect(getThresholdStatus(500_000, 'commercial').status).toBe('over')
  })

  it('industrial uses commercial threshold', () => {
    expect(getThresholdStatus(499_999, 'industrial').status).toBe('warning')
  })

  it('artisanal uses commercial threshold', () => {
    expect(getThresholdStatus(499_999, 'artisanal').status).toBe('warning')
  })
})

// ── getRevenueThreshold ──────────────────────────────────────────────────────

describe('getRevenueThreshold', () => {
  it('service → 200,000 MAD', () => {
    expect(getRevenueThreshold('service')).toBe(200_000)
  })
  it('commercial → 500,000 MAD', () => {
    expect(getRevenueThreshold('commercial')).toBe(500_000)
  })
  it('industrial → 500,000 MAD', () => {
    expect(getRevenueThreshold('industrial')).toBe(500_000)
  })
  it('artisanal → 500,000 MAD', () => {
    expect(getRevenueThreshold('artisanal')).toBe(500_000)
  })
})

// ── getTaxRate ───────────────────────────────────────────────────────────────

describe('getTaxRate', () => {
  it('service → 1%', () => {
    expect(getTaxRate('service')).toBe(0.010)
  })
  it('commercial → 0.5%', () => {
    expect(getTaxRate('commercial')).toBe(0.005)
  })
  it('industrial → 0.5%', () => {
    expect(getTaxRate('industrial')).toBe(0.005)
  })
  it('artisanal → 0.5%', () => {
    expect(getTaxRate('artisanal')).toBe(0.005)
  })
})

// ── computeTax ───────────────────────────────────────────────────────────────

describe('computeTax', () => {
  it('computes 1% on 50,000 MAD service turnover → 500 MAD', () => {
    expect(computeTax(50_000, 'service')).toBe(500)
  })
  it('computes 0.5% on 100,000 MAD commercial turnover → 500 MAD', () => {
    expect(computeTax(100_000, 'commercial')).toBe(500)
  })
  it('computes zero tax on zero turnover', () => {
    expect(computeTax(0, 'service')).toBe(0)
  })
  it('quarterly: 1% on 30,000 MAD service → 300 MAD', () => {
    expect(computeTax(30_000, 'service')).toBe(300)
  })
})

// ── computeWithholdingOverCap ─────────────────────────────────────────────────

describe('computeWithholdingOverCap', () => {
  it('30% of 10,000 MAD surplus → 3,000 MAD', () => {
    expect(computeWithholdingOverCap(10_000)).toBe(3_000)
  })
  it('30% of zero → 0', () => {
    expect(computeWithholdingOverCap(0)).toBe(0)
  })
  it('30% of 1 MAD → 0.30 MAD', () => {
    expect(computeWithholdingOverCap(1)).toBeCloseTo(0.30)
  })
})

// ── validateICE ──────────────────────────────────────────────────────────────

describe('validateICE', () => {
  it('accepts a valid 15-digit ICE', () => {
    expect(validateICE('001234567890001').valid).toBe(true)
  })
  it('rejects empty string', () => {
    expect(validateICE('').valid).toBe(false)
  })
  it('rejects ICE with 14 digits', () => {
    expect(validateICE('00123456789000').valid).toBe(false)
  })
  it('rejects ICE with 16 digits', () => {
    expect(validateICE('0012345678900011').valid).toBe(false)
  })
  it('rejects ICE with letters', () => {
    expect(validateICE('00123456789000A').valid).toBe(false)
  })
  it('accepts ICE with spaces (strips them)', () => {
    expect(validateICE('001234567 890001').valid).toBe(true)
  })
})

// ── validateIF ───────────────────────────────────────────────────────────────

describe('validateIF', () => {
  it('accepts a valid 8-digit IF', () => {
    expect(validateIF('12345678').valid).toBe(true)
  })
  it('accepts a valid 7-digit IF', () => {
    expect(validateIF('1234567').valid).toBe(true)
  })
  it('rejects empty string', () => {
    expect(validateIF('').valid).toBe(false)
  })
  it('rejects IF with 6 digits', () => {
    expect(validateIF('123456').valid).toBe(false)
  })
  it('rejects IF with letters', () => {
    expect(validateIF('1234567A').valid).toBe(false)
  })
})

// ── formatInvoiceNumber ───────────────────────────────────────────────────────

describe('formatInvoiceNumber — CGI Article 145', () => {
  it('formats standard invoice number', () => {
    expect(formatInvoiceNumber('FACT', 2026, 1)).toBe('FACT-2026-001')
  })
  it('pads sequence to 3 digits', () => {
    expect(formatInvoiceNumber('FACT', 2026, 42)).toBe('FACT-2026-042')
  })
  it('handles large sequence numbers', () => {
    expect(formatInvoiceNumber('FACT', 2026, 999)).toBe('FACT-2026-999')
    expect(formatInvoiceNumber('FACT', 2026, 1000)).toBe('FACT-2026-1000')
  })
  it('uses custom prefix', () => {
    expect(formatInvoiceNumber('INV', 2026, 1)).toBe('INV-2026-001')
  })
})

// ── getMandatoryMentions ──────────────────────────────────────────────────────

describe('getMandatoryMentions — CGI Article 145 + Law 114-13', () => {
  const baseCtx = {
    sellerName: 'Karim Benali',
    sellerAddress: 'Casablanca',
    sellerICE: '001234567890001',
    sellerIF: '12345678',
    clientName: 'TechCorp SARL',
    clientAddress: 'Casablanca',
    isClientMoroccanB2B: false,
    totalMad: 10_000,
  }

  it('always includes TVA non applicable mention', () => {
    const mentions = getMandatoryMentions(baseCtx)
    expect(mentions.some((m) => m.includes('TVA non applicable'))).toBe(true)
  })

  it('always includes 10-year conservation mention', () => {
    const mentions = getMandatoryMentions(baseCtx)
    expect(mentions.some((m) => m.includes('10 ans'))).toBe(true)
  })

  it('includes client ICE for Moroccan B2B', () => {
    const ctx = { ...baseCtx, isClientMoroccanB2B: true, clientICE: '002345678901002' }
    const mentions = getMandatoryMentions(ctx)
    expect(mentions.some((m) => m.includes('002345678901002'))).toBe(true)
  })

  it('includes BAM rate and repatriation for foreign currency invoices', () => {
    const ctx = {
      ...baseCtx,
      isForeignCurrency: true,
      foreignCurrency: 'EUR',
      foreignAmount: 500,
      exchangeRate: 10.85,
    }
    const mentions = getMandatoryMentions(ctx)
    expect(mentions.some((m) => m.includes('EUR'))).toBe(true)
    expect(mentions.some((m) => m.includes('rapatriement') || m.includes('Rapatriement'))).toBe(true)
  })

  it('warns about cash payment above 5,000 MAD for B2B', () => {
    const ctx = { ...baseCtx, totalMad: 6_000, paymentMethod: 'espece' }
    const mentions = getMandatoryMentions(ctx)
    expect(mentions.some((m) => m.includes('déduire'))).toBe(true)
  })

  it('warns about 6% penalty for cash above 20,000 MAD', () => {
    const ctx = { ...baseCtx, totalMad: 25_000, paymentMethod: 'espece' }
    const mentions = getMandatoryMentions(ctx)
    expect(mentions.some((m) => m.includes('6%'))).toBe(true)
  })
})
