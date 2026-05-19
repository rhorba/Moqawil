/**
 * @moqawil/tax-engine
 * Morocco auto-entrepreneur tax rules — pure functions, no I/O.
 * Apache-2.0 — freely embeddable in other Moroccan tools.
 *
 * All constants cite their legal source. Tax-rule changes require a legal
 * citation (DGI circular, Finance Law article, CGI reference) in the PR description.
 */

// ── Activity Types ───────────────────────────────────────────────────────────

export type ActivityType = 'commercial' | 'industrial' | 'artisanal' | 'service'

// ── Constants ────────────────────────────────────────────────────────────────

// CGI Article 73-II-G-8° — Finance Law 2023
// An AE service provider cannot invoice more than this per client per calendar year
// without triggering 30% withholding tax on the surplus for the client.
export const PER_CLIENT_CAP_MAD = 80_000

// Law 114-13 (Auto-entrepreneur regime) — annual revenue thresholds
// Exceeding for two consecutive years triggers loss of AE status
export const REVENUE_THRESHOLD_COMMERCIAL = 500_000  // commercial / industrial / artisanal
export const REVENUE_THRESHOLD_SERVICE = 200_000      // services

// Law 114-13 — liberatory tax rates (on turnover, not profit)
export const TAX_RATE_COMMERCIAL = 0.005  // 0.5% — commercial, industrial, artisanal
export const TAX_RATE_SERVICE = 0.010     // 1.0% — services

// CGI Article 73-II-G-8° — withholding rate above the 80K per-client cap
export const WHT_RATE_OVER_CAP = 0.30    // 30% withheld by client on the surplus

// CGI Article 2 — standard VAT rate (AE are out of scope, but useful constant)
export const VAT_STANDARD = 0.20

// CGI Article 193 — cash payment limit for professional clients
// Payments above this require check / virement / effet to allow client deduction
export const CASH_PAYMENT_LIMIT_MAD = 5_000

// CGI Article 193 — cash payments above this trigger a 6% penalty for the buyer
export const CASH_PENALTY_THRESHOLD_MAD = 20_000

// ── Threshold / Cap Logic ────────────────────────────────────────────────────

export type CapStatus = 'safe' | 'warning' | 'over'

export interface CapResult {
  status: CapStatus
  percentOfCap: number
  remainingMad: number
}

/**
 * Compute per-client annual cap status.
 * Applies ONLY to service-type AE (per CGI Article 73-II-G-8°).
 * The caller is responsible for checking activityType === 'service' before invoking.
 */
export function getCapStatus(invoicedYtdToClient: number): CapResult {
  const percent = (invoicedYtdToClient / PER_CLIENT_CAP_MAD) * 100
  const remaining = Math.max(0, PER_CLIENT_CAP_MAD - invoicedYtdToClient)

  let status: CapStatus
  if (percent >= 100) {
    status = 'over'
  } else if (percent >= 70) {
    status = 'warning'
  } else {
    status = 'safe'
  }

  return { status, percentOfCap: percent, remainingMad: remaining }
}

export interface ThresholdResult {
  status: CapStatus
  percentOfThreshold: number
  remainingMad: number
}

/**
 * Compute annual revenue threshold status (Law 114-13).
 * Shows whether the AE is approaching the regime ceiling.
 */
export function getThresholdStatus(
  ytdTurnover: number,
  activityType: ActivityType
): ThresholdResult {
  const threshold = getRevenueThreshold(activityType)
  const percent = (ytdTurnover / threshold) * 100
  const remaining = Math.max(0, threshold - ytdTurnover)

  let status: CapStatus
  if (percent >= 100) {
    status = 'over'
  } else if (percent >= 70) {
    status = 'warning'
  } else {
    status = 'safe'
  }

  return { status, percentOfThreshold: percent, remainingMad: remaining }
}

// ── Tax Computation ──────────────────────────────────────────────────────────

/** Annual revenue threshold for the given activity type. */
export function getRevenueThreshold(activityType: ActivityType): number {
  return activityType === 'service' ? REVENUE_THRESHOLD_SERVICE : REVENUE_THRESHOLD_COMMERCIAL
}

/** Liberatory tax rate for the given activity type. */
export function getTaxRate(activityType: ActivityType): number {
  return activityType === 'service' ? TAX_RATE_SERVICE : TAX_RATE_COMMERCIAL
}

/**
 * Compute quarterly or annual tax due (liberatory).
 * Tax = turnover × rate. Discharges all income tax obligation.
 */
export function computeTax(turnoverMad: number, activityType: ActivityType): number {
  return turnoverMad * getTaxRate(activityType)
}

/**
 * Compute the 30% withholding amount on the surplus above the 80K cap.
 * This is the client's obligation, but affects net received by the AE.
 */
export function computeWithholdingOverCap(amountAboveCapMad: number): number {
  return amountAboveCapMad * WHT_RATE_OVER_CAP
}

// ── Invoice Validation ───────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validate ICE (Identifiant Commun de l'Entreprise).
 * Format: exactly 15 digits. Full OMPIC registry lookup deferred to v0.2.
 * Mandatory on invoices since 2021 for Moroccan B2B (CGI Article 145).
 */
export function validateICE(ice: string): ValidationResult {
  if (!ice) return { valid: false, reason: 'ICE est requis' }
  const cleaned = ice.replace(/\s/g, '')
  if (!/^\d{15}$/.test(cleaned)) {
    return { valid: false, reason: 'ICE doit comporter exactement 15 chiffres' }
  }
  return { valid: true }
}

/**
 * Validate IF (Identifiant Fiscal).
 * Format: 7-8 digits (DGI format). Full validation via tax portal deferred.
 */
export function validateIF(ifNumber: string): ValidationResult {
  if (!ifNumber) return { valid: false, reason: 'IF est requis' }
  const cleaned = ifNumber.replace(/\s/g, '')
  if (!/^\d{7,8}$/.test(cleaned)) {
    return { valid: false, reason: 'IF doit comporter 7 ou 8 chiffres' }
  }
  return { valid: true }
}

/**
 * Format a sequential invoice number per CGI Article 145.
 * Format: {prefix}-{YYYY}-{NNN} — e.g. FACT-2026-001
 * Annual reset is accepted when the year is included in the format.
 */
export function formatInvoiceNumber(prefix: string, year: number, sequence: number): string {
  const seq = String(sequence).padStart(3, '0')
  return `${prefix}-${year}-${seq}`
}

// ── Mandatory Invoice Mentions ───────────────────────────────────────────────

export interface InvoiceContext {
  sellerName: string
  sellerAddress: string
  sellerICE: string
  sellerIF: string
  clientName: string
  clientAddress: string
  clientICE?: string      // Required for Moroccan B2B (company_ma)
  isClientMoroccanB2B: boolean
  totalMad: number
  paymentMethod?: string
  isForeignCurrency?: boolean
  foreignCurrency?: string
  foreignAmount?: number
  exchangeRate?: number
}

/**
 * Generate all mandatory mentions for a compliant Moroccan AE invoice.
 * Sources: CGI Article 145 + Law 114-13 + AE-specific rules.
 *
 * Returns an array of required mention strings in French.
 * PDF templates must include all of these.
 */
export function getMandatoryMentions(ctx: InvoiceContext): string[] {
  const mentions: string[] = [
    'TVA non applicable — Régime auto-entrepreneur (Loi 114-13)',
  ]

  if (ctx.isClientMoroccanB2B && ctx.clientICE) {
    mentions.push(`ICE client : ${ctx.clientICE}`)
  }

  if (ctx.isForeignCurrency && ctx.foreignCurrency && ctx.foreignAmount && ctx.exchangeRate) {
    const rate = ctx.exchangeRate
    mentions.push(
      `Montant en devise : ${ctx.foreignAmount} ${ctx.foreignCurrency}`,
      `Taux de change BAM du jour : 1 ${ctx.foreignCurrency} = ${rate} MAD`,
      'Rapatriement des fonds dans un délai de 3 mois (réglementation des changes)'
    )
  }

  if (ctx.totalMad > CASH_PAYMENT_LIMIT_MAD && ctx.paymentMethod === 'espece') {
    mentions.push(
      `Attention : Paiement en espèces supérieur à ${CASH_PAYMENT_LIMIT_MAD} MAD — ` +
      'le client ne peut pas déduire cette charge (CGI Article 193)'
    )
  }

  if (ctx.totalMad > CASH_PENALTY_THRESHOLD_MAD && ctx.paymentMethod === 'espece') {
    mentions.push(
      `Attention : Paiement en espèces supérieur à ${CASH_PENALTY_THRESHOLD_MAD} MAD — ` +
      'pénalité de 6% applicable pour le client (CGI Article 193)'
    )
  }

  mentions.push(
    'Les factures doivent être conservées pendant 10 ans (CGI Article 211)'
  )

  return mentions
}
