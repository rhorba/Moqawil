'use client'

import { CapConfirmDialog } from '@/components/cap-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('quote')
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
    <Card className="space-y-3 p-4">
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
        <p className="rounded-sm bg-danger-bg px-3 py-2 text-xs text-danger">
          {convertState.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {currentStatus === 'draft' && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => startTransition(() => updateQuoteStatus(quoteId, 'sent'))}
            >
              {t('markSent')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (confirm(t('deleteConfirm'))) {
                  startTransition(async () => {
                    await deleteQuote(quoteId)
                    router.push('/quotes')
                  })
                }
              }}
            >
              {t('delete')}
            </Button>
          </>
        )}

        <Button
          type="button"
          disabled={isPending}
          onClick={() => runConvert(false)}
          className="bg-safe text-primary-foreground hover:bg-safe/90"
        >
          {t('convertToInvoice')}
        </Button>

        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            if (confirm(t('rejectConfirm'))) {
              startTransition(() => updateQuoteStatus(quoteId, 'rejected'))
            }
          }}
        >
          {t('markRejected')}
        </Button>
      </div>
    </Card>
  )
}
