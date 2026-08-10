'use client'

import type { clients } from '@moqawil/db'
import type { InferSelectModel } from 'drizzle-orm'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { type ClientFormState, createClient, updateClient } from './actions'

type Client = InferSelectModel<typeof clients>

const clientTypeValues = ['individual', 'company_ma', 'company_foreign'] as const
const countryValues = ['MA', 'FR', 'BE', 'DE', 'GB', 'US', 'CA', 'OTHER'] as const

export function ClientForm({ client }: { client?: Client }) {
  const t = useTranslations('client')
  const boundUpdate = client ? updateClient.bind(null, client.id) : null
  const action = boundUpdate ?? createClient

  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(action, {})

  function err(name: string) {
    return state.errors?.[name]?.[0]
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </p>
      )}

      <Field
        label={t('name')}
        name="name"
        defaultValue={client?.name}
        error={err('name')}
        required
      />

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          {t('type')} <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          defaultValue={client?.type ?? 'individual'}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {clientTypeValues.map((value) => (
            <option key={value} value={value}>
              {t(`types.${value}`)}
            </option>
          ))}
        </select>
        {err('type') && <p className="text-xs text-red-600 mt-1">{err('type')}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t('ice')}
          name="ice"
          defaultValue={client?.ice ?? ''}
          error={err('ice')}
          placeholder="000000000000000"
          hint={t('iceHint')}
        />
        <Field
          label={t('ifLabel')}
          name="ifNumber"
          defaultValue={client?.ifNumber ?? ''}
          error={err('ifNumber')}
        />
      </div>

      <Field
        label={t('email')}
        name="email"
        type="email"
        defaultValue={client?.email ?? ''}
        error={err('email')}
      />
      <Field
        label={t('phone')}
        name="phone"
        type="tel"
        defaultValue={client?.phone ?? ''}
        error={err('phone')}
      />
      <Field
        label={t('address')}
        name="address"
        defaultValue={client?.address ?? ''}
        error={err('address')}
      />

      <div>
        <label htmlFor="countryCode" className="block text-sm font-medium text-gray-700 mb-1">
          {t('country')}
        </label>
        <select
          id="countryCode"
          name="countryCode"
          defaultValue={client?.countryCode ?? 'MA'}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          {countryValues.map((value) => (
            <option key={value} value={value}>
              {t(`countries.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? t('saving') : client ? t('update') : t('create')}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  error,
  required,
  type = 'text',
  hint,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string
  error?: string
  required?: boolean
  type?: string
  hint?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
