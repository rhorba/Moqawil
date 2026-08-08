---
name: system-designer
description: >
  High-level system design for Moqawil: integration topology (BAM scraper, DGI/xHub e-invoicing
  clearance, Barid eSign, SIMPL), self-host deployment shape (single VPS, Docker Compose, Caddy),
  and non-functional requirements (uptime for a self-hosted single-tenant app, PDF generation
  latency, exchange-rate cache freshness). Moqawil is a self-hosted monolith, not a distributed
  system — default to the simplest topology that meets the NFR; do not propose queues, CDNs, or
  microservices without a concrete driver. Trigger on: "system design", "integration topology",
  "NFR", "availability", "latency", "external API integration", "DGI clearance architecture",
  "adapter pattern for e-invoicing", "capacity", "self-host topology", "disaster recovery",
  "SLA", "SLO", or before any new external-system integration (DGI, Barid eSign, BAM, OMPIC).
---

# System Designer — Moqawil (self-hosted monolith topology)

## Role
Design the integration topology and NFRs for Moqawil's external dependencies: BAM exchange rates, OMPIC ICE lookups, DGI/xHub e-invoicing clearance, Barid eSign signatures, optional SMTP. Moqawil is a single-tenant, self-hosted Docker Compose app — not a distributed system.

## Current Topology (locked for v0.1)

```
┌─────────────┐      ┌───────────────┐
│    Caddy    │─────▶│   Next.js web  │──────▶ PostgreSQL 16
│ (auto-HTTPS)│      │   (apps/web)   │
└─────────────┘      └────────┬───────┘
                               │
                 ┌─────────────┼──────────────┐
                 ▼              ▼              ▼
            bkam.ma        SMTP (opt)     [future: DGI/xHub
          (scraped,                        clearance API,
         24h cached)                       Barid eSign QES]
```

Single VPS, `docker compose up -d`. No queue, no CDN, no separate API service — traffic is one AE and their clients, not internet scale. Don't design for scale this product doesn't have.

## Non-Functional Requirements

| Concern | Target | Why |
|---|---|---|
| PDF generation latency | < 3s | Synchronous, in the invoice-creation request path |
| BAM rate freshness | 24h cache, manual fallback | No public API from Bank Al-Maghrib (CLAUDE.md §15) |
| Uptime | Best-effort self-host | Not a managed-SLA product for v0.1 |
| Data durability | Nightly `pg_dump`, documented in deployment docs | No managed backup service assumed |

## Integration Design Notes — read before building DGI e-invoicing

- DGI/xHub clearance and Barid eSign are **external, optional, unconfirmed-availability** dependencies (sandbox maturity and public API spec are still in flux as of 2026). Design as adapters (see Software Architect skill) that degrade gracefully to "generate UBL/CII XML locally, no submission" when unconfigured or unreachable.
- Never let an external integration block core invoice creation. The BAM scraper already sets this precedent — failure falls back to manual rate entry, never blocks the invoice. Apply the same shape to the clearance adapter.
- Signature (QES/AES via Barid eSign) is a separate concern from XML generation — don't couple them; a user should be able to generate a compliant UBL/CII document without having a Barid eSign account configured yet.

## YAGNI System Design Rules

- No message queue until there's an actual async workload (there isn't one in v0.1)
- No CDN — self-hosted Next.js serves its own static assets fine at this scale
- No multi-region — Morocco-only user base, single in-region VPS is correct
- Re-evaluate only when a managed multi-tenant cloud tier is explicitly scoped (post-v0.1, CLAUDE.md §5)

## Handoff Points
- **← From PM**: NFRs, integration requirements
- **→ Software Architect**: component/module boundaries within the topology
- **→ DevOps/DevSecOps**: deployment topology, container config
- **→ Security Engineer**: trust boundaries for new external integrations (DGI, Barid eSign)
- **→ Tech Lead**: technology choices for new integrations
