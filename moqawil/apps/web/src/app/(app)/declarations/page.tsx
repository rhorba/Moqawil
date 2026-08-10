import { auth } from '@/lib/auth'
import { getDeclarationsForYear } from '@/lib/queries/declaration'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getTranslations } from 'next-intl/server'
import { DeclarationCard } from './declaration-card'

export default async function DeclarationsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const session = await auth()
  const entrepreneur = session?.user?.id ? await getEntrepreneur(session.user.id) : null
  if (!entrepreneur) return null

  const { year: yearParam } = await searchParams
  const year = yearParam ? Number.parseInt(yearParam) : new Date().getFullYear()

  const [t, declarations] = await Promise.all([
    getTranslations('declaration'),
    getDeclarationsForYear(entrepreneur.id, year),
  ])

  const prevYear = year - 1
  const nextYear = year + 1
  const currentYear = new Date().getFullYear()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>

        {/* Year selector */}
        <div className="flex items-center gap-2 text-sm">
          <a
            href={`/declarations?year=${prevYear}`}
            className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <span className="rtl:hidden">←</span>
            <span className="ltr:hidden">→</span>
            {prevYear}
          </a>
          <span className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg font-medium">
            {year}
          </span>
          {year < currentYear && (
            <a
              href={`/declarations?year=${nextYear}`}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              {nextYear}
              <span className="rtl:hidden">→</span>
              <span className="ltr:hidden">←</span>
            </a>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>{t('howItWorksTitle')}</strong> {t('howItWorksBody')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {declarations.map((decl) => (
          <DeclarationCard
            key={decl.quarter}
            declaration={decl}
            year={year}
            activityType={entrepreneur.activityType}
          />
        ))}
      </div>
    </div>
  )
}
