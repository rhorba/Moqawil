import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getTranslations } from 'next-intl/server'
import { AccountantLinksSection } from './accountant-links/section'
import { ProfileForm } from './profile-form'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const session = await auth()
  const { onboarding } = await searchParams
  const [t, profile] = await Promise.all([
    getTranslations('settings'),
    session?.user?.id ? getEntrepreneur(session.user.id) : Promise.resolve(null),
  ])

  const isOnboarding = onboarding === '1'

  return (
    <div className="max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">
          {isOnboarding ? t('onboardingTitle') : t('title')}
        </h1>
        {isOnboarding && (
          <p className="mt-1 text-sm text-muted-foreground">{t('onboardingHint')}</p>
        )}
      </div>

      <ProfileForm profile={profile} isOnboarding={isOnboarding} />

      {/* Accountant access (Sprint 9) — only once the profile exists; onboarding
          has nothing to grant access to yet. */}
      {!isOnboarding && profile && <AccountantLinksSection entrepreneurId={profile.id} />}
    </div>
  )
}
