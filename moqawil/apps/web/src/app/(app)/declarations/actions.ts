'use server'

import { auth } from '@/lib/auth'
import { db, quarterlyDeclarations } from '@moqawil/db'
import { eq, and } from 'drizzle-orm'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { computeAndUpsertDeclaration } from '@/lib/queries/declaration'
import { revalidatePath } from 'next/cache'
import type { ActivityType } from '@moqawil/tax-engine'

export async function generateDeclaration(year: number, quarter: number): Promise<{
  success: boolean
  message?: string
  id?: string
  turnover?: number
  taxDue?: number
}> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: 'Non authentifié' }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return { success: false, message: 'Profil introuvable' }

  const result = await computeAndUpsertDeclaration(
    entrepreneur.id,
    year,
    quarter,
    entrepreneur.activityType as ActivityType
  )

  revalidatePath('/declarations')
  revalidatePath('/dashboard')

  return { success: true, id: result.id, turnover: result.turnover, taxDue: result.taxDue }
}

export async function markDeclarationSubmitted(declarationId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return

  await db
    .update(quarterlyDeclarations)
    .set({ status: 'submitted', submittedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(quarterlyDeclarations.id, declarationId),
        eq(quarterlyDeclarations.entrepreneurId, entrepreneur.id)
      )
    )

  revalidatePath('/declarations')
}
