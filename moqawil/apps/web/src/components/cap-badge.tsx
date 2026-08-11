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
    bg: 'bg-safe-bg',
    border: 'border-safe',
    text: 'text-safe',
    dot: 'bg-safe',
  },
  warning: {
    bg: 'bg-warning-bg',
    border: 'border-warning',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  over: {
    bg: 'bg-danger-bg',
    border: 'border-danger',
    text: 'text-danger',
    dot: 'bg-danger',
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
        className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.border} ${cfg.text}`}
        title={`${percentOfCap.toFixed(0)}% ${t('label')} — ${t('remainingShort', { remaining: fmt(remainingMad) })}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {statusLabel}
      </span>
    )
  }

  return (
    <div className={`rounded-md border p-3 ${cfg.bg} ${cfg.border}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-xs font-semibold ${cfg.text}`}>{t('label')}</span>
        <span className={`text-xs font-semibold ${cfg.text}`}>{percentOfCap.toFixed(0)}%</span>
      </div>
      <div className="mb-2 h-1.5 w-full rounded-full bg-foreground/10">
        <div
          className={`h-1.5 rounded-full transition-[width] duration-300 ${cfg.dot}`}
          style={{ width: `${pct}%` }}
        />
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
