'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { clients } from '@moqawil/db'
import type { InferSelectModel } from 'drizzle-orm'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { type QuoteFormState, createQuote } from './actions'

type Client = InferSelectModel<typeof clients>

interface Line {
  id: number
  description: string
  quantity: string
  unitPriceOriginal: string
}

interface QuoteFormProps {
  clients: Client[]
}

const currencies = ['MAD', 'EUR', 'USD', 'GBP', 'CAD', 'CHF']

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(n)
}

function defaultValidUntil() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export function QuoteForm({ clients }: QuoteFormProps) {
  const t = useTranslations('quote')
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(createQuote, {})
  const [lines, setLines] = useState<Line[]>([
    { id: 0, description: '', quantity: '1', unitPriceOriginal: '' },
  ])
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [currency, setCurrency] = useState('MAD')
  const [exchangeRate, setExchangeRate] = useState('1')
  const [bamRateError, setBamRateError] = useState<string | null>(null)

  async function fetchBamRate(cur: string) {
    if (cur === 'MAD') return
    try {
      const res = await fetch('/api/exchange-rate')
      const data = await res.json()
      const rate = data[cur]
      if (rate) {
        setExchangeRate(String(rate))
        setBamRateError(null)
      } else {
        setBamRateError(data.error ?? t('bamRateError'))
      }
    } catch {
      setBamRateError(t('bamRateError'))
    }
  }

  const totalMad = lines.reduce((sum, l) => {
    const qty = Number.parseFloat(l.quantity) || 0
    const price = Number.parseFloat(l.unitPriceOriginal) || 0
    const rate = Number.parseFloat(exchangeRate) || 1
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

  return (
    <form action={formAction} className="space-y-8">
      {state.message && (
        <div className="rounded-md border border-danger bg-danger-bg p-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      {/* Client */}
      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('client')}
        </h2>
        <div>
          <Label htmlFor="clientId" className="mb-1 block">
            {t('client')} <span className="text-danger">*</span>
          </Label>
          <Select
            id="clientId"
            name="clientId"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            {clients.length === 0 && <option value="">{t('clientNotFound')}</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {state.errors?.clientId && (
            <p className="mt-1 text-xs text-danger">{state.errors.clientId[0]}</p>
          )}
        </div>
      </div>

      {/* Dates & currency */}
      <div className="space-y-4 border-t border-border pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('date')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issueDate" className="mb-1 block">
              {t('issueDate')} <span className="text-danger">*</span>
            </Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <Label htmlFor="validUntilDate" className="mb-1 block">
              {t('validUntil')} <span className="text-danger">*</span>
            </Label>
            <Input
              id="validUntilDate"
              name="validUntilDate"
              type="date"
              defaultValue={defaultValidUntil()}
            />
            {state.errors?.validUntilDate && (
              <p className="mt-1 text-xs text-danger">{state.errors.validUntilDate[0]}</p>
            )}
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
              <p className="mt-1 text-xs text-muted-foreground">{t('bamRateNotice')}</p>
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

        {state.errors?.lines && <p className="mt-1 text-xs text-danger">{state.errors.lines[0]}</p>}
      </div>

      {/* Total */}
      <div className="rounded-md border border-border bg-muted p-4">
        <div className="flex justify-between font-medium text-foreground">
          <span>{t('totalEstimate')}</span>
          <span>{fmt(totalMad)} DH</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t('notInvoiceNotice')}</p>
      </div>

      {/* Notes */}
      <div className="space-y-4 border-t border-border pt-6">
        <div>
          <Label htmlFor="notes" className="mb-1 block">
            {t('notes')}
          </Label>
          <Textarea id="notes" name="notes" rows={3} placeholder={t('notesPlaceholder')} />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={pending || clients.length === 0} size="lg">
          {pending ? t('creating') : t('create')}
        </Button>
      </div>
    </form>
  )
}
