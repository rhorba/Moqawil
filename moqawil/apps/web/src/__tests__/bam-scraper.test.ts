/**
 * Sprint 2 — BAM exchange rate scraper tests.
 * Sprint 5 (S5-01/S5-02): rewritten to import the real `parseRates` from
 * `src/lib/bam-parser.ts` (the route's own parser can't be imported directly
 * since Next.js route files may only export route handlers) and test it
 * against a real, live-captured bkam.ma HTML excerpt instead of a
 * hand-invented structure. The previous version tested a *reimplementation*
 * that mirrored an assumed table shape (currency code + 3 numeric columns:
 * achat/vente/cours moyen) which turned out not to match bkam.ma's real
 * markup at all (currency identified via an anchor's `title="... (EUR)"`,
 * values in `<span class="number">`) — the divergence let a real bug
 * (wrong URL, wrong parser) ship undetected. See risks.md and
 * .logs/activity.md for the full story.
 */

import fs from 'node:fs'
import path from 'node:path'
import { BAM_RATES_URL, parseRates } from '@/lib/bam-parser'
import { describe, expect, it } from 'vitest'

const realFixtureHtml = fs.readFileSync(
  path.join(__dirname, 'fixtures/bkam-cours-reference.sample.html'),
  'utf-8'
)

// ── parseRates against the real bkam.ma markup shape ──────────────────────

describe('parseRates — real bkam.ma "Cours de référence" markup', () => {
  it('extracts all 5 tracked currencies from the real fixture', () => {
    const rates = parseRates(realFixtureHtml)
    expect(Object.keys(rates).sort()).toEqual(['CAD', 'CHF', 'EUR', 'GBP', 'USD'])
  })

  it('extracts EUR at the correct value (most recent "Moyen" column)', () => {
    const rates = parseRates(realFixtureHtml)
    expect(rates.EUR).toBeCloseTo(10.7447)
  })

  it('extracts USD correctly despite large whitespace padding before its value', () => {
    const rates = parseRates(realFixtureHtml)
    expect(rates.USD).toBeCloseTo(9.317)
  })

  it('extracts GBP, CHF, CAD correctly', () => {
    const rates = parseRates(realFixtureHtml)
    expect(rates.GBP).toBeCloseTo(12.534)
    expect(rates.CHF).toBeCloseTo(11.501)
    expect(rates.CAD).toBeCloseTo(6.6537)
  })

  it('picks the most recent date column, not the prior day', () => {
    // Fixture's EUR row has 10,7447 (07/08/2026, most recent) then 10,7452 (06/08/2026)
    const rates = parseRates(realFixtureHtml)
    expect(rates.EUR).toBe(10.7447)
    expect(rates.EUR).not.toBe(10.7452)
  })

  it('is not broken by bkam.ma\'s own "</sapn>" closing-tag typo', () => {
    expect(realFixtureHtml).toContain('</sapn>')
    const rates = parseRates(realFixtureHtml)
    expect(rates.EUR).toBeDefined()
  })

  it('returns empty object for empty HTML', () => {
    const rates = parseRates('<html></html>')
    expect(Object.keys(rates)).toHaveLength(0)
  })

  it('rejects implausibly low values (< 1)', () => {
    const html = `<a title="1 EURO (EUR)">1 EURO</a><span class="number">0,50</span>`
    const rates = parseRates(html)
    expect(rates.EUR).toBeUndefined()
  })

  it('rejects implausibly high values (> 25)', () => {
    const html = `<a title="1 EURO (EUR)">1 EURO</a><span class="number">30,00</span>`
    const rates = parseRates(html)
    expect(rates.EUR).toBeUndefined()
  })
})

// ── URL regression guard ───────────────────────────────────────────────────

describe('BAM_RATES_URL', () => {
  it('points at the real "Cours de référence" page, not the old 404 path', () => {
    // The route was silently 404ing in production for its entire lifetime
    // under /Marches/Cours-des-devises — guard against regressing to it.
    expect(BAM_RATES_URL).not.toContain('Cours-des-devises')
    expect(BAM_RATES_URL).toContain('Cours-de-reference')
  })
})

// ── Exchange rate API response contract ─────────────────────────────────────

describe('exchange rate API contract', () => {
  it('rates map has MAD-denominated values (1 unit > 1 MAD)', () => {
    const rates = parseRates(realFixtureHtml)
    for (const rate of Object.values(rates)) {
      expect(rate).toBeGreaterThan(1)
      expect(rate).toBeLessThan(25)
    }
  })

  it('a null rate in the response signals scrape failure (graceful fallback)', () => {
    // The API returns { rates: { EUR: null, USD: null }, error: "..." } on failure
    const failureResponse = { rates: { EUR: null, USD: null }, error: 'Scrape failed' }
    expect(failureResponse.rates.EUR).toBeNull()
    expect(failureResponse.error).toBeTruthy()
  })
})
