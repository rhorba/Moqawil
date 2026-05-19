# Risk Log

### 2026-05-19 00:00 TECHNICAL — Auth.js v5 breaking changes
- **Specialist**: Tech Lead
- **Summary**: Auth.js v5 has a different API from v4. Must pin version and test all auth flows.
- **Probability**: high | **Mitigation**: Pin exact version in package.json; test sign-in, magic link, session
- **Status**: open
- **Impact**: medium
---

### 2026-05-19 00:00 INTEGRATION — BAM rate scraper may break
- **Specialist**: Tech Lead
- **Summary**: bkam.ma has no public API. Scraper may break on site changes.
- **Probability**: medium | **Mitigation**: Build manual entry fallback from day 1. Document as known limitation.
- **Status**: open
- **Impact**: low
---

### 2026-05-19 00:00 LEGAL — Tax rate constants need legal citations
- **Specialist**: Security Engineer
- **Summary**: Tax engine constants (80K cap, 0.5%/1% rates) must have CGI/Finance Law citations in code comments.
- **Probability**: certain | **Mitigation**: Add citation comments when writing tax-engine package.
- **Status**: open
- **Impact**: high
---
