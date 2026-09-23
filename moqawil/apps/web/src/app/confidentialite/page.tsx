import { LegalPage } from '@/components/legal-page'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Politique de confidentialité — Moqawil' }

export default function PrivacyPage() {
  return <LegalPage namespace="privacy" />
}
