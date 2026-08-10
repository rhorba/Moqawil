import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getQuotes } from '@/lib/queries/quote'
import { Plus } from 'lucide-react'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Envoyé', cls: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepté', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusé', cls: 'bg-red-100 text-red-700' },
  expired: { label: 'Expiré', cls: 'bg-orange-100 text-orange-700' },
}

function fmt(n: string) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(Number.parseFloat(n))
}

export default async function QuotesPage() {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const quoteList = await getQuotes(entrepreneur.id)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Devis</h1>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Nouveau devis
        </Link>
      </div>

      {quoteList.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">Aucun devis. Créez votre premier devis.</p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Créer un devis
          </Link>
        </div>
      ) : (
        <div className="divide-y border rounded-lg bg-white">
          <div className="grid grid-cols-[auto_1fr_140px_120px_100px] gap-4 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>N°</span>
            <span>Client</span>
            <span>Date</span>
            <span className="text-end">Montant</span>
            <span className="text-center">Statut</span>
          </div>
          {quoteList.map(({ quote, clientName }) => {
            const status = statusConfig[quote.status] ?? statusConfig.draft
            return (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="grid grid-cols-[auto_1fr_140px_120px_100px] gap-4 items-center px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-mono text-gray-700">{quote.quoteNumber}</span>
                <span className="text-sm text-gray-900 truncate">{clientName}</span>
                <span className="text-sm text-gray-500">{quote.issueDate}</span>
                <span className="text-sm font-medium text-end">
                  {fmt(quote.totalMad)} {quote.currency === 'MAD' ? 'DH' : quote.currency}
                </span>
                <span className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
