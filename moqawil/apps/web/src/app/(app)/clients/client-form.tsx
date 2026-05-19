'use client'

import { useActionState } from 'react'
import { createClient, updateClient, type ClientFormState } from './actions'
import type { InferSelectModel } from 'drizzle-orm'
import type { clients } from '@moqawil/db'

type Client = InferSelectModel<typeof clients>

const clientTypes = [
  { value: 'individual', label: 'Particulier' },
  { value: 'company_ma', label: 'Entreprise marocaine' },
  { value: 'company_foreign', label: 'Entreprise étrangère' },
] as const

export function ClientForm({ client }: { client?: Client }) {
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

      <Field label="Nom / Raison sociale" name="name" defaultValue={client?.name} error={err('name')} required />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          name="type"
          defaultValue={client?.type ?? 'individual'}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {clientTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {err('type') && <p className="text-xs text-red-600 mt-1">{err('type')}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="ICE"
          name="ice"
          defaultValue={client?.ice ?? ''}
          error={err('ice')}
          placeholder="000000000000000"
          hint="Obligatoire pour les entreprises marocaines"
        />
        <Field label="IF" name="ifNumber" defaultValue={client?.ifNumber ?? ''} error={err('ifNumber')} />
      </div>

      <Field label="Email" name="email" type="email" defaultValue={client?.email ?? ''} error={err('email')} />
      <Field label="Téléphone" name="phone" type="tel" defaultValue={client?.phone ?? ''} error={err('phone')} />
      <Field label="Adresse" name="address" defaultValue={client?.address ?? ''} error={err('address')} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
        <select
          name="countryCode"
          defaultValue={client?.countryCode ?? 'MA'}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="MA">Maroc</option>
          <option value="FR">France</option>
          <option value="BE">Belgique</option>
          <option value="DE">Allemagne</option>
          <option value="GB">Royaume-Uni</option>
          <option value="US">États-Unis</option>
          <option value="CA">Canada</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? 'Enregistrement…' : client ? 'Mettre à jour' : 'Créer le client'}
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
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
