import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getTranslations } from 'next-intl/server'
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
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{isOnboarding ? t('onboardingTitle') : t('title')}</h1>
        {isOnboarding && <p className="text-sm text-gray-600 mt-1">{t('onboardingHint')}</p>}
      </div>

      <ProfileForm profile={profile} isOnboarding={isOnboarding} />
    </div>
  )
}
