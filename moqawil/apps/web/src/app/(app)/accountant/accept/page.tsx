import { auth } from '@/lib/auth'
import { getPendingInviteByToken } from '@/lib/queries/accountant'
import { getTranslations } from 'next-intl/server'
import { acceptAccountantInvite } from '../actions'

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const [t, tCommon] = await Promise.all([getTranslations('accountant'), getTranslations('common')])
  const session = await auth()

  if (!token) {
    return <InviteMessage title={t('acceptTitle')} message={t('acceptInvalid')} />
  }

  const found = await getPendingInviteByToken(token)
  if (!found) {
    return <InviteMessage title={t('acceptTitle')} message={t('acceptInvalid')} />
  }

  const { link, entrepreneur } = found

  if (link.status !== 'pending') {
    return <InviteMessage title={t('acceptTitle')} message={t('acceptAlready')} />
  }
  if (link.inviteExpiresAt && link.inviteExpiresAt.getTime() < Date.now()) {
    return <InviteMessage title={t('acceptTitle')} message={t('acceptExpired')} />
  }
  // No `session.user.email &&` guard here: a session with no email must be
  // treated as a mismatch, not silently skip the check (fail closed).
  if (
    !session?.user?.email ||
    link.invitedEmail.toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return (
      <InviteMessage
        title={t('acceptTitle')}
        message={t('acceptEmailMismatch', { email: link.invitedEmail })}
      />
    )
  }

  const accept = acceptAccountantInvite.bind(null, token)

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg space-y-4">
      <h1 className="text-xl font-bold">{t('acceptTitle')}</h1>
      <p className="text-sm text-gray-600">
        {t('acceptPrompt', { entrepreneur: entrepreneur.fullName })}
      </p>
      <form action={accept}>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {tCommon('confirm')}
        </button>
      </form>
    </div>
  )
}

function InviteMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg space-y-2">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}
