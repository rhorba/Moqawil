import { auth } from '@/lib/auth'
import { getAccountantDashboardRows } from '@/lib/queries/accountant'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)
}

const statusBg: Record<string, string> = {
  safe: 'bg-[var(--color-safe-bg)] border-[var(--color-safe)]',
  warning: 'bg-[var(--color-warning-bg)] border-[var(--color-warning)]',
  over: 'bg-[var(--color-danger-bg)] border-[var(--color-danger)]',
}
const statusText: Record<string, string> = {
  safe: 'text-[var(--color-safe)]',
  warning: 'text-[var(--color-warning)]',
  over: 'text-[var(--color-danger)]',
}

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboardTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{year}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{t('dashboardEmpty')}</p>
      ) : (
        <div className="grid gap-4">
          {rows.map(({ entrepreneur, ytdMad, threshold, declarations }) => {
            const submittedCount = declarations.filter((d) => d.status === 'submitted').length
            return (
              <Link
                key={entrepreneur.id}
                href={`/accountant/${entrepreneur.id}`}
                className={`rounded-lg border p-4 hover:shadow-sm transition-shadow ${statusBg[threshold.status]}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{entrepreneur.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {tEntrepreneur(`activityTypes.${entrepreneur.activityType}`)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${statusText[threshold.status]}`}>
                    {threshold.percentOfThreshold.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-3">
                  <span>
                    {t('ytdTurnover')} : <strong>{fmt(ytdMad)} DH</strong>
                  </span>
                  <span>
                    {t('declarationsStatus')} :{' '}
                    <strong>
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
