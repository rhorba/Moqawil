/**
 * BAM Exchange Rate API
 * Scrapes daily reference rates ("Cours de référence") from Bank Al-Maghrib (bkam.ma).
 * Falls back gracefully if scrape fails — returns null rates + error flag.
 * Cached 24h via Next.js unstable_cache.
 *
 * Known limitation (CLAUDE.md §15): bkam.ma has no public API.
 * We scrape the HTML rates table and extract the most recent "Moyen" column
 * (MAD per foreign unit) for each tracked currency. Parsing lives in
 * `src/lib/bam-parser.ts` rather than here because a Next.js route file may
 * only export route handlers (GET/POST/...) — anything else fails the build.
 *
 * Sprint 5 (S5-01): the URL and parser were live-verified against the real
 * page on 2026-08-10 — the previous URL (`/Marches/Cours-des-devises`) had
 * been a live 404 since this route was first written, so the scraper had
 * silently fallen back to manual entry on every single request in
 * production. See `__tests__/fixtures/bkam-cours-reference.sample.html` for
 * the real markup shape.
 */
import { BAM_RATES_URL, parseRates } from '@/lib/bam-parser'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'

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

const fetchBamRates = unstable_cache(
  async (): Promise<BamRates> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(BAM_RATES_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Moqawil/1.0)', Accept: 'text/html' },
      })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      const parsed = parseRates(html)
      if (!parsed.EUR && !parsed.USD) throw new Error('Parse failed — no rates found')
      return {
        EUR: parsed.EUR ?? null,
        USD: parsed.USD ?? null,
        GBP: parsed.GBP ?? null,
        CHF: parsed.CHF ?? null,
        CAD: parsed.CAD ?? null,
        fetchedAt: new Date().toISOString(),
        source: 'bkam',
      }
    } catch (err) {
      clearTimeout(timeout)
      return {
        EUR: null,
        USD: null,
        GBP: null,
        CHF: null,
        CAD: null,
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
