import { CapBadge } from '@/components/cap-badge'
import { auth } from '@/lib/auth'
import { assertAccountantAccess } from '@/lib/queries/accountant'
import { getAllClientAnnualTotals, getClients } from '@/lib/queries/client'
import { getThresholdWidget } from '@/lib/queries/invoice'
import { db, entrepreneurs } from '@moqawil/db'
import type { ActivityType } from '@moqawil/tax-engine'
import { eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)
}

export default async function AccountantEntrepreneurDetailPage({
  params,
}: {
  params: Promise<{ entrepreneurId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { entrepreneurId } = await params

  // The authorization boundary — never trust the route param alone.
  const allowed = await assertAccountantAccess(session.user.id, entrepreneurId)
  if (!allowed) notFound()

  const [entrepreneur] = await db
    .select({
      id: entrepreneurs.id,
      fullName: entrepreneurs.fullName,
      activityType: entrepreneurs.activityType,
    })
    .from(entrepreneurs)
    .where(eq(entrepreneurs.id, entrepreneurId))
    .limit(1)
  if (!entrepreneur) notFound()

  const year = new Date().getFullYear()
  const [t, tEntrepreneur, threshold, clients, capTotals] = await Promise.all([
    getTranslations('accountant'),
    getTranslations('entrepreneur'),
    getThresholdWidget(entrepreneur.id, year, entrepreneur.activityType as ActivityType),
    getClients(entrepreneur.id),
    getAllClientAnnualTotals(entrepreneur.id, year),
  ])

  const isService = entrepreneur.activityType === 'service'

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/accountant" className="text-xs text-gray-500 hover:underline">
          &larr; {t('backToList')}
        </Link>
        <h1 className="text-2xl font-bold mt-1">{entrepreneur.fullName}</h1>
        <p className="text-sm text-gray-500">
          {tEntrepreneur(`activityTypes.${entrepreneur.activityType}`)} · {year}
        </p>
      </div>

      <div className="rounded-lg border p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">{t('thresholdStatus')}</h2>
          <span className="text-xs font-bold">{threshold.percentOfThreshold.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>
            {t('ytdTurnover')} : <strong>{fmt(threshold.ytd)} DH</strong>
          </span>
        </div>
      </div>

      {isService && (
        <div>
          <h2 className="font-semibold text-sm mb-3">{t('clientLabel')}</h2>
          {clients.length === 0 ? (
            <p className="text-sm text-gray-500">{t('noClients')}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {clients.map((client) => {
                const total = capTotals[client.id]
                if (!total) return null
                return (
                  <div key={client.id} className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">{client.name}</p>
                    <CapBadge
                      status={total.status}
                      percentOfCap={total.percentOfCap}
                      remainingMad={total.remainingToCapMad}
                      totalMad={total.totalInvoicedMad}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
