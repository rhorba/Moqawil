import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getClientById, getClientAnnualTotal } from '@/lib/queries/client'
import { CapBadge } from '@/components/cap-badge'
import { ClientForm } from '../client-form'
import { eq, and } from 'drizzle-orm'
import { db, invoices } from '@moqawil/db'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const client = await getClientById(id, entrepreneur.id)
  if (!client) notFound()

  const year = new Date().getFullYear()
  const isService = entrepreneur.activityType === 'service'

  const cap = isService ? await getClientAnnualTotal(id, year) : null

  const clientInvoices = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.clientId, id),
      eq(invoices.entrepreneurId, entrepreneur.id),
      eq(invoices.fiscalYear, year)
    ))
    .orderBy(invoices.sequenceNumber)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </Link>
        <h1 className="text-2xl font-bold">{client.name}</h1>
      </div>

      {isService && cap && (
        <CapBadge
          status={cap.status}
          percentOfCap={cap.percentOfCap}
          remainingMad={cap.remainingToCapMad}
          totalMad={cap.totalInvoicedMad}
          clientName={client.name}
        />
      )}

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-4">Modifier le client</h2>
        <ClientForm client={client} />
      </div>

      <div>
        <h2 className="font-semibold mb-3">Factures {year}</h2>
        {clientInvoices.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune facture cette année.</p>
        ) : (
          <div className="divide-y border rounded-lg bg-white">
            {clientInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{inv.issueDate}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(
                      parseFloat(inv.totalMad)
                    )}{' '}
                    DH
                  </p>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    cancelled: 'Annulée',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
