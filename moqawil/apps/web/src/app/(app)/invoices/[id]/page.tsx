import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getInvoiceWithLines } from '@/lib/queries/invoice'
import { getClientById, getClientAnnualTotal } from '@/lib/queries/client'
import { CapBadge } from '@/components/cap-badge'
import { InvoiceActions } from '../invoice-actions'
import Link from 'next/link'
import { ArrowLeft, Download, Pencil } from 'lucide-react'
import { notFound } from 'next/navigation'

function fmt(n: string | number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(
    typeof n === 'string' ? parseFloat(n) : n
  )
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Envoyée', cls: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Payée', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', cls: 'bg-red-100 text-red-700' },
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const data = await getInvoiceWithLines(id, entrepreneur.id)
  if (!data) notFound()

  const { invoice, lines } = data
  const client = await getClientById(invoice.clientId, entrepreneur.id)
  const isService = entrepreneur.activityType === 'service'
  const cap = isService && client
    ? await getClientAnnualTotal(client.id, invoice.fiscalYear)
    : null

  const status = statusConfig[invoice.status] ?? statusConfig.draft

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <Link
              href={`/invoices/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Pencil size={15} />
              Modifier
            </Link>
          )}
          <a
            href={`/api/invoices/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={15} />
            Télécharger PDF
          </a>
        </div>
      </div>

      {isService && cap && client && (
        <CapBadge
          status={cap.status}
          percentOfCap={cap.percentOfCap}
          remainingMad={cap.remainingToCapMad}
          totalMad={cap.totalInvoicedMad}
          clientName={client.name}
        />
      )}

      {/* Invoice header */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Client</p>
            <p className="font-medium">{client?.name ?? '—'}</p>
            {client?.ice && <p className="text-gray-500 text-xs">ICE: {client.ice}</p>}
            {client?.address && <p className="text-gray-500 text-xs">{client.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs mb-1">Dates</p>
            <p>Émission : {invoice.issueDate}</p>
            {invoice.dueDate && <p className="text-gray-500">Échéance : {invoice.dueDate}</p>}
          </div>
        </div>

        {invoice.currency !== 'MAD' && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
            Devise : {invoice.currency} · Taux BAM : {invoice.exchangeRate} MAD/{invoice.currency}
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Description</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600 w-20">Qté</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600 w-28">Prix unitaire</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600 w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-2">{line.description}</td>
                <td className="px-4 py-2 text-right text-gray-700">{fmt(line.quantity)}</td>
                <td className="px-4 py-2 text-right text-gray-700">
                  {fmt(line.unitPriceOriginal)} {invoice.currency}
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {fmt(line.lineTotalMad)} DH
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 italic">
                TVA non applicable — Régime auto-entrepreneur (Loi 114-13)
              </td>
              <td className="px-4 py-2 text-right font-bold">{fmt(invoice.totalMad)} DH</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <InvoiceActions invoiceId={id} currentStatus={invoice.status} clientEmail={client?.email ?? null} />
    </div>
  )
}
