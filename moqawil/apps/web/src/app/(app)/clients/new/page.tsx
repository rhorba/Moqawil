import { getTranslations } from 'next-intl/server'
import { ClientForm } from '../client-form'

export default async function NewClientPage() {
  const t = await getTranslations('client')
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">{t('new')}</h1>
      <ClientForm />
    </div>
  )
}
