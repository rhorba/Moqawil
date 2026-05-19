import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db, entrepreneurs } from '@moqawil/db'
import { eq } from 'drizzle-orm'
import { AppNav } from '@/components/app-nav'
import { getLocale } from 'next-intl/server'

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
    if (!pathname.startsWith('/settings')) {
      redirect('/settings?onboarding=1')
    }
  }

  const locale = await getLocale()

  return (
    <div className="min-h-screen flex">
      <AppNav currentLocale={locale} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
