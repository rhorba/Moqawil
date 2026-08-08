# Architecture: Moqawil
**PRD**: docs/prd-moqawil.md | **System Design**: docs/system-design-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: Software Architect | **Status**: Draft

## ADR-1: pnpm monorepo, package-by-feature, no DDD/CQRS
- **Status**: Accepted
- **Context**: Single product, single team, CRUD-shaped domain (invoices, clients, declarations) with one genuinely complex piece of business logic (tax/cap math).
- **Decision**: pnpm workspace monorepo. `apps/web` (Next.js App Router) for presentation + application layer, package-by-feature inside it (`invoice/`, `client/`, `declaration/`). Plain layered architecture, not Clean/Hexagonal/DDD/CQRS.
- **Consequences**: (+) fast to build, easy to reason about, matches team size of one. (−) would need real rework if this became a true multi-tenant SaaS with independent scaling needs per module — not a current requirement.
- **Re-evaluate when**: a managed multi-tenant cloud tier is explicitly scoped (post-v0.1).

## ADR-2: `tax-engine` is a separate, zero-I/O, Apache-2.0 package
- **Status**: Accepted
- **Context**: The tax/compliance math (80K cap, thresholds, tax rates, withholding, ICE/IF validation, invoice-number formatting) is the actual strategic asset — the thing no competitor (Hisab.ma, Auto-Entrepreneur.ma, ClicPaie.ma) ships. It's also the highest-legal-risk code in the project — every constant is a number from a specific CGI article or Finance Law.
- **Decision**: `packages/tax-engine` is pure functions only, zero imports from Next.js/Drizzle/React or anything with I/O, licensed Apache-2.0 (permissive, unlike the AGPL-3.0 app) so other Moroccan tools can depend on it directly. Every tax-rule constant carries a source citation in a code comment.
- **Consequences**: (+) independently testable (59+ unit tests before any UI existed), reusable, and the permissive license invites exactly the kind of ecosystem adoption that makes Moqawil's compliance data the de facto standard. (−) any change to `tax-engine` types ripples through app code — acceptable given how rarely tax law actually changes.
- **Enforcement**: dependency rule is a hard boundary — a framework import leaking into `packages/tax-engine/src` is a defect, not a style nit.

## ADR-3: Adapter pattern for unstable/absent external APIs
- **Status**: Accepted
- **Context**: Three integrations (BAM rates, DGI/SIMPL declarations, DGI/xHub e-invoicing) have no reliable public API. Coupling invoice creation directly to any of them would make core functionality hostage to a government platform's uptime or API-publication timeline.
- **Decision**: Every unstable external dependency sits behind an interface with a graceful-degradation default: BAM scraper falls back to manual entry; SIMPL declarations degrade to a printable form; e-invoicing clearance (Sprint 4+) defaults to a `NoOpClearanceProvider`.
- **Consequences**: (+) the product has shipped a working v0.1 despite none of the three government integrations being fully automatable yet. (−) some workflows remain manual (physical bank submission) until the underlying government platform catches up — documented as known limitations, not hidden.

## Module Boundaries
```
apps/web/                  # Next.js App Router — presentation + application layer
  ├── app/(auth)/           # Public auth pages
  ├── app/(app)/            # Authenticated routes: dashboard, invoices, clients, declarations, settings
  ├── app/api/               # exchange-rate, invoice/declaration PDF routes, (Sprint 4: ubl route)
  ├── components/            # ui/ (shadcn primitives), invoice/, client/, declaration/
  └── lib/                   # queries, auth config, email, i18n, (Sprint 4: clearance/ adapter)
packages/tax-engine/         # Pure functions, zero I/O, Apache-2.0 — the moat (ADR-2)
packages/db/                 # Drizzle schema + migrations — data layer
packages/pdf-templates/      # React-PDF templates (invoice, declaration)
packages/i18n/               # Shared translation utilities
```

## Design Patterns Actually Used
| Pattern | Where | Why |
|---|---|---|
| Pure function module | `packages/tax-engine` | Testability, reuse, legal auditability |
| Advisory-lock transaction | Invoice sequential numbering | CGI Art. 145 requires no gaps — this is a legal correctness requirement, not a style choice |
| Adapter | BAM scraper; Sprint 4's `ClearanceProvider` | External systems with unstable/absent public APIs (ADR-3) |
| Query-helper module | `apps/web/src/lib/queries/*` | Decouples Drizzle calls from server actions/components |

Not used, deliberately: Factory, Strategy, Observer, Decorator, Command, Specification — the domain doesn't need them at this size.

## Handoff
→ DBA: `docs/database-moqawil.md`
→ Security Engineer: `docs/security-moqawil.md`
→ DevOps/DevSecOps: `docs/devops-moqawil.md`
