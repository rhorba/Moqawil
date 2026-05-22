import { signIn } from '@/lib/auth'

export default function SignInPage() {
  const hasTestSecret = !!process.env.E2E_TEST_SECRET

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Moqawil</h1>
          <p className="text-sm text-gray-600">
            La conformité auto-entrepreneur, sans effort.
          </p>
        </div>

        <div className="space-y-3">
          {/* Google sign-in — shown only when configured */}
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/dashboard' })
            }}
          >
            <button
              type="submit"
              className="w-full py-2 px-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continuer avec Google
            </button>
          </form>

          {/* Email magic link — shown only when Resend is configured */}
          <form
            action={async (formData: FormData) => {
              'use server'
              const email = formData.get('email') as string
              await signIn('resend', { email, redirectTo: '/dashboard' })
            }}
            className="space-y-2"
          >
            <input
              name="email"
              type="email"
              placeholder="votre@email.com"
              required
              className="w-full py-2 px-3 border rounded-lg text-sm"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Envoyer un lien de connexion
            </button>
          </form>

          {/* Test credentials — dev/e2e only, never shown in production */}
          {hasTestSecret && (
            <form
              data-testid="test-credentials-form"
              action={async (formData: FormData) => {
                'use server'
                const email = formData.get('test-email') as string
                const secret = formData.get('test-secret') as string
                await signIn('test-credentials', { email, secret, redirectTo: '/dashboard' })
              }}
              className="space-y-2 border-t pt-4 mt-2"
            >
              <p className="text-xs text-gray-400 text-center">Test credentials (dev only)</p>
              <input
                name="test-email"
                type="email"
                placeholder="test@example.com"
                required
                className="w-full py-2 px-3 border rounded-lg text-sm"
              />
              <input
                name="test-secret"
                type="password"
                placeholder="E2E secret"
                required
                className="w-full py-2 px-3 border rounded-lg text-sm"
              />
              <button
                type="submit"
                data-testid="test-credentials-submit"
                className="w-full py-2 px-4 border border-dashed rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Test Sign In
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-center text-gray-500">
          Open-source · AGPL-3.0 ·{' '}
          <a href="https://github.com/moqawil/moqawil" className="underline">
            GitHub
          </a>
        </p>
      </div>
    </main>
  )
}
