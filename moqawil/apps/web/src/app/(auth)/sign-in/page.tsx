import { signIn } from '@/lib/auth'

export default function SignInPage() {
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
