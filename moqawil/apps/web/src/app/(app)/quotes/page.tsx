import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getQuotes } from '@/lib/queries/quote'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

function fmt(n: string) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(Number.parseFloat(n))
}

export default async function QuotesPage() {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const [t, quoteList] = await Promise.all([getTranslations('quote'), getQuotes(entrepreneur.id)])

  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: t('status.draft'), variant: 'secondary' },
    sent: { label: t('status.sent'), variant: 'outline' },
    accepted: { label: t('status.accepted'), variant: 'safe' },
    rejected: { label: t('status.rejected'), variant: 'danger' },
    expired: { label: t('status.expired'), variant: 'warning' },
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">{t('title')}</h1>
        <Button asChild>
          <Link href="/quotes/new">
            <Plus size={16} />
            {t('new')}
          </Link>
        </Button>
      </div>

      {quoteList.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center">
          <p className="mb-4 text-muted-foreground">{t('empty')}</p>
          <Button asChild>
            <Link href="/quotes/new">
              <Plus size={16} />
              {t('addFirst')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="grid grid-cols-[auto_1fr_140px_120px_100px] gap-4 border-b border-border bg-muted px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>{t('number')}</span>
            <span>{t('client')}</span>
            <span>{t('date')}</span>
            <span className="text-end">{t('amount')}</span>
            <span className="text-center">{t('statusHeader')}</span>
          </div>
          <div className="divide-y divide-border">
            {quoteList.map(({ quote, clientName }) => {
              const status = statusConfig[quote.status] ?? statusConfig.draft
              return (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className="grid grid-cols-[auto_1fr_140px_120px_100px] items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="font-mono text-sm text-muted-foreground">
                    {quote.quoteNumber}
                  </span>
                  <span className="truncate text-sm text-foreground">{clientName}</span>
                  <span className="text-sm text-muted-foreground">{quote.issueDate}</span>
                  <span className="text-end text-sm font-medium text-foreground">
                    {fmt(quote.totalMad)} {quote.currency === 'MAD' ? 'DH' : quote.currency}
                  </span>
                  <span className="flex justify-center">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
