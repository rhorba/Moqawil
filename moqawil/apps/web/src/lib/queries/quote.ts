import { clients, db, quoteLines, quotes } from '@moqawil/db'
import { and, desc, eq } from 'drizzle-orm'

export async function getQuotes(entrepreneurId: string) {
  return db
    .select({
      quote: quotes,
      clientName: clients.name,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .where(eq(quotes.entrepreneurId, entrepreneurId))
    .orderBy(desc(quotes.issueDate), desc(quotes.sequenceNumber))
}

export async function getQuoteWithLines(quoteId: string, entrepreneurId: string) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.entrepreneurId, entrepreneurId)))
    .limit(1)

  if (!quote) return null

  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, quoteId))
    .orderBy(quoteLines.position)

  return { quote, lines }
}
