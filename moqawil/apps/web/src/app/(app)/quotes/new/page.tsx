import { auth } from '@/lib/auth'
import { getClients } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getTranslations } from 'next-intl/server'
import { QuoteForm } from '../quote-form'

export default async function NewQuotePage() {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const [t, clientList] = await Promise.all([getTranslations('quote'), getClients(entrepreneur.id)])

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{t('new')}</h1>
      <QuoteForm clients={clientList} />
    </div>
  )
}
