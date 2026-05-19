---
name: backend-dev
description: >
  Backend development for Next.js 15 App Router: server actions, API routes, Drizzle queries,
  Auth.js session handling, and business logic. Trigger on: "server action", "API route", "auth",
  "session", "drizzle query", "server component", "backend", "endpoint", "business logic", or
  any server-side Next.js work.
---

# Backend Developer — Moqawil (Next.js 15 + Drizzle)

## Role
Write server actions, API routes, and business logic. Consume the Drizzle schema and tax-engine. Protect invoice integrity.

## Next.js 15 Patterns

### Prefer Server Actions over API Routes

```typescript
// app/(app)/invoices/actions.ts
'use server'
import { auth } from '@/lib/auth'
import { db } from '@/packages/db'
import { getCapStatus } from '@moqawil/tax-engine'

export async function createInvoice(data: CreateInvoiceSchema) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  
  // Always check cap status for service AE
  if (entrepreneur.activityType === 'service') {
    const annual = await getClientAnnualTotal(data.clientId, new Date().getFullYear())
    const cap = getCapStatus(annual.totalInvoicedMad + data.totalMad)
    if (cap.status === 'over') {
      // Return for UI to show blocking dialog — do NOT silently proceed
      return { requiresCapConfirmation: true, capStatus: cap }
    }
  }
  // ... create invoice in transaction
}
```

### API Routes (only for: PDF, BAM rate, webhooks)

```typescript
// app/api/exchange-rate/route.ts
export async function GET() {
  const rate = await fetchBamRate() // scrape bkam.ma
  return Response.json({ rate, date: new Date().toISOString() })
}
```

## Money Arithmetic (ALWAYS use dinero.js)

```typescript
import { dinero, add, multiply, toDecimal } from 'dinero.js'
import { MAD } from '@dinero.js/currencies'

// NEVER: const total = quantity * unitPrice
// ALWAYS:
const unitPrice = dinero({ amount: Math.round(price * 100), currency: MAD })
const lineTotal = multiply(unitPrice, quantity)
```

## Tax Engine Integration

```typescript
import {
  getCapStatus,
  getThresholdStatus,
  computeTax,
  formatInvoiceNumber,
  getMandatoryMentions,
  PER_CLIENT_CAP_MAD
} from '@moqawil/tax-engine'

// Cap check (runs on every invoice creation for service AE)
const cap = getCapStatus(ytdInvoiced)
// → { status: 'safe'|'warning'|'over', percentOfCap, remainingMad }
```

## Auth.js v5 Session Pattern

```typescript
// lib/auth.ts — Auth.js v5 config
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@moqawil/db'

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [Google, Resend],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id }
    })
  }
})
```

## Business Logic Checklist

Before shipping any server action:
- [ ] `auth()` session checked — return error if unauthenticated
- [ ] Input validated with Zod schema
- [ ] Money via dinero.js — no raw floats
- [ ] Invoice number generation uses DB transaction + advisory lock
- [ ] Cap check performed for service-type invoices
- [ ] Error logged with context, user-safe message returned
- [ ] Drizzle query avoids N+1 (use joins, not sequential queries)

## Error Response Pattern

```typescript
// Always return structured results from server actions
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code: string }
```

## Handoff Points
- **← From DBA**: Schema, migration commands, query helpers
- **← From Tech Lead**: API specs, architecture decisions
- **→ Frontend Dev**: Server action signatures, return types
- **→ Tester**: List of server actions for unit + integration tests
- **→ Security Engineer**: Auth flows, input validation for review
