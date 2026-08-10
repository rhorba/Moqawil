import { auth } from '@/lib/auth'
import { getClients } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { QuoteForm } from '../quote-form'

export default async function NewQuotePage() {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const clientList = await getClients(entrepreneur.id)

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Nouveau devis</h1>
      <QuoteForm clients={clientList} />
    </div>
  )
}
