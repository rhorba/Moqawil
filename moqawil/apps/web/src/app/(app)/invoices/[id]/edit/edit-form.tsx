'use client'

import { CapBadge } from '@/components/cap-badge'
import { CapConfirmDialog } from '@/components/cap-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { clients, invoiceLines, invoices } from '@moqawil/db'
import type { InferSelectModel } from 'drizzle-orm'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useState } from 'react'
import { type EditInvoiceFormState, updateInvoice } from '../../actions'

type Client = InferSelectModel<typeof clients>
type Invoice = InferSelectModel<typeof invoices>
type InvoiceLine = InferSelectModel<typeof invoiceLines>
type CapTotal = {
  totalInvoicedMad: number
  totalPaidMad: number
  remainingToCapMad: number
  percentOfCap: number
  status: 'safe' | 'warning' | 'over'
}

interface Line {
  id: number
  description: string
  quantity: string
  unitPriceOriginal: string
}

interface EditInvoiceFormProps {
  invoiceId: string
  invoice: Invoice
  lines: InvoiceLine[]
  clients: Client[]
  capTotals: Record<string, CapTotal>
  isService: boolean
}

const currencies = ['MAD', 'EUR', 'USD', 'GBP', 'CAD', 'CHF']

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(n)
}

export function EditInvoiceForm({
  invoiceId,
  invoice,
  lines: initialLines,
  clients,
  capTotals,
  isService,
}: EditInvoiceFormProps) {
  const t = useTranslations('invoice')
  const boundAction = updateInvoice.bind(null, invoiceId)
  const [state, formAction, pending] = useActionState<EditInvoiceFormState, FormData>(
    boundAction,
    {}
  )

  const [lines, setLines] = useState<Line[]>(
    initialLines.map((l) => ({
      id: l.position,
      description: l.description,
      quantity: l.quantity,
      unitPriceOriginal: l.unitPriceOriginal,
    }))
  )

  const [currency, setCurrency] = useState(invoice.currency)
  const [exchangeRate, setExchangeRate] = useState(invoice.exchangeRate ?? '1')
  const [bamRateError, setBamRateError] = useState<string | null>(null)
  const [capConfirmed, setCapConfirmed] = useState(false)
  const [showCapDialog, setShowCapDialog] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const selectedCap = isService ? capTotals[invoice.clientId] : undefined

  useEffect(() => {
    if (state.capWarning && !capConfirmed) setShowCapDialog(true)
  }, [state.capWarning, capConfirmed])

  async function fetchBamRate(cur: string) {
    if (cur === 'MAD') return
    try {
      const res = await fetch('/api/exchange-rate')
      const data = await res.json()
      const rate = data[cur]
      if (rate) {
        setExchangeRate(String(rate))
        setBamRateError(null)
      } else setBamRateError(data.error ?? t('bamRateError'))
    } catch {
      setBamRateError(t('bamRateError'))
    }
  }

  const totalMad = lines.reduce((sum, l) => {
    const qty = Number.parseFloat(l.quantity) || 0
    const price = Number.parseFloat(l.unitPriceOriginal) || 0
    const rate = Number.parseFloat(String(exchangeRate)) || 1
    return sum + qty * price * rate
  }, 0)

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: Date.now(), description: '', quantity: '1', unitPriceOriginal: '' },
    ])
  }
  function removeLine(id: number) {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }
  function updateLine(id: number, field: keyof Line, value: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  function handleCapConfirm() {
    setCapConfirmed(true)
    setShowCapDialog(false)
    if (pendingFormData) {
      pendingFormData.set('capConfirmed', 'true')
      formAction(pendingFormData)
      setPendingFormData(null)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (state.capWarning && !capConfirmed) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      setPendingFormData(fd)
      setShowCapDialog(true)
    }
  }

  return (
    <>
      {showCapDialog && state.capWarning && (
        <CapConfirmDialog
          capWarning={state.capWarning}
          onConfirm={handleCapConfirm}
          onCancel={() => {
            setShowCapDialog(false)
            setCapConfirmed(false)
          }}
        />
      )}

      <form action={formAction} onSubmit={handleSubmit} className="space-y-8">
        {capConfirmed && <input type="hidden" name="capConfirmed" value="true" />}

        {state.message && (
          <div className="rounded-md border border-danger bg-danger-bg p-3 text-sm text-danger">
            {state.message}
          </div>
        )}

        {/* Client — read-only on edit */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('client')}
          </h2>
          <div>
            <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {clients.find((c) => c.id === invoice.clientId)?.name ?? '—'}
            </p>
            {isService && selectedCap && (
              <div className="mt-2">
                <CapBadge
                  status={selectedCap.status}
                  percentOfCap={selectedCap.percentOfCap}
                  remainingMad={selectedCap.remainingToCapMad}
                  totalMad={selectedCap.totalInvoicedMad}
                />
              </div>
            )}
          </div>
        </div>

        {/* Dates & currency */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('dates')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate" className="mb-1 block">
                {t('issueDate')} <span className="text-danger">*</span>
              </Label>
              <Input id="issueDate" name="issueDate" type="date" defaultValue={invoice.issueDate} />
            </div>
            <div>
              <Label htmlFor="dueDate" className="mb-1 block">
                {t('dueDateLabel')}
              </Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={invoice.dueDate ?? ''} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency" className="mb-1 block">
                {t('currency')}
              </Label>
              <Select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => {
                  const cur = e.target.value
                  setCurrency(cur)
                  if (cur === 'MAD') {
                    setExchangeRate('1')
                    setBamRateError(null)
                  } else fetchBamRate(cur)
                }}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            {currency !== 'MAD' && (
              <div>
                <Label htmlFor="exchangeRate" className="mb-1 block">
                  {t('bamRateLabel')} (MAD/{currency})
                </Label>
                <Input
                  id="exchangeRate"
                  name="exchangeRate"
                  type="number"
                  step="0.0001"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                />
                {bamRateError && <p className="mt-1 text-xs text-warning">{bamRateError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-2 border-t border-border pt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('linesLabel')}
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus size={13} /> {t('addLine')}
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_110px_32px] gap-2 px-1">
              <span className="text-xs text-muted-foreground">{t('lines.description')}</span>
              <span className="text-xs text-muted-foreground">{t('lines.quantity')}</span>
              <span className="text-xs text-muted-foreground">
                {t('lines.unitPrice')} ({currency})
              </span>
              <span />
            </div>
            {lines.map((line, idx) => (
              <div key={line.id} className="grid grid-cols-[1fr_80px_110px_32px] gap-2">
                <Input
                  name={`lines[${idx}][description]`}
                  value={line.description}
                  onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                  placeholder={t('lines.description')}
                  className="h-9 py-1.5"
                />
                <Input
                  name={`lines[${idx}][quantity]`}
                  type="number"
                  step="0.001"
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                  className="h-9 py-1.5 text-end"
                />
                <Input
                  name={`lines[${idx}][unitPriceOriginal]`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.unitPriceOriginal}
                  onChange={(e) => updateLine(line.id, 'unitPriceOriginal', e.target.value)}
                  className="h-9 py-1.5 text-end"
                />
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length === 1}
                  className="flex items-center justify-center text-muted-foreground hover:text-danger disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          {state.errors?.lines && (
            <p className="mt-1 text-xs text-danger">{state.errors.lines[0]}</p>
          )}
        </div>

        {/* Total */}
        <div className="rounded-md border border-border bg-muted p-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{t('total')}</span>
            <span className="font-medium text-foreground">{fmt(totalMad)} DH</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('vatNotice')}</p>
        </div>

        {/* Payment & notes */}
        <div className="space-y-4 border-t border-border pt-6">
          <div>
            <Label htmlFor="paymentMethod" className="mb-1 block">
              {t('paymentMethodLabel')}
            </Label>
            <Select
              id="paymentMethod"
              name="paymentMethod"
              defaultValue={invoice.paymentMethod ?? ''}
            >
              <option value="">{t('paymentMethodNone')}</option>
              <option value="virement">{t('paymentMethod.virement')}</option>
              <option value="cheque">{t('paymentMethod.cheque')}</option>
              <option value="espece">{t('paymentMethod.espece')}</option>
              <option value="effet">{t('paymentMethod.effet')}</option>
              <option value="carte">{t('paymentMethod.carte')}</option>
              <option value="other">{t('paymentMethod.other')}</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="mb-1 block">
              {t('notes')}
            </Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={invoice.notes ?? ''} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={pending} size="lg">
            {pending ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </>
  )
}
