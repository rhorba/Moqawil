'use server'

import { auth } from '@/lib/auth'
import { sendAccountantInviteEmail } from '@/lib/email'
import { generateInviteToken, inviteExpiresAt } from '@/lib/invite-token'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { accountantLinks, db } from '@moqawil/db'
import { and, eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

type Translator = Awaited<ReturnType<typeof getTranslations>>

function getInviteSchema(t: Translator) {
  return z.object({
    email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
  })
}

export type AccountantInviteState = {
  errors?: Partial<Record<'email', string[]>>
  message?: string
  success?: boolean
  inviteUrl?: string // shown when SMTP isn't configured — graceful degrade, same as invoice email
}

function buildInviteUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/accountant/accept?token=${token}`
}

export async function inviteAccountant(
  _prev: AccountantInviteState,
  formData: FormData
): Promise<AccountantInviteState> {
  const session = await auth()
  const [tCommon, tAccountant] = await Promise.all([
    getTranslations('common'),
    getTranslations('accountant'),
  ])
  if (!session?.user?.id) return { message: tCommon('notAuthenticated') }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { message: tCommon('profileNotFound') }

  const raw = Object.fromEntries(formData.entries())
  const parsed = getInviteSchema(tAccountant).safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const email = parsed.data.email.trim().toLowerCase()
  const token = generateInviteToken()
  const expiresAt = inviteExpiresAt()

  const [existing] = await db
    .select()
    .from(accountantLinks)
    .where(
      and(
        eq(accountantLinks.entrepreneurId, entrepreneur.id),
        eq(accountantLinks.invitedEmail, email)
      )
    )
    .limit(1)

  if (existing?.status === 'active') {
    return { errors: { email: [tAccountant('alreadyActive')] } }
  }

  if (existing) {
    // Re-invite: was 'pending' (resend) or 'revoked' (re-grant) — reset with a fresh token.
    await db
      .update(accountantLinks)
      .set({
        status: 'pending',
        inviteToken: token,
        inviteExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(accountantLinks.id, existing.id))
  } else {
    await db.insert(accountantLinks).values({
      entrepreneurId: entrepreneur.id,
      invitedEmail: email,
      status: 'pending',
      inviteToken: token,
      inviteExpiresAt: expiresAt,
    })
  }

  const inviteUrl = buildInviteUrl(token)
  const result = await sendAccountantInviteEmail({
    to: email,
    entrepreneurName: entrepreneur.fullName,
    inviteUrl,
  })

  revalidatePath('/settings/accountant-links')

  if (result.sent) {
    return { success: true, message: tAccountant('inviteSentEmail', { email }) }
  }
  // SMTP not configured (or send failed) — never block the invite on email delivery,
  // same graceful-degrade pattern as the existing invoice-PDF email feature.
  return { success: true, message: tAccountant('inviteSentNoEmail'), inviteUrl }
}

export async function revokeAccountantLink(linkId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return
  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return

  // Scoped by entrepreneurId — an entrepreneur can only revoke their own grants.
  await db
    .update(accountantLinks)
    .set({ status: 'revoked', inviteToken: null, inviteExpiresAt: null, updatedAt: new Date() })
    .where(and(eq(accountantLinks.id, linkId), eq(accountantLinks.entrepreneurId, entrepreneur.id)))

  revalidatePath('/settings/accountant-links')
}
