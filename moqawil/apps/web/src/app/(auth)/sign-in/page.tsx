import { signIn } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { TestCredentialsForm } from './test-credentials-form'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const hasTestSecret = !!process.env.E2E_TEST_SECRET
  const [t, tNav] = await Promise.all([getTranslations('auth'), getTranslations('nav')])
  const { callbackUrl } = await searchParams
  // Only ever a same-origin relative path (set by our own middleware) — never
  // pass an external URL through to redirectTo.
  const redirectTo = callbackUrl?.startsWith('/') ? callbackUrl : '/dashboard'

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{tNav('brand')}</h1>
          <p className="text-sm text-gray-600">{t('tagline')}</p>
        </div>

        <div className="space-y-3">
          {/* Google sign-in — shown only when configured */}
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo })
            }}
          >
            <button
              type="submit"
              className="w-full py-2 px-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('withGoogle')}
            </button>
          </form>

          {/* Email magic link — shown only when Resend is configured */}
          <form
            action={async (formData: FormData) => {
              'use server'
              const email = formData.get('email') as string
              await signIn('resend', { email, redirectTo })
            }}
            className="space-y-2"
          >
            <input
              name="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              required
              className="w-full py-2 px-3 border rounded-lg text-sm"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('withEmail')}
            </button>
          </form>

          {/* Test credentials — dev/e2e only, never shown in production */}
          {hasTestSecret && <TestCredentialsForm />}
        </div>

        <p className="text-xs text-center text-gray-500">
          {t('openSource')}{' '}
          <a href="https://github.com/moqawil/moqawil" className="underline">
            GitHub
          </a>
        </p>
      </div>
    </main>
  )
}
