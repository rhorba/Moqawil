import { CapBadge } from '@/components/cap-badge'
import { auth } from '@/lib/auth'
import { getAllClientAnnualTotals, getClients } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { ChevronRight, Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function ClientsPage() {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const year = new Date().getFullYear()
  const [t, clientList, capTotals] = await Promise.all([
    getTranslations('client'),
    getClients(entrepreneur.id),
    getAllClientAnnualTotals(entrepreneur.id, year),
  ])

  const isService = entrepreneur.activityType === 'service'
  const typeLabels: Record<string, string> = {
    individual: t('types.individual'),
    company_ma: t('types.company_ma'),
    company_foreign: t('types.company_foreign'),
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      {clientList.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">{t('empty')}</p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            {t('addFirst')}
          </Link>
        </div>
      ) : (
        <div className="divide-y border rounded-lg bg-white">
          {clientList.map((client) => {
            const cap = capTotals[client.id]
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900 truncate">{client.name}</p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {typeLabels[client.type] ?? client.type}
                    </span>
                  </div>
                  {client.email && <p className="text-sm text-gray-500 mt-0.5">{client.email}</p>}
                </div>

                <div className="flex items-center gap-3 ms-4 flex-shrink-0">
                  {isService && cap && (
                    <CapBadge
                      status={cap.status}
                      percentOfCap={cap.percentOfCap}
                      remainingMad={cap.remainingToCapMad}
                      totalMad={cap.totalInvoicedMad}
                      compact
                    />
                  )}
                  <ChevronRight size={16} className="text-gray-400 rtl:rotate-180" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
