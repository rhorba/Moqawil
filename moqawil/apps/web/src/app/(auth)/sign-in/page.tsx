import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { TestCredentialsForm } from './test-credentials-form'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  const hasResend = !!process.env.AUTH_RESEND_KEY
  const hasTestSecret = !!process.env.E2E_TEST_SECRET
  const [t, tNav] = await Promise.all([getTranslations('auth'), getTranslations('nav')])
  const { callbackUrl } = await searchParams
  // Only ever a same-origin relative path (set by our own middleware) — never
  // pass an external URL through to redirectTo.
  const redirectTo = callbackUrl?.startsWith('/') ? callbackUrl : '/dashboard'

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-primary">{tNav('brand')}</h1>
          <p className="text-sm text-muted-foreground">{t('tagline')}</p>
        </div>

        <Card className="space-y-3 p-6">
          {/* Google sign-in — shown only when configured */}
          {hasGoogle && (
            <form
              action={async () => {
                'use server'
                await signIn('google', { redirectTo })
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                {t('withGoogle')}
              </Button>
            </form>
          )}

          {/* Email magic link — shown only when Resend is configured */}
          {hasResend && (
            <form
              action={async (formData: FormData) => {
                'use server'
                const email = formData.get('email') as string
                await signIn('resend', { email, redirectTo })
              }}
              className="space-y-2"
            >
              <Input name="email" type="email" placeholder={t('emailPlaceholder')} required />
              <Button type="submit" className="w-full">
                {t('withEmail')}
              </Button>
            </form>
          )}

          {/* Test credentials — dev/e2e only, never shown in production */}
          {hasTestSecret && <TestCredentialsForm />}

          {!hasGoogle && !hasResend && !hasTestSecret && (
            <p className="text-center text-sm text-muted-foreground">{t('noProviderConfigured')}</p>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {t('openSource')}{' '}
          <a href="https://github.com/moqawil/moqawil" className="text-primary underline">
            GitHub
          </a>
        </p>
      </div>
    </main>
  )
}
