import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

type Section = { title: string; body: string[] }

/**
 * Public privacy policy / terms pages for the hosted demo instance. Google's OAuth consent
 * screen requires a home page, privacy policy and terms link before the app can leave
 * "Testing" — without them, only the Cloud project owner can sign in with Google.
 * Deliberately short and factual: the full hosted-instance drafts in
 * docs/privacy-policy-moqawil.md and docs/terms-of-service-moqawil.md are still pending
 * lawyer review and are not what these pages publish.
 */
export async function LegalPage({ namespace }: { namespace: 'privacy' | 'terms' }) {
  const [t, tLegal, tNav] = await Promise.all([
    getTranslations(namespace),
    getTranslations('legalPages'),
    getTranslations('nav'),
  ])
  const sections = t.raw('sections') as Section[]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-primary">
            {tNav('brand')}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-medium text-foreground">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tLegal('updated')}</p>
        <p className="mt-6 text-muted-foreground">{t('intro')}</p>

        {sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="text-lg font-medium text-foreground">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-10 text-sm text-muted-foreground">
          {tLegal('contact')}{' '}
          <a href={`mailto:${tLegal('contactEmail')}`} className="text-primary underline">
            {tLegal('contactEmail')}
          </a>
        </p>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl gap-4 px-4 py-6 text-xs text-muted-foreground">
          <Link href="/confidentialite" className="text-primary underline">
            {tLegal('privacyLink')}
          </Link>
          <Link href="/cgu" className="text-primary underline">
            {tLegal('termsLink')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
