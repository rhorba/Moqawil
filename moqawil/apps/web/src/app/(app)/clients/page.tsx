import { CapBadge } from '@/components/cap-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { getAllClientAnnualTotals, getClients } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { PER_CLIENT_CAP_MAD, getCapStatus } from '@moqawil/tax-engine'
import { ChevronRight, Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

const ZERO_CAP = {
  totalInvoicedMad: 0,
  totalPaidMad: 0,
  remainingToCapMad: PER_CLIENT_CAP_MAD,
  percentOfCap: getCapStatus(0).percentOfCap,
  status: getCapStatus(0).status,
}

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">{t('title')}</h1>
        <Button asChild>
          <Link href="/clients/new">
            <Plus size={16} />
            {t('new')}
          </Link>
        </Button>
      </div>

      {clientList.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center">
          <p className="mb-4 text-muted-foreground">{t('empty')}</p>
          <Button asChild>
            <Link href="/clients/new">
              <Plus size={16} />
              {t('addFirst')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>{t('columnClient')}</span>
            {isService && <span className="ms-4 shrink-0">{t('columnCap')}</span>}
          </div>
          <div className="divide-y divide-border">
            {clientList.map((client) => {
              // Clients with zero invoices this year have no row in capTotals — default to the
              // zero/safe state so the cap badge is never silently omitted (root CLAUDE.md §4).
              const cap = capTotals[client.id] ?? ZERO_CAP
              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="truncate font-medium text-foreground">{client.name}</p>
                      <Badge variant="secondary">{typeLabels[client.type] ?? client.type}</Badge>
                    </div>
                    {client.email && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{client.email}</p>
                    )}
                  </div>

                  <div className="ms-4 flex shrink-0 items-center gap-3">
                    {isService && (
                      <CapBadge
                        status={cap.status}
                        percentOfCap={cap.percentOfCap}
                        remainingMad={cap.remainingToCapMad}
                        totalMad={cap.totalInvoicedMad}
                        compact
                      />
                    )}
                    <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
