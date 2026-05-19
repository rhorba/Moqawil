'use client'

import { useActionState } from 'react'
import { upsertProfile, type ProfileFormState } from './actions'
import type { InferSelectModel } from 'drizzle-orm'
import type { entrepreneurs } from '@moqawil/db'

type Entrepreneur = InferSelectModel<typeof entrepreneurs>

const activityTypes = [
  { value: 'commercial', label: 'Commercial (achat/revente)' },
  { value: 'industrial', label: 'Industriel (fabrication)' },
  { value: 'artisanal', label: 'Artisanal' },
  { value: 'service', label: 'Services (conseil, dev, design…)' },
] as const

export function ProfileForm({
  profile,
  isOnboarding,
}: {
  profile: Entrepreneur | null
  isOnboarding: boolean
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(upsertProfile, {})

  function fieldError(name: keyof Entrepreneur | string) {
    const errs = state.errors?.[name as keyof typeof state.errors]
    return errs?.[0]
  }

  return (
    <form action={action} className="space-y-5">
      {state.message && !state.success && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.message}
        </div>
      )}

      <Field label="Nom complet" name="fullName" defaultValue={profile?.fullName} error={fieldError('fullName')} required />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="ICE (15 chiffres)"
          name="ice"
          defaultValue={profile?.ice}
          error={fieldError('ice')}
          placeholder="000000000000000"
          required
          hint="Identifiant Commun de l'Entreprise — RNAE"
        />
        <Field
          label="IF (Identifiant Fiscal)"
          name="ifNumber"
          defaultValue={profile?.ifNumber}
          error={fieldError('ifNumber')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type d&apos;activité <span className="text-red-500">*</span>
        </label>
        <select
          name="activityType"
          defaultValue={profile?.activityType ?? 'service'}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {activityTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {fieldError('activityType') && (
          <p className="text-xs text-red-600 mt-1">{fieldError('activityType')}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Services : taux 1% sur CA, seuil 200 000 DH/an, plafond 80 000 DH/client.
          Commercial/Industriel/Artisanal : taux 0,5%, seuil 500 000 DH/an.
        </p>
      </div>

      <Field
        label="Description de l'activité"
        name="activityDescription"
        defaultValue={profile?.activityDescription ?? ''}
        error={fieldError('activityDescription')}
        placeholder="Ex: Développement web et applications mobiles"
      />

      <Field label="Adresse" name="address" defaultValue={profile?.address} error={fieldError('address')} required />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ville" name="city" defaultValue={profile?.city} error={fieldError('city')} required />
        <Field label="Téléphone" name="phone" defaultValue={profile?.phone ?? ''} error={fieldError('phone')} type="tel" />
      </div>

      <Field
        label="Date d'immatriculation RNAE"
        name="registrationDate"
        defaultValue={profile?.registrationDate ?? ''}
        error={fieldError('registrationDate')}
        type="date"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Préfixe de facture"
          name="invoicePrefix"
          defaultValue={profile?.invoicePrefix ?? 'FACT'}
          error={fieldError('invoicePrefix')}
          required
          hint="Ex: FACT → FACT-2026-001"
          placeholder="FACT"
        />
        <Field
          label="IBAN bancaire"
          name="bankIban"
          defaultValue={profile?.bankIban ?? ''}
          error={fieldError('bankIban')}
          placeholder="MA64…"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? 'Enregistrement…' : isOnboarding ? 'Terminer la configuration' : 'Enregistrer'}
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
