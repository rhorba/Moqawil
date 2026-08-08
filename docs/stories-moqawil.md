# Stories: Moqawil
**PRD**: docs/prd-moqawil.md
**Architecture**: docs/architecture-moqawil.md
**Test Strategy**: docs/test-strategy-moqawil.md
**Version**: 1.0 | **Date**: 2026-08-08 | **Author**: Scrum Master (+ Test Architect ATDD) | **Status**: Retroactive for Sprints 0-3 (built), forward-looking for Sprint 4+

---

## Epic 1: Onboarding & AE Profile
Foundation every other epic depends on — an entrepreneur can't invoice without a profile.

### Story 1.1: AE profile onboarding
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev + Frontend Dev | **Sprint**: 0-1 (done)

**Acceptance Criteria**:
```gherkin
Given a new user has signed in via Google or email magic link
When they complete onboarding with full name, ICE, IF, activity type, address, and invoice prefix
Then their entrepreneur profile is created
And ICE is validated as 15 digits with a checksum
And their activity type determines their applicable revenue threshold and tax rate
```

---

## Epic 2: Compliant Invoicing
The table-stakes feature — but done to a legal standard no competitor matches.

### Story 2.1: Client management with cap awareness
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev + Frontend Dev | **Sprint**: 1 (done)
```gherkin
Given an entrepreneur views their client list
When a client has invoices this year
Then a cap badge shows the client's percent-of-80K status in green/amber/red
```

### Story 2.2: Invoice creation with mandatory legal fields
**Priority**: Must | **Size**: L | **Specialist**: Backend Dev + Frontend Dev | **Sprint**: 1 (done)
```gherkin
Given an entrepreneur creates an invoice for a client
When the invoice is generated
Then it contains every CGI Art. 145 mandatory field: sequential number, issue date,
  seller ICE/IF, client ICE (if MA company), line items, total, "TVA non applicable",
  and payment method
And the invoice number has no gaps (advisory-lock enforced, docs/database-moqawil.md §5)
```

### Story 2.3: Bilingual PDF generation
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev | **Sprint**: 1 (done)
```gherkin
Given a sent invoice
When the PDF is downloaded
Then legal mentions appear in French and Arabic
And the layout passes manual review by a Moroccan chartered accountant (DoD item)
```

### Story 2.4: Foreign-currency invoicing
**Priority**: Should | **Size**: M | **Specialist**: Backend Dev | **Sprint**: 1-2 (done)
```gherkin
Given an entrepreneur invoices a foreign client in EUR/USD/GBP/CHF/CAD
When the invoice is generated
Then the PDF shows both the foreign amount and the MAD equivalent at the Bank Al-Maghrib
  reference rate, dated
And if the BAM scrape fails, the entrepreneur can enter the rate manually
```

---

## Epic 3: The 80K Cap Tracker (the wedge feature)
No competitor ships this — it is the product's actual reason to exist.

### Story 3.1: Live per-client cap tracking
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev + Frontend Dev | **Sprint**: 1 (done)
```gherkin
Given a service-type entrepreneur has invoiced a client this calendar year
When they view that client anywhere in the app
Then a badge shows remaining capacity to the 80,000 MAD cap in real time
```

### Story 3.2: Blocking confirmation on cap breach
**Priority**: Must | **Size**: S | **Specialist**: Frontend Dev | **Sprint**: 1 (done)
```gherkin
Given creating an invoice would push a client's YTD total past 80,000 MAD
When the entrepreneur attempts to save the invoice
Then a dialog blocks submission, explaining the client must withhold 30% on the surplus
And the entrepreneur must explicitly confirm before the invoice is created
```

---

## Epic 4: Annual Threshold & Quarterly Declarations
Turns "eventually lose AE status without knowing why" into a visible, managed process.

### Story 4.1: Annual threshold dashboard widget
**Priority**: Must | **Size**: S | **Specialist**: Frontend Dev | **Sprint**: 2 (done)
```gherkin
Given an entrepreneur's YTD turnover approaches their activity-type threshold
  (200K services / 500K other)
When they view the dashboard
Then a color-coded progress bar shows their status
And email alerts fire at 70%, 90%, and 100% of threshold
```

### Story 4.2: Quarterly declaration generator
**Priority**: Must | **Size**: L | **Specialist**: Backend Dev | **Sprint**: 2 (done)
```gherkin
Given an entrepreneur has paid invoices within a quarter
When they generate that quarter's declaration
Then turnover and tax due are auto-calculated at the correct rate (0.5%/1%)
And a printable PDF is produced matching the Barid Al-Maghrib form layout
```

---

## Epic 5: Bilingual FR/AR UI
Not a translation layer bolted on — a first-class requirement from the start.

### Story 5.1: Locale toggle with full RTL
**Priority**: Must | **Size**: M | **Specialist**: Frontend Dev | **Sprint**: 2 (done)
```gherkin
Given a user switches locale to Arabic
When they navigate the app
Then layout direction is `rtl`, using logical CSS properties throughout
And an RTL audit found and fixed 6 files with hardcoded left/right assumptions
```

---

## Epic 6: Self-Hosting
The trust model: AE users should never have to hand financial data to a third party.

### Story 6.1: One-command self-host
**Priority**: Must | **Size**: M | **Specialist**: DevOps/DevSecOps | **Sprint**: 2 (done)
```gherkin
Given a fresh Ubuntu VPS with Docker installed
When the operator runs `docker compose up -d`
Then web, postgres, and Caddy (auto-HTTPS) containers start
And migrations apply automatically (fixed 2026-08-08 — meta/_journal.json
  was previously gitignored, breaking this on a genuinely fresh checkout)
```

---

## Epic 7: E2E Verification & Docs (Sprint 3)
### Story 7.1: Happy-path E2E coverage
**Priority**: Must | **Size**: L | **Specialist**: Tester | **Sprint**: 3 (done)
```gherkin
Given a fresh test database
When the Playwright suite runs the full flow: signup → onboard → create client
  → create invoice → mark paid → see cap update → generate declaration
Then all steps pass
```

### Story 7.2: Public docs site
**Priority**: Must | **Size**: M | **Specialist**: Frontend Dev | **Sprint**: 3 (in progress — S3-08 DoD check still open)
```gherkin
Given the Docusaurus site in moqawil/docs/
When a user visits the installation, invoicing, or declaration guide
Then they find FR-primary instructions matching the actual current UI
```

---

## Epic 8: E-Invoicing Format Readiness (Sprint 4, planned)
See `docs/prd-sprint4-e-invoicing.md` and `docs/architecture-sprint4-e-invoicing.md` for full detail — full stories live in `.claude/sprint-backlog/sprint-4.md` rather than duplicated here, since this epic is still in planning, not built.

---

## Traceability
```
PRD Requirement → Architecture ADR → Story → Acceptance Test → Code → Tester passes
```
Nothing here was built without a corresponding requirement; nothing ships untested.
