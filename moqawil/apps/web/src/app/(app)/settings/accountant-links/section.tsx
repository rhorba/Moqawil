import { Badge } from '@/components/ui/badge'
import { getAccountantLinksForEntrepreneur } from '@/lib/queries/accountant'
import { getTranslations } from 'next-intl/server'
import { InviteAccountantForm } from './invite-form'
import { RevokeButton } from './revoke-button'

const STATUS_VARIANT = {
  pending: 'warning',
  active: 'safe',
  revoked: 'secondary',
} as const

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
    <div className="mt-10 space-y-4 border-t border-border pt-8">
      <div>
        <h2 className="text-lg font-medium text-foreground">{t('settingsTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('settingsHint')}</p>
      </div>

      <InviteAccountantForm />

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('linksEmpty')}</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between px-4 py-3 text-sm text-foreground"
            >
              <span>{link.invitedEmail}</span>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[link.status]}>{t(STATUS_KEYS[link.status])}</Badge>
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
