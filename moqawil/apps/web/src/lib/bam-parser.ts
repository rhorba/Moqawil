export const BAM_RATES_URL =
  'https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-des-changes/Cours-de-change/Cours-de-reference'

/**
 * Extract the "Moyen" (average) reference rate from bkam.ma's "Cours de
 * référence" HTML table. Each currency row identifies itself via an anchor
 * like `title="1 EURO (EUR)"`, followed by two dated "Moyen" columns (most
 * recent business day first) as `<span class="number">10,7447</span>`
 * (bkam.ma's own markup has a `</sapn>` typo on the closing tag — matching
 * only the opening tag avoids depending on it). We take the first (most
 * recent) value.
 */
export function parseRates(html: string): Record<string, number> {
  const rates: Record<string, number> = {}
  for (const currency of ['EUR', 'USD', 'GBP', 'CHF', 'CAD']) {
    const regex = new RegExp(
      `\\(${currency}\\)[\\s\\S]*?<span class="number">\\s*([\\d]+[.,]?[\\d]*)`,
      'i'
    )
    const match = regex.exec(html)
    if (match) {
      const rate = Number.parseFloat(match[1].replace(',', '.'))
      if (!Number.isNaN(rate) && rate > 1 && rate < 25) rates[currency] = rate
    }
  }
  return rates
}
