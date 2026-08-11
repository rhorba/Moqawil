import { auth } from '@/lib/auth'
import { getAccountantDashboardRows } from '@/lib/queries/accountant'
import { cn } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)
}

const statusPanel = {
  safe: 'bg-safe-bg border-safe',
  warning: 'bg-warning-bg border-warning',
  over: 'bg-danger-bg border-danger',
} as const

const statusText = {
  safe: 'text-safe',
  warning: 'text-warning',
  over: 'text-danger',
} as const

export default async function AccountantDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const year = new Date().getFullYear()
  const [t, tEntrepreneur, rows] = await Promise.all([
    getTranslations('accountant'),
    getTranslations('entrepreneur'),
    getAccountantDashboardRows(session.user.id, year),
  ])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-medium text-foreground">{t('dashboardTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{year}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('dashboardEmpty')}</p>
      ) : (
        <div className="grid gap-4">
          {rows.map(({ entrepreneur, ytdMad, threshold, declarations }) => {
            const submittedCount = declarations.filter((d) => d.status === 'submitted').length
            return (
              <Link
                key={entrepreneur.id}
                href={`/accountant/${entrepreneur.id}`}
                className={cn(
                  'rounded-md border p-4 transition-colors hover:bg-muted/50',
                  statusPanel[threshold.status]
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{entrepreneur.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {tEntrepreneur(`activityTypes.${entrepreneur.activityType}`)}
                    </p>
                  </div>
                  <span className={cn('text-xs font-semibold', statusText[threshold.status])}>
                    {threshold.percentOfThreshold.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {t('ytdTurnover')} :{' '}
                    <strong className="text-foreground">{fmt(ytdMad)} DH</strong>
                  </span>
                  <span>
                    {t('declarationsStatus')} :{' '}
                    <strong className="text-foreground">
                      {submittedCount}/{declarations.length || 4}
                    </strong>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
