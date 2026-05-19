import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getInvoiceWithLines } from '@/lib/queries/invoice'
import { getClients, getAllClientAnnualTotals } from '@/lib/queries/client'
import { EditInvoiceForm } from './edit-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const data = await getInvoiceWithLines(id, entrepreneur.id)
  if (!data) notFound()

  if (data.invoice.status !== 'draft') {
    return (
      <div className="p-6 max-w-2xl">
        <p className="text-sm text-gray-500">
          Seules les factures en brouillon peuvent être modifiées.{' '}
          <Link href={`/invoices/${id}`} className="text-[var(--color-primary)] underline">
            Retour
          </Link>
        </p>
      </div>
    )
  }

  const year = new Date(data.invoice.issueDate).getFullYear()
  const isService = entrepreneur.activityType === 'service'
  const allClients = await getClients(entrepreneur.id)
  const capTotals = isService ? await getAllClientAnnualTotals(entrepreneur.id, year) : {}

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/invoices/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">
          Modifier {data.invoice.invoiceNumber}
        </h1>
      </div>

      <EditInvoiceForm
        invoiceId={id}
        invoice={data.invoice}
        lines={data.lines}
        clients={allClients}
        capTotals={capTotals}
        isService={isService}
      />
    </div>
  )
}
