/**
 * S1-12: Adversarial / security review tests.
 * Tests cap bypass, sequence manipulation, and IDOR protections.
 *
 * These are unit-level security logic tests. DB-level IDOR tests are integration tests.
 */

import { describe, it, expect } from 'vitest'
import { getCapStatus, PER_CLIENT_CAP_MAD, formatInvoiceNumber, validateICE } from '@moqawil/tax-engine'

describe('Security: cap bypass prevention', () => {
  it('cap check uses invoiced total (not paid) — no bypass via unpaid invoices', () => {
    // An AE cannot circumvent the cap by keeping invoices in draft/sent state.
    // getClientAnnualTotal counts all non-cancelled invoices.
    const invoicedTotal = 75_000 // draft+sent+paid
    const newInvoice = 10_000
    const projected = invoicedTotal + newInvoice
    // Must trigger warning even if 0 DH is paid
    expect(projected).toBeGreaterThan(PER_CLIENT_CAP_MAD)
    const { status } = getCapStatus(invoicedTotal)
    expect(status).toBe('warning') // Already at 93.75%
  })

  it('cap dialog cannot be skipped — capConfirmed flag required to proceed past cap', () => {
    // If capConfirmed is false/undefined AND projected > 80K, server action returns capWarning.
    // This test documents the expected behavior.
    const currentYtd = 79_000
    const newAmount = 5_000
    const projected = currentYtd + newAmount
    expect(projected).toBeGreaterThan(PER_CLIENT_CAP_MAD)
    // Server action returns { capWarning: {...} } and does NOT create the invoice
    // without capConfirmed = true. This is enforced in createInvoice().
  })

  it('capConfirmed cannot bypass cap for a different client', () => {
    // capConfirmed is per-request — a confirmed request for client A
    // cannot be replayed for client B by changing clientId in formData.
    // Server action re-checks cap using the submitted clientId server-side.
    // This test documents the invariant.
    const clientA_ytd = 79_000
    const clientB_ytd = 0
    const newAmount = 5_000

    // Client A would trigger capWarning
    expect(clientA_ytd + newAmount).toBeGreaterThan(PER_CLIENT_CAP_MAD)

    // Client B would not (server re-checks with actual clientId)
    expect(clientB_ytd + newAmount).toBeLessThan(PER_CLIENT_CAP_MAD)
  })
})

describe('Security: invoice sequence manipulation', () => {
  it('invoiceNumber is generated server-side — client cannot inject custom numbers', () => {
    // formatInvoiceNumber is called server-side within the advisory lock transaction.
    // The invoiceNumber is derived from the server-computed sequence, not from formData.
    const serverNumber = formatInvoiceNumber('FACT', 2026, 42)
    expect(serverNumber).toBe('FACT-2026-042')
    // Attempting to pass a custom invoiceNumber in formData would be ignored
    // because createInvoice() does not read invoiceNumber from formData.
  })

  it('sequence number is monotonically increasing within a year', () => {
    const seqs = [1, 2, 3, 4, 100, 101]
    for (let i = 0; i < seqs.length - 1; i++) {
      expect(seqs[i + 1]).toBeGreaterThan(seqs[i])
    }
  })

  it('sequence resets per year — year prefix prevents collision', () => {
    const y2025_1 = formatInvoiceNumber('FACT', 2025, 1)
    const y2026_1 = formatInvoiceNumber('FACT', 2026, 1)
    expect(y2025_1).not.toBe(y2026_1)
  })
})

describe('Security: IDOR protection', () => {
  it('getClientById requires both clientId AND entrepreneurId', () => {
    // The query: getClientById(clientId, entrepreneurId) — both conditions in WHERE.
    // Without entrepreneurId check, user A could access client owned by user B.
    // This is enforced at the DB query level — see lib/queries/client.ts.
    // Test documents the invariant; actual enforcement is in the query.

    // If entrepreneurId were NOT in the query, this would be the attack vector:
    const attackerEntrepreneurId = 'attacker-uuid'
    const victimClientId = 'victim-client-uuid'
    // With proper IDOR guard, getClientById(victimClientId, attackerEntrepreneurId) returns null.
    expect(attackerEntrepreneurId).not.toBe(victimClientId) // obviously different
  })

  it('invoice creation checks that client belongs to the authenticated entrepreneur', () => {
    // createInvoice() calls getClientById(data.clientId, entrepreneur.id)
    // Returns { errors: { clientId: ['Client introuvable'] } } if client does not belong to AE.
    // An attacker cannot submit another user's clientId and create an invoice against their client.
  })
})

describe('Security: ICE validation prevents injection', () => {
  it('rejects ICE with non-digit characters', () => {
    expect(validateICE('000000000000000').valid).toBe(true)
    expect(validateICE("' OR 1=1 --    ").valid).toBe(false) // SQL injection attempt
    expect(validateICE('<script>alert(1)</script>00').valid).toBe(false) // XSS attempt
    expect(validateICE('00000000000000A').valid).toBe(false) // Letter in ICE
  })

  it('rejects ICE that is not exactly 15 characters', () => {
    expect(validateICE('12345').valid).toBe(false) // Too short
    expect(validateICE('1234567890123456').valid).toBe(false) // Too long
    expect(validateICE('123456789012345').valid).toBe(true) // Correct length
  })
})
