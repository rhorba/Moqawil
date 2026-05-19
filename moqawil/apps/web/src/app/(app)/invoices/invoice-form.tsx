'use client'

import { useActionState, useState, useEffect } from 'react'
import { createInvoice, type InvoiceFormState } from './actions'
import { CapBadge } from '@/components/cap-badge'
import { CapConfirmDialog } from '@/components/cap-confirm-dialog'
import { Plus, Trash2 } from 'lucide-react'
import type { InferSelectModel } from 'drizzle-orm'
import type { clients } from '@moqawil/db'

type Client = InferSelectModel<typeof clients>
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

interface InvoiceFormProps {
  clients: Client[]
  capTotals: Record<string, CapTotal>
  isService: boolean
  invoicePrefix?: string
}

const currencies = ['MAD', 'EUR', 'USD', 'GBP', 'CAD', 'CHF']

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(n)
}

export function InvoiceForm({ clients, capTotals, isService }: InvoiceFormProps) {
  const [state, formAction, pending] = useActionState<InvoiceFormState, FormData>(createInvoice, {})
  const [lines, setLines] = useState<Line[]>([{ id: 0, description: '', quantity: '1', unitPriceOriginal: '' }])
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
        setBamRateError(data.error ?? `Taux ${cur}/MAD non disponible — saisie manuelle requise`)
      }
    } catch {
      setBamRateError('Impossible de récupérer le taux BAM — saisie manuelle requise')
    }
  }
  const [capConfirmed, setCapConfirmed] = useState(false)
  const [showCapDialog, setShowCapDialog] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  // Show cap dialog when server returns capWarning
  useEffect(() => {
    if (state.capWarning && !capConfirmed) {
      setShowCapDialog(true)
    }
  }, [state.capWarning, capConfirmed])

  const selectedCap = isService ? capTotals[selectedClientId] : undefined

  const totalMad = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0
    const price = parseFloat(l.unitPriceOriginal) || 0
    const rate = parseFloat(exchangeRate) || 1
    return sum + qty * price * rate
  }, 0)

  function addLine() {
    setLines((prev) => [...prev, { id: Date.now(), description: '', quantity: '1', unitPriceOriginal: '' }])
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
          onCancel={() => { setShowCapDialog(false); setCapConfirmed(false) }}
        />
      )}

      <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
        {capConfirmed && <input type="hidden" name="capConfirmed" value="true" />}

        {state.message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {state.message}
          </div>
        )}

        {/* Client select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client <span className="text-red-500">*</span>
          </label>
          <select
            name="clientId"
            value={selectedClientId}
            onChange={(e) => { setSelectedClientId(e.target.value); setCapConfirmed(false) }}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {clients.length === 0 && <option value="">Aucun client — créez-en un d'abord</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.errors?.clientId && (
            <p className="text-xs text-red-600 mt-1">{state.errors.clientId[0]}</p>
          )}

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

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;émission <span className="text-red-500">*</span>
            </label>
            <input
              name="issueDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;échéance
            </label>
            <input name="dueDate" type="date" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select
              name="currency"
              value={currency}
              onChange={(e) => {
            const cur = e.target.value
            setCurrency(cur)
            if (cur === 'MAD') { setExchangeRate('1'); setBamRateError(null) }
            else fetchBamRate(cur)
          }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {currency !== 'MAD' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux BAM (MAD/{currency})
              </label>
              <input
                name="exchangeRate"
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Taux Bank Al-Maghrib à la date d&apos;encaissement (bkam.ma)
              </p>
              {bamRateError && (
                <p className="text-xs text-[var(--color-warning)] mt-1">{bamRateError}</p>
              )}
            </div>
          )}
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Lignes de facture</label>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              <Plus size={13} /> Ajouter une ligne
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_110px_32px] gap-2 px-1">
              <span className="text-xs text-gray-500">Description</span>
              <span className="text-xs text-gray-500">Qté</span>
              <span className="text-xs text-gray-500">Prix HT ({currency})</span>
              <span />
            </div>

            {lines.map((line, idx) => (
              <div key={line.id} className="grid grid-cols-[1fr_80px_110px_32px] gap-2">
                <input
                  name={`lines[${idx}][description]`}
                  value={line.description}
                  onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                  placeholder="Description du service"
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

        {/* Total */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Sous-total</span>
            <span>{fmt(totalMad)} DH</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>TVA non applicable — Régime auto-entrepreneur (Loi 114-13)</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total TTC</span>
            <span>{fmt(totalMad)} DH</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
          <select name="paymentMethod" className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">— Non spécifié —</option>
            <option value="virement">Virement bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="espece">Espèces</option>
            <option value="effet">Effet de commerce</option>
            <option value="carte">Carte bancaire</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Notes internes (non imprimées)"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending || clients.length === 0}
            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? 'Création…' : 'Créer la facture'}
          </button>
        </div>
      </form>
    </>
  )
}
