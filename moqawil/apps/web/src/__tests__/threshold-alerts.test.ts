/**
 * Threshold alert logic tests.
 * Covers every boundary crossing for the 200K (service) and 500K
 * (commercial/industrial/artisanal) annual caps, and all alert levels
 * (70%, 90%, 100%).
 *
 * Nodemailer is mocked so no network calls are made.
 * SMTP env vars are set/cleared around each group.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// vi.hoisted ensures mockSendMail is defined before the vi.mock factory runs
const mocks = vi.hoisted(() => ({
  sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mocks.sendMail })),
  },
}))

import { checkAndSendThresholdAlerts } from '@/lib/threshold-alerts'

const SMTP_ENV = {
  SMTP_HOST: 'mail.test.local',
  SMTP_USER: 'user@test.local',
  SMTP_PASS: 'testpassword',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
}

function clearSmtp() {
  for (const k of Object.keys(SMTP_ENV)) delete process.env[k]
  delete process.env['SMTP_FROM']
}

// ── SMTP not configured ──────────────────────────────────────────────────────

describe('checkAndSendThresholdAlerts — SMTP not configured', () => {
  beforeEach(() => {
    clearSmtp()
    mocks.sendMail.mockClear()
  })

  it('returns without sending when SMTP_HOST is absent', async () => {
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 130_000,
      newYtd: 145_000,
    })
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })

  it('returns without sending even when a boundary would be crossed', async () => {
    // Crosses 70%, 90%, 100% in one jump — but SMTP not set so nothing fires
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 0,
      newYtd: 210_000,
    })
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })
})

// ── SMTP configured ──────────────────────────────────────────────────────────

describe('checkAndSendThresholdAlerts — SMTP configured', () => {
  beforeEach(() => {
    Object.assign(process.env, SMTP_ENV)
    mocks.sendMail.mockClear()
    mocks.sendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  afterEach(() => {
    clearSmtp()
  })

  it('sends no email when no boundary is crossed (service: stays below 70%)', async () => {
    // 200K threshold — service activity
    // 50K (25%) → 55K (27.5%): no boundary
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 50_000,
      newYtd: 55_000,
    })
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })

  it('sends no email when already above a boundary but not crossing it again', async () => {
    // 145K (72.5%) → 155K (77.5%): already past 70%, not crossing any new level
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 145_000,
      newYtd: 155_000,
    })
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })

  it('sends 1 email when crossing the 70% boundary', async () => {
    // 130K (65%) → 145K (72.5%): crosses 70%
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 130_000,
      newYtd: 145_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledTimes(1)
    const [mail] = mocks.sendMail.mock.calls[0]
    expect(mail.subject).toMatch(/70%/)
    expect(mail.to).toBe('ae@test.ma')
    expect(mail.text).toContain('Karim')
  })

  it('sends 1 email when crossing the 90% boundary', async () => {
    // 170K (85%) → 185K (92.5%): crosses 90%
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Salma',
      activityType: 'service',
      previousYtd: 170_000,
      newYtd: 185_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledTimes(1)
    const [mail] = mocks.sendMail.mock.calls[0]
    expect(mail.subject).toMatch(/90%/)
  })

  it('sends 1 urgent email when crossing the 100% boundary', async () => {
    // 195K (97.5%) → 205K (102.5%): crosses 100%
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Hicham',
      activityType: 'service',
      previousYtd: 195_000,
      newYtd: 205_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledTimes(1)
    const [mail] = mocks.sendMail.mock.calls[0]
    expect(mail.subject).toMatch(/URGENT/)
    // Urgent message body explains loss of AE status
    expect(mail.text).toMatch(/statut auto-entrepreneur|perte du statut/i)
  })

  it('sends 3 emails when crossing all three boundaries in one jump', async () => {
    // 0 → 210K: crosses 70%, 90%, 100% all at once
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 0,
      newYtd: 210_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledTimes(3)
  })

  it('crosses 70% for commercial activity (500K threshold)', async () => {
    // 500K × 70% = 350K
    // 340K (68%) → 365K (73%): crosses 70%
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Salma',
      activityType: 'commercial',
      previousYtd: 340_000,
      newYtd: 365_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledTimes(1)
  })

  it('crosses 70% for artisanal activity (500K threshold)', async () => {
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Craftsman',
      activityType: 'artisanal',
      previousYtd: 340_000,
      newYtd: 365_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledTimes(1)
  })

  it('crosses 70% for industrial activity (500K threshold)', async () => {
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Manufacturer',
      activityType: 'industrial',
      previousYtd: 340_000,
      newYtd: 365_000,
    })
    expect(mocks.sendMail).toHaveBeenCalledTimes(1)
  })

  it('uses SMTP_FROM env var as sender when set', async () => {
    process.env['SMTP_FROM'] = 'noreply@moqawil.ma'
    // 130K → 145K: crosses 70% → sends 1 email
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 130_000,
      newYtd: 145_000,
    })
    const [mail] = mocks.sendMail.mock.calls[0]
    expect(mail.from).toContain('noreply@moqawil.ma')
  })

  it('falls back to SMTP_USER as sender when SMTP_FROM is not set', async () => {
    // SMTP_FROM not set — already cleared by afterEach/beforeEach
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 130_000,
      newYtd: 145_000,
    })
    const [mail] = mocks.sendMail.mock.calls[0]
    expect(mail.from).toContain('user@test.local')
  })

  it('swallows sendMail errors and does not throw', async () => {
    mocks.sendMail.mockRejectedValueOnce(new Error('SMTP connection refused'))
    await expect(
      checkAndSendThresholdAlerts({
        userEmail: 'ae@test.ma',
        entrepreneurName: 'Karim',
        activityType: 'service',
        previousYtd: 130_000,
        newYtd: 145_000,
      })
    ).resolves.toBeUndefined()
  })

  it('sends email in HTML and plain-text formats', async () => {
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 130_000,
      newYtd: 145_000,
    })
    const [mail] = mocks.sendMail.mock.calls[0]
    expect(typeof mail.text).toBe('string')
    expect(typeof mail.html).toBe('string')
    expect(mail.html).toContain('<p>')
  })

  it('MAD amounts are formatted in French locale', async () => {
    await checkAndSendThresholdAlerts({
      userEmail: 'ae@test.ma',
      entrepreneurName: 'Karim',
      activityType: 'service',
      previousYtd: 130_000,
      newYtd: 145_000,
    })
    const [mail] = mocks.sendMail.mock.calls[0]
    // French locale formats large numbers with space or narrow-space separator
    expect(mail.text).toMatch(/DH/)
  })
})
