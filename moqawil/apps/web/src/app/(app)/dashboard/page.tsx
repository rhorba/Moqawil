import { Card } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getThresholdWidget } from '@/lib/queries/invoice'
import { cn } from '@/lib/utils'
import type { ActivityType } from '@moqawil/tax-engine'
import { ChevronRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)
}

const statusFill = {
  safe: 'bg-safe',
  warning: 'bg-warning',
  over: 'bg-danger',
} as const

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

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return null

  const [t, tEntrepreneur] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('entrepreneur'),
  ])

  const activityLabel = tEntrepreneur(`activityTypes.${entrepreneur.activityType}`)

  const year = new Date().getFullYear()
  const threshold = await getThresholdWidget(
    entrepreneur.id,
    year,
    entrepreneur.activityType as ActivityType
  )

  const thresholdPct = Math.min(100, threshold.percentOfThreshold)

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const quarterDeadlines = [
    { q: 1, label: t('q1'), deadline: `${year}-04-30` },
    { q: 2, label: t('q2'), deadline: `${year}-07-31` },
    { q: 3, label: t('q3'), deadline: `${year}-10-31` },
    { q: 4, label: t('q4'), deadline: `${year + 1}-01-31` },
  ]

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-medium text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {entrepreneur.fullName} · {activityLabel} · {year}
        </p>
      </div>

      {/* Annual threshold widget */}
      <div className={cn('rounded-md border p-5', statusPanel[threshold.status])}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className={cn('text-sm font-medium', statusText[threshold.status])}>
            {t('thresholdTitle', { activity: activityLabel })}
          </h2>
          <span className={cn('text-xs font-semibold', statusText[threshold.status])}>
            {threshold.percentOfThreshold.toFixed(1)}%
          </span>
        </div>

        <div className="mb-3 h-2 w-full rounded-full bg-foreground/10">
          <div
            className={cn(
              'h-2 rounded-full transition-[width] duration-300',
              statusFill[threshold.status]
            )}
            style={{ width: `${thresholdPct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {t('declaredCa')} : <strong className="text-foreground">{fmt(threshold.ytd)} DH</strong>
          </span>
          <span>
            {t('thresholdAmount')} :{' '}
            <strong className="text-foreground">
              {fmt(threshold.remainingMad + threshold.ytd)} DH
            </strong>
          </span>
        </div>

        {threshold.status === 'warning' && (
          <p className={cn('mt-2 text-xs', statusText.warning)}>{t('warningNote')}</p>
        )}
        {threshold.status === 'over' && (
          <p className={cn('mt-2 text-xs font-medium', statusText.over)}>{t('overNote')}</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/invoices/new">
          <Card className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
            <div>
              <p className="text-sm font-medium text-foreground">{t('newInvoice')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('newInvoiceDesc')}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground rtl:rotate-180" />
          </Card>
        </Link>
        <Link href="/declarations">
          <Card className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('declarationQ', { quarter: currentQuarter })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('declarationDesc')}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground rtl:rotate-180" />
          </Card>
        </Link>
      </div>

      {/* Quarterly timeline */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">
          {t('declarationsForYear', { year })}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quarterDeadlines.map(({ q, label, deadline }) => {
            const isPast = q < currentQuarter
            const isCurrent = q === currentQuarter
            return (
              <Link
                key={q}
                href="/declarations"
                className={cn(
                  'rounded-md border p-3 text-center transition-colors',
                  isCurrent
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : isPast
                      ? 'border-border bg-muted text-muted-foreground'
                      : 'border-border bg-card hover:bg-muted/50'
                )}
              >
                <p className="text-sm font-medium">{label}</p>
                <p
                  className={cn(
                    'mt-1 text-xs',
                    isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}
                >
                  {t('deadline', { date: deadline })}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
