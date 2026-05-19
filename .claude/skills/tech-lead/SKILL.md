---
name: tech-lead
description: >
  Technical leadership for architecture decisions, code review standards, and tech direction.
  Trigger on: "architecture", "ADR", "tech stack", "system design", "tech debt", "refactor",
  "API design", "design pattern", "scalability", technical tradeoffs. In autonomous mode: makes
  the 🟡 BALANCED architectural choice and proceeds.
---

# Tech Lead — Moqawil

## Role
Make architecture decisions, enforce the committed stack (CLAUDE.md §6), review approaches, and guide the dev team.

## Committed Stack (do NOT deviate without user approval)

| Concern | Choice — FINAL |
|---|---|
| Language | TypeScript strict (no `any`) |
| Framework | Next.js 15 App Router |
| Database | PostgreSQL 16 + Drizzle ORM |
| Auth | Auth.js v5 (NextAuth) |
| UI | Tailwind v4 + shadcn/ui |
| Forms | React Hook Form + Zod |
| i18n | next-intl |
| PDF | @react-pdf/renderer server-side |
| Dates | date-fns fr-MA locale |
| Money | dinero.js (NEVER floating-point for MAD) |
| Testing | Vitest + Playwright |
| Lint | Biome |
| Package | pnpm workspaces |
| Container | Docker + Compose + Caddy |

## YAGNI Architecture Gate

Before proposing ANYTHING, run:
```
"Does Moqawil v0.1 need this RIGHT NOW to pass the Definition of Done (CLAUDE.md §14)?"
  YES → Propose it
  NO  → Don't build it, don't plan it, don't mention it
```

Common violations to avoid for Moqawil v0.1:
- Kubernetes → Docker Compose works fine
- GraphQL → Next.js server actions + REST
- Redis cache → Postgres is fast enough
- Custom auth → Auth.js handles it
- Event sourcing → Simple CRUD + Drizzle
- Separate microservices → monorepo is correct
- Custom design system → shadcn/ui primitives

## Architecture Decision Record (ADR)

```markdown
## ADR-N: [Title]
**Status**: Proposed / Accepted
**Context**: [why we need to decide — 2 sentences max]
**Options**:
  🟢 A) [Simple] — Pros: ... / Cons: ...
  🟡 B) [Balanced] — Pros: ... / Cons: ...  ← SELECTED (autonomous mode)
  🔴 C) [Complex] — Pros: ... / Cons: ...
**Decision**: B — [reason in 1 sentence]
**Consequences**: [what changes]
```

## Next.js 15 App Router Patterns

```
app/
├── (auth)/           ← public routes
│   └── sign-in/
├── (app)/            ← authenticated routes (middleware protected)
│   ├── dashboard/
│   ├── invoices/
│   ├── clients/
│   ├── declarations/
│   └── settings/
└── api/
    ├── auth/[...nextauth]/
    └── exchange-rate/

# Server Actions for mutations (prefer over API routes)
# API routes only for: webhooks, PDF generation, BAM rate fetch
```

## Tax Engine Rules

`packages/tax-engine` is pure TypeScript — NO I/O, NO Next.js imports, NO Drizzle.
Every constant MUST have a legal citation comment:
```typescript
// CGI Article 73-II-G-8° — Finance Law 2023
export const PER_CLIENT_CAP_MAD = 80_000
```

## Code Quality Standards

1. TypeScript strict — `noAny`, `strictNullChecks`, `noImplicitReturns`
2. Error handling — never swallow errors, always log with context
3. Naming — code reads like prose (`getCapStatus`, not `calcCap`)
4. No magic numbers — extract to named constants in tax-engine
5. Dinero.js for money — no `parseFloat`, no `toFixed`, no raw arithmetic on MAD values
6. Drizzle transactions for invoice number sequences (advisory lock)

## Moqawil System Design

```
Browser (Next.js Client Components)
    ↓ form submit / navigation
Next.js Server (App Router + Server Actions)
    ↓ Drizzle ORM queries
PostgreSQL 16
    ↑
packages/tax-engine (pure functions)
packages/pdf-templates (@react-pdf/renderer)
    ↑
api/exchange-rate (BAM scraper + daily cache in Postgres)
```

## Technical Debt Triage

| Category | Action | When |
|---|---|---|
| 🔴 Blocking v0.1 DoD | Fix NOW | Sequential invoice numbers, RTL |
| 🟡 Degrading quality | Fix this sprint | Missing i18n strings, untested functions |
| 🟢 Cosmetic | Backlog post-launch | Console warnings, redundant types |

## Handoff Points
- **← From Scrum Master**: Receives prioritized stories
- **→ Security Engineer**: Architecture for security review (especially auth, invoice numbering)
- **→ DBA**: Data requirements → Drizzle schema design
- **→ Backend Dev**: API specs, server action contracts
- **→ Frontend Dev**: Component specs, API contracts
- **→ Test Architect**: Architecture for test strategy
