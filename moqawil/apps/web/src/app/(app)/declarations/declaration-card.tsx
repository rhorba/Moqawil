'use client'

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
    if (status === 'submitted') return 'text-[var(--color-safe)]'
    if (isOverdue) return 'text-[var(--color-danger)]'
    if (isUrgent) return 'text-[var(--color-warning)]'
    return 'text-gray-500'
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
    <div
      className={`border rounded-xl overflow-hidden ${
        status === 'submitted'
          ? 'border-[var(--color-safe)] bg-[var(--color-safe-bg)]'
          : isOverdue
            ? 'border-[var(--color-danger)] bg-[var(--color-danger-bg)]'
            : 'border-gray-200 bg-white'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <span className="text-lg font-bold">
            {t(`quarterShort.${quarterKey}`)} {year}
          </span>
          <p className="text-xs text-gray-500 mt-0.5">{t(`quarterLong.${quarterKey}`)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'submitted' ? (
            <CheckCircle size={18} className="text-[var(--color-safe)]" />
          ) : isOverdue ? (
            <AlertTriangle size={18} className="text-[var(--color-danger)]" />
          ) : (
            <Clock size={18} className="text-gray-400" />
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              status === 'submitted'
                ? 'bg-[var(--color-safe)] text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {status === 'submitted' ? t('status.submitted') : t('status.pending')}
          </span>
        </div>
      </div>

      {/* Deadline */}
      <p className={`px-4 text-xs font-medium pb-3 ${deadlineColor()}`}>{deadlineLabel()}</p>

      {/* Figures */}
      {generated ? (
        <div className="px-4 pb-3 space-y-1 border-t pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('quarterlyTurnover')}</span>
            <span className="font-medium">{fmt(generated.turnover)} DH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {t('taxRateAt', { rate: activityType === 'service' ? '1,0%' : '0,5%' })}
            </span>
            <span className="font-medium text-[var(--color-primary)]">
              {fmt(generated.taxDue)} DH
            </span>
          </div>
          {generated.turnover === 0 && (
            <p className="text-xs text-[var(--color-warning)] mt-1">{t('zeroWarning')}</p>
          )}
        </div>
      ) : (
        <div className="px-4 pb-3 border-t pt-3">
          <p className="text-xs text-gray-400 italic">{t('generateHint')}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        {status !== 'submitted' && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            <FileText size={13} />
            {isPending ? t('generating') : t('generate')}
          </button>
        )}

        {generated && declarationId && (
          <a
            href={`/api/declarations/${declarationId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
          >
            <FileText size={13} />
            {t('printPdf')}
          </a>
        )}

        {generated && declarationId && status !== 'submitted' && (
          <button
            type="button"
            onClick={handleMarkSubmitted}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-safe)] text-[var(--color-safe)] rounded-lg text-xs hover:bg-[var(--color-safe-bg)] disabled:opacity-50"
          >
            <CheckCircle size={13} />
            {t('markSubmitted')}
          </button>
        )}
      </div>
    </div>
  )
}
