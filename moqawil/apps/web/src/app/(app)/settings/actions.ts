'use server'

import { auth } from '@/lib/auth'
import { db, entrepreneurs } from '@moqawil/db'
import { eq } from 'drizzle-orm'
import { validateICE, validateIF } from '@moqawil/tax-engine'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  ice: z.string().refine(
    (v) => validateICE(v).valid,
    (v) => ({ message: validateICE(v).reason ?? 'ICE invalide' })
  ),
  ifNumber: z.string().refine(
    (v) => validateIF(v).valid,
    (v) => ({ message: validateIF(v).reason ?? 'IF invalide' })
  ),
  activityType: z.enum(['commercial', 'industrial', 'artisanal', 'service']),
  activityDescription: z.string().optional(),
  address: z.string().min(5, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
  phone: z.string().optional(),
  bankIban: z.string().optional(),
  registrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)'),
  invoicePrefix: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9-]+$/, 'Préfixe: lettres majuscules, chiffres et tirets uniquement'),
})

export type ProfileFormState = {
  errors?: Partial<Record<keyof z.infer<typeof profileSchema>, string[]>>
  message?: string
  success?: boolean
}

export async function upsertProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth()
  if (!session?.user?.id) return { message: 'Non authentifié' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = profileSchema.safeParse(raw)

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
