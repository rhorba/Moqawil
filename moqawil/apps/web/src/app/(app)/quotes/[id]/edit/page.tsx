import { auth } from '@/lib/auth'
import { getClients } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getQuoteWithLines } from '@/lib/queries/quote'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditQuoteForm } from './edit-form'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const [t, data] = await Promise.all([
    getTranslations('quote'),
    getQuoteWithLines(id, entrepreneur.id),
  ])
  if (!data) notFound()

  if (data.quote.status !== 'draft') {
    return (
      <div className="p-6 max-w-2xl">
        <p className="text-sm text-gray-500">
          {t('editOnlyDraft')}{' '}
          <Link href={`/quotes/${id}`} className="text-[var(--color-primary)] underline">
            {t('back')}
          </Link>
        </p>
      </div>
    )
  }

  const allClients = await getClients(entrepreneur.id)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/quotes/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </Link>
        <h1 className="text-2xl font-bold">
          {t('edit')} {data.quote.quoteNumber}
        </h1>
      </div>

      <EditQuoteForm quoteId={id} quote={data.quote} lines={data.lines} clients={allClients} />
    </div>
  )
}
