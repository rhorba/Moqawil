# System Design: Moqawil
**PRD**: docs/prd-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: System Designer | **Status**: Draft

## 1. Scale Reality
Moqawil is **self-hosted, single-tenant per install**. One instance serves one auto-entrepreneur (or a small number, if someone self-hosts for a few AE friends). This is not a multi-tenant SaaS with thousands of concurrent users on shared infrastructure — it's closer in shape to a personal finance tool than a marketplace. Every NFR below is calibrated to that reality; do not design as if this were Wassalha or Kasb.

## 2. Topology
```
┌─────────────┐      ┌───────────────┐
│    Caddy    │─────▶│   Next.js web  │──────▶ PostgreSQL 16
│ (auto-HTTPS)│      │   (apps/web)   │
└─────────────┘      └────────┬───────┘
                               │
                 ┌─────────────┼──────────────┐
                 ▼              ▼              ▼
            bkam.ma        SMTP (opt)     [Sprint 4+: DGI/xHub
          (scraped,                        clearance API,
         24h cached)                       Barid eSign QES]
```
Single VPS via `docker compose up -d`. No load balancer, no queue, no CDN, no separate API tier — one Next.js process is correct at this scale.

## 3. Integration Points & Their Failure Modes
| System | Purpose | Public API? | Failure mode designed for |
|---|---|---|---|
| bkam.ma (Bank Al-Maghrib) | Daily EUR/USD/GBP/CHF/CAD → MAD reference rate | No — HTML scrape | 24h cache; on scrape failure, fall back to manual entry. Never blocks invoice creation. |
| ompic.ma | ICE registry lookup | No — format/checksum validation only | v0.1 validates format (15 digits) + checksum, no live registry check |
| DGI/SIMPL tax portal | Quarterly declaration filing | No — manual login required | Generate a printable pre-filled form; user physically submits at Barid Al-Maghrib. Tracked as a known limitation, not silently worked around. |
| DGI/xHub e-invoicing platform | Structured e-invoice clearance | Unconfirmed as of 2026-08 — sandbox maturity unclear | Sprint 4 ships UBL 2.1 generation only, behind a `ClearanceProvider` adapter defaulting to no-op. See `docs/architecture-sprint4-e-invoicing.md`. |
| Barid eSign | QES/AES signature for e-invoices | Requires a business account | Not built in v0.1 — same adapter isolation as above |

**Design rule, applied consistently**: no external integration blocks core invoicing. Every one of the above degrades gracefully.

## 4. Non-Functional Requirements
| Concern | Target | Rationale |
|---|---|---|
| PDF generation latency | < 3s | Synchronous, in the invoice-creation request path (`@react-pdf/renderer`, server-side) |
| BAM rate freshness | 24h cache | No API — daily scrape is the ceiling on freshness anyway |
| Uptime | Best-effort self-host | Not a managed-SLA product for v0.1; a single AE's own downtime tolerance, not a marketplace's |
| Data durability | Nightly `pg_dump`, documented in deployment docs | No managed backup service assumed for self-hosters |
| Concurrent users per instance | Single digit | One AE, maybe a bookkeeper — not a scale concern |

## 5. What This Project Deliberately Does NOT Need
- No message queue — no async workload exists in v0.1
- No CDN — Next.js serves its own assets fine at this scale
- No multi-region — Morocco-only user base, one in-region VPS is correct
- No horizontal scaling story — vertical VPS sizing is the only lever that will ever matter for a single-tenant self-host
- No load-testing infra (k6 or similar) — there is no concurrency scenario this product will hit that justifies it; revisit only if a managed multi-tenant cloud tier is scoped (explicitly post-v0.1, CLAUDE.md §5)

## 6. Handoff
→ Software Architect: module boundaries within this topology (`docs/architecture-moqawil.md`)
→ DevOps/DevSecOps: container/deployment implementation (`docs/devops-moqawil.md`)
