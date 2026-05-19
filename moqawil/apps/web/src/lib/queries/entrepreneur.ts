import { db, entrepreneurs } from '@moqawil/db'
import { eq } from 'drizzle-orm'

export async function getEntrepreneur(userId: string) {
  const [row] = await db
    .select()
    .from(entrepreneurs)
    .where(eq(entrepreneurs.userId, userId))
    .limit(1)
  return row ?? null
}
