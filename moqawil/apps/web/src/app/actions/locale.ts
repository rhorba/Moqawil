'use server'

import { type Locale, locales } from '@moqawil/i18n'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function setLocale(locale: Locale): Promise<void> {
  if (!locales.includes(locale)) return
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
