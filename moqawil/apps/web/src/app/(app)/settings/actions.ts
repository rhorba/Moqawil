'use server'

import { auth } from '@/lib/auth'
import { db, entrepreneurs } from '@moqawil/db'
import { validateICE, validateIF } from '@moqawil/tax-engine'
import { eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

type Translator = Awaited<ReturnType<typeof getTranslations>>

// Schema is built per-request (not module scope) so validation messages can
// use getTranslations(), which is async and needs a request-scoped locale.
function getProfileSchema(t: Translator) {
  return z.object({
    fullName: z.string().min(2, t('nameRequired')),
    ice: z.string().refine(
      (v) => validateICE(v).valid,
      (v) => ({ message: validateICE(v).reason ?? t('iceInvalidFallback') })
    ),
    ifNumber: z.string().refine(
      (v) => validateIF(v).valid,
      (v) => ({ message: validateIF(v).reason ?? t('ifInvalidFallback') })
    ),
    activityType: z.enum(['commercial', 'industrial', 'artisanal', 'service']),
    activityDescription: z.string().optional(),
    address: z.string().min(5, t('addressRequired')),
    city: z.string().min(2, t('cityRequired')),
    phone: z.string().optional(),
    bankIban: z.string().optional(),
    registrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('dateInvalidFormat')),
    invoicePrefix: z
      .string()
      .min(2)
      .max(10)
      .regex(/^[A-Z0-9-]+$/, t('invoicePrefixFormat')),
  })
}

export type ProfileFormState = {
  errors?: Partial<Record<keyof z.infer<ReturnType<typeof getProfileSchema>>, string[]>>
  message?: string
  success?: boolean
}

export async function upsertProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth()
  const [tCommon, tSettings] = await Promise.all([
    getTranslations('common'),
    getTranslations('settings'),
  ])
  if (!session?.user?.id) {
    return { message: tCommon('notAuthenticated') }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = getProfileSchema(tSettings).safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const userId = session.user.id

  const [existing] = await db
    .select({ id: entrepreneurs.id })
    .from(entrepreneurs)
    .where(eq(entrepreneurs.userId, userId))
    .limit(1)

  if (existing) {
    await db
      .update(entrepreneurs)
      .set({
        fullName: data.fullName,
        ice: data.ice,
        ifNumber: data.ifNumber,
        activityType: data.activityType,
        activityDescription: data.activityDescription ?? null,
        address: data.address,
        city: data.city,
        phone: data.phone ?? null,
        bankIban: data.bankIban ?? null,
        registrationDate: data.registrationDate,
        invoicePrefix: data.invoicePrefix,
        updatedAt: new Date(),
      })
      .where(eq(entrepreneurs.userId, userId))
  } else {
    await db.insert(entrepreneurs).values({
      userId,
      fullName: data.fullName,
      ice: data.ice,
      ifNumber: data.ifNumber,
      activityType: data.activityType,
      activityDescription: data.activityDescription ?? null,
      address: data.address,
      city: data.city,
      phone: data.phone ?? null,
      bankIban: data.bankIban ?? null,
      registrationDate: data.registrationDate,
      invoicePrefix: data.invoicePrefix,
    })
  }

  redirect('/dashboard')
}
