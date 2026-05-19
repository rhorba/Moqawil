/**
 * BAM Exchange Rate API
 * Scrapes daily reference rates from Bank Al-Maghrib (bkam.ma).
 * Falls back gracefully if scrape fails — returns null rates + error flag.
 * Cached 24h via Next.js unstable_cache.
 *
 * Known limitation (CLAUDE.md §15): bkam.ma has no public API.
 * We scrape the HTML rates table and extract "cours moyen" (MAD per foreign unit).
 */
import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

export const revalidate = 86400

interface BamRates {
  EUR: number | null
  USD: number | null
  GBP: number | null
  CHF: number | null
  CAD: number | null
  fetchedAt: string
  source: 'bkam' | 'fallback'
  error?: string
}

/** Extract "cours moyen" from bkam.ma HTML rates table. */
function parseRates(html: string): Record<string, number> {
  const rates: Record<string, number> = {}
  for (const currency of ['EUR', 'USD', 'GBP', 'CHF', 'CAD']) {
    // Match currency code + 3 numeric columns: achat | vente | cours moyen
    const regex = new RegExp(
      `${currency}[^\\d]*([\\d]+[,.]?[\\d]*)[^\\d]*([\\d]+[,.]?[\\d]*)[^\\d]*([\\d]+[,.]?[\\d]*)`,
      'i'
    )
    const match = html.match(regex)
    if (match) {
      const rate = parseFloat(match[3].replace(',', '.'))
      if (!isNaN(rate) && rate > 1 && rate < 25) rates[currency] = rate
    }
  }
  return rates
}

const fetchBamRates = unstable_cache(
  async (): Promise<BamRates> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch('https://www.bkam.ma/Marches/Cours-des-devises', {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Moqawil/1.0)', Accept: 'text/html' },
      })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      const parsed = parseRates(html)
      if (!parsed['EUR'] && !parsed['USD']) throw new Error('Parse failed — no rates found')
      return {
        EUR: parsed['EUR'] ?? null,
        USD: parsed['USD'] ?? null,
        GBP: parsed['GBP'] ?? null,
        CHF: parsed['CHF'] ?? null,
        CAD: parsed['CAD'] ?? null,
        fetchedAt: new Date().toISOString(),
        source: 'bkam',
      }
    } catch (err) {
      clearTimeout(timeout)
      return {
        EUR: null, USD: null, GBP: null, CHF: null, CAD: null,
        fetchedAt: new Date().toISOString(),
        source: 'fallback',
        error: `Taux BAM indisponibles (${err instanceof Error ? err.message : 'erreur'}).`,
      }
    }
  },
  ['bam-rates'],
  { revalidate: 86400 }
)

export async function GET() {
  const rates = await fetchBamRates()
  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  })
}
