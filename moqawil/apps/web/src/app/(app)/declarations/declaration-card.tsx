'use client'

import { useState, useTransition } from 'react'
import { generateDeclaration, markDeclarationSubmitted } from './actions'
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const quarterLabels: Record<number, string> = {
  1: 'T1 — Janvier · Février · Mars',
  2: 'T2 — Avril · Mai · Juin',
  3: 'T3 — Juillet · Août · Septembre',
  4: 'T4 — Octobre · Novembre · Décembre',
}

const quarterShort: Record<number, string> = {
  1: 'T1',
  2: 'T2',
  3: 'T3',
  4: 'T4',
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
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
  const [isPending, startTransition] = useTransition()
  const [generated, setGenerated] = useState<{
    turnover: number
    taxDue: number
  } | null>(declaration.id ? { turnover: declaration.totalTurnoverMad, taxDue: declaration.taxDueMad } : null)
  const [declarationId, setDeclarationId] = useState(declaration.id)
  const [status, setStatus] = useState(declaration.status)

  const { quarter, daysLeft, deadline } = declaration

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
    if (status === 'submitted') return `Soumise le ${declaration.submittedAt?.toLocaleDateString('fr-MA') ?? '—'}`
    if (isOverdue) return `En retard de ${Math.abs(daysLeft)} j — limite ${deadline}`
    if (isUrgent) return `Urgent — ${daysLeft} j restants (limite ${deadline})`
    if (isFuture) return `Limite : ${deadline}`
    return `${daysLeft} j restants — limite ${deadline}`
  }

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateDeclaration(year, quarter)
      if (result.success && result.turnover !== undefined) {
        setGenerated({ turnover: result.turnover!, taxDue: result.taxDue! })
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
          <span className="text-lg font-bold">{quarterShort[quarter]} {year}</span>
          <p className="text-xs text-gray-500 mt-0.5">{quarterLabels[quarter]}</p>
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
            {status === 'submitted' ? 'Soumise' : 'En attente'}
          </span>
        </div>
      </div>

      {/* Deadline */}
      <p className={`px-4 text-xs font-medium pb-3 ${deadlineColor()}`}>{deadlineLabel()}</p>

      {/* Figures */}
      {generated ? (
        <div className="px-4 pb-3 space-y-1 border-t pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">CA trimestriel</span>
            <span className="font-medium">{fmt(generated.turnover)} DH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Taux ({activityType === 'service' ? '1,0%' : '0,5%'})
            </span>
            <span className="font-medium text-[var(--color-primary)]">
              {fmt(generated.taxDue)} DH
            </span>
          </div>
          {generated.turnover === 0 && (
            <p className="text-xs text-[var(--color-warning)] mt-1">
              CA nul — déclaration à zéro obligatoire. Deux déclarations nulles consécutives
              dès l&apos;an 2 entraînent la perte du statut AE.
            </p>
          )}
        </div>
      ) : (
        <div className="px-4 pb-3 border-t pt-3">
          <p className="text-xs text-gray-400 italic">
            Cliquez sur "Générer" pour calculer depuis vos factures payées.
          </p>
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
            {isPending ? 'Calcul…' : 'Générer'}
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
            Imprimer PDF
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
            Marquer soumise
          </button>
        )}
      </div>
    </div>
  )
}
