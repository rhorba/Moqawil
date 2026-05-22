import { NextRequest, NextResponse } from 'next/server'

// Removes all data for the test user so each suite run starts clean
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || !process.env.E2E_TEST_SECRET) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  let body: { secret?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const expectedSecret = (process.env.E2E_TEST_SECRET ?? '').trim()
  if ((body.secret ?? '').trim() !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const email = body.email ?? 'e2e-test@moqawil.test'

  const { db, users, entrepreneurs, clients, invoices, invoiceLines, quarterlyDeclarations } = await import('@moqawil/db')
  const { eq } = await import('drizzle-orm')

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (!user) return NextResponse.json({ ok: true, deleted: 'no user found' })

  const [entrepreneur] = await db
    .select({ id: entrepreneurs.id })
    .from(entrepreneurs)
    .where(eq(entrepreneurs.userId, user.id))
    .limit(1)

  if (entrepreneur) {
    // Delete in dependency order
    const clientIds = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.entrepreneurId, entrepreneur.id))

    for (const { id } of clientIds) {
      const invoiceIds = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.clientId, id))
      for (const { id: invId } of invoiceIds) {
        await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, invId))
      }
      await db.delete(invoices).where(eq(invoices.clientId, id))
    }

    await db.delete(quarterlyDeclarations).where(eq(quarterlyDeclarations.entrepreneurId, entrepreneur.id))
    await db.delete(clients).where(eq(clients.entrepreneurId, entrepreneur.id))
    await db.delete(entrepreneurs).where(eq(entrepreneurs.id, entrepreneur.id))
  }

  return NextResponse.json({ ok: true })
}
