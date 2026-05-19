import { test, expect } from '@playwright/test'

test.describe('Sprint 0 Smoke Tests', () => {
  test('sign-in page loads and shows auth options', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveTitle(/Moqawil/)
    await expect(page.getByText('Continuer avec Google')).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
  })

  test('unauthenticated access to dashboard redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('unauthenticated access to invoices redirects to sign-in', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('unauthenticated access to clients redirects to sign-in', async ({ page }) => {
    await page.goto('/clients')
    await expect(page).toHaveURL(/sign-in/)
  })
})

/**
 * S1-13: Core user flow E2E test — requires authenticated session.
 * Skipped until integration test environment provides magic-link bypass.
 */
test.describe.skip('Sprint 1 — Core Flow (requires authenticated session)', () => {
  test('new user redirected to onboarding', async ({ page }) => {
    await expect(page).toHaveURL(/settings\?onboarding=1/)
    await expect(page.getByText('Configurer votre profil auto-entrepreneur')).toBeVisible()
  })

  test('onboarding form accepts valid AE profile', async ({ page }) => {
    await page.goto('/settings?onboarding=1')
    await page.fill('[name="fullName"]', 'Karim Benchekroun')
    await page.fill('[name="ice"]', '123456789012345')
    await page.fill('[name="ifNumber"]', '12345678')
    await page.selectOption('[name="activityType"]', 'service')
    await page.fill('[name="address"]', '12 Rue Mohammed V')
    await page.fill('[name="city"]', 'Casablanca')
    await page.fill('[name="registrationDate"]', '2024-01-01')
    await page.fill('[name="invoicePrefix"]', 'FACT')
    await page.click('[type="submit"]')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('cap over-limit dialog shows when projected total exceeds 80K', async ({ page }) => {
    await page.goto('/invoices/new')
    await page.fill('[name="lines[0][description]"]', 'Consulting')
    await page.fill('[name="lines[0][quantity]"]', '1')
    await page.fill('[name="lines[0][unitPriceOriginal]"]', '85000')
    await page.click('[type="submit"]')
    await expect(page.getByText('Plafond 80 000 DH dépassé')).toBeVisible()
    await page.getByText('Annuler').click()
  })
})
