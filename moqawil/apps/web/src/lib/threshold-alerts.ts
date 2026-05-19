/**
 * Annual revenue threshold email alerts.
 * Fires when a paid invoice pushes YTD turnover past 70%, 90%, or 100% of
 * the applicable threshold (200K MAD services / 500K MAD commercial/industrial/artisanal).
 * CGI references: Article 73-II-G-8°, Finance Law 2023.
 *
 * Alert levels are tracked in a simple in-memory set per process restart.
 * A persistent "alerts sent" table would require a migration — deferred to v0.2.
 */

import { getThresholdStatus } from '@moqawil/tax-engine'
import type { ActivityType } from '@moqawil/tax-engine'
import nodemailer from 'nodemailer'

const ALERT_THRESHOLDS = [70, 90, 100] as const

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

function fmtMad(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n) + ' DH'
}

async function sendThresholdAlert(opts: {
  to: string
  entrepreneurName: string
  ytd: number
  threshold: number
  percentOfThreshold: number
  remainingMad: number
  activityType: ActivityType
  level: 70 | 90 | 100
}) {
  if (!isSmtpConfigured()) return

  const subjectPrefix =
    opts.level === 100
      ? '⚠️ URGENT — Plafond annuel atteint'
      : opts.level === 90
      ? '⚠️ Attention — 90% du plafond annuel'
      : 'Info — 70% du plafond annuel atteint'

  const body =
    opts.level === 100
      ? `Vous avez atteint le plafond annuel de chiffre d'affaires de ${fmtMad(opts.threshold)} pour votre activité.
Deux dépassements consécutifs entraînent la perte du statut auto-entrepreneur.
Consultez un comptable si votre CA dépasse ce seuil deux années de suite.`
      : `Votre chiffre d'affaires YTD est de ${fmtMad(opts.ytd)} (${Math.round(opts.percentOfThreshold)}% du plafond de ${fmtMad(opts.threshold)}).
Il vous reste ${fmtMad(opts.remainingMad)} avant d'atteindre le plafond annuel.`

  try {
    const transport = createTransport()
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
    await transport.sendMail({
      from: `Moqawil <${from}>`,
      to: opts.to,
      subject: `[Moqawil] ${subjectPrefix}`,
      text: `Bonjour ${opts.entrepreneurName},\n\n${body}\n\n— L'équipe Moqawil`,
      html: `<p>Bonjour ${opts.entrepreneurName},</p><p>${body.replace(/\n/g, '<br>')}</p><p>— L'équipe Moqawil</p>`,
    })
  } catch {
    // Swallow — alert emails are best-effort
  }
}

/**
 * Check whether any threshold alert should fire after recording a new paid invoice.
 * `previousYtd` is the YTD before this invoice; `newYtd` is after.
 * Only sends the alert if we crossed a boundary (avoids repeat sends on the same level).
 */
export async function checkAndSendThresholdAlerts(opts: {
  userEmail: string
  entrepreneurName: string
  activityType: ActivityType
  previousYtd: number
  newYtd: number
}) {
  if (!isSmtpConfigured()) return

  const prevStatus = getThresholdStatus(opts.previousYtd, opts.activityType)
  const newStatus = getThresholdStatus(opts.newYtd, opts.activityType)
  const threshold = opts.newYtd + newStatus.remainingMad

  for (const level of ALERT_THRESHOLDS) {
    // Crossed = was below this level before, at or above it now
    if (prevStatus.percentOfThreshold < level && newStatus.percentOfThreshold >= level) {
      await sendThresholdAlert({
        to: opts.userEmail,
        entrepreneurName: opts.entrepreneurName,
        ytd: opts.newYtd,
        threshold,
        percentOfThreshold: newStatus.percentOfThreshold,
        remainingMad: newStatus.remainingMad,
        activityType: opts.activityType,
        level,
      })
    }
  }
}
