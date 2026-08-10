/**
 * Sprint 5 (S5-10): real OASIS UBL 2.1 XSD schema validation for
 * `mapInvoiceToUbl`'s output, replacing Sprint 4's known gap — the original
 * suite only checked well-formedness and top-level element *order* by hand,
 * never validated against the actual schema (see fixtures/xsd/README.md for
 * provenance). The fast heuristic checks in ubl-mapper.test.ts stay — they
 * still catch regressions without needing `xmllint` installed — this file
 * is the genuine correctness check.
 *
 * Requires the `xmllint` binary (libxml2-utils) on PATH. Skipped gracefully
 * if it isn't found rather than failing local dev machines that don't have
 * it — CI's `test` job installs it explicitly (see .github/workflows/ci.yml).
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type UblInvoiceInput, mapInvoiceToUbl } from '../src/e-invoicing/ubl-mapper'

const XSD_ENTRY_POINT = join(__dirname, 'fixtures/xsd/maindoc/UBL-Invoice-2.1.xsd')

function xmllintAvailable(): boolean {
  try {
    // Fixed argv, no shell involved (S5-11 security check) — see the
    // validate() helper below for the same rationale.
    execFileSync('xmllint', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const SKIP_NO_XMLLINT = !xmllintAvailable()

/**
 * Validates `xml` against the vendored OASIS schema by shelling out to
 * `xmllint --noout --schema`. Uses `execFileSync` with a fixed argument
 * array — never `exec()` with a concatenated shell string — so there is no
 * command-injection surface even though the XML content originates from
 * (trusted, developer-authored) test fixtures, not user input.
 */
function validateAgainstXsd(xml: string, tmpDir: string, filename: string): void {
  const xmlPath = join(tmpDir, filename)
  writeFileSync(xmlPath, xml, 'utf8')
  execFileSync('xmllint', ['--noout', '--schema', XSD_ENTRY_POINT, xmlPath], {
    stdio: 'pipe', // capture stderr into the thrown error instead of printing to the test runner's console
  })
}

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

describe.skipIf(SKIP_NO_XMLLINT)('mapInvoiceToUbl — real OASIS UBL 2.1 XSD validation', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'moqawil-ubl-xsd-'))
  })

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('validates a representative invoice against the real schema (not just structural heuristics)', () => {
    const xml = mapInvoiceToUbl(baseInput)
    expect(() => validateAgainstXsd(xml, tmpDir, 'valid.xml')).not.toThrow()
  })

  it('validates a foreign-currency invoice with no ICE (individual buyer)', () => {
    const input: UblInvoiceInput = {
      ...baseInput,
      currency: 'EUR',
      buyer: { name: 'Jean Dupont', address: '10 Rue de Paris', city: 'Paris' },
    }
    const xml = mapInvoiceToUbl(input)
    expect(() => validateAgainstXsd(xml, tmpDir, 'foreign-currency.xml')).not.toThrow()
  })

  it('validates an invoice with special characters requiring XML escaping', () => {
    const input: UblInvoiceInput = {
      ...baseInput,
      buyer: { ...baseInput.buyer, name: 'Société "A & B" <Test>' },
    }
    const xml = mapInvoiceToUbl(input)
    expect(() => validateAgainstXsd(xml, tmpDir, 'escaped.xml')).not.toThrow()
  })

  it('rejects XML that violates the schema (proves this is real validation, not a no-op)', () => {
    // Delete the mandatory cbc:ID element — the schema requires it.
    const xml = mapInvoiceToUbl(baseInput).replace(
      `<cbc:ID>${baseInput.invoiceNumber}</cbc:ID>`,
      ''
    )
    expect(() => validateAgainstXsd(xml, tmpDir, 'invalid-missing-id.xml')).toThrow()
  })
})
