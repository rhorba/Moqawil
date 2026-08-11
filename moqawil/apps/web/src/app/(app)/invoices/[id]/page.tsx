import { CapBadge } from '@/components/cap-badge'
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
import { getClientAnnualTotal, getClientById } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getInvoiceWithLines } from '@/lib/queries/invoice'
import { ArrowLeft, Download, FileCode2, Pencil } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvoiceActions } from '../invoice-actions'

function fmt(n: string | number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(
    typeof n === 'string' ? Number.parseFloat(n) : n
  )
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const [t, data] = await Promise.all([
    getTranslations('invoice'),
    getInvoiceWithLines(id, entrepreneur.id),
  ])
  if (!data) notFound()

  const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: t('status.draft'), variant: 'secondary' },
    sent: { label: t('status.sent'), variant: 'outline' },
    paid: { label: t('status.paid'), variant: 'safe' },
    cancelled: { label: t('status.cancelled'), variant: 'danger' },
  }
  const { invoice, lines } = data
  const client = await getClientById(invoice.clientId, entrepreneur.id)
  const isService = entrepreneur.activityType === 'service'
  const cap =
    isService && client
      ? await getClientAnnualTotal(client.id, entrepreneur.id, invoice.fiscalYear)
      : null

  const status = statusConfig[invoice.status] ?? statusConfig.draft

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-2xl font-medium text-foreground">{invoice.invoiceNumber}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <Button variant="outline" asChild>
              <Link href={`/invoices/${id}/edit`}>
                <Pencil size={15} />
                {t('edit')}
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href={`/api/invoices/${id}/pdf`} target="_blank" rel="noreferrer">
              <Download size={15} />
              {t('download')}
            </a>
          </Button>
          {invoice.status !== 'draft' && (
            <Button variant="outline" asChild>
              <a href={`/api/invoices/${id}/ubl`} target="_blank" rel="noreferrer">
                <FileCode2 size={15} />
                {t('downloadUbl')}
              </a>
            </Button>
          )}
        </div>
      </div>

      {invoice.status !== 'draft' && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          <FileCode2 size={13} className="shrink-0" />
          <span>{t('ublReadyNotice')}</span>
        </div>
      )}

      {isService && cap && client && (
        <CapBadge
          status={cap.status}
          percentOfCap={cap.percentOfCap}
          remainingMad={cap.remainingToCapMad}
          totalMad={cap.totalInvoicedMad}
          clientName={client.name}
        />
      )}

      {/* Invoice header */}
      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t('billedTo')}</p>
            <p className="font-medium text-foreground">{client?.name ?? '—'}</p>
            {client?.ice && <p className="text-xs text-muted-foreground">ICE: {client.ice}</p>}
            {client?.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
          </div>
          <div className="text-end">
            <p className="mb-1 text-xs text-muted-foreground">{t('dates')}</p>
            <p className="text-foreground">
              {t('issueDateLabel')} : {invoice.issueDate}
            </p>
            {invoice.dueDate && (
              <p className="text-muted-foreground">
                {t('dueDateLabel')} : {invoice.dueDate}
              </p>
            )}
          </div>
        </div>

        {invoice.currency !== 'MAD' && (
          <div className="rounded-sm border border-border bg-muted p-2 text-xs text-muted-foreground">
            {t('currencyLabel')} : {invoice.currency} · {t('bamRateLabel')} : {invoice.exchangeRate}{' '}
            MAD/{invoice.currency}
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
                  {fmt(line.unitPriceOriginal)} {invoice.currency}
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
                {t('vatNotice')}
              </td>
              <td className="px-3 py-2 text-end font-medium text-foreground">
                {fmt(invoice.totalMad)} DH
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>

      <InvoiceActions
        invoiceId={id}
        currentStatus={invoice.status}
        clientEmail={client?.email ?? null}
      />
    </div>
  )
}
