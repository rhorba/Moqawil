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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">{t('title')}</h1>

        {/* Year selector */}
        <div className="flex items-center gap-2 text-sm">
          <a
            href={`/declarations?year=${prevYear}`}
            className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
          >
            <span className="rtl:hidden">←</span>
            <span className="ltr:hidden">→</span>
            {prevYear}
          </a>
          <span className="rounded-sm bg-primary px-3 py-1.5 font-medium text-primary-foreground">
            {year}
          </span>
          {year < currentYear && (
            <a
              href={`/declarations?year=${nextYear}`}
              className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
            >
              {nextYear}
              <span className="rtl:hidden">→</span>
              <span className="ltr:hidden">←</span>
            </a>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted p-4 text-sm text-foreground">
        <strong className="font-medium">{t('howItWorksTitle')}</strong> {t('howItWorksBody')}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
