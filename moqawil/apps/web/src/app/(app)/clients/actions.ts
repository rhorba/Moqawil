'use server'

import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { clients, db } from '@moqawil/db'
import { validateICE } from '@moqawil/tax-engine'
import { and, eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

type Translator = Awaited<ReturnType<typeof getTranslations>>

// Schema is built per-request (not module scope) so validation messages can
// use getTranslations(), which is async and needs a request-scoped locale.
function getClientSchema(t: Translator) {
  return z
    .object({
      name: z.string().min(2, t('nameRequired')),
      type: z.enum(['individual', 'company_ma', 'company_foreign']),
      ice: z.string().optional(),
      ifNumber: z.string().optional(),
      email: z.string().email(t('emailInvalid')).optional().or(z.literal('')),
      phone: z.string().optional(),
      address: z.string().optional(),
      countryCode: z.string().length(2).default('MA'),
    })
    .superRefine((data, ctx) => {
      // ICE mandatory for Moroccan companies (CGI Article 145, mandatory since Jan 2019)
      if (data.type === 'company_ma') {
        if (!data.ice || data.ice.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['ice'],
            message: t('iceRequiredMa'),
          })
        } else {
          const result = validateICE(data.ice)
          if (!result.valid) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['ice'],
              message: result.reason ?? t('iceInvalidFallback'),
            })
          }
        }
      }
    })
}

export type ClientFormState = {
  errors?: Partial<Record<string, string[]>>
  message?: string
}

async function getAuthenticatedEntrepreneur() {
  const session = await auth()
  if (!session?.user?.id) return null
  return getEntrepreneur(session.user.id)
}

export async function createClient(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const [tCommon, tClient] = await Promise.all([
    getTranslations('common'),
    getTranslations('client'),
  ])
  const entrepreneur = await getAuthenticatedEntrepreneur()
  if (!entrepreneur) return { message: tCommon('notAuthenticated') }

  const raw = Object.fromEntries(formData.entries())
  const parsed = getClientSchema(tClient).safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  await db.insert(clients).values({
    entrepreneurId: entrepreneur.id,
    name: data.name,
    type: data.type,
    ice: data.ice || null,
    ifNumber: data.ifNumber || null,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    countryCode: data.countryCode,
  })

  redirect('/clients')
}

export async function updateClient(
  clientId: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const [tCommon, tClient] = await Promise.all([
    getTranslations('common'),
    getTranslations('client'),
  ])
  const entrepreneur = await getAuthenticatedEntrepreneur()
  if (!entrepreneur) return { message: tCommon('notAuthenticated') }

  const raw = Object.fromEntries(formData.entries())
  const parsed = getClientSchema(tClient).safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const data = parsed.data
  await db
    .update(clients)
    .set({
      name: data.name,
      type: data.type,
      ice: data.ice || null,
      ifNumber: data.ifNumber || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      countryCode: data.countryCode,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, clientId), eq(clients.entrepreneurId, entrepreneur.id)))

  revalidatePath('/clients')
  redirect('/clients')
}

export async function deleteClient(clientId: string): Promise<void> {
  const entrepreneur = await getAuthenticatedEntrepreneur()
  if (!entrepreneur) return

  await db
    .delete(clients)
    .where(and(eq(clients.id, clientId), eq(clients.entrepreneurId, entrepreneur.id)))

  revalidatePath('/clients')
}
