import { getAccountantLinksForEntrepreneur } from '@/lib/queries/accountant'
import { getTranslations } from 'next-intl/server'
import { InviteAccountantForm } from './invite-form'
import { RevokeButton } from './revoke-button'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  revoked: 'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_KEYS = {
  pending: 'statusPending',
  active: 'statusActive',
  revoked: 'statusRevoked',
} as const

export async function AccountantLinksSection({ entrepreneurId }: { entrepreneurId: string }) {
  const [t, links] = await Promise.all([
    getTranslations('accountant'),
    getAccountantLinksForEntrepreneur(entrepreneurId),
  ])

  return (
    <div className="mt-10 pt-8 border-t space-y-4">
      <div>
        <h2 className="text-lg font-bold">{t('settingsTitle')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('settingsHint')}</p>
      </div>

      <InviteAccountantForm />

      {links.length === 0 ? (
        <p className="text-sm text-gray-500">{t('linksEmpty')}</p>
      ) : (
        <ul className="divide-y border rounded-lg">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{link.invitedEmail}</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[link.status]}`}
                >
                  {t(STATUS_KEYS[link.status])}
                </span>
                {link.status !== 'revoked' && (
                  <RevokeButton linkId={link.id} email={link.invitedEmail} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
