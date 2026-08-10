/**
 * CapBadge — visual indicator for the 80,000 MAD per-client annual cap.
 * CGI Article 73-II-G-8°, Finance Law 2023.
 * Only shown for service-type AEs (activityType === 'service').
 */
'use client'

import { useTranslations } from 'next-intl'

type CapStatus = 'safe' | 'warning' | 'over'

interface CapBadgeProps {
  status: CapStatus
  percentOfCap: number
  remainingMad: number
  totalMad: number
  clientName?: string
  compact?: boolean
}

const statusColors = {
  safe: {
    bg: 'bg-[var(--color-safe-bg)]',
    border: 'border-[var(--color-safe)]',
    text: 'text-[var(--color-safe)]',
    dot: 'bg-[var(--color-safe)]',
  },
  warning: {
    bg: 'bg-[var(--color-warning-bg)]',
    border: 'border-[var(--color-warning)]',
    text: 'text-[var(--color-warning)]',
    dot: 'bg-[var(--color-warning)]',
  },
  over: {
    bg: 'bg-[var(--color-danger-bg)]',
    border: 'border-[var(--color-danger)]',
    text: 'text-[var(--color-danger)]',
    dot: 'bg-[var(--color-danger)]',
  },
}

export function CapBadge({ status, percentOfCap, remainingMad, compact }: CapBadgeProps) {
  const t = useTranslations('cap')
  const cfg = statusColors[status]
  const pct = Math.min(100, percentOfCap)
  const statusLabel = t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}` as 'statusSafe')

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.text}`}
        title={`${percentOfCap.toFixed(0)}% ${t('label')} — ${t('remainingShort', { remaining: fmt(remainingMad) })}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {statusLabel}
      </span>
    )
  }

  return (
    <div className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${cfg.text}`}>{t('label')}</span>
        <span className={`text-xs font-bold ${cfg.text}`}>{percentOfCap.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-white/60 rounded-full h-1.5 mb-2">
        <div className={`h-1.5 rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-xs ${cfg.text}`}>
        {status === 'over'
          ? t('overLimitNotice')
          : t('remainingShort', { remaining: fmt(remainingMad) })}
      </p>
    </div>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)
}
