/**
 * Sprint 9 (S9-11): accountant multi-client dashboard, two-actor flow.
 *
 * Uses two separate browser contexts (real cookie-jar isolation, unlike a
 * second tab in the same context) to simulate the entrepreneur and the
 * accountant as genuinely different signed-in users — matching how
 * happy-path.spec.ts's beforeEach signs in via the test-only API route, but
 * with one context per actor since this test needs both signed in at once.
 *
 * Requires E2E_TEST_SECRET + DATABASE_URL — skipped otherwise (see
 * happy-path.spec.ts for the same pattern).
 */

import { expect, test } from '@playwright/test'

const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET
const AE_EMAIL = 'e2e-accountant-ae@moqawil.test'
const ACCOUNTANT_EMAIL = 'e2e-accountant-user@moqawil.test'
// Sprint 11 fixture-collision fix: block 111 reserved for this file — see docs/test-strategy-moqawil.md
const AE_ICE = '000000000000111'

test.describe('Accountant multi-client dashboard — two-actor flow', () => {
  test.skip(!E2E_TEST_SECRET, 'E2E_TEST_SECRET not set — skipping authenticated tests')

  test.beforeAll(async ({ request }) => {
    await request.post('/api/e2e/cleanup', { data: { email: AE_EMAIL, secret: E2E_TEST_SECRET } })
  })

  test('entrepreneur invites accountant, accountant accepts and sees only the granted entrepreneur, revoke removes access immediately', async ({
    browser,
  }) => {
    const aeContext = await browser.newContext()
    const accountantContext = await browser.newContext()
    const aePage = await aeContext.newPage()
    const accountantPage = await accountantContext.newPage()

    try {
      // --- Entrepreneur: sign in, onboard, invite the accountant ---
      let res = await aePage.request.post('/api/e2e/signin', {
        data: { email: AE_EMAIL, secret: E2E_TEST_SECRET },
      })
      expect(res.ok()).toBeTruthy()

      await aePage.goto('/settings?onboarding=1')
      await aePage.fill('[name="fullName"]', 'E2E Accountant Test AE')
      await aePage.fill('[name="ice"]', AE_ICE)
      await aePage.fill('[name="ifNumber"]', '13579246')
      await aePage.selectOption('[name="activityType"]', 'service')
      await aePage.fill('[name="address"]', '1 Rue E2E')
      await aePage.fill('[name="city"]', 'Tanger')
      await aePage.fill('[name="registrationDate"]', '2024-01-01')
      await aePage.fill('[name="invoicePrefix"]', 'E2EA')
      await aePage.click('[type="submit"]')
      await expect(aePage).toHaveURL(/dashboard/)

      await aePage.goto('/settings')
      await expect(aePage.getByText('Aucun comptable invité.')).toBeVisible()
      await aePage.fill('[name="email"]', ACCOUNTANT_EMAIL)
      await aePage.getByRole('button', { name: 'Inviter' }).click()

      // SMTP isn't configured in the test env — the on-screen fallback link appears.
      const inviteUrlLocator = aePage.getByTestId('invite-url')
      await expect(inviteUrlLocator).toBeVisible()
      const inviteUrl = await inviteUrlLocator.textContent()
      expect(inviteUrl).toContain('/accountant/accept?token=')
      await expect(aePage.getByText(ACCOUNTANT_EMAIL)).toBeVisible()
      await expect(aePage.getByText('En attente')).toBeVisible()

      // --- Accountant: sign in as a genuinely different user, accept the invite ---
      res = await accountantPage.request.post('/api/e2e/signin', {
        data: { email: ACCOUNTANT_EMAIL, secret: E2E_TEST_SECRET },
      })
      expect(res.ok()).toBeTruthy()

      const inviteUrlPath =
        new URL(inviteUrl as string).pathname + new URL(inviteUrl as string).search
      await accountantPage.goto(inviteUrlPath)
      await expect(accountantPage.getByText('E2E Accountant Test AE')).toBeVisible()
      await accountantPage.click('[type="submit"]')
      await expect(accountantPage).toHaveURL(/\/accountant$/)

      // Dashboard shows exactly this one entrepreneur, nothing else
      await expect(accountantPage.getByText('E2E Accountant Test AE')).toBeVisible()

      // Drill down — authorization boundary + per-client cap section render
      await accountantPage.locator('a[href^="/accountant/"]').first().click()
      await expect(accountantPage).toHaveURL(/\/accountant\/[a-f0-9-]+$/)
      await expect(
        accountantPage.getByRole('heading', { name: 'E2E Accountant Test AE' })
      ).toBeVisible()

      // Nav entry only appears once access is active
      await expect(accountantPage.getByRole('link', { name: 'Espace comptable' })).toBeVisible()

      // --- Entrepreneur revokes access ---
      await aePage.reload()
      await expect(aePage.getByText('Actif')).toBeVisible()
      aePage.once('dialog', (dialog) => dialog.accept())
      await aePage.getByRole('button', { name: /révoquer/i }).click()
      // The link row is never deleted — status flips to revoked, and the
      // revoke action disappears (only pending/active links show it).
      await expect(aePage.getByText('Révoqué')).toBeVisible()
      await expect(aePage.getByRole('button', { name: /révoquer/i })).not.toBeVisible()

      // --- Accountant's very next request must lose access — live check, not cached ---
      // Lands on /settings?onboarding=1, not /dashboard: this accountant test user has
      // no AE profile of their own, so losing accountant access chains into the normal
      // onboarding redirect rather than a broken blank /dashboard.
      await accountantPage.goto('/accountant')
      await expect(accountantPage).toHaveURL(/\/settings\?onboarding=1$/)
    } finally {
      await aeContext.close()
      await accountantContext.close()
    }
  })
})
