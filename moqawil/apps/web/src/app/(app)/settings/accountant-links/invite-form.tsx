'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { type AccountantInviteState, inviteAccountant } from './actions'

export function InviteAccountantForm() {
  const t = useTranslations('accountant')
  const [state, action, pending] = useActionState<AccountantInviteState, FormData>(
    inviteAccountant,
    {}
  )

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {t('inviteEmailLabel')}
        </label>
        <div className="flex gap-2">
          <input
            id="email"
            name="email"
            type="email"
            placeholder={t('inviteEmailPlaceholder')}
            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
              state.errors?.email ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
          >
            {pending ? t('inviteSending') : t('inviteButton')}
          </button>
        </div>
        {state.errors?.email && (
          <p className="text-xs text-red-600 mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      {state.success && state.message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 space-y-1">
          <p>{state.message}</p>
          {state.inviteUrl && (
            <p
              data-testid="invite-url"
              className="text-xs break-all font-mono bg-white border rounded px-2 py-1"
            >
              {state.inviteUrl}
            </p>
          )}
        </div>
      )}
    </form>
  )
}
