import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: t('status.draft'), variant: 'secondary' },
    sent: { label: t('status.sent'), variant: 'outline' },
    accepted: { label: t('status.accepted'), variant: 'safe' },
    rejected: { label: t('status.rejected'), variant: 'danger' },
    expired: { label: t('status.expired'), variant: 'warning' },
  }

  const { quote, lines } = data
  const client = await getClientById(quote.clientId, entrepreneur.id)
  const status = statusConfig[quote.status] ?? statusConfig.draft

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotes" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-2xl font-medium text-foreground">{quote.quoteNumber}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <Button variant="outline" asChild>
              <Link href={`/quotes/${id}/edit`}>
                <Pencil size={15} />
                {t('edit')}
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href={`/api/quotes/${id}/pdf`} target="_blank" rel="noreferrer">
              <Download size={15} />
              {t('download')}
            </a>
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-warning bg-warning-bg px-3 py-2 text-xs text-warning">
        <span>
          {t('notInvoiceNotice')} {t('validUntil')} <strong>{quote.validUntilDate}</strong>.{' '}
          {t('notInCapNotice')}
        </span>
      </div>

      {quote.convertedToInvoiceId && (
        <div className="rounded-md border border-safe bg-safe-bg px-3 py-2 text-sm text-safe">
          {t('convertedPrefix')}{' '}
          <Link href={`/invoices/${quote.convertedToInvoiceId}`} className="font-medium underline">
            {t('seeInvoice')}
          </Link>
        </div>
      )}

      {/* Quote header */}
      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t('client')}</p>
            <p className="font-medium text-foreground">{client?.name ?? '—'}</p>
            {client?.ice && <p className="text-xs text-muted-foreground">ICE: {client.ice}</p>}
            {client?.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
          </div>
          <div className="text-end">
            <p className="mb-1 text-xs text-muted-foreground">{t('date')}</p>
            <p className="text-foreground">
              {t('issueDate')} : {quote.issueDate}
            </p>
            <p className="text-muted-foreground">
              {t('validUntil')} : {quote.validUntilDate}
            </p>
          </div>
        </div>

        {quote.currency !== 'MAD' && (
          <div className="rounded-sm border border-border bg-muted p-2 text-xs text-muted-foreground">
            {t('currency')} : {quote.currency} · {t('bamRateLabel')} : {quote.exchangeRate} MAD/
            {quote.currency}
          </div>
        )}
      </Card>

      {/* Lines */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('lines.description')}</TableHead>
              <TableHead className="w-20 text-end">{t('lines.quantity')}</TableHead>
              <TableHead className="w-28 text-end">{t('lines.unitPrice')}</TableHead>
              <TableHead className="w-28 text-end">{t('lines.total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="text-foreground">{line.description}</TableCell>
                <TableCell className="text-end text-muted-foreground">
                  {fmt(line.quantity)}
                </TableCell>
                <TableCell className="text-end text-muted-foreground">
                  {fmt(line.unitPriceOriginal)} {quote.currency}
                </TableCell>
                <TableCell className="text-end font-medium text-foreground">
                  {fmt(line.lineTotalMad)} DH
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <tfoot className="border-t border-border bg-muted">
            <tr>
              <td colSpan={3} className="px-3 py-2 text-sm italic text-muted-foreground">
                {t('estimateOnly')}
              </td>
              <td className="px-3 py-2 text-end font-medium text-foreground">
                {fmt(quote.totalMad)} DH
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>

      {!quote.convertedToInvoiceId && <QuoteActions quoteId={id} currentStatus={quote.status} />}
    </div>
  )
}
