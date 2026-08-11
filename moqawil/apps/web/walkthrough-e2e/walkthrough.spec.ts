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
 * Sprint 10: extended to cover devis (create/detail/PDF/convert), real PDF-viewer
 * screenshots for every generated document (invoice, invoice UBL, quote, declaration —
 * previously these just clicked-and-closed the download link without ever showing the
 * result), and the Sprint 9 accountant multi-client dashboard. The accountant portion runs
 * in the SAME page/context rather than a second browser window — a second `browser.
 * newContext()` would open outside the fixed screen region `scripts/run-walkthrough.mjs`'s
 * ffmpeg process records, so identity is swapped via `page.request.post('/api/e2e/signin',
 * ...)` (the same test-only endpoint `happy-path.spec.ts` uses), which sets the session
 * cookie on the existing context without a new window.
 *
 * Requires the app already running and E2E_TEST_SECRET set. Invoked via
 * `pnpm exec playwright test --config=playwright.walkthrough.config.ts`.
 */

const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET
const TEST_EMAIL = 'demo-walkthrough@moqawil.test'
// Sprint 11 fixture-collision fix: walkthrough specs own block 200-209 — see docs/test-strategy-moqawil.md
const TEST_ICE = '000000000000201'
const ACCOUNTANT_EMAIL = 'demo-accountant@moqawil.test'

// __dirname (not import.meta.dirname): Playwright transforms this file to CommonJS since
// the package has no "type": "module" — mixing in ESM-only import.meta breaks that transform.
const ROOT = join(__dirname, '..', '..', '..') // apps/web/walkthrough-e2e -> repo root
const RECORDINGS_DIR = join(ROOT, '.recordings')
const SCREENSHOTS_DIR = join(RECORDINGS_DIR, 'screenshots')

let shotIndex = 0
async function shot(page: Page, name: string) {
  shotIndex += 1
  const filename = `${String(shotIndex).padStart(2, '0')}-${name}.png`
  // fullPage: true — otherwise any page taller than the viewport (Settings'
  // profile form + accountant-links section is the worst offender) gets
  // silently truncated in the screenshot with no visual indication anything
  // is missing below the fold.
  await page.screenshot({ path: join(SCREENSHOTS_DIR, filename), fullPage: true })
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Scrolls the page down in a few visible steps (with pauses between) so a page taller than
 *  the viewport is actually seen scrolling in the recorded video, not just captured whole by
 *  the fullPage screenshot. Scrolls back to top afterward so the next step starts clean. */
async function scrollThroughPage(page: Page, steps = 4) {
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  if (scrollHeight <= viewportHeight) return
  for (let i = 1; i <= steps; i++) {
    await page.mouse.wheel(0, (scrollHeight - viewportHeight) / steps)
    await pause(500)
  }
  await pause(600)
  await page.evaluate(() => window.scrollTo(0, 0))
  await pause(300)
}

/** Types like a human — visible keystrokes, not an instant fill. Clears any prior value first
 *  (some fields, like invoice line quantity, have a non-empty default). */
async function humanType(locator: Locator, text: string) {
  await locator.click()
  await locator.fill('')
  await locator.pressSequentially(text, { delay: 65 })
}

/** Fetches a generated PDF/XML document and screenshots the browser's native viewer, then
 *  returns to `backTo` — shows the actual rendered document instead of just clicking a
 *  download link and closing whatever it opened. Every PDF/XML route sends
 *  `Content-Disposition: attachment`, which makes Chromium trigger a download rather than
 *  navigate — `page.goto(url)` on such a URL always throws
 *  `net::ERR_HTTP_RESPONSE_CODE_FAILURE`, so the download is caught, saved locally, and
 *  reopened via a `file://` URL (which Chromium's built-in PDF viewer renders normally)
 *  instead. */
async function viewDocument(page: Page, url: string, name: string, backTo: string) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page
      .goto(url)
      .catch(() => {}), // navigation itself always "fails" — the download is what matters
  ])
  const localPath = await download.path()
  if (localPath) {
    await page.goto(`file://${localPath.replace(/\\/g, '/')}`)
    await pause(1000)
    await shot(page, name)
  }
  await page.goto(backTo)
  await pause(400)
}

test.describe.configure({ mode: 'serial' })

test('full app walkthrough', async ({ page, baseURL }) => {
  test.setTimeout(240_000)
  if (!E2E_TEST_SECRET) throw new Error('E2E_TEST_SECRET is not set — cannot sign in.')
  const BASE_URL = baseURL ?? 'http://localhost:3000'

  await test.step('cleanup demo users', async () => {
    for (const email of [TEST_EMAIL, ACCOUNTANT_EMAIL]) {
      const res = await page.request.post(`${BASE_URL}/api/e2e/cleanup`, {
        data: { email, secret: E2E_TEST_SECRET },
      })
      expect(res.status()).toBe(200)
    }
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

  await test.step('8. Devis — create', async () => {
    await page.goto(`${BASE_URL}/quotes/new`)
    await page.waitForLoadState('networkidle')
    await pause(600)
    await shot(page, 'quote-new-empty')

    await page.locator('[name="clientId"]').selectOption({ label: 'Acme Corp' })
    await pause(300)
    await humanType(page.locator('[name="lines[0][description]"]'), 'Refonte identité visuelle')
    await pause(250)
    await humanType(page.locator('[name="lines[0][quantity]"]'), '1')
    await pause(250)
    await humanType(page.locator('[name="lines[0][unitPriceOriginal]"]'), '8000')
    await pause(250)
    await page.locator('[name="issueDate"]').fill(new Date().toISOString().slice(0, 10))
    await pause(500)
    await shot(page, 'quote-new-filled')

    await page.getByRole('button', { name: /créer le devis/i }).click()
    await page.waitForURL(/\/quotes\/[a-f0-9-]+$/, { timeout: 15000 })
    await pause(900)
  })

  let quoteUrl = ''
  await test.step('9. Devis — detail + PDF', async () => {
    quoteUrl = page.url()
    await shot(page, 'quote-detail-draft')

    const quoteId = quoteUrl.split('/').pop()
    await viewDocument(page, `${BASE_URL}/api/quotes/${quoteId}/pdf`, 'quote-pdf-view', quoteUrl)
  })

  let invoiceUrl = ''
  await test.step('10. Devis — convert to invoice', async () => {
    await page.getByRole('button', { name: /convertir en facture/i }).click()
    await page.waitForURL(/\/invoices\/[a-f0-9-]+$/, { timeout: 15000 })
    await pause(900)
    await shot(page, 'quote-converted-to-invoice')
    invoiceUrl = page.url()
  })

  await test.step('11. Invoices — create (direct, second invoice for the same client)', async () => {
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

  await test.step('12. Invoice — edit', async () => {
    const invoiceId = invoiceUrl.split('/').pop()
    await page.goto(`${BASE_URL}/invoices/${invoiceId}/edit`)
    await pause(700)
    await shot(page, 'invoice-edit-form')
    await page.goto(invoiceUrl)
    await pause(600)
  })

  await test.step('13. Invoice — view PDF', async () => {
    const invoiceId = invoiceUrl.split('/').pop()
    await viewDocument(
      page,
      `${BASE_URL}/api/invoices/${invoiceId}/pdf`,
      'invoice-pdf-view',
      invoiceUrl
    )
  })

  await test.step('14. Invoice — mark as paid', async () => {
    const paymentDateInput = page.locator('[type="date"]').first()
    await paymentDateInput.fill(new Date().toISOString().slice(0, 10))
    await pause(400)
    await page.getByRole('button', { name: /marquer comme payée/i }).click()
    await pause(900)
    await shot(page, 'invoice-detail-paid')
  })

  await test.step('15. Invoice — view UBL XML export', async () => {
    const invoiceId = invoiceUrl.split('/').pop()
    const ublLink = page.getByRole('link', { name: /télécharger xml/i })
    if (await ublLink.isVisible().catch(() => false)) {
      await viewDocument(
        page,
        `${BASE_URL}/api/invoices/${invoiceId}/ubl`,
        'invoice-ubl-xml-view',
        invoiceUrl
      )
    }
  })

  await test.step('16. Client detail — cap badge after payment', async () => {
    await page.goto(`${BASE_URL}/clients`)
    await page.waitForLoadState('networkidle')
    await pause(500)
    await page.locator('a[href^="/clients/"]:not([href$="new"])').first().click()
    await page.waitForURL(/\/clients\/[a-f0-9-]+$/, { timeout: 10000 })
    await pause(800)
    await shot(page, 'client-detail-cap-updated')
  })

  await test.step('17. Declarations — generate + view PDF', async () => {
    await page.goto(`${BASE_URL}/declarations`)
    await pause(700)
    await shot(page, 'declarations-list')

    const generateButton = page.getByRole('button', { name: /générer/i }).first()
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click()
      await pause(900)
      await shot(page, 'declarations-generated')

      const declarationsUrl = page.url()
      const printLink = page.getByRole('link', { name: /imprimer pdf/i }).first()
      const href = await printLink.getAttribute('href').catch(() => null)
      if (href) {
        await viewDocument(page, `${BASE_URL}${href}`, 'declaration-pdf-view', declarationsUrl)
      }
    }
  })

  await test.step('18. Invoices — list', async () => {
    await page.goto(`${BASE_URL}/invoices`)
    await pause(700)
    await shot(page, 'invoices-list')
  })

  await test.step('19. Cap over-limit confirmation dialog', async () => {
    await page.goto(`${BASE_URL}/invoices/new`)
    await page.waitForLoadState('networkidle')
    await pause(500)
    await page.locator('[name="clientId"]').selectOption({ label: 'Acme Corp' })
    await pause(250)
    await humanType(page.locator('[name="lines[0][description]"]'), 'Projet dépassant le plafond')
    await pause(250)
    await humanType(page.locator('[name="lines[0][quantity]"]'), '1')
    await pause(250)
    await humanType(page.locator('[name="lines[0][unitPriceOriginal]"]'), '60000')
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

  await test.step('20. Settings — profile', async () => {
    await page.goto(`${BASE_URL}/settings`)
    await pause(700)
    // Profile form + accountant-links section together run well past one
    // viewport — scroll through visibly for the video before the (fullPage)
    // screenshot, which would otherwise capture everything below the fold
    // silently with no one having actually seen it scroll by.
    await scrollThroughPage(page)
    await shot(page, 'settings-profile')
  })

  let inviteUrl = ''
  await test.step('21. Settings — invite accountant', async () => {
    await page.locator('[name="email"]').scrollIntoViewIfNeeded()
    await pause(400)
    await humanType(page.locator('[name="email"]'), ACCOUNTANT_EMAIL)
    await pause(300)
    await page.getByRole('button', { name: 'Inviter' }).click()
    await pause(900)
    await scrollThroughPage(page)
    await shot(page, 'settings-accountant-invited')

    const inviteUrlLocator = page.getByTestId('invite-url')
    if (await inviteUrlLocator.isVisible().catch(() => false)) {
      inviteUrl = (await inviteUrlLocator.textContent()) ?? ''
    }
  })

  await test.step('22. Accountant — accept invitation', async () => {
    if (!inviteUrl) return
    const res = await page.request.post(`${BASE_URL}/api/e2e/signin`, {
      data: { email: ACCOUNTANT_EMAIL, secret: E2E_TEST_SECRET },
    })
    expect(res.ok()).toBeTruthy()

    const path = new URL(inviteUrl).pathname + new URL(inviteUrl).search
    await page.goto(`${BASE_URL}${path}`)
    await pause(800)
    await shot(page, 'accountant-accept-invite')

    await page.locator('[type="submit"]').click()
    await page.waitForURL(/\/accountant$/, { timeout: 15000 })
    await pause(900)
  })

  await test.step('23. Accountant — dashboard', async () => {
    if (!inviteUrl) return
    await shot(page, 'accountant-dashboard')
  })

  await test.step('24. Accountant — drill-down (cap badges)', async () => {
    if (!inviteUrl) return
    await page.locator('a[href^="/accountant/"]').first().click()
    await page.waitForURL(/\/accountant\/[a-f0-9-]+$/, { timeout: 10000 })
    await pause(900)
    await shot(page, 'accountant-drilldown')
  })

  await test.step('25. Back to entrepreneur — revoke accountant access', async () => {
    if (!inviteUrl) return
    const res = await page.request.post(`${BASE_URL}/api/e2e/signin`, {
      data: { email: TEST_EMAIL, secret: E2E_TEST_SECRET },
    })
    expect(res.ok()).toBeTruthy()

    await page.goto(`${BASE_URL}/settings`)
    await page.waitForLoadState('networkidle')
    await pause(700)
    const revokeButton = page.getByRole('button', { name: /révoquer/i })
    if (await revokeButton.isVisible().catch(() => false)) {
      page.once('dialog', (dialog) => dialog.accept())
      await revokeButton.click()
      await pause(700)
      await scrollThroughPage(page)
      await shot(page, 'settings-accountant-revoked')
    }
  })
})
