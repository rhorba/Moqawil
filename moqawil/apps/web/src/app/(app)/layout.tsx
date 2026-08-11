import { AppNav } from '@/components/app-nav'
import { auth } from '@/lib/auth'
import { hasActiveAccountantAccess } from '@/lib/queries/accountant'
import { db, entrepreneurs } from '@moqawil/db'
import { eq } from 'drizzle-orm'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const [profile] = await db
    .select({ id: entrepreneurs.id })
    .from(entrepreneurs)
    .where(eq(entrepreneurs.userId, session.user.id))
    .limit(1)

  if (!profile) {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? ''
    // Accountants (Sprint 9) may never have their own AE profile — exempt
    // /accountant alongside /settings so a profile-less accountant isn't
    // forced into onboarding just to view a dashboard they were invited to.
    if (!pathname.startsWith('/settings') && !pathname.startsWith('/accountant')) {
      redirect('/settings?onboarding=1')
    }
  }

  const [locale, hasAccountantAccess] = await Promise.all([
    getLocale(),
    hasActiveAccountantAccess(session.user.id),
  ])

  return (
    <div className="flex min-h-screen">
      <AppNav currentLocale={locale} hasAccountantAccess={hasAccountantAccess} />
      <main className="flex-1 overflow-auto">
        {/* Constrains content on wide screens so pages don't trail off into empty gutter —
            found by the design-loop craft critic on the clients/dashboard screens. */}
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
