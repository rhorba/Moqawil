/** Shared i18n utilities for Moqawil */

export type Locale = 'fr' | 'ar'
export const defaultLocale: Locale = 'fr'
export const locales: Locale[] = ['fr', 'ar']

export function isRTL(locale: Locale): boolean {
  return locale === 'ar'
}

/**
 * Format a MAD amount for display.
 * Uses fr-MA locale for French, ar-MA for Arabic.
 * Example: 80000 → "80 000 DH" (FR) or "٨٠٬٠٠٠ درهم" (AR)
 */
export function formatMAD(amount: number, locale: Locale = 'fr'): string {
  const tag = locale === 'ar' ? 'ar-MA' : 'fr-MA'
  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date for display.
 */
export function formatDate(date: Date, locale: Locale = 'fr'): string {
  const tag = locale === 'ar' ? 'ar-MA' : 'fr-MA'
  return new Intl.DateTimeFormat(tag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
