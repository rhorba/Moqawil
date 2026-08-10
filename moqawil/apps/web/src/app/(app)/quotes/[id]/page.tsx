import { auth } from '@/lib/auth'
import { getClientById } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getQuoteWithLines } from '@/lib/queries/quote'
import { ArrowLeft, Download, Pencil } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QuoteActions } from '../quote-actions'

function fmt(n: string | number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(
    typeof n === 'string' ? Number.parseFloat(n) : n
  )
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const [t, data] = await Promise.all([
    getTranslations('quote'),
    getQuoteWithLines(id, entrepreneur.id),
  ])
  if (!data) notFound()

  const statusConfig: Record<string, { label: string; cls: string }> = {
    draft: { label: t('status.draft'), cls: 'bg-gray-100 text-gray-600' },
    sent: { label: t('status.sent'), cls: 'bg-blue-100 text-blue-700' },
    accepted: { label: t('status.accepted'), cls: 'bg-green-100 text-green-700' },
    rejected: { label: t('status.rejected'), cls: 'bg-red-100 text-red-700' },
    expired: { label: t('status.expired'), cls: 'bg-orange-100 text-orange-700' },
  }

  const { quote, lines } = data
  const client = await getClientById(quote.clientId, entrepreneur.id)
  const status = statusConfig[quote.status] ?? statusConfig.draft

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotes" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <Link
              href={`/quotes/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Pencil size={15} />
              {t('edit')}
            </Link>
          )}
          <a
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={15} />
            {t('download')}
          </a>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
        <span>
          {t('notInvoiceNotice')} {t('validUntil')} <strong>{quote.validUntilDate}</strong>.{' '}
          {t('notInCapNotice')}
        </span>
      </div>

      {quote.convertedToInvoiceId && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
          {t('convertedPrefix')}{' '}
          <Link href={`/invoices/${quote.convertedToInvoiceId}`} className="underline font-medium">
            {t('seeInvoice')}
          </Link>
        </div>
      )}

      <div className="bg-white border rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">{t('client')}</p>
            <p className="font-medium">{client?.name ?? '—'}</p>
            {client?.ice && <p className="text-gray-500 text-xs">ICE: {client.ice}</p>}
            {client?.address && <p className="text-gray-500 text-xs">{client.address}</p>}
          </div>
          <div className="text-end">
            <p className="text-gray-500 text-xs mb-1">{t('date')}</p>
            <p>
              {t('issueDate')} : {quote.issueDate}
            </p>
            <p className="text-gray-500">
              {t('validUntil')} : {quote.validUntilDate}
            </p>
          </div>
        </div>

        {quote.currency !== 'MAD' && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
            {t('currency')} : {quote.currency} · {t('bamRateLabel')} : {quote.exchangeRate} MAD/
            {quote.currency}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-start px-4 py-2 font-medium text-gray-600">
                {t('lines.description')}
              </th>
              <th className="text-end px-4 py-2 font-medium text-gray-600 w-20">
                {t('lines.quantity')}
              </th>
              <th className="text-end px-4 py-2 font-medium text-gray-600 w-28">
                {t('lines.unitPrice')}
              </th>
              <th className="text-end px-4 py-2 font-medium text-gray-600 w-28">
                {t('lines.total')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-2">{line.description}</td>
                <td className="px-4 py-2 text-end text-gray-700">{fmt(line.quantity)}</td>
                <td className="px-4 py-2 text-end text-gray-700">
                  {fmt(line.unitPriceOriginal)} {quote.currency}
                </td>
                <td className="px-4 py-2 text-end font-medium">{fmt(line.lineTotalMad)} DH</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 italic">
                {t('estimateOnly')}
              </td>
              <td className="px-4 py-2 text-end font-bold">{fmt(quote.totalMad)} DH</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!quote.convertedToInvoiceId && <QuoteActions quoteId={id} currentStatus={quote.status} />}
    </div>
  )
}
