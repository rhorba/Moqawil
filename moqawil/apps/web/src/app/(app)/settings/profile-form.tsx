'use client'

import type { entrepreneurs } from '@moqawil/db'
import type { InferSelectModel } from 'drizzle-orm'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { type ProfileFormState, upsertProfile } from './actions'

type Entrepreneur = InferSelectModel<typeof entrepreneurs>

const activityTypeValues = ['commercial', 'industrial', 'artisanal', 'service'] as const

export function ProfileForm({
  profile,
  isOnboarding,
}: {
  profile: Entrepreneur | null
  isOnboarding: boolean
}) {
  const t = useTranslations('entrepreneur')
  const tSettings = useTranslations('settings')
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

      <Field
        label={t('fullName')}
        name="fullName"
        defaultValue={profile?.fullName}
        error={fieldError('fullName')}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t('ice')}
          name="ice"
          defaultValue={profile?.ice}
          error={fieldError('ice')}
          placeholder="000000000000000"
          required
          hint={t('iceHint')}
        />
        <Field
          label={t('ifNumber')}
          name="ifNumber"
          defaultValue={profile?.ifNumber}
          error={fieldError('ifNumber')}
          required
        />
      </div>

      <div>
        <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
          {t('activityType')} <span className="text-red-500">*</span>
        </label>
        <select
          id="activityType"
          name="activityType"
          defaultValue={profile?.activityType ?? 'service'}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {activityTypeValues.map((value) => (
            <option key={value} value={value}>
              {t(`activityTypes.${value}`)}
            </option>
          ))}
        </select>
        {fieldError('activityType') && (
          <p className="text-xs text-red-600 mt-1">{fieldError('activityType')}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">{t('activityHint')}</p>
      </div>

      <Field
        label={t('activityDescription')}
        name="activityDescription"
        defaultValue={profile?.activityDescription ?? ''}
        error={fieldError('activityDescription')}
        placeholder={t('activityDescriptionPlaceholder')}
      />

      <Field
        label={t('address')}
        name="address"
        defaultValue={profile?.address}
        error={fieldError('address')}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t('city')}
          name="city"
          defaultValue={profile?.city}
          error={fieldError('city')}
          required
        />
        <Field
          label={t('phone')}
          name="phone"
          defaultValue={profile?.phone ?? ''}
          error={fieldError('phone')}
          type="tel"
        />
      </div>

      <Field
        label={t('registrationDate')}
        name="registrationDate"
        defaultValue={profile?.registrationDate ?? ''}
        error={fieldError('registrationDate')}
        type="date"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t('invoicePrefix')}
          name="invoicePrefix"
          defaultValue={profile?.invoicePrefix ?? 'FACT'}
          error={fieldError('invoicePrefix')}
          required
          hint={t('invoicePrefixHint')}
          placeholder="FACT"
        />
        <Field
          label={t('bankIban')}
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
          {pending
            ? tSettings('saving')
            : isOnboarding
              ? tSettings('finishOnboarding')
              : tSettings('save')}
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
