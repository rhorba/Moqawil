'use server'

import { auth } from '@/lib/auth'
import { db, invoices, invoiceLines } from '@moqawil/db'
import { eq, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getClientById, getClientAnnualTotal } from '@/lib/queries/client'
import { formatInvoiceNumber, PER_CLIENT_CAP_MAD } from '@moqawil/tax-engine'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const lineSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().positive('Quantité positive requise'),
  unitPriceOriginal: z.coerce.number().positive('Prix unitaire requis'),
})

const invoiceSchema = z.object({
  clientId: z.string().uuid('Client requis'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  dueDate: z.string().optional(),
  currency: z.string().default('MAD'),
  exchangeRate: z.coerce.number().optional(),
  notes: z.string().optional(),
  paymentMethod: z
    .enum(['virement', 'cheque', 'espece', 'effet', 'carte', 'other'])
    .optional(),
  capConfirmed: z.coerce.boolean().optional(),
})

export type InvoiceFormState = {
  errors?: Partial<Record<string, string[]>>
  message?: string
  capWarning?: {
    clientName: string
    currentTotal: number
    invoiceAmount: number
    surplusAmount: number
  }
}

function parseLines(formData: FormData): z.infer<typeof lineSchema>[] {
  const lines: z.infer<typeof lineSchema>[] = []
  let i = 0
  while (formData.has(`lines[${i}][description]`)) {
    lines.push({
      description: formData.get(`lines[${i}][description]`) as string,
      quantity: parseFloat(formData.get(`lines[${i}][quantity]`) as string),
      unitPriceOriginal: parseFloat(formData.get(`lines[${i}][unitPriceOriginal]`) as string),
    })
    i++
  }
  return lines
}

export async function createInvoice(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const session = await auth()
  if (!session?.user?.id) return { message: 'Non authentifié' }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { message: 'Profil introuvable' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = invoiceSchema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const rawLines = parseLines(formData)

  if (rawLines.length === 0) {
    return { errors: { lines: ['Au moins une ligne requise'] } }
  }

  const lineValidations = rawLines.map((l) => lineSchema.safeParse(l))
  const invalidLine = lineValidations.find((r) => !r.success)
  if (invalidLine && !invalidLine.success) {
    return { errors: { lines: invalidLine.error.errors.map((e) => e.message) } }
  }

  const client = await getClientById(data.clientId, entrepreneur.id)
  if (!client) return { errors: { clientId: ['Client introuvable'] } }

  // Calculate totals
  const exchangeRate = data.currency === 'MAD' ? 1 : (data.exchangeRate ?? 1)
  const lines = rawLines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPriceOriginal: l.unitPriceOriginal,
    lineTotalOriginal: l.quantity * l.unitPriceOriginal,
    lineTotalMad: l.quantity * l.unitPriceOriginal * exchangeRate,
  }))
  const subtotalOriginal = lines.reduce((s, l) => s + l.lineTotalOriginal, 0)
  const subtotalMad = lines.reduce((s, l) => s + l.lineTotalMad, 0)
  const totalMad = subtotalMad

  // Cap check for service AEs (CGI Article 73-II-G-8°)
  if (entrepreneur.activityType === 'service') {
    const fiscalYear = new Date(data.issueDate).getFullYear()
    const capData = await getClientAnnualTotal(data.clientId, fiscalYear)
    const projectedTotal = capData.totalInvoicedMad + totalMad

    if (projectedTotal > PER_CLIENT_CAP_MAD && !data.capConfirmed) {
      const surplus = projectedTotal - PER_CLIENT_CAP_MAD
      return {
        capWarning: {
          clientName: client.name,
          currentTotal: capData.totalInvoicedMad,
          invoiceAmount: totalMad,
          surplusAmount: surplus,
        },
      }
    }
  }

  const fiscalYear = new Date(data.issueDate).getFullYear()

  // S1-05 core: advisory lock + transaction for sequential numbering (no gaps)
  const result = await db.transaction(async (tx) => {
    // PostgreSQL advisory lock — keyed on hash of entrepreneurId to prevent concurrent inserts
    // lock key: first 8 chars of UUID as bigint via hashtext
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${entrepreneur.id}))`
    )

    // Get next sequence number within the lock
    const [seqRow] = await tx
      .select({
        maxSeq: sql<number>`COALESCE(MAX(${invoices.sequenceNumber}), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.entrepreneurId, entrepreneur.id),
          eq(invoices.fiscalYear, fiscalYear)
        )
      )

    const seqNumber = (seqRow?.maxSeq ?? 0) + 1
    const invoiceNumber = formatInvoiceNumber(entrepreneur.invoicePrefix, fiscalYear, seqNumber)

    const [newInvoice] = await tx
      .insert(invoices)
      .values({
        entrepreneurId: entrepreneur.id,
        clientId: data.clientId,
        invoiceNumber,
        fiscalYear,
        sequenceNumber: seqNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate || null,
        status: 'draft',
        paymentMethod: data.paymentMethod ?? null,
        currency: data.currency,
        exchangeRate: data.currency !== 'MAD' ? String(exchangeRate) : null,
        subtotalOriginal: String(subtotalOriginal),
        subtotalMad: String(subtotalMad),
        totalMad: String(totalMad),
        notes: data.notes || null,
      })
      .returning()

    await tx.insert(invoiceLines).values(
      lines.map((l, i) => ({
        invoiceId: newInvoice.id,
        position: i + 1,
        description: l.description,
        quantity: String(l.quantity),
        unitPriceOriginal: String(l.unitPriceOriginal),
        lineTotalOriginal: String(l.lineTotalOriginal),
        lineTotalMad: String(l.lineTotalMad),
      }))
    )

    return newInvoice
  })

  redirect(`/invoices/${result.id}`)
}

export async function sendInvoiceByEmail(
  invoiceId: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: 'Non authentifié' }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { success: false, message: 'Profil introuvable' }

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.entrepreneurId, entrepreneur.id)))
    .limit(1)

  if (!invoice) return { success: false, message: 'Facture introuvable' }

  const client = await getClientById(invoice.clientId, entrepreneur.id)
  if (!client?.email) {
    return { success: false, message: 'Le client n\'a pas d\'adresse e-mail enregistrée' }
  }

  const { renderInvoicePdf } = await import('@moqawil/pdf-templates')
  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId))
    .orderBy(invoiceLines.position)

  const pdfBuffer = await renderInvoicePdf({
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate ?? null,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate ?? null,
      totalMad: invoice.totalMad,
      subtotalMad: invoice.subtotalMad,
      paymentMethod: invoice.paymentMethod ?? null,
      notes: invoice.notes ?? null,
    },
    entrepreneur: {
      fullName: entrepreneur.fullName,
      ice: entrepreneur.ice,
      ifNumber: entrepreneur.ifNumber,
      address: entrepreneur.address,
      city: entrepreneur.city,
      phone: entrepreneur.phone ?? null,
      activityType: entrepreneur.activityType,
      invoicePrefix: entrepreneur.invoicePrefix,
    },
    client: {
      name: client.name,
      ice: client.ice ?? null,
      address: client.address ?? null,
      countryCode: client.countryCode,
    },
    lines: lines.map((l) => ({
      position: l.position,
      description: l.description,
      quantity: l.quantity,
      unitPriceOriginal: l.unitPriceOriginal,
      lineTotalOriginal: l.lineTotalOriginal,
      lineTotalMad: l.lineTotalMad,
    })),
  })

  const { sendInvoiceEmail } = await import('@/lib/email')
  const result = await sendInvoiceEmail({
    to: client.email,
    entrepreneurName: entrepreneur.fullName,
    invoiceNumber: invoice.invoiceNumber,
    totalMad: new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(
      parseFloat(invoice.totalMad)
    ),
    pdfBuffer: pdfBuffer as Buffer,
  })

  if (result.sent) {
    // Mark as sent if still draft
    if (invoice.status === 'draft') {
      await db
        .update(invoices)
        .set({ status: 'sent', updatedAt: new Date() })
        .where(eq(invoices.id, invoiceId))
      revalidatePath(`/invoices/${invoiceId}`)
      revalidatePath('/invoices')
    }
    return { success: true, message: `Facture envoyée à ${client.email}` }
  }

  return { success: false, message: result.reason }
}

export async function markInvoicePaid(invoiceId: string, paymentDate: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return

  const { getYtdTurnover } = await import('@/lib/queries/invoice')
  const year = new Date(paymentDate).getFullYear()
  const previousYtd = await getYtdTurnover(entrepreneur.id, year)

  await db
    .update(invoices)
    .set({ status: 'paid', paymentDate, updatedAt: new Date() })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.entrepreneurId, entrepreneur.id)))

  // Check threshold alerts (best-effort — does not block if SMTP not configured)
  const newYtd = await getYtdTurnover(entrepreneur.id, year)
  const { checkAndSendThresholdAlerts } = await import('@/lib/threshold-alerts')
  const userEmail = session.user.email
  if (userEmail) {
    await checkAndSendThresholdAlerts({
      userEmail,
      entrepreneurName: entrepreneur.fullName,
      activityType: entrepreneur.activityType as import('@moqawil/tax-engine').ActivityType,
      previousYtd,
      newYtd,
    }).catch(() => {}) // swallow — alert failure must never break the paid flow
  }

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/clients')
  revalidatePath('/dashboard')
}

const editInvoiceSchema = z.object({
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  dueDate: z.string().optional(),
  currency: z.string().default('MAD'),
  exchangeRate: z.coerce.number().optional(),
  notes: z.string().optional(),
  paymentMethod: z
    .enum(['virement', 'cheque', 'espece', 'effet', 'carte', 'other'])
    .optional(),
  capConfirmed: z.coerce.boolean().optional(),
})

export type EditInvoiceFormState = {
  errors?: Partial<Record<string, string[]>>
  message?: string
  capWarning?: {
    clientName: string
    currentTotal: number
    invoiceAmount: number
    surplusAmount: number
  }
}

export async function updateInvoice(
  invoiceId: string,
  _prev: EditInvoiceFormState,
  formData: FormData
): Promise<EditInvoiceFormState> {
  const session = await auth()
  if (!session?.user?.id) return { message: 'Non authentifié' }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { message: 'Profil introuvable' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = editInvoiceSchema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const rawLines = parseLines(formData)
  if (rawLines.length === 0) return { errors: { lines: ['Au moins une ligne requise'] } }

  const lineValidations = rawLines.map((l) => lineSchema.safeParse(l))
  const invalidLine = lineValidations.find((r) => !r.success)
  if (invalidLine && !invalidLine.success) {
    return { errors: { lines: invalidLine.error.errors.map((e) => e.message) } }
  }

  // Fetch current invoice — must be draft and belong to this entrepreneur
  const [existing] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.entrepreneurId, entrepreneur.id)))
    .limit(1)

  if (!existing) return { message: 'Facture introuvable' }
  if (existing.status !== 'draft') return { message: 'Seules les factures brouillon peuvent être modifiées' }

  const exchangeRate = data.currency === 'MAD' ? 1 : (data.exchangeRate ?? 1)
  const lines = rawLines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPriceOriginal: l.unitPriceOriginal,
    lineTotalOriginal: l.quantity * l.unitPriceOriginal,
    lineTotalMad: l.quantity * l.unitPriceOriginal * exchangeRate,
  }))
  const subtotalOriginal = lines.reduce((s, l) => s + l.lineTotalOriginal, 0)
  const subtotalMad = lines.reduce((s, l) => s + l.lineTotalMad, 0)
  const totalMad = subtotalMad

  // Re-check cap for service AEs
  if (entrepreneur.activityType === 'service') {
    const fiscalYear = new Date(data.issueDate).getFullYear()
    const capData = await getClientAnnualTotal(existing.clientId, fiscalYear)
    // Subtract the old invoice total before projecting the new one
    const previousTotal = parseFloat(existing.totalMad)
    const projectedTotal = capData.totalInvoicedMad - previousTotal + totalMad
    if (projectedTotal > PER_CLIENT_CAP_MAD && !data.capConfirmed) {
      const client = await getClientById(existing.clientId, entrepreneur.id)
      const surplus = projectedTotal - PER_CLIENT_CAP_MAD
      return {
        capWarning: {
          clientName: client?.name ?? '—',
          currentTotal: capData.totalInvoicedMad - previousTotal,
          invoiceAmount: totalMad,
          surplusAmount: surplus,
        },
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
      .set({
        issueDate: data.issueDate,
        dueDate: data.dueDate || null,
        currency: data.currency,
        exchangeRate: data.currency !== 'MAD' ? String(exchangeRate) : null,
        subtotalOriginal: String(subtotalOriginal),
        subtotalMad: String(subtotalMad),
        totalMad: String(totalMad),
        paymentMethod: data.paymentMethod ?? null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))

    await tx.delete(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId))

    await tx.insert(invoiceLines).values(
      lines.map((l, i) => ({
        invoiceId,
        position: i + 1,
        description: l.description,
        quantity: String(l.quantity),
        unitPriceOriginal: String(l.unitPriceOriginal),
        lineTotalOriginal: String(l.lineTotalOriginal),
        lineTotalMad: String(l.lineTotalMad),
      }))
    )
  })

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/clients')
  revalidatePath('/dashboard')
  redirect(`/invoices/${invoiceId}`)
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return

  await db
    .update(invoices)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.entrepreneurId, entrepreneur.id)))

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}
