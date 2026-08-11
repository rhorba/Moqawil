'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
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
    <form action={action} className="space-y-8">
      {state.message && !state.success && (
        <div className="rounded-md border border-danger bg-danger-bg p-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      {/* Identification */}
      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {tSettings('sectionIdentification')}
        </h2>

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
          <Label htmlFor="activityType" className="mb-1 block">
            {t('activityType')} <span className="text-danger">*</span>
          </Label>
          <Select
            id="activityType"
            name="activityType"
            defaultValue={profile?.activityType ?? 'service'}
          >
            {activityTypeValues.map((value) => (
              <option key={value} value={value}>
                {t(`activityTypes.${value}`)}
              </option>
            ))}
          </Select>
          {fieldError('activityType') && (
            <p className="mt-1 text-xs text-danger">{fieldError('activityType')}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{t('activityHint')}</p>
        </div>

        <Field
          label={t('activityDescription')}
          name="activityDescription"
          defaultValue={profile?.activityDescription ?? ''}
          error={fieldError('activityDescription')}
          placeholder={t('activityDescriptionPlaceholder')}
        />
      </div>

      {/* Contact */}
      <div className="space-y-4 border-t border-border pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {tSettings('sectionContact')}
        </h2>

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
      </div>

      {/* Business */}
      <div className="space-y-4 border-t border-border pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {tSettings('sectionBusiness')}
        </h2>

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
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={pending} size="lg">
          {pending
            ? tSettings('saving')
            : isOnboarding
              ? tSettings('finishOnboarding')
              : tSettings('save')}
        </Button>
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
      <Label htmlFor={name} className="mb-1 block">
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(error && 'border-danger')}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
