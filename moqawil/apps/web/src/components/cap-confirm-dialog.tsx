'use client'

import type { InvoiceFormState } from '@/app/(app)/invoices/actions'
import { useTranslations } from 'next-intl'

interface CapConfirmDialogProps {
  capWarning: NonNullable<InvoiceFormState['capWarning']>
  onConfirm: () => void
  onCancel: () => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(n)
}

export function CapConfirmDialog({ capWarning, onConfirm, onCancel }: CapConfirmDialogProps) {
  const t = useTranslations('cap')
  const tCommon = useTranslations('common')
  const { clientName, currentTotal, invoiceAmount, surplusAmount } = capWarning
  const whtAmount = surplusAmount * 0.3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-[var(--color-danger-bg)] border-b border-[var(--color-danger)] p-4">
          <h2 className="font-bold text-[var(--color-danger)] text-lg">{t('dialogTitle')}</h2>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">{t('dialogDescription', { client: clientName })}</p>

          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('alreadyInvoiced')}</span>
              <span className="font-medium">{fmt(currentTotal)} DH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('thisInvoiceAmount')}</span>
              <span className="font-medium">+ {fmt(invoiceAmount)} DH</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="text-gray-600">{t('surplusLabel')}</span>
              <span className="font-bold text-[var(--color-danger)]">{fmt(surplusAmount)} DH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('withholdingLabel')}</span>
              <span className="font-bold text-[var(--color-danger)]">{fmt(whtAmount)} DH</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
            {t('warningNote', { amount: fmt(whtAmount) })}
          </p>
        </div>

        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-[var(--color-danger)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t('confirmCta')}
          </button>
        </div>
      </div>
    </div>
  )
}
