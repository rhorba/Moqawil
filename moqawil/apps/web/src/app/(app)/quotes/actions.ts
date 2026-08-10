'use server'

import { auth } from '@/lib/auth'
import { createInvoiceInTransaction } from '@/lib/invoice-creation'
import { getClientAnnualTotal, getClientById } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { db, quoteLines, quotes } from '@moqawil/db'
import { PER_CLIENT_CAP_MAD, formatInvoiceNumber } from '@moqawil/tax-engine'
import { and, eq, sql } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const QUOTE_PREFIX = 'DEVIS'

const lineSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().positive('Quantité positive requise'),
  unitPriceOriginal: z.coerce.number().positive('Prix unitaire requis'),
})

const quoteSchema = z.object({
  clientId: z.string().uuid('Client requis'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  validUntilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de validité invalide'),
  currency: z.string().default('MAD'),
  exchangeRate: z.coerce.number().optional(),
  notes: z.string().optional(),
})

export type QuoteFormState = {
  errors?: Partial<Record<string, string[]>>
  message?: string
}

function parseLines(formData: FormData): z.infer<typeof lineSchema>[] {
  const lines: z.infer<typeof lineSchema>[] = []
  let i = 0
  while (formData.has(`lines[${i}][description]`)) {
    lines.push({
      description: formData.get(`lines[${i}][description]`) as string,
      quantity: Number.parseFloat(formData.get(`lines[${i}][quantity]`) as string),
      unitPriceOriginal: Number.parseFloat(
        formData.get(`lines[${i}][unitPriceOriginal]`) as string
      ),
    })
    i++
  }
  return lines
}

function computeTotals(rawLines: z.infer<typeof lineSchema>[], exchangeRate: number) {
  const lines = rawLines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPriceOriginal: l.unitPriceOriginal,
    lineTotalOriginal: l.quantity * l.unitPriceOriginal,
    lineTotalMad: l.quantity * l.unitPriceOriginal * exchangeRate,
  }))
  const subtotalOriginal = lines.reduce((s, l) => s + l.lineTotalOriginal, 0)
  const subtotalMad = lines.reduce((s, l) => s + l.lineTotalMad, 0)
  return { lines, subtotalOriginal, subtotalMad, totalMad: subtotalMad }
}

export async function createQuote(
  _prev: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const session = await auth()
  const [t, tQuote] = await Promise.all([getTranslations('common'), getTranslations('quote')])
  if (!session?.user?.id) return { message: t('notAuthenticated') }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { message: t('profileNotFound') }

  const raw = Object.fromEntries(formData.entries())
  const parsed = quoteSchema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const rawLines = parseLines(formData)
  if (rawLines.length === 0) return { errors: { lines: [tQuote('linesRequired')] } }

  const lineValidations = rawLines.map((l) => lineSchema.safeParse(l))
  const invalidLine = lineValidations.find((r) => !r.success)
  if (invalidLine && !invalidLine.success) {
    return { errors: { lines: invalidLine.error.errors.map((e) => e.message) } }
  }

  const client = await getClientById(data.clientId, entrepreneur.id)
  if (!client) return { errors: { clientId: [tQuote('clientLookupFailed')] } }

  const exchangeRate = data.currency === 'MAD' ? 1 : (data.exchangeRate ?? 1)
  const { lines, subtotalOriginal, subtotalMad, totalMad } = computeTotals(rawLines, exchangeRate)
  const fiscalYear = new Date(data.issueDate).getFullYear()

  // Own advisory lock namespace (entrepreneurId + '-quote') so quote creation
  // never contends with invoice creation's lock — they're separate sequences.
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${entrepreneur.id} || '-quote'))`)

    const [seqRow] = await tx
      .select({ maxSeq: sql<number>`COALESCE(MAX(${quotes.sequenceNumber}), 0)` })
      .from(quotes)
      .where(and(eq(quotes.entrepreneurId, entrepreneur.id), eq(quotes.fiscalYear, fiscalYear)))

    const seqNumber = (seqRow?.maxSeq ?? 0) + 1
    // formatInvoiceNumber is a generic '{prefix}-{year}-{seq}' formatter despite
    // the name — reused here rather than reimplementing the same padding logic.
    const quoteNumber = formatInvoiceNumber(QUOTE_PREFIX, fiscalYear, seqNumber)

    const [newQuote] = await tx
      .insert(quotes)
      .values({
        entrepreneurId: entrepreneur.id,
        clientId: data.clientId,
        quoteNumber,
        fiscalYear,
        sequenceNumber: seqNumber,
        issueDate: data.issueDate,
        validUntilDate: data.validUntilDate,
        status: 'draft',
        currency: data.currency,
        exchangeRate: data.currency !== 'MAD' ? String(exchangeRate) : null,
        subtotalOriginal: String(subtotalOriginal),
        subtotalMad: String(subtotalMad),
        totalMad: String(totalMad),
        notes: data.notes || null,
      })
      .returning()

    await tx.insert(quoteLines).values(
      lines.map((l, i) => ({
        quoteId: newQuote.id,
        position: i + 1,
        description: l.description,
        quantity: String(l.quantity),
        unitPriceOriginal: String(l.unitPriceOriginal),
        lineTotalOriginal: String(l.lineTotalOriginal),
        lineTotalMad: String(l.lineTotalMad),
      }))
    )

    return newQuote
  })

  redirect(`/quotes/${result.id}`)
}

const editQuoteSchema = z.object({
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  validUntilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de validité invalide'),
  currency: z.string().default('MAD'),
  exchangeRate: z.coerce.number().optional(),
  notes: z.string().optional(),
})

export async function updateQuote(
  quoteId: string,
  _prev: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const session = await auth()
  const [t, tQuote] = await Promise.all([getTranslations('common'), getTranslations('quote')])
  if (!session?.user?.id) return { message: t('notAuthenticated') }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { message: t('profileNotFound') }

  const raw = Object.fromEntries(formData.entries())
  const parsed = editQuoteSchema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  const rawLines = parseLines(formData)
  if (rawLines.length === 0) return { errors: { lines: [tQuote('linesRequired')] } }

  const lineValidations = rawLines.map((l) => lineSchema.safeParse(l))
  const invalidLine = lineValidations.find((r) => !r.success)
  if (invalidLine && !invalidLine.success) {
    return { errors: { lines: invalidLine.error.errors.map((e) => e.message) } }
  }

  const [existing] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.entrepreneurId, entrepreneur.id)))
    .limit(1)

  if (!existing) return { message: tQuote('quoteNotFound') }
  if (existing.status !== 'draft') return { message: tQuote('editOnlyDraft') }

  const exchangeRate = data.currency === 'MAD' ? 1 : (data.exchangeRate ?? 1)
  const { lines, subtotalOriginal, subtotalMad, totalMad } = computeTotals(rawLines, exchangeRate)

  await db.transaction(async (tx) => {
    await tx
      .update(quotes)
      .set({
        issueDate: data.issueDate,
        validUntilDate: data.validUntilDate,
        currency: data.currency,
        exchangeRate: data.currency !== 'MAD' ? String(exchangeRate) : null,
        subtotalOriginal: String(subtotalOriginal),
        subtotalMad: String(subtotalMad),
        totalMad: String(totalMad),
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))

    await tx.delete(quoteLines).where(eq(quoteLines.quoteId, quoteId))

    await tx.insert(quoteLines).values(
      lines.map((l, i) => ({
        quoteId,
        position: i + 1,
        description: l.description,
        quantity: String(l.quantity),
        unitPriceOriginal: String(l.unitPriceOriginal),
        lineTotalOriginal: String(l.lineTotalOriginal),
        lineTotalMad: String(l.lineTotalMad),
      }))
    )
  })

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  redirect(`/quotes/${quoteId}`)
}

export async function deleteQuote(quoteId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return

  const [existing] = await db
    .select({ status: quotes.status })
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.entrepreneurId, entrepreneur.id)))
    .limit(1)

  if (!existing || existing.status !== 'draft') return

  await db
    .delete(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.entrepreneurId, entrepreneur.id)))

  revalidatePath('/quotes')
}

export async function updateQuoteStatus(
  quoteId: string,
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return

  await db
    .update(quotes)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(quotes.id, quoteId), eq(quotes.entrepreneurId, entrepreneur.id)))

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
}

export type ConvertQuoteState = {
  message?: string
  capWarning?: {
    clientName: string
    currentTotal: number
    invoiceAmount: number
    surplusAmount: number
  }
}

/**
 * Converts an accepted-or-sent devis into a real invoice, via the exact same
 * advisory-lock + sequential-numbering transaction direct invoice creation
 * uses (`createInvoiceInTransaction`) — never a separate reimplementation.
 * Still runs the 80K cap check exactly as direct invoice creation would;
 * `capConfirmed` lets the caller acknowledge the same blocking dialog.
 */
export async function convertQuoteToInvoice(
  quoteId: string,
  capConfirmed: boolean
): Promise<ConvertQuoteState> {
  const session = await auth()
  const [t, tQuote] = await Promise.all([getTranslations('common'), getTranslations('quote')])
  if (!session?.user?.id) return { message: t('notAuthenticated') }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { message: t('profileNotFound') }

  const [quote] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.entrepreneurId, entrepreneur.id)))
    .limit(1)

  if (!quote) return { message: tQuote('quoteNotFound') }
  if (quote.convertedToInvoiceId) return { message: tQuote('alreadyConverted') }
  if (quote.status === 'rejected' || quote.status === 'expired') {
    return { message: tQuote('cannotConvertRejectedExpired') }
  }

  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, quoteId))
    .orderBy(quoteLines.position)

  const totalMad = Number.parseFloat(quote.totalMad)

  // Cap check for service AEs (CGI Article 73-II-G-8°) — identical rule to
  // direct invoice creation, using today as the invoice's issue date.
  const issueDate = new Date().toISOString().slice(0, 10)
  if (entrepreneur.activityType === 'service') {
    const fiscalYear = new Date(issueDate).getFullYear()
    const capData = await getClientAnnualTotal(quote.clientId, fiscalYear)
    const projectedTotal = capData.totalInvoicedMad + totalMad

    if (projectedTotal > PER_CLIENT_CAP_MAD && !capConfirmed) {
      const client = await getClientById(quote.clientId, entrepreneur.id)
      const surplus = projectedTotal - PER_CLIENT_CAP_MAD
      return {
        capWarning: {
          clientName: client?.name ?? '—',
          currentTotal: capData.totalInvoicedMad,
          invoiceAmount: totalMad,
          surplusAmount: surplus,
        },
      }
    }
  }

  const newInvoice = await createInvoiceInTransaction({
    entrepreneurId: entrepreneur.id,
    invoicePrefix: entrepreneur.invoicePrefix,
    clientId: quote.clientId,
    issueDate,
    currency: quote.currency,
    exchangeRate: quote.exchangeRate ? Number.parseFloat(quote.exchangeRate) : undefined,
    subtotalOriginal: Number.parseFloat(quote.subtotalOriginal),
    subtotalMad: Number.parseFloat(quote.subtotalMad),
    totalMad,
    notes: quote.notes,
    lines: lines.map((l) => ({
      description: l.description,
      quantity: Number.parseFloat(l.quantity),
      unitPriceOriginal: Number.parseFloat(l.unitPriceOriginal),
      lineTotalOriginal: Number.parseFloat(l.lineTotalOriginal),
      lineTotalMad: Number.parseFloat(l.lineTotalMad),
    })),
  })

  await db
    .update(quotes)
    .set({ status: 'accepted', convertedToInvoiceId: newInvoice.id, updatedAt: new Date() })
    .where(eq(quotes.id, quoteId))

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  revalidatePath('/invoices')
  revalidatePath('/clients')
  revalidatePath('/dashboard')
  redirect(`/invoices/${newInvoice.id}`)
}
