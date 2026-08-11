/**
 * Sprint 10: PDF rendering was never unit-tested for any of the three document
 * types — this gap let a real bug ship in Sprint 6 (quote PDF generation
 * throws, 500s on every download) that no automated test caught, since
 * happy-path.spec.ts's devis test never actually opens the PDF. Found via the
 * Sprint 10 walkthrough script's new "view every generated PDF" steps.
 */

import { describe, expect, it } from 'vitest'

describe('PDF template rendering', () => {
  it('renderInvoicePdf produces a non-empty PDF buffer', async () => {
    const { renderInvoicePdf } = await import('@moqawil/pdf-templates')
    const buffer = await renderInvoicePdf({
      invoice: {
        invoiceNumber: 'FACT-2026-001',
        issueDate: '2026-01-15',
        dueDate: null,
        currency: 'MAD',
        exchangeRate: null,
        subtotalMad: '15000.00',
        totalMad: '15000.00',
        notes: null,
        paymentMethod: 'virement',
      },
      lines: [
        {
          position: 1,
          description: 'Développement application web',
          quantity: '1',
          unitPriceOriginal: '15000.00',
          lineTotalOriginal: '15000.00',
          lineTotalMad: '15000.00',
        },
      ],
      entrepreneur: {
        fullName: 'Karim Benchekroun',
        ice: '000000000000001',
        ifNumber: '12345678',
        address: '12 Rue Mohammed V',
        city: 'Casablanca',
        phone: null,
        activityType: 'service',
        invoicePrefix: 'FACT',
      },
      client: {
        name: 'Acme Corp',
        ice: '999999999999999',
        ifNumber: null,
        address: 'Technopark Casablanca',
        countryCode: 'MA',
      },
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
  })

  it('renderQuotePdf produces a non-empty PDF buffer', async () => {
    const { renderQuotePdf } = await import('@moqawil/pdf-templates')
    const buffer = await renderQuotePdf({
      quote: {
        quoteNumber: 'DEVIS-2026-001',
        issueDate: '2026-01-15',
        validUntilDate: '2026-02-14',
        currency: 'MAD',
        exchangeRate: null,
        subtotalMad: '8000.00',
        totalMad: '8000.00',
        notes: null,
      },
      lines: [
        {
          position: 1,
          description: 'Refonte identité visuelle',
          quantity: '1',
          unitPriceOriginal: '8000.00',
          lineTotalOriginal: '8000.00',
          lineTotalMad: '8000.00',
        },
      ],
      entrepreneur: {
        fullName: 'Karim Benchekroun',
        ice: '000000000000001',
        ifNumber: '12345678',
        address: '12 Rue Mohammed V',
        city: 'Casablanca',
        phone: null,
      },
      client: {
        name: 'Acme Corp',
        ice: '999999999999999',
        ifNumber: null,
        address: 'Technopark Casablanca',
        countryCode: 'MA',
      },
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
  })

  it('renderDeclarationPdf produces a non-empty PDF buffer', async () => {
    const { renderDeclarationPdf } = await import('@moqawil/pdf-templates')
    const buffer = await renderDeclarationPdf({
      declaration: {
        year: 2026,
        quarter: 1,
        totalTurnoverMad: 45000,
        taxRate: 0.01,
        taxDueMad: 450,
        status: 'pending',
        submittedAt: null,
      },
      entrepreneur: {
        fullName: 'Karim Benchekroun',
        ice: '000000000000001',
        ifNumber: '12345678',
        address: '12 Rue Mohammed V',
        city: 'Casablanca',
        phone: null,
        activityType: 'service',
        invoicePrefix: 'FACT',
        registrationDate: '2024-01-01',
      },
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
  })
})
