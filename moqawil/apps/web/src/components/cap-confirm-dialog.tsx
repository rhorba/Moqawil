'use client'

import type { InvoiceFormState } from '@/app/(app)/invoices/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
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
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogTitle className="text-danger">{t('dialogTitle')}</DialogTitle>
        <DialogDescription>{t('dialogDescription', { client: clientName })}</DialogDescription>

        <div className="mt-4 space-y-1.5 rounded-md border border-border bg-muted p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('alreadyInvoiced')}</span>
            <span className="font-medium text-foreground">{fmt(currentTotal)} DH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('thisInvoiceAmount')}</span>
            <span className="font-medium text-foreground">+ {fmt(invoiceAmount)} DH</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="text-muted-foreground">{t('surplusLabel')}</span>
            <span className="font-medium text-danger">{fmt(surplusAmount)} DH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('withholdingLabel')}</span>
            <span className="font-medium text-danger">{fmt(whtAmount)} DH</span>
          </div>
        </div>

        <p className="mt-4 rounded-sm border border-warning bg-warning-bg p-2 text-xs text-warning">
          {t('warningNote', { amount: fmt(whtAmount) })}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {tCommon('cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            {t('confirmCta')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
