'use client'

import { CapConfirmDialog } from '@/components/cap-confirm-dialog'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  type ConvertQuoteState,
  convertQuoteToInvoice,
  deleteQuote,
  updateQuoteStatus,
} from './actions'

interface QuoteActionsProps {
  quoteId: string
  currentStatus: string
}

export function QuoteActions({ quoteId, currentStatus }: QuoteActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [convertState, setConvertState] = useState<ConvertQuoteState>({})
  const [showCapDialog, setShowCapDialog] = useState(false)

  if (currentStatus === 'rejected' || currentStatus === 'expired') return null

  function runConvert(capConfirmed: boolean) {
    startTransition(async () => {
      const result = await convertQuoteToInvoice(quoteId, capConfirmed)
      setConvertState(result)
      if (result.capWarning) setShowCapDialog(true)
    })
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      {showCapDialog && convertState.capWarning && (
        <CapConfirmDialog
          capWarning={convertState.capWarning}
          onConfirm={() => {
            setShowCapDialog(false)
            runConvert(true)
          }}
          onCancel={() => setShowCapDialog(false)}
        />
      )}

      {convertState.message && (
        <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700">
          {convertState.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        {currentStatus === 'draft' && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => updateQuoteStatus(quoteId, 'sent'))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Marquer comme envoyé
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (confirm('Supprimer ce devis brouillon ? Cette action est définitive.')) {
                  startTransition(async () => {
                    await deleteQuote(quoteId)
                    router.push('/quotes')
                  })
                }
              }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
            >
              Supprimer
            </button>
          </>
        )}

        <button
          type="button"
          disabled={isPending}
          onClick={() => runConvert(false)}
          className="px-4 py-2 bg-[var(--color-safe)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Convertir en facture
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm('Marquer ce devis comme refusé ?')) {
              startTransition(() => updateQuoteStatus(quoteId, 'rejected'))
            }
          }}
          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
        >
          Marquer refusé
        </button>
      </div>
    </div>
  )
}
