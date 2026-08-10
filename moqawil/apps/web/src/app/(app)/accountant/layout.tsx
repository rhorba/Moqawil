import { auth } from '@/lib/auth'
import { hasActiveAccountantAccess } from '@/lib/queries/accountant'
import { redirect } from 'next/navigation'

export default async function AccountantLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  // /accountant/accept must be reachable with zero active links — accepting the
  // first invite is what CREATES one. Only guard the list/detail views.
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (pathname.startsWith('/accountant/accept')) return <>{children}</>

  const hasAccess = await hasActiveAccountantAccess(session.user.id)
  if (!hasAccess) redirect('/dashboard')

  return <>{children}</>
}
