import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { ProfileForm } from './profile-form'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const session = await auth()
  const { onboarding } = await searchParams
  const profile = session?.user?.id ? await getEntrepreneur(session.user.id) : null

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {onboarding === '1' ? 'Configurer votre profil auto-entrepreneur' : 'Paramètres'}
        </h1>
        {onboarding === '1' && (
          <p className="text-sm text-gray-600 mt-1">
            Ces informations apparaîtront sur vos factures. Elles doivent correspondre à votre
            registre RNAE.
          </p>
        )}
      </div>

      <ProfileForm profile={profile} isOnboarding={onboarding === '1'} />
    </div>
  )
}
