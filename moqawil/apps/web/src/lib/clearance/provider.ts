/**
 * Adapter boundary for DGI e-invoicing clearance submission (docs/architecture-sprint4-e-invoicing.md ADR-2).
 *
 * The real DGI/xHub clearance API's availability is unconfirmed as of 2026-08 — this interface
 * exists so invoice creation and UBL export never depend on it being reachable. v0.1 ships only
 * NoOpClearanceProvider. A real DgiXhubClearanceProvider is Sprint 5+ scope, gated on actually
 * getting registered API/sandbox access (a business/registration step, not a code change).
 */

export type ClearanceResult =
  | { status: 'not_applicable' }
  | { status: 'submitted'; clearanceId: string }
  | { status: 'rejected'; reason: string }

export interface ClearanceProvider {
  /** Submit a UBL 2.1 invoice XML for clearance. Never throws — callers get a result, not an exception. */
  submitInvoice(ublXml: string): Promise<ClearanceResult>
}

/**
 * v0.1 default. Always reports 'not_applicable' — no submission is attempted. This is what lets
 * Moqawil generate UBL 2.1 XML and honestly label it "format-ready" without claiming DGI has
 * actually cleared anything (see Sprint 4 DoD: no UI copy may imply certification).
 */
export class NoOpClearanceProvider implements ClearanceProvider {
  async submitInvoice(_ublXml: string): Promise<ClearanceResult> {
    return { status: 'not_applicable' }
  }
}

export function getClearanceProvider(): ClearanceProvider {
  return new NoOpClearanceProvider()
}
