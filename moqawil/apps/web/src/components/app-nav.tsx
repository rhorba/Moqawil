'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTransition } from 'react'
import { LayoutDashboard, FileText, Users, ClipboardList, Settings, LogOut } from 'lucide-react'
import { setLocale } from '@/app/actions/locale'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', labelAr: 'لوحة القيادة', icon: LayoutDashboard },
  { href: '/invoices', label: 'Factures', labelAr: 'الفواتير', icon: FileText },
  { href: '/clients', label: 'Clients', labelAr: 'العملاء', icon: Users },
  { href: '/declarations', label: 'Déclarations', labelAr: 'التصريحات', icon: ClipboardList },
  { href: '/settings', label: 'Paramètres', labelAr: 'الإعدادات', icon: Settings },
]

interface AppNavProps {
  currentLocale?: string
}

export function AppNav({ currentLocale = 'fr' }: AppNavProps) {
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
          {isAr ? 'مقاول' : 'Moqawil'}
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, label, labelAr, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {isAr ? labelAr : label}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t space-y-1">
        {/* Locale toggle */}
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
          {isAr ? 'تسجيل الخروج' : 'Déconnexion'}
        </button>
      </div>
    </aside>
  )
}
