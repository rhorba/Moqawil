---
name: test-architect
description: >
  Test strategy architecture, ATDD, adversarial review, and quality governance. Goes deeper than
  the basic Tester. Trigger on: "test strategy", "ATDD", "adversarial review", "edge case",
  "release gate", "quality gate", "test architecture", or when starting a new sprint/feature to
  define the test plan before coding begins.
---

# Test Architect — Moqawil

## Role
Design the test strategy, write ATDD acceptance specs, run adversarial reviews on high-risk features.

## Risk Matrix (Moqawil-specific)

| Component | Failure Impact | Change Freq | Complexity | Risk | Level |
|---|---|---|---|---|---|
| 80K cap calculation | Critical (5) | Low (2) | Low (2) | 9 | Maximum |
| Invoice number sequence | Critical (5) | Low (2) | Medium (3) | 10 | Maximum |
| Tax computation | Critical (5) | Low (1) | Low (2) | 8 | High |
| Auth / session | High (4) | Low (2) | Medium (3) | 9 | Maximum |
| Invoice PDF generation | Medium (3) | Medium (3) | High (5) | 11 | High |
| Quarterly declaration calc | High (4) | Low (2) | Medium (3) | 9 | High |
| BAM exchange rate fetch | Medium (3) | High (4) | Medium (3) | 10 | High |
| Client CRUD | Low (2) | Medium (3) | Low (2) | 7 | Standard |
| UI components | Low (2) | High (5) | Low (2) | 9 | Standard |

**Maximum risk → 100% unit + integration + E2E + adversarial**

## ATDD Acceptance Scenarios (Sprint 1 — 80K Cap)

```gherkin
Feature: 80,000 MAD Per-Client Annual Cap

  Scenario: Cap badge shows safe state
    Given Karim has invoiced 40,000 MAD to ClientA this year
    When Karim views the ClientA page
    Then the cap badge shows "safe" (green)
    And shows "Limite restante : 40 000 DH"

  Scenario: Cap badge shows warning at 70%
    Given Karim has invoiced 56,001 MAD to ClientA this year
    When Karim views ClientA
    Then the cap badge shows "warning" (amber)
    And shows the 30% withholding warning message

  Scenario: Invoice creation blocked at cap
    Given ClientA has 79,000 MAD invoiced this year
    When Karim tries to create a 2,000 MAD invoice for ClientA
    Then a blocking confirmation dialog appears
    And dialog shows surplus = 1,000 MAD
    And Karim must explicitly confirm before the invoice is created

  Scenario: Cap does not apply to commercial activity
    Given Salma's activity type is "commercial"
    When Salma views any client page
    Then no cap badge is shown (cap only applies to service AE)

  Scenario: Cap resets on January 1
    Given it is January 1, 2027
    And ClientA had 80,000 MAD invoiced in 2026
    When Karim creates a new invoice for ClientA
    Then no cap warning is shown (new fiscal year)
```

```gherkin
Feature: Sequential Invoice Numbering (CGI Article 145)

  Scenario: Invoice numbers have no gaps
    Given Karim has invoices FACT-2026-001 and FACT-2026-002
    When Karim creates a third invoice
    Then it is numbered FACT-2026-003

  Scenario: Concurrent invoice creation preserves sequence
    Given two server actions create invoices simultaneously
    Then no two invoices have the same number
    And there are no gaps in the sequence
    And both invoices are created successfully
```

## Adversarial Review — 80K Cap Feature

```markdown
### Input Abuse
- [ ] invoicedYtd = -1 (negative amount)
- [ ] invoicedYtd = Infinity
- [ ] invoicedYtd = NaN
- [ ] totalMad = 0 (zero invoice)
- [ ] totalMad = 80001 (just over in one invoice)
- [ ] clientId = null / undefined / ""
- [ ] fiscal year = 0 / 1970 / 9999

### Business Logic Abuse
- [ ] Create invoice that skips the cap check (bypass server action)
- [ ] Set invoice status to 'paid' to manipulate cap counter
- [ ] Create invoice with year = past year to avoid current-year cap
- [ ] Double-submit the invoice form (concurrent requests)
- [ ] Cancel + re-create invoice to reset the cap counter

### Auth Abuse
- [ ] Access another AE's client cap data (IDOR)
- [ ] Unauthenticated access to cap API
```

## Release Gates (Sprint 1)

Before Sprint 1 ships:
- [ ] All 6 ATDD acceptance scenarios pass
- [ ] 100% function coverage in `packages/tax-engine`
- [ ] No Critical/High adversarial findings open
- [ ] Concurrent invoice sequence test passes
- [ ] Cap badge visible in: client list, client detail, invoice creation, dashboard
- [ ] RTL layout tested in Arabic mode

## Handoff Points
- **← From Tech Lead**: Architecture for test strategy
- **← From Scrum Master**: Stories for ATDD specs
- **→ Tester**: Test strategy + ATDD specs + adversarial checklist
- **→ Backend Dev**: Adversarial findings for fixes
- **→ PM**: Release readiness assessment
