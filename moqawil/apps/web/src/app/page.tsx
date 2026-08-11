import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ClipboardList, FileText, Github, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

/**
 * Sprint 11 (SaaS readiness): public, unauthenticated landing page. Root `/` previously had no
 * page at all (404) — `/sign-in` was the de facto entry point, fine for a self-hoster who
 * already knows what they're installing, not fine for a stranger reaching a public hosted
 * domain. No pricing section — billing is out of scope this sprint (docs/prd-sprint11-saas-
 * readiness.md). Built on the same design tokens/primitives as the authenticated app.
 */
export default async function LandingPage() {
  const [t, tNav] = await Promise.all([getTranslations('landing'), getTranslations('nav')])

  const features = [
    { icon: ShieldCheck, title: t('capTitle'), body: t('capBody') },
    { icon: ClipboardList, title: t('declarationTitle'), body: t('declarationBody') },
    { icon: FileText, title: t('invoiceTitle'), body: t('invoiceBody') },
    { icon: Github, title: t('openSourceTitle'), body: t('openSourceBody') },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold text-primary">{tNav('brand')}</span>
          <Button asChild variant="outline">
            <Link href="/sign-in">{t('signIn')}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            {t('heroEyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('heroSubtitle')}</p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <Button asChild size="lg">
              <Link href="/sign-in">{t('heroCta')}</Link>
            </Button>
            <p className="text-xs text-muted-foreground">{t('heroCtaSub')}</p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6">
                <Icon className="size-6 text-primary" />
                <h2 className="mt-3 text-lg font-medium text-foreground">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-start">
          <p>{t('footerTagline')}</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/moqawil/moqawil"
              className="inline-flex items-center gap-1.5 text-primary underline"
            >
              <Github className="size-3.5" />
              {t('footerGithub')}
            </a>
            <span>{t('footerLicense')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
