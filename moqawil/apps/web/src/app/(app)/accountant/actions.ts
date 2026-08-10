'use server'

import { auth } from '@/lib/auth'
import { getPendingInviteByToken } from '@/lib/queries/accountant'
import { accountantLinks, db } from '@moqawil/db'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

/**
 * Bound to a plain <form action={...}> (see accept/page.tsx), so this always
 * ends in a redirect rather than returning a state object — a form action's
 * type must be `(formData) => void | Promise<void>`. Every failure mode
 * (invalid/expired/already-used/email-mismatch) redirects back to the same
 * accept page, which re-runs the identical checks against fresh DB state and
 * renders the right message there — see accept/page.tsx.
 */
export async function acceptAccountantInvite(token: string, _formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) redirect('/sign-in')

  const found = await getPendingInviteByToken(token)
  if (!found) redirect(`/accountant/accept?token=${token}`)

  const { link } = found
  if (
    link.status !== 'pending' ||
    (link.inviteExpiresAt && link.inviteExpiresAt.getTime() < Date.now()) ||
    link.invitedEmail.toLowerCase() !== session.user.email.toLowerCase()
  ) {
    redirect(`/accountant/accept?token=${token}`)
  }

  const [updated] = await db
    .update(accountantLinks)
    .set({
      accountantUserId: session.user.id,
      status: 'active',
      inviteToken: null,
      inviteExpiresAt: null,
      updatedAt: new Date(),
    })
    // Re-check status = 'pending' at write time (not just at read time above) to close
    // the race where the same token is submitted twice concurrently.
    .where(and(eq(accountantLinks.id, link.id), eq(accountantLinks.status, 'pending')))
    .returning({ id: accountantLinks.id })

  if (!updated) redirect(`/accountant/accept?token=${token}`)

  redirect('/accountant')
}
