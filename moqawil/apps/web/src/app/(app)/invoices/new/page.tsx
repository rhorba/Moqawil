import { auth } from '@/lib/auth'
import { getAllClientAnnualTotals, getClients } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getTranslations } from 'next-intl/server'
import { InvoiceForm } from '../invoice-form'

export default async function NewInvoicePage() {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const year = new Date().getFullYear()
  const [t, clientList, capTotals] = await Promise.all([
    getTranslations('invoice'),
    getClients(entrepreneur.id),
    getAllClientAnnualTotals(entrepreneur.id, year),
  ])

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t('new')}</h1>
      <InvoiceForm
        clients={clientList}
        capTotals={capTotals}
        isService={entrepreneur.activityType === 'service'}
        invoicePrefix={entrepreneur.invoicePrefix}
      />
    </div>
  )
}
