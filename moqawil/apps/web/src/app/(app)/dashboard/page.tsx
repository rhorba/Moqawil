import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getThresholdWidget } from '@/lib/queries/invoice'
import Link from 'next/link'
import type { ActivityType } from '@moqawil/tax-engine'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)
}

const activityLabels: Record<string, string> = {
  commercial: 'Commercial',
  industrial: 'Industriel',
  artisanal: 'Artisanal',
  service: 'Services',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return null

  const year = new Date().getFullYear()
  const threshold = await getThresholdWidget(
    entrepreneur.id,
    year,
    entrepreneur.activityType as ActivityType
  )

  const thresholdPct = Math.min(100, threshold.percentOfThreshold)
  const statusColors = {
    safe: 'bg-[var(--color-safe)]',
    warning: 'bg-[var(--color-warning)]',
    over: 'bg-[var(--color-danger)]',
  }
  const statusBg = {
    safe: 'bg-[var(--color-safe-bg)] border-[var(--color-safe)]',
    warning: 'bg-[var(--color-warning-bg)] border-[var(--color-warning)]',
    over: 'bg-[var(--color-danger-bg)] border-[var(--color-danger)]',
  }
  const statusText = {
    safe: 'text-[var(--color-safe)]',
    warning: 'text-[var(--color-warning)]',
    over: 'text-[var(--color-danger)]',
  }

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const quarterDeadlines = [
    { q: 1, label: 'T1 (jan–mars)', deadline: `${year}-04-30` },
    { q: 2, label: 'T2 (avr–juin)', deadline: `${year}-07-31` },
    { q: 3, label: 'T3 (jul–sep)', deadline: `${year}-10-31` },
    { q: 4, label: 'T4 (oct–déc)', deadline: `${year + 1}-01-31` },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">
          {entrepreneur.fullName} · {activityLabels[entrepreneur.activityType]} · {year}
        </p>
      </div>

      {/* Annual threshold widget */}
      <div className={`rounded-lg border p-5 ${statusBg[threshold.status]}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className={`font-semibold text-sm ${statusText[threshold.status]}`}>
            Seuil annuel {activityLabels[entrepreneur.activityType]}
          </h2>
          <span className={`text-xs font-bold ${statusText[threshold.status]}`}>
            {threshold.percentOfThreshold.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-white/60 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${statusColors[threshold.status]}`}
            style={{ width: `${thresholdPct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>CA déclaré : <strong>{fmt(threshold.ytd)} DH</strong></span>
          <span>Seuil : <strong>{fmt(threshold.remainingMad + threshold.ytd)} DH</strong></span>
        </div>

        {threshold.status === 'warning' && (
          <p className={`text-xs mt-2 ${statusText.warning}`}>
            Attention — vous approchez du seuil. Consultez un comptable si vous pensez le dépasser deux années consécutives.
          </p>
        )}
        {threshold.status === 'over' && (
          <p className={`text-xs mt-2 font-semibold ${statusText.over}`}>
            Seuil dépassé. Si c&apos;est la 2e année consécutive, vous perdrez le statut auto-entrepreneur.
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/invoices/new"
          className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
        >
          <p className="font-semibold text-sm">Nouvelle facture</p>
          <p className="text-xs text-gray-500 mt-1">Créer et numéroter une facture</p>
        </Link>
        <Link
          href="/declarations"
          className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
        >
          <p className="font-semibold text-sm">Déclaration T{currentQuarter}</p>
          <p className="text-xs text-gray-500 mt-1">Préparer la déclaration trimestrielle</p>
        </Link>
      </div>

      {/* Quarterly timeline */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Déclarations {year}</h2>
        <div className="grid grid-cols-4 gap-3">
          {quarterDeadlines.map(({ q, label, deadline }) => {
            const isPast = q < currentQuarter
            const isCurrent = q === currentQuarter
            return (
              <Link
                key={q}
                href="/declarations"
                className={`border rounded-lg p-3 text-center transition-all hover:shadow-sm ${
                  isCurrent
                    ? 'bg-[var(--color-primary)] text-white border-transparent'
                    : isPast
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white'
                }`}
              >
                <p className={`font-bold text-sm ${isCurrent ? 'text-white' : ''}`}>{label}</p>
                <p className={`text-xs mt-1 ${isCurrent ? 'text-white/80' : 'text-gray-500'}`}>
                  Limite : {deadline}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
