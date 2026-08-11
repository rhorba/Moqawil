import { db } from '@moqawil/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * Sprint 11 (SaaS readiness): cheap liveness check for an external uptime monitor
 * (UptimeRobot or similar — which monitor to use is an operator choice, not built here).
 * Unauthenticated on purpose — an uptime monitor has no session. Confirms the app can reach
 * the DB, not just that the Next.js process is up, since "process alive but DB unreachable"
 * is the failure mode that actually matters for a hosted instance.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`)
    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
