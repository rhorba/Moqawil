'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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
        <Label htmlFor="email" className="mb-1 block">
          {t('inviteEmailLabel')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('inviteEmailPlaceholder')}
            className={cn('flex-1', state.errors?.email && 'border-danger')}
          />
          <Button type="submit" disabled={pending} className="shrink-0">
            {pending ? t('inviteSending') : t('inviteButton')}
          </Button>
        </div>
        {state.errors?.email && <p className="mt-1 text-xs text-danger">{state.errors.email[0]}</p>}
      </div>

      {state.success && state.message && (
        <div className="space-y-1 rounded-md border border-safe bg-safe-bg p-3 text-sm text-safe">
          <p>{state.message}</p>
          {state.inviteUrl && (
            <p
              data-testid="invite-url"
              className="rounded border border-safe bg-card px-2 py-1 font-mono text-xs text-foreground break-all"
            >
              {state.inviteUrl}
            </p>
          )}
        </div>
      )}
    </form>
  )
}
