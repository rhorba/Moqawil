'use client'

import { useState, useTransition } from 'react'
import { markInvoicePaid, updateInvoiceStatus, sendInvoiceByEmail } from './actions'
import { Mail } from 'lucide-react'

interface InvoiceActionsProps {
  invoiceId: string
  currentStatus: string
  clientEmail?: string | null
}

export function InvoiceActions({ invoiceId, currentStatus, clientEmail }: InvoiceActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [emailResult, setEmailResult] = useState<string | null>(null)

  if (currentStatus === 'cancelled' || currentStatus === 'paid') return null

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      {emailResult && (
        <p className={`text-xs px-3 py-2 rounded-lg ${
          emailResult.startsWith('Facture envoyée')
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>{emailResult}</p>
      )}
      <div className="flex flex-wrap gap-3 items-center">
      {currentStatus === 'draft' && (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, 'sent'))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Marquer comme envoyée
          </button>
          {clientEmail && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                const r = await sendInvoiceByEmail(invoiceId)
                setEmailResult(r.message)
              })}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Mail size={14} />
              Envoyer par e-mail
            </button>
          )}
        </>
      )}

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => markInvoicePaid(invoiceId, paymentDate))}
          className="px-4 py-2 bg-[var(--color-safe)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Marquer comme payée
        </button>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm('Annuler cette facture ? Cette action ne peut pas être annulée.')) {
            startTransition(() => updateInvoiceStatus(invoiceId, 'cancelled'))
          }
        }}
        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
      >
        Annuler la facture
      </button>
      </div>
    </div>
  )
}
