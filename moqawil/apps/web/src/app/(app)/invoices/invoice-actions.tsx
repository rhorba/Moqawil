'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { markInvoicePaid, sendInvoiceByEmail, updateInvoiceStatus } from './actions'

interface InvoiceActionsProps {
  invoiceId: string
  currentStatus: string
  clientEmail?: string | null
}

export function InvoiceActions({ invoiceId, currentStatus, clientEmail }: InvoiceActionsProps) {
  const t = useTranslations('invoice')
  const [isPending, startTransition] = useTransition()
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)

  if (currentStatus === 'cancelled' || currentStatus === 'paid') return null

  return (
    <Card className="space-y-3 p-4">
      {emailResult && (
        <p
          className={`rounded-sm px-3 py-2 text-xs ${
            emailResult.success ? 'bg-safe-bg text-safe' : 'bg-danger-bg text-danger'
          }`}
        >
          {emailResult.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {currentStatus === 'draft' && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, 'sent'))}
            >
              {t('markSent')}
            </Button>
            {clientEmail && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await sendInvoiceByEmail(invoiceId)
                    setEmailResult(r)
                  })
                }
              >
                <Mail size={14} />
                {t('sendByEmail')}
              </Button>
            )}
          </>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-auto"
          />
          <Button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => markInvoicePaid(invoiceId, paymentDate))}
            className="bg-safe text-primary-foreground hover:bg-safe/90"
          >
            {t('markPaid')}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            if (confirm(t('cancelConfirm'))) {
              startTransition(() => updateInvoiceStatus(invoiceId, 'cancelled'))
            }
          }}
          className="text-danger hover:bg-danger-bg hover:text-danger"
        >
          {t('cancelInvoice')}
        </Button>
      </div>
    </Card>
  )
}
