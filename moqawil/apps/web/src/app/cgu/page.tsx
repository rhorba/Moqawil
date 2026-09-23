import { LegalPage } from '@/components/legal-page'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Conditions d'utilisation — Moqawil" }

export default function TermsPage() {
  return <LegalPage namespace="terms" />
}
