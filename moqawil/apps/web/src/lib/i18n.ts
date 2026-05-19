import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { locales, defaultLocale, type Locale } from '@moqawil/i18n'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined
  const locale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale

  const messages = (await import(`../messages/${locale}.json`)).default

  return { locale, messages }
})
