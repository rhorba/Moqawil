'use client'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Client component, not a Server Action form, on purpose. Calling signIn() with a
 * redirectTo from a Server Action chains into (app)/layout.tsx's own onboarding
 * redirect() within the SAME RSC transition — that double-redirect renders a blank
 * shell until a manual refresh (confirmed via a hard-reload diagnostic). A real HTTP
 * navigation (window.location) after a client-side signIn() doesn't have this problem,
 * matching how Google/Resend sign-in already works correctly (their redirect happens
 * via a real 302 through NextAuth's callback route, not an in-flight RSC transition).
 */
export function TestCredentialsForm() {
  const t = useTranslations('auth')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('test-email') as string
    const secret = formData.get('test-secret') as string

    const result = await signIn('test-credentials', { email, secret, redirect: false })
    if (result?.error) {
      setError(t('testCredentialsError'))
      setPending(false)
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <form
      data-testid="test-credentials-form"
      onSubmit={handleSubmit}
      className="space-y-2 border-t pt-4 mt-2"
    >
      <p className="text-xs text-gray-400 text-center">{t('testCredentialsLabel')}</p>
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
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        data-testid="test-credentials-submit"
        className="w-full py-2 px-4 border border-dashed rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {pending ? t('testCredentialsConnecting') : t('testCredentialsSubmit')}
      </button>
    </form>
  )
}
