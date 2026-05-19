import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getClients, getAllClientAnnualTotals } from '@/lib/queries/client'
import { InvoiceForm } from '../invoice-form'

export default async function NewInvoicePage() {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const year = new Date().getFullYear()
  const [clientList, capTotals] = await Promise.all([
    getClients(entrepreneur.id),
    getAllClientAnnualTotals(entrepreneur.id, year),
  ])

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Nouvelle facture</h1>
      <InvoiceForm
        clients={clientList}
        capTotals={capTotals}
        isService={entrepreneur.activityType === 'service'}
        invoicePrefix={entrepreneur.invoicePrefix}
      />
    </div>
  )
}
