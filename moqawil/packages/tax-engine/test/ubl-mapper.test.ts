import { describe, expect, it } from 'vitest'
import { type UblInvoiceInput, mapInvoiceToUbl } from '../src/e-invoicing/ubl-mapper'

const baseInput: UblInvoiceInput = {
  invoiceNumber: 'FACT-2026-001',
  issueDate: '2026-08-08',
  currency: 'MAD',
  seller: {
    name: 'Karim Benchekroun',
    address: '12 Rue des Fleurs',
    city: 'Casablanca',
    ice: '001234567000012',
    ifNumber: '12345678',
  },
  buyer: {
    name: 'SARL Exemple',
    address: '5 Boulevard Central',
    city: 'Rabat',
    ice: '009876543000098',
  },
  lines: [
    { description: 'Développement site web', quantity: 1, unitPrice: 15000, lineTotal: 15000 },
    { description: 'Maintenance mensuelle', quantity: 2, unitPrice: 500, lineTotal: 1000 },
  ],
  totalMad: 16000,
  notesFr: 'TVA non applicable — Régime auto-entrepreneur (Loi 114-13)',
  notesAr: 'الضريبة على القيمة المضافة غير قابلة للتطبيق — نظام المقاول الذاتي',
}

/** Minimal dependency-free well-formedness check: every opened tag is closed, in order. */
function assertWellFormedXml(xml: string) {
  const tagRe = /<\/?([a-zA-Z][\w:.-]*)(?:\s[^>]*)?(\/?)>/g
  const stack: string[] = []
  let match: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec iteration pattern
  while ((match = tagRe.exec(xml)) !== null) {
    const [full, name, selfClose] = match
    if (full.startsWith('<?')) continue // XML declaration
    if (selfClose === '/') continue // self-closing, e.g. <br/>
    if (full.startsWith('</')) {
      const opened = stack.pop()
      if (opened !== name) {
        throw new Error(`Mismatched closing tag: expected </${opened}>, got </${name}>`)
      }
    } else {
      stack.push(name)
    }
  }
  if (stack.length > 0) {
    throw new Error(`Unclosed tags: ${stack.join(', ')}`)
  }
}

describe('mapInvoiceToUbl', () => {
  it('produces well-formed XML (every tag balanced and correctly nested)', () => {
    const xml = mapInvoiceToUbl(baseInput)
    expect(() => assertWellFormedXml(xml)).not.toThrow()
  })

  it('declares the correct UBL 2.1 namespaces on the root Invoice element', () => {
    const xml = mapInvoiceToUbl(baseInput)
    expect(xml).toContain('xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"')
    expect(xml).toContain(
      'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"'
    )
    expect(xml).toContain(
      'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"'
    )
  })

  it('follows the OASIS UBL 2.1 schema element sequence at the top level', () => {
    const xml = mapInvoiceToUbl(baseInput)
    const order = [
      '<cbc:ID>',
      '<cbc:IssueDate>',
      '<cbc:InvoiceTypeCode>',
      '<cbc:Note>',
      '<cbc:DocumentCurrencyCode>',
      '<cac:AccountingSupplierParty>',
      '<cac:AccountingCustomerParty>',
      '<cac:TaxTotal>',
      '<cac:LegalMonetaryTotal>',
      '<cac:InvoiceLine>',
    ]
    let lastIndex = -1
    for (const tag of order) {
      const idx = xml.indexOf(tag)
      expect(idx, `${tag} should be present`).toBeGreaterThan(-1)
      expect(idx, `${tag} is out of schema order`).toBeGreaterThan(lastIndex)
      lastIndex = idx
    }
  })

  it('includes every CGI Article 145 mandatory field', () => {
    const xml = mapInvoiceToUbl(baseInput)
    // Sequential invoice number
    expect(xml).toContain('<cbc:ID>FACT-2026-001</cbc:ID>')
    // Issue date
    expect(xml).toContain('<cbc:IssueDate>2026-08-08</cbc:IssueDate>')
    // Seller: name, address, ICE, IF
    expect(xml).toContain('Karim Benchekroun')
    expect(xml).toContain('12 Rue des Fleurs')
    expect(xml).toContain('<cbc:CompanyID>001234567000012</cbc:CompanyID>')
    expect(xml).toContain('<cbc:CompanyID>12345678</cbc:CompanyID>')
    // Client: name, ICE (Moroccan B2B)
    expect(xml).toContain('SARL Exemple')
    expect(xml).toContain('<cbc:CompanyID>009876543000098</cbc:CompanyID>')
    // Line items with description, quantity, unit price, line total
    expect(xml).toContain('Développement site web')
    expect(xml).toContain('<cbc:InvoicedQuantity>1</cbc:InvoicedQuantity>')
    // Total
    expect(xml).toContain('16000.00')
  })

  it('represents TVA exemption correctly (0%, exemption reason, not French Art. 293B)', () => {
    const xml = mapInvoiceToUbl(baseInput)
    expect(xml).toContain('<cbc:Percent>0</cbc:Percent>')
    expect(xml).toContain('<cbc:TaxExemptionReasonCode>VATEX-MA-AE</cbc:TaxExemptionReasonCode>')
    expect(xml).toContain('Loi 114-13')
    expect(xml).not.toContain('293B')
  })

  it('carries bilingual mandatory mentions as FR then AR cbc:Note elements', () => {
    const xml = mapInvoiceToUbl(baseInput)
    const frIdx = xml.indexOf(baseInput.notesFr)
    const arIdx = xml.indexOf(baseInput.notesAr)
    expect(frIdx).toBeGreaterThan(-1)
    expect(arIdx).toBeGreaterThan(-1)
    expect(frIdx).toBeLessThan(arIdx)
  })

  it('never includes the 80K per-client cap status (internal feature, not a legal invoice field)', () => {
    const xml = mapInvoiceToUbl(baseInput)
    expect(xml).not.toMatch(/80.?000/)
    expect(xml.toLowerCase()).not.toContain('cap')
  })

  it('escapes XML special characters in free-text fields', () => {
    const input: UblInvoiceInput = {
      ...baseInput,
      buyer: { ...baseInput.buyer, name: 'Société "A & B" <Test>' },
    }
    const xml = mapInvoiceToUbl(input)
    expect(xml).toContain('Société')
    expect(xml).toContain('&amp;')
    expect(xml).toContain('&lt;Test&gt;')
    expect(xml).toContain('&quot;A')
    expect(() => assertWellFormedXml(xml)).not.toThrow()
  })

  it('generates one cac:InvoiceLine per input line, each with a 1-based sequential ID', () => {
    const xml = mapInvoiceToUbl(baseInput)
    const lineCount = (xml.match(/<cac:InvoiceLine>/g) ?? []).length
    expect(lineCount).toBe(2)
    expect(xml).toContain('<cbc:ID>1</cbc:ID>')
    expect(xml).toContain('<cbc:ID>2</cbc:ID>')
  })
})
