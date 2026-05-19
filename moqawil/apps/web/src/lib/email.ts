import nodemailer from 'nodemailer'

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export type EmailResult =
  | { sent: true }
  | { sent: false; reason: string }

export async function sendInvoiceEmail(opts: {
  to: string
  entrepreneurName: string
  invoiceNumber: string
  totalMad: string
  pdfBuffer: Buffer
}): Promise<EmailResult> {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: 'SMTP non configuré — ajoutez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env' }
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  try {
    const transport = createTransport()
    await transport.sendMail({
      from: `${opts.entrepreneurName} <${from}>`,
      to: opts.to,
      subject: `Facture ${opts.invoiceNumber}`,
      text: [
        `Bonjour,`,
        ``,
        `Veuillez trouver ci-joint la facture ${opts.invoiceNumber} d'un montant de ${opts.totalMad} DH.`,
        ``,
        `TVA non applicable — Régime Auto-Entrepreneur (Loi 114-13).`,
        ``,
        `Cordialement,`,
        opts.entrepreneurName,
      ].join('\n'),
      html: `
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint la facture <strong>${opts.invoiceNumber}</strong>
        d'un montant de <strong>${opts.totalMad}&nbsp;DH</strong>.</p>
        <p style="color:#666;font-size:12px">TVA non applicable — Régime Auto-Entrepreneur (Loi 114-13).</p>
        <p>Cordialement,<br>${opts.entrepreneurName}</p>
      `,
      attachments: [
        {
          filename: `${opts.invoiceNumber}.pdf`,
          content: opts.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })
    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { sent: false, reason: `Échec d'envoi : ${message}` }
  }
}
