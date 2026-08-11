'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { generateDeclaration, markDeclarationSubmitted } from './actions'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

interface DeclarationCardProps {
  declaration: {
    id: string | null
    year: number
    quarter: number
    totalTurnoverMad: number
    taxRate: number
    taxDueMad: number
    status: 'pending' | 'submitted'
    submittedAt: Date | null
    deadline: string
    daysLeft: number
  }
  year: number
  activityType: string
}

export function DeclarationCard({ declaration, year, activityType }: DeclarationCardProps) {
  const t = useTranslations('declaration')
  const [isPending, startTransition] = useTransition()
  const [generated, setGenerated] = useState<{
    turnover: number
    taxDue: number
  } | null>(
    declaration.id
      ? { turnover: declaration.totalTurnoverMad, taxDue: declaration.taxDueMad }
      : null
  )
  const [declarationId, setDeclarationId] = useState(declaration.id)
  const [status, setStatus] = useState(declaration.status)

  const { quarter, daysLeft, deadline } = declaration
  const quarterKey = String(quarter) as '1' | '2' | '3' | '4'

  const isOverdue = daysLeft < 0
  const isUrgent = daysLeft >= 0 && daysLeft <= 7
  const isFuture = daysLeft > 30

  function deadlineColor() {
    if (status === 'submitted') return 'text-safe'
    if (isOverdue) return 'text-danger'
    if (isUrgent) return 'text-warning'
    return 'text-muted-foreground'
  }

  function deadlineLabel() {
    if (status === 'submitted')
      return t('submittedOn', { date: declaration.submittedAt?.toLocaleDateString('fr-MA') ?? '—' })
    if (isOverdue) return t('overdueBy', { days: Math.abs(daysLeft), date: deadline })
    if (isUrgent) return t('urgentDaysLeft', { days: daysLeft, date: deadline })
    if (isFuture) return t('deadline', { date: deadline })
    return t('daysLeft', { days: daysLeft, date: deadline })
  }

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateDeclaration(year, quarter)
      if (result.success && result.turnover !== undefined && result.taxDue !== undefined) {
        setGenerated({ turnover: result.turnover, taxDue: result.taxDue })
        if (result.id) setDeclarationId(result.id)
      }
    })
  }

  function handleMarkSubmitted() {
    if (!declarationId) return
    startTransition(async () => {
      await markDeclarationSubmitted(declarationId)
      setStatus('submitted')
    })
  }

  return (
    <Card
      className={cn(
        'overflow-hidden',
        status === 'submitted'
          ? 'border-safe bg-safe-bg'
          : isOverdue
            ? 'border-danger bg-danger-bg'
            : undefined
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <span className="text-lg font-medium text-foreground">
            {t(`quarterShort.${quarterKey}`)} {year}
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">{t(`quarterLong.${quarterKey}`)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'submitted' ? (
            <CheckCircle size={18} className="text-safe" />
          ) : isOverdue ? (
            <AlertTriangle size={18} className="text-danger" />
          ) : (
            <Clock size={18} className="text-muted-foreground" />
          )}
          <Badge variant={status === 'submitted' ? 'safe' : 'secondary'}>
            {status === 'submitted' ? t('status.submitted') : t('status.pending')}
          </Badge>
        </div>
      </div>

      {/* Deadline */}
      <p className={cn('px-4 pb-3 text-xs font-medium', deadlineColor())}>{deadlineLabel()}</p>

      {/* Figures */}
      {generated ? (
        <div className="space-y-1 border-t border-border px-4 pb-3 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('quarterlyTurnover')}</span>
            <span className="font-medium text-foreground">{fmt(generated.turnover)} DH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('taxRateAt', { rate: activityType === 'service' ? '1,0%' : '0,5%' })}
            </span>
            <span className="font-medium text-primary">{fmt(generated.taxDue)} DH</span>
          </div>
          {generated.turnover === 0 && (
            <p className="mt-1 text-xs text-warning">{t('zeroWarning')}</p>
          )}
        </div>
      ) : (
        <div className="border-t border-border px-4 pb-3 pt-3">
          <p className="text-xs italic text-muted-foreground">{t('generateHint')}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {status !== 'submitted' && (
          <Button size="sm" onClick={handleGenerate} disabled={isPending}>
            <FileText size={13} />
            {isPending ? t('generating') : t('generate')}
          </Button>
        )}

        {generated && declarationId && (
          <Button size="sm" variant="outline" asChild>
            <a href={`/api/declarations/${declarationId}/pdf`} target="_blank" rel="noreferrer">
              <FileText size={13} />
              {t('printPdf')}
            </a>
          </Button>
        )}

        {generated && declarationId && status !== 'submitted' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkSubmitted}
            disabled={isPending}
            className="border-safe text-safe hover:bg-safe-bg"
          >
            <CheckCircle size={13} />
            {t('markSubmitted')}
          </Button>
        )}
      </div>
    </Card>
  )
}
