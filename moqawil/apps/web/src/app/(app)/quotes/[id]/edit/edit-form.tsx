'use client'

import type { clients, quoteLines, quotes } from '@moqawil/db'
import type { InferSelectModel } from 'drizzle-orm'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { type QuoteFormState, updateQuote } from '../../actions'

type Client = InferSelectModel<typeof clients>
type Quote = InferSelectModel<typeof quotes>
type QuoteLine = InferSelectModel<typeof quoteLines>

interface Line {
  id: number
  description: string
  quantity: string
  unitPriceOriginal: string
}

interface EditQuoteFormProps {
  quoteId: string
  quote: Quote
  lines: QuoteLine[]
  clients: Client[]
}

const currencies = ['MAD', 'EUR', 'USD', 'GBP', 'CAD', 'CHF']

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(n)
}

export function EditQuoteForm({
  quoteId,
  quote,
  lines: initialLines,
  clients,
}: EditQuoteFormProps) {
  const t = useTranslations('quote')
  const boundAction = updateQuote.bind(null, quoteId)
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(boundAction, {})

  const [lines, setLines] = useState<Line[]>(
    initialLines.map((l) => ({
      id: l.position,
      description: l.description,
      quantity: l.quantity,
      unitPriceOriginal: l.unitPriceOriginal,
    }))
  )

  const [currency, setCurrency] = useState(quote.currency)
  const [exchangeRate, setExchangeRate] = useState(quote.exchangeRate ?? '1')
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

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">{t('client')}</p>
        <p className="text-sm text-gray-600 border rounded-lg px-3 py-2 bg-gray-50">
          {clients.find((c) => c.id === quote.clientId)?.name ?? '—'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
            {t('issueDate')} <span className="text-red-500">*</span>
          </label>
          <input
            id="issueDate"
            name="issueDate"
            type="date"
            defaultValue={quote.issueDate}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="validUntilDate" className="block text-sm font-medium text-gray-700 mb-1">
            {t('validUntil')} <span className="text-red-500">*</span>
          </label>
          <input
            id="validUntilDate"
            name="validUntilDate"
            type="date"
            defaultValue={quote.validUntilDate}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            {t('currency')}
          </label>
          <select
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
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {currency !== 'MAD' && (
          <div>
            <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('bamRateLabel')} (MAD/{currency})
            </label>
            <input
              id="exchangeRate"
              name="exchangeRate"
              type="number"
              step="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            {bamRateError && (
              <p className="text-xs text-[var(--color-warning)] mt-1">{bamRateError}</p>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{t('linesLabel')}</span>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
          >
            <Plus size={13} /> {t('addLine')}
          </button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_80px_110px_32px] gap-2 px-1">
            <span className="text-xs text-gray-500">{t('lines.description')}</span>
            <span className="text-xs text-gray-500">{t('lines.quantity')}</span>
            <span className="text-xs text-gray-500">
              {t('lines.unitPrice')} ({currency})
            </span>
            <span />
          </div>
          {lines.map((line, idx) => (
            <div key={line.id} className="grid grid-cols-[1fr_80px_110px_32px] gap-2">
              <input
                name={`lines[${idx}][description]`}
                value={line.description}
                onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                placeholder={t('lines.description')}
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
              <input
                name={`lines[${idx}][quantity]`}
                type="number"
                step="0.001"
                min="0"
                value={line.quantity}
                onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-sm text-right"
              />
              <input
                name={`lines[${idx}][unitPriceOriginal]`}
                type="number"
                step="0.01"
                min="0"
                value={line.unitPriceOriginal}
                onChange={(e) => updateLine(line.id, 'unitPriceOriginal', e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-sm text-right"
              />
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                disabled={lines.length === 1}
                className="flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {state.errors?.lines && (
          <p className="text-xs text-red-600 mt-1">{state.errors.lines[0]}</p>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{t('totalEstimate')}</span>
          <span className="font-bold">{fmt(totalMad)} DH</span>
        </div>
        <p className="text-xs text-gray-400">{t('estimateOnly')}</p>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          {t('notes')}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={quote.notes ?? ''}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  )
}
