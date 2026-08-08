/**
 * Invoice → UBL 2.1 XML mapper (docs/architecture-sprint4-e-invoicing.md, ADR-1 & ADR-2).
 * Pure function, zero I/O — takes a plain data object, never a DB row type (tax-engine cannot
 * depend on @moqawil/db, per the dependency rule in docs/architecture-moqawil.md).
 *
 * Format: UBL 2.1 Invoice (urn:oasis:names:specification:ubl:schema:xsd:Invoice-2). Element
 * order follows the OASIS UBL 2.1 schema sequence exactly — UBL validators are order-sensitive.
 * CII was considered and rejected for v0.1 (ADR-1) — UBL 2.1 only.
 *
 * This generates format-ready XML only. It does NOT submit to DGI/xHub (no clearance happens
 * here — see apps/web/lib/clearance/provider.ts) and does NOT apply a digital signature
 * (Barid eSign QES/AES is unbuilt, Sprint 5+). Never claim DGI certification from this output.
 */

export interface UblPartyInput {
  name: string
  address: string
  city: string
  /** ICE — 15-digit Identifiant Commun de l'Entreprise. Required for the seller, optional for individual clients. */
  ice?: string
  /** IF — Identifiant Fiscal. Seller only; not collected for clients in the current data model. */
  ifNumber?: string
}

export interface UblInvoiceLineInput {
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface UblInvoiceInput {
  invoiceNumber: string
  issueDate: string // ISO YYYY-MM-DD
  currency: string // ISO 4217, e.g. 'MAD', 'EUR'
  seller: UblPartyInput
  buyer: UblPartyInput
  lines: UblInvoiceLineInput[]
  totalMad: number
  /** Mandatory mentions from getMandatoryMentions() — carried as cbc:Note, FR then AR. */
  notesFr: string
  notesAr: string
}

const UBL_NS = 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'
const CBC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
const CAC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'

/** UNTDID 1001 code for a standard commercial invoice. */
const INVOICE_TYPE_CODE = '380'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function fmt2(n: number): string {
  return n.toFixed(2)
}

function party(
  tag: 'cac:AccountingSupplierParty' | 'cac:AccountingCustomerParty',
  p: UblPartyInput
): string {
  const taxScheme = p.ice
    ? `<cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(p.ice)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`
    : ''
  const legalEntity = `<cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(p.name)}</cbc:RegistrationName>${
    p.ifNumber ? `<cbc:CompanyID>${escapeXml(p.ifNumber)}</cbc:CompanyID>` : ''
  }</cac:PartyLegalEntity>`

  return `<${tag}><cac:Party><cac:PartyName><cbc:Name>${escapeXml(p.name)}</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>${escapeXml(p.address)}</cbc:StreetName><cbc:CityName>${escapeXml(p.city)}</cbc:CityName><cac:Country><cbc:IdentificationCode>MA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>${taxScheme}${legalEntity}</cac:Party></${tag}>`
}

function invoiceLine(line: UblInvoiceLineInput, index: number, currency: string): string {
  return `<cac:InvoiceLine><cbc:ID>${index + 1}</cbc:ID><cbc:InvoicedQuantity>${line.quantity}</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="${escapeXml(currency)}">${fmt2(line.lineTotal)}</cbc:LineExtensionAmount><cac:Item><cbc:Description>${escapeXml(line.description)}</cbc:Description></cac:Item><cac:Price><cbc:PriceAmount currencyID="${escapeXml(currency)}">${fmt2(line.unitPrice)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`
}

/**
 * Generate a UBL 2.1 Invoice XML document. TVA is always represented as a fully exempt
 * (0%) tax category — AE are out of VAT scope under Loi 114-13 (CLAUDE.md §3), never
 * "TVA non applicable" via the French CGI Article 293B mention, which does not apply here.
 */
export function mapInvoiceToUbl(input: UblInvoiceInput): string {
  const { invoiceNumber, issueDate, currency, seller, buyer, lines, totalMad } = input

  const lineExtensionTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Invoice xmlns="${UBL_NS}" xmlns:cbc="${CBC_NS}" xmlns:cac="${CAC_NS}"><cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID><cbc:IssueDate>${escapeXml(issueDate)}</cbc:IssueDate><cbc:InvoiceTypeCode>${INVOICE_TYPE_CODE}</cbc:InvoiceTypeCode><cbc:Note>${escapeXml(input.notesFr)}</cbc:Note><cbc:Note>${escapeXml(input.notesAr)}</cbc:Note><cbc:DocumentCurrencyCode>${escapeXml(currency)}</cbc:DocumentCurrencyCode>${party('cac:AccountingSupplierParty', seller)}${party('cac:AccountingCustomerParty', buyer)}<cac:TaxTotal><cbc:TaxAmount currencyID="${escapeXml(currency)}">0.00</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="${escapeXml(currency)}">${fmt2(totalMad)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${escapeXml(currency)}">0.00</cbc:TaxAmount><cac:TaxCategory><cbc:ID>E</cbc:ID><cbc:Percent>0</cbc:Percent><cbc:TaxExemptionReasonCode>VATEX-MA-AE</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>${escapeXml(input.notesFr)}</cbc:TaxExemptionReason><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${escapeXml(currency)}">${fmt2(lineExtensionTotal)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="${escapeXml(currency)}">${fmt2(totalMad)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="${escapeXml(currency)}">${fmt2(totalMad)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${escapeXml(currency)}">${fmt2(totalMad)}</cbc:PayableAmount></cac:LegalMonetaryTotal>${lines.map((l, i) => invoiceLine(l, i, currency)).join('')}</Invoice>`

  return xml
}
