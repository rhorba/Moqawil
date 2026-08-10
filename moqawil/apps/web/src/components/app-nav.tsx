'use client'

import { setLocale } from '@/app/actions/locale'
import {
  BookUser,
  ClipboardList,
  FileEdit,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'

const navItems = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/quotes', key: 'quotes', icon: FileEdit },
  { href: '/invoices', key: 'invoices', icon: FileText },
  { href: '/clients', key: 'clients', icon: Users },
  { href: '/declarations', key: 'declarations', icon: ClipboardList },
  { href: '/settings', key: 'settings', icon: Settings },
] as const

interface AppNavProps {
  currentLocale?: string
  hasAccountantAccess?: boolean
}

export function AppNav({ currentLocale = 'fr', hasAccountantAccess = false }: AppNavProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const isAr = currentLocale === 'ar'

  function handleLocaleSwitch() {
    startTransition(async () => {
      await setLocale(isAr ? 'fr' : 'ar')
      // Force a page reload to apply new locale + direction
      window.location.reload()
    })
  }

  return (
    <aside className="w-56 border-e bg-white flex flex-col shrink-0" data-no-print>
      <div className="p-4 border-b">
        <Link href="/dashboard" className="font-bold text-lg text-[var(--color-primary)]">
          {t('brand')}
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-[var(--color-primary)] text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {t(key)}
            </Link>
          )
        })}
        {hasAccountantAccess && (
          <Link
            href="/accountant"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith('/accountant')
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookUser size={16} />
            {t('accountantSpace')}
          </Link>
        )}
      </nav>

      <div className="p-2 border-t space-y-1">
        {/* Locale toggle — language names are shown in their own script,
            not translated per active locale (a French speaker switching to
            Arabic needs to see "العربية", not a French translation of it). */}
        <button
          type="button"
          onClick={handleLocaleSwitch}
          disabled={isPending}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          title={isAr ? 'Passer en français' : 'التبديل إلى العربية'}
        >
          <span className="text-base leading-none">{isAr ? '🇫🇷' : '🇲🇦'}</span>
          {isAr ? 'Français' : 'العربية'}
        </button>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={16} />
          {t('signOut')}
        </button>
      </div>
    </aside>
  )
}
