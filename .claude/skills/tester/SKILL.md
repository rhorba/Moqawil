---
name: tester
description: >
  QA and testing skill. AUTO-TRIGGERED after every code task (Backend/Frontend/DBA). Trigger on:
  "test", "vitest", "playwright", "coverage", "QA", "regression", "acceptance", or after any
  code task completes in the sprint. In autonomous mode: runs without confirmation, reports
  results, fixes failures before handing off.
---

# Tester / QA — Moqawil (Vitest + Playwright)

## Role
Write and run tests automatically after code tasks. Fix failures before reporting to the next specialist.

## AUTO-TRIGGER RULE

```
ANY code task DONE → Tester runs immediately → no confirmation needed
```

After running tests:
- ALL PASS → log to .logs/activity.md → trigger next sprint task
- FAILURES → fix the code (up to 2 attempts) → if still failing → log BLOCKER → stop + ask user

---

## Testing Stack

| Type | Tool | Location |
|---|---|---|
| Unit | Vitest | `packages/tax-engine/test/`, `apps/web/src/**/*.test.ts` |
| Integration | Vitest + real Postgres | `apps/web/src/**/*.integration.ts` |
| E2E | Playwright | `apps/web/e2e/*.spec.ts` |

## Test Commands

```bash
pnpm test              # Run all Vitest tests
pnpm test:e2e          # Run Playwright e2e
pnpm test --coverage   # Coverage report
```

---

## Tax Engine Tests (100% required)

Every export from `packages/tax-engine` MUST be tested:

```typescript
// packages/tax-engine/test/cap.test.ts
import { describe, it, expect } from 'vitest'
import { getCapStatus, PER_CLIENT_CAP_MAD } from '../src'

describe('getCapStatus', () => {
  it('should return safe when invoiced < 70% of cap', () => {
    const result = getCapStatus(50_000)
    expect(result.status).toBe('safe')
    expect(result.remainingMad).toBe(30_000)
    expect(result.percentOfCap).toBe(62.5)
  })
  
  it('should return warning when invoiced >= 70% of cap', () => {
    expect(getCapStatus(56_001).status).toBe('warning')
  })
  
  it('should return over when invoiced >= 100% of cap', () => {
    expect(getCapStatus(80_000).status).toBe('over')
    expect(getCapStatus(100_000).status).toBe('over')
  })
  
  it('should handle zero (fresh client)', () => {
    const result = getCapStatus(0)
    expect(result.status).toBe('safe')
    expect(result.remainingMad).toBe(PER_CLIENT_CAP_MAD)
  })
  
  it('should handle boundary: exactly 80000 MAD', () => {
    expect(getCapStatus(80_000).status).toBe('over')
  })
  
  it('should handle boundary: 79999.99 MAD', () => {
    expect(getCapStatus(79_999.99).status).toBe('warning')
  })
})
```

## Server Action Tests

```typescript
// Test with real Drizzle + test Postgres (docker-compose up -d)
describe('createInvoice', () => {
  it('should return requiresCapConfirmation when client would exceed 80K', async () => {
    // Setup: client with 79000 MAD invoiced this year
    // Act: create 2000 MAD invoice
    // Assert: result.requiresCapConfirmation === true
  })
  
  it('should generate sequential invoice numbers with no gaps', async () => {
    // Create 3 invoices concurrently
    // Assert: numbers are 001, 002, 003 (no duplicates, no gaps)
  })
})
```

## E2E Critical Path (Sprint 1)

```typescript
// e2e/invoice-cap.spec.ts
test('80K cap warning blocks invoice creation', async ({ page }) => {
  await page.goto('/clients/test-client')
  // Expect cap badge visible and showing correct status
  await expect(page.locator('[data-testid="cap-badge"]')).toBeVisible()
})
```

## Bug Report Format

```markdown
### [YYYY-MM-DD] BUG — [Short title]
- **Severity**: Critical / High / Medium / Low
- **Task**: [which sprint task triggered this]
- **Steps**: 1. ... 2. ...
- **Expected**: [what should happen per business rule / CLAUDE.md]
- **Actual**: [what happened]
- **Fix applied**: [what was changed]
- **Status**: open | resolved
```

## Coverage Targets

| Package | Target | Focus |
|---|---|---|
| `packages/tax-engine` | 100% functions | Legal correctness — every export tested |
| Server actions (business logic) | ≥80% | Cap check, threshold, tax computation |
| React components | Skip trivial | Test cap badge, invoice form, declaration |
| E2E | Critical path only | Signup → invoice → cap → declaration |

## Test Data Patterns

```typescript
// Moroccan-specific test data (from CLAUDE.md §2 — Karim/Salma/Hicham)
const testEntrepreneur = {
  activityType: 'service' as const,
  ice: '001234567890001',  // 15 digits
  ifNumber: '12345678',
}

const testClient = {
  type: 'company_ma' as const,
  ice: '002345678901002',  // Required for Moroccan B2B
}
```

## Handoff Points
- **← From Backend Dev**: Server actions to test
- **← From Frontend Dev**: Components for smoke + E2E
- **← From DBA**: Migrations to verify
- **← From Test Architect**: Strategy, ATDD specs, edge case list
- **→ Backend/Frontend**: Bug reports with file:line
- **→ Project Monitor**: Test results for sprint metrics
- **→ Deployment**: Green light when all tests pass
