import { join } from 'node:path'
import { type Locator, type Page, expect, test } from '@playwright/test'

/**
 * Records a slow, human-paced video walkthrough of every major Moqawil path, plus a
 * screenshot of each screen. Not a correctness test — a demo/documentation tool. Runs via
 * the Playwright test runner (not a raw chromium.launch() script) because that's the only
 * code path that reliably keeps recording video across many real page navigations — a
 * manually-driven context.newContext({recordVideo}) session silently stopped capturing
 * frames a few seconds into a full run (confirmed via ffprobe: 70s real session produced a
 * 0.96s video, despite page.screenshot() calls working fine throughout — screenshots use a
 * separate CDP call from the continuous screencast video uses, so screenshots alone can't
 * catch this).
 *
 * Requires the app already running and E2E_TEST_SECRET set. Invoked via
 * `pnpm exec playwright test --config=playwright.walkthrough.config.ts`.
 */

const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET
const TEST_EMAIL = 'demo-walkthrough@moqawil.test'
const TEST_ICE = '000000000000099'

// __dirname (not import.meta.dirname): Playwright transforms this file to CommonJS since
// the package has no "type": "module" — mixing in ESM-only import.meta breaks that transform.
const ROOT = join(__dirname, '..', '..', '..') // apps/web/walkthrough-e2e -> repo root
const RECORDINGS_DIR = join(ROOT, '.recordings')
const SCREENSHOTS_DIR = join(RECORDINGS_DIR, 'screenshots')

let shotIndex = 0
async function shot(page: Page, name: string) {
  shotIndex += 1
  const filename = `${String(shotIndex).padStart(2, '0')}-${name}.png`
  await page.screenshot({ path: join(SCREENSHOTS_DIR, filename) })
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Types like a human — visible keystrokes, not an instant fill. Clears any prior value first
 *  (some fields, like invoice line quantity, have a non-empty default). */
async function humanType(locator: Locator, text: string) {
  await locator.click()
  await locator.fill('')
  await locator.pressSequentially(text, { delay: 65 })
}

test.describe.configure({ mode: 'serial' })

test('full app walkthrough', async ({ page, context, baseURL }) => {
  test.setTimeout(180_000)
  if (!E2E_TEST_SECRET) throw new Error('E2E_TEST_SECRET is not set — cannot sign in.')
  const BASE_URL = baseURL ?? 'http://localhost:3000'

  await test.step('cleanup demo user', async () => {
    const res = await page.request.post(`${BASE_URL}/api/e2e/cleanup`, {
      data: { email: TEST_EMAIL, secret: E2E_TEST_SECRET },
    })
    expect(res.status()).toBe(200)
  })

  await test.step('1. Sign-in page', async () => {
    await page.goto(`${BASE_URL}/sign-in`)
    await pause(800)
    await shot(page, 'sign-in')

    await humanType(page.locator('[name="test-email"]'), TEST_EMAIL)
    await pause(300)
    await humanType(page.locator('[name="test-secret"]'), E2E_TEST_SECRET)
    await pause(500)
    await page.locator('[data-testid="test-credentials-submit"]').click()
    await page.waitForURL(/\/(settings|dashboard)/, { timeout: 15000 })
    await pause(600)
  })

  await test.step('2. Onboarding', async () => {
    if (!page.url().includes('/settings')) {
      await page.goto(`${BASE_URL}/settings?onboarding=1`)
    }
    await page.waitForLoadState('networkidle')
    await pause(1000)
    await shot(page, 'onboarding-empty')

    await humanType(page.locator('[name="fullName"]'), 'Karim Benchekroun')
    await pause(250)
    await humanType(page.locator('[name="ice"]'), TEST_ICE)
    await pause(250)
    await humanType(page.locator('[name="ifNumber"]'), '12345678')
    await pause(250)
    await page.locator('[name="activityType"]').selectOption('service')
    await pause(300)
    await humanType(page.locator('[name="activityDescription"]'), 'Développement logiciel')
    await pause(250)
    await humanType(page.locator('[name="address"]'), '12 Rue Mohammed V')
    await pause(250)
    await humanType(page.locator('[name="city"]'), 'Casablanca')
    await pause(250)
    await page.locator('[name="registrationDate"]').fill('2024-01-01')
    await pause(250)
    await humanType(page.locator('[name="invoicePrefix"]'), 'FACT')
    await pause(500)
    await shot(page, 'onboarding-filled')

    await page.locator('[type="submit"]').click()
    await page.waitForURL(/dashboard/, { timeout: 15000 })
    await pause(900)
  })

  await test.step('3. Dashboard', async () => {
    await shot(page, 'dashboard')
  })

  await test.step('4. Locale toggle (AR/RTL)', async () => {
    const localeToggle = page.getByRole('button', { name: /AR|عربي|FR|français/i }).first()
    if (await localeToggle.isVisible().catch(() => false)) {
      await localeToggle.click()
      await pause(900)
      await shot(page, 'dashboard-arabic-rtl')
      await page
        .getByRole('button', { name: /FR|français/i })
        .first()
        .click()
      await pause(700)
    }
  })

  await test.step('5. Clients — list (empty)', async () => {
    await page.goto(`${BASE_URL}/clients`)
    await pause(700)
    await shot(page, 'clients-empty')
  })

  await test.step('6. Clients — create', async () => {
    await page.goto(`${BASE_URL}/clients/new`)
    await pause(600)
    await shot(page, 'client-new-form')

    await humanType(page.locator('[name="name"]'), 'Acme Corp')
    await pause(250)
    await page.locator('[name="type"]').selectOption('company_ma')
    await pause(300)
    await humanType(page.locator('[name="ice"]'), '999999999999999')
    await pause(250)
    await humanType(page.locator('[name="email"]'), 'billing@acme.ma')
    await pause(250)
    await humanType(page.locator('[name="address"]'), 'Technopark Casablanca')
    await pause(500)
    await shot(page, 'client-new-filled')

    await page.locator('[type="submit"]').click()
    await page.waitForURL(/\/clients$/, { timeout: 15000 })
    await pause(800)
    await shot(page, 'clients-list-with-acme')
  })

  await test.step('7. Client detail — cap badge', async () => {
    await page.locator('a[href^="/clients/"]:not([href$="new"])').first().click()
    await page.waitForURL(/\/clients\/[a-f0-9-]+$/, { timeout: 10000 })
    await pause(800)
    await shot(page, 'client-detail-cap-badge')
  })

  let invoiceUrl = ''
  await test.step('8. Invoices — create', async () => {
    await page.goto(`${BASE_URL}/invoices/new`)
    await page.waitForLoadState('networkidle')
    await pause(600)
    await shot(page, 'invoice-new-empty')

    await page.locator('[name="clientId"]').selectOption({ label: 'Acme Corp' })
    await pause(300)
    await humanType(page.locator('[name="lines[0][description]"]'), 'Développement application web')
    await pause(250)
    await humanType(page.locator('[name="lines[0][quantity]"]'), '1')
    await pause(250)
    await humanType(page.locator('[name="lines[0][unitPriceOriginal]"]'), '15000')
    await pause(250)
    await page.locator('[name="issueDate"]').fill(new Date().toISOString().slice(0, 10))
    await pause(500)
    await shot(page, 'invoice-new-filled')

    await page.getByRole('button', { name: /créer la facture/i }).click()
    await page.waitForURL(/\/invoices\/[a-f0-9-]+$/, { timeout: 15000 })
    await pause(900)
    await shot(page, 'invoice-detail-draft')
    invoiceUrl = page.url()
  })

  await test.step('9. Invoice — edit', async () => {
    const invoiceId = invoiceUrl.split('/').pop()
    await page.goto(`${BASE_URL}/invoices/${invoiceId}/edit`)
    await pause(700)
    await shot(page, 'invoice-edit-form')
    await page.goto(invoiceUrl)
    await pause(600)
  })

  await test.step('10. Invoice — download PDF + UBL XML', async () => {
    const pdfLink = page.getByRole('link', { name: /télécharger pdf/i })
    if (await pdfLink.isVisible().catch(() => false)) {
      const [pdfDownload] = await Promise.all([
        context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
        pdfLink.click(),
      ])
      await pause(600)
      if (pdfDownload) await pdfDownload.close().catch(() => {})
    }
  })

  await test.step('11. Invoice — mark as paid', async () => {
    const paymentDateInput = page.locator('[type="date"]').first()
    await paymentDateInput.fill(new Date().toISOString().slice(0, 10))
    await pause(400)
    await page.getByRole('button', { name: /marquer comme payée/i }).click()
    await pause(900)
    await shot(page, 'invoice-detail-paid')

    const ublLink = page.getByRole('link', { name: /télécharger xml/i })
    if (await ublLink.isVisible().catch(() => false)) {
      await shot(page, 'invoice-detail-ubl-badge-visible')
    }
  })

  await test.step('12. Client detail — cap badge after payment', async () => {
    await page.goto(`${BASE_URL}/clients`)
    await page.waitForLoadState('networkidle')
    await pause(500)
    await page.locator('a[href^="/clients/"]:not([href$="new"])').first().click()
    await page.waitForURL(/\/clients\/[a-f0-9-]+$/, { timeout: 10000 })
    await pause(800)
    await shot(page, 'client-detail-cap-updated')
  })

  await test.step('13. Declarations', async () => {
    await page.goto(`${BASE_URL}/declarations`)
    await pause(700)
    await shot(page, 'declarations-list')

    const generateButton = page.getByRole('button', { name: /générer/i }).first()
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click()
      await pause(900)
      await shot(page, 'declarations-generated')
    }
  })

  await test.step('14. Invoices — list', async () => {
    await page.goto(`${BASE_URL}/invoices`)
    await pause(700)
    await shot(page, 'invoices-list')
  })

  await test.step('15. Cap over-limit confirmation dialog', async () => {
    await page.goto(`${BASE_URL}/invoices/new`)
    await page.waitForLoadState('networkidle')
    await pause(500)
    await page.locator('[name="clientId"]').selectOption({ label: 'Acme Corp' })
    await pause(250)
    await humanType(page.locator('[name="lines[0][description]"]'), 'Projet dépassant le plafond')
    await pause(250)
    await humanType(page.locator('[name="lines[0][quantity]"]'), '1')
    await pause(250)
    await humanType(page.locator('[name="lines[0][unitPriceOriginal]"]'), '70000')
    await pause(250)
    await page.locator('[name="issueDate"]').fill(new Date().toISOString().slice(0, 10))
    await pause(500)
    await page.locator('[type="submit"]').click()
    await pause(900)
    await shot(page, 'cap-over-limit-dialog')
    const cancelButton = page.getByRole('button', { name: /annuler/i })
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click()
      await pause(500)
    }
  })

  await test.step('16. Settings', async () => {
    await page.goto(`${BASE_URL}/settings`)
    await pause(700)
    await shot(page, 'settings-profile')
  })
})
