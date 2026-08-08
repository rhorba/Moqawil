---
name: software-architect
description: >
  Software architecture for Moqawil's pnpm monorepo: module boundaries between `apps/web` and
  `packages/{tax-engine,db,pdf-templates,i18n}`, the tax-engine's zero-I/O purity rule (Apache-2.0,
  no imports from app code), and adapter-pattern design for pluggable external integrations (DGI
  clearance providers, BAM rate sources). Moqawil is package-by-feature, layered, no DDD/CQRS/event
  sourcing — keep it that way unless a specific integration (e.g. DGI e-invoicing) genuinely needs
  a port/adapter boundary. Trigger on: "module boundary", "package structure", "design pattern",
  "adapter pattern", "dependency rule", "tax-engine purity", "clearance provider interface",
  "repository pattern", "coupling", "cohesion", "architectural fitness", or before any new
  `packages/*` addition or cross-package dependency.
---

# Software Architect — Moqawil (pnpm monorepo, layered architecture)

## Role
Own module boundaries between `apps/web` and `packages/*`. Protect the tax-engine's zero-I/O purity. Decide adapter boundaries for pluggable external integrations (DGI clearance, BAM rates).

## Current Architecture (locked for v0.1 — see root `CLAUDE.md` §6-7)

```
apps/web/                  # Next.js App Router — presentation + application layer
packages/tax-engine/       # Pure functions, zero I/O, Apache-2.0 — the moat (CLAUDE.md §9)
packages/db/               # Drizzle schema + migrations — data layer
packages/pdf-templates/    # React-PDF templates
packages/i18n/             # Shared translation utilities
```

Package-by-feature within `apps/web` (`invoice/`, `client/`, `declaration/` each own their components + server actions). No DDD, no CQRS, no event sourcing — plain CRUD is correct at AE scale (thousands of invoices per user, not millions). Don't propose otherwise without a concrete driver.

## Dependency Rule — non-negotiable

`packages/tax-engine` has **zero imports** from `apps/web`, Drizzle, Next.js, or anything with I/O. It ships standalone (Apache-2.0) so other Moroccan tools can depend on it — this is the project's strategic asset (CLAUDE.md §9). Never let a framework import leak into `packages/tax-engine/src`. Enforce with lint rule / dependency-cruiser if a violation is ever proposed.

## Adapter Pattern for External Clearance/Rate Providers

When adding DGI e-invoicing clearance support or swapping the BAM scraper for a real API, isolate the external system behind an interface — never call it directly from invoice creation flow:

```typescript
// packages/tax-engine/src/clearance/provider.ts
export interface ClearanceProvider {
  submitInvoice(xml: string): Promise<{ status: 'cleared' | 'rejected'; clearanceId?: string }>
}
// Concrete implementations (DGI/xHub client, or a no-op for self-hosters without
// API access) live in apps/web/lib/clearance/, injected — never hardcoded.
```

This is what already lets the BAM scraper fail gracefully (manual rate entry) without breaking invoice creation — apply the same shape to any new external dependency.

## Design Patterns Actually Used Here

| Pattern | Where | Why |
|---|---|---|
| Repository-ish query helpers | `packages/db/src/queries/*` | Decouple Drizzle calls from server actions |
| Advisory-lock transaction | Invoice numbering (DBA skill) | Sequential numbering is a legal requirement, not a style choice |
| Adapter | BAM scraper, future DGI clearance | External systems with unstable/absent public APIs |
| Pure function module | `packages/tax-engine` | Testability + reuse outside this app |

Don't reach for Factory, Strategy, Observer, Decorator, or Command here — the domain doesn't need them yet.

## YAGNI Architecture Rules for Moqawil

- Layered/CRUD, not Clean/Hexagonal/DDD — the domain isn't complex enough to earn it
- One `ClearanceProvider` interface is enough abstraction for e-invoicing — don't build a plugin system
- Don't split `apps/web` into a separate API service — Next.js server actions are sufficient at this scale
- Re-evaluate only if: a managed multi-tenant cloud tier ships (explicitly post-v0.1, CLAUDE.md §5), or a second clearance provider needs supporting

## Handoff Points
- **← From System Designer**: integration topology and NFRs for new external systems
- **← From PM**: feature requirements
- **→ Tech Lead**: architecture decisions for implementation standards
- **→ Backend Dev**: module structure, interfaces, adapter contracts
- **→ DBA**: package/data ownership boundaries for new tables
- **→ Test Architect**: dependency map for testability analysis
