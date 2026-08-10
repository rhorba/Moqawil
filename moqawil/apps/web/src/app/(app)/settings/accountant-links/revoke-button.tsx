'use client'

import { useTranslations } from 'next-intl'
import { revokeAccountantLink } from './actions'

export function RevokeButton({ linkId, email }: { linkId: string; email: string }) {
  const t = useTranslations('accountant')

  return (
    <form
      action={revokeAccountantLink.bind(null, linkId)}
      onSubmit={(e) => {
        if (!confirm(t('revokeConfirm', { email }))) e.preventDefault()
      }}
    >
      <button
        type="submit"
        className="text-xs text-red-600 hover:underline"
        aria-label={`${t('revoke')} ${email}`}
      >
        {t('revoke')}
      </button>
    </form>
  )
}
