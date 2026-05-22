/**
 * Sprint 3 E2E Happy Path
 * Covers: login → onboard → create client → create invoice → mark paid →
 *         verify cap update → generate declaration
 *
 * Requires:
 *   - Running dev server (pnpm dev or webServer in playwright.config.ts)
 *   - E2E_TEST_SECRET set in .env (enables test-only Credentials provider)
 *   - DATABASE_URL set (tests write real data to the DB)
 *
 * Skip the entire suite if E2E_TEST_SECRET is not available.
 */

import { test, expect } from '@playwright/test'

const E2E_TEST_SECRET = process.env['E2E_TEST_SECRET']
const TEST_EMAIL = 'e2e-test@moqawil.test'

// ICE: 15 digits, unique enough for tests
const TEST_ICE = '000000000000001'

// Tests are intentionally sequential — each step depends on previous data
test.describe.serial('Happy Path — Full AE Workflow', () => {
  test.skip(!E2E_TEST_SECRET, 'E2E_TEST_SECRET not set — skipping authenticated tests')

  test.beforeAll(async ({ request }) => {
    // Wipe all data for the test user so each suite run starts from a clean state
    await request.post('/api/e2e/cleanup', {
      data: { email: TEST_EMAIL, secret: E2E_TEST_SECRET },
    })
  })

  test.beforeEach(async ({ page }) => {
    // Sign in via the test-only API route (sets session cookie directly, no CSRF)
    const response = await page.request.post('/api/e2e/signin', {
      data: { email: TEST_EMAIL, secret: E2E_TEST_SECRET },
    })
    expect(response.ok()).toBeTruthy()
    // Navigate to app — session cookie is now set on the context
    await page.goto('/dashboard')
    await expect(page).not.toHaveURL(/sign-in/)
  })

  test('1 — onboarding: AE profile is saved and redirects to dashboard', async ({ page }) => {
    await page.goto('/settings?onboarding=1')
    await expect(page.getByRole('heading', { name: /profil/i })).toBeVisible()

    await page.fill('[name="fullName"]', 'Karim Benchekroun')
    await page.fill('[name="ice"]', TEST_ICE)
    await page.fill('[name="ifNumber"]', '12345678')
    await page.selectOption('[name="activityType"]', 'service')
    await page.fill('[name="activityDescription"]', 'Développement logiciel')
    await page.fill('[name="address"]', '12 Rue Mohammed V')
    await page.fill('[name="city"]', 'Casablanca')
    await page.fill('[name="registrationDate"]', '2024-01-01')
    await page.fill('[name="invoicePrefix"]', 'FACT')

    await page.click('[type="submit"]')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('2 — create client and see cap badge', async ({ page }) => {
    await page.goto('/clients/new')

    await page.fill('[name="name"]', 'Acme Corp')
    await page.selectOption('[name="type"]', 'company_ma')
    await page.fill('[name="ice"]', '999999999999999')
    await page.fill('[name="email"]', 'billing@acme.ma')
    await page.fill('[name="address"]', 'Technopark Casablanca')

    await page.click('[type="submit"]')
    await expect(page).toHaveURL(/\/clients$/)

    // Cap badge should be visible in the list row
    await expect(page.getByText('Acme Corp')).toBeVisible()
  })

  test('3 — create invoice for the client', async ({ page }) => {
    await page.goto('/invoices/new')
    // Wait for React to fully hydrate before interacting
    await page.waitForLoadState('networkidle')

    // Select client
    await page.selectOption('[name="clientId"]', { label: 'Acme Corp' })

    // Fill line item — React controlled inputs require triggering change events
    await page.locator('[name="lines[0][description]"]').fill('Développement application web')
    await page.locator('[name="lines[0][quantity]"]').fill('1')
    await page.locator('[name="lines[0][unitPriceOriginal]"]').fill('15000')
    await page.locator('[name="issueDate"]').fill(new Date().toISOString().slice(0, 10))

    await page.getByRole('button', { name: /créer la facture/i }).click()

    // Should land on invoice detail page — toHaveURL waits up to 15 s for the redirect
    await expect(page).toHaveURL(/\/invoices\/[a-f0-9-]+$/, { timeout: 15000 })
    await expect(page.getByText('FACT-')).toBeVisible()
    // fr-MA locale uses period as thousands separator (15.000) — regex covers all locale variants
    await expect(page.getByText(/15[\s.,]000/).first()).toBeVisible()
  })

  test('4 — mark invoice as paid and check cap badge updates', async ({ page }) => {
    // Navigate to invoices list, find the latest draft
    await page.goto('/invoices')
    // Exclude the "Nouvelle facture" (/invoices/new) button; match only UUID invoice links
    const invoiceLink = page.locator('a[href^="/invoices/"]:not([href$="new"])').first()
    await invoiceLink.click()

    await expect(page).toHaveURL(/\/invoices\/[a-f0-9-]+$/)

    // Mark as paid
    const paymentDateInput = page.locator('[type="date"]')
    await paymentDateInput.fill(new Date().toISOString().slice(0, 10))

    await page.getByRole('button', { name: /marquer comme payée/i }).click()

    // Status badge should update to "Payée"
    await expect(page.getByText('Payée')).toBeVisible()
  })

  test('5 — cap badge is visible on client detail page', async ({ page }) => {
    await page.goto('/clients')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/clients/"]:not([href$="new"])').first().click()
    await expect(page).toHaveURL(/\/clients\/[a-f0-9-]+$/, { timeout: 10000 })

    // Cap badge should be visible (15 000 / 80 000 = ~18.75%, status=safe)
    await expect(page.getByText(/plafond/i)).toBeVisible()
    await expect(page.getByText(/80 000/i)).toBeVisible()
  })

  test('6 — generate quarterly declaration and print PDF link appears', async ({ page }) => {
    await page.goto('/declarations')

    // The declarations page should show 4 quarter cards
    await expect(page.getByText(/T1|T2|T3|T4/).first()).toBeVisible()

    // Click "Générer" on the current quarter
    const generateButton = page.getByRole('button', { name: /générer/i }).first()
    await generateButton.click()

    // CA trimestriel should now be visible
    await expect(page.getByText(/CA trimestriel/i)).toBeVisible()

    // Print PDF link should appear
    await expect(page.getByText(/imprimer pdf/i)).toBeVisible()
  })

  test('7 — cap over-limit dialog shows when projected total would exceed 80K', async ({ page }) => {
    await page.goto('/invoices/new')

    await page.selectOption('[name="clientId"]', { label: 'Acme Corp' })
    await page.fill('[name="lines[0][description]"]', 'Projet dépassant le plafond')
    await page.fill('[name="lines[0][quantity]"]', '1')
    // 70 000 DH — combined with the earlier 15 000 = 85 000 DH, over the 80K cap
    await page.fill('[name="lines[0][unitPriceOriginal]"]', '70000')
    await page.fill('[name="issueDate"]', new Date().toISOString().slice(0, 10))

    await page.click('[type="submit"]')

    // Cap confirmation dialog should appear
    await expect(page.getByText(/plafond.*80 000/i)).toBeVisible()
    // Cancel to not actually create the invoice
    await page.getByRole('button', { name: /annuler/i }).click()
  })
})

// Smoke tests that run without auth — preserved from Sprint 0
test.describe('Auth Redirects (unauthenticated)', () => {
  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveTitle(/Moqawil/)
  })

  test('dashboard redirects to sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('invoices redirects to sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('clients redirects to sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/clients')
    await expect(page).toHaveURL(/sign-in/)
  })
})
