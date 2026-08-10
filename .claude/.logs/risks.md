# Risk Log

### 2026-05-19 00:00 TECHNICAL — Auth.js v5 breaking changes
- **Specialist**: Tech Lead
- **Summary**: Auth.js v5 has a different API from v4. Must pin version and test all auth flows.
- **Probability**: high | **Mitigation**: Pin exact version in package.json; test sign-in, magic link, session
- **Status**: CLOSED (2026-08-10, Sprint 5 S5-03)
- **Impact**: medium
- **Resolution evidence**: Confirmed `trustHost: true` present in both `src/lib/auth.ts:13` and `src/lib/auth.config.ts:10` (the second, Edge-runtime-safe config used by middleware, was the one that shipped with a real self-host-breaking gap during Sprint 3.5 — see `.logs/activity.md` 2026-08-08 14:25 entry — now fixed in both places). CI's e2e job (`auth-redirect` + smoke suite) has been green for the last 5 consecutive runs on `master`, most recently run `31278744178`.
---

### 2026-05-19 00:00 INTEGRATION — BAM rate scraper may break
- **Specialist**: Tech Lead
- **Summary**: bkam.ma has no public API. Scraper may break on site changes.
- **Probability**: medium | **Mitigation**: Build manual entry fallback from day 1. Document as known limitation.
- **Status**: CLOSED (2026-08-10, Sprint 5 S5-01/S5-02) — this had already happened, undetected, since the scraper was first written
- **Impact**: was high in practice, not low — see below
- **Resolution evidence**: Live-fetched the real page and found the scraper's hardcoded URL (`https://www.bkam.ma/Marches/Cours-des-devises`) returns an actual HTTP 404 — it had never worked in production. The graceful fallback masked this completely (app always showed "manual entry" with no visible error trail pointing at the real cause). The real page is `/Marches/Principaux-indicateurs/Marche-des-changes/Cours-de-change/Cours-de-reference` ("Cours de référence" — incidentally the exact legal term CLAUDE.md §3 uses for the foreign-invoice conversion rate). Root cause behind it staying hidden: the unit test suite tested a hand-invented HTML structure that was never validated against the real page, not the actual `parseRates` function (route.ts couldn't export it directly — Next.js route files may only export route handlers). Fixed: extracted `parseRates` to `src/lib/bam-parser.ts` so it's directly testable, rewrote the parser to match the real markup (currency identified via `title="1 EURO (EUR)"` anchors, values in `<span class="number">`), added a real-fixture-backed test suite (`__tests__/fixtures/bkam-cours-reference.sample.html`, captured live) plus a regression guard asserting the URL never points back at the old 404 path. Verified: 12/12 new tests pass, typecheck clean, lint clean.
---

### 2026-05-19 00:00 LEGAL — Tax rate constants need legal citations
- **Specialist**: Security Engineer
- **Summary**: Tax engine constants (80K cap, 0.5%/1% rates) must have CGI/Finance Law citations in code comments.
- **Probability**: certain | **Mitigation**: Add citation comments when writing tax-engine package.
- **Status**: open
- **Impact**: high
---
