# System Design: Moqawil
**PRD**: docs/prd-moqawil.md, docs/prd-sprint11-saas-readiness.md | **Version**: 1.1 | **Date**: 2026-08-11 | **Author**: System Designer | **Status**: Draft

## 1. Scale Reality
Moqawil ships in two deployment modes as of Sprint 11: **self-hosted** (unchanged — one instance, one AE, operator manages their own uptime/backups) and **Moqawil-operated hosted** (new — one instance serving many independent AE tenants who sign up directly, still each a single solo auto-entrepreneur persona, not registered companies or team accounts; see `docs/prd-sprint11-saas-readiness.md` for the explicit non-goals). Both modes run the *same* topology below — this is still not a multi-tenant SaaS with thousands of concurrent users on shared horizontally-scaled infrastructure, it's a single-VPS app where the tenant count went from "1" to "many independent rows in the same tables," which the data model already handled (every query is `entrepreneurId`-scoped, per `docs/security-moqawil.md` §2). Do not design as if this were Wassalha or Kasb — no queue, no CDN, no horizontal scaling story changes in this sprint.

## 2. Topology
```
┌─────────────┐      ┌───────────────┐
│    Caddy    │─────▶│   Next.js web  │──────▶ PostgreSQL 16
│ (auto-HTTPS)│      │   (apps/web)   │◀────── /api/health (Sprint 11)
└─────────────┘      └────────┬───────┘
                               │
                 ┌─────────────┼──────────────┬───────────────┐
                 ▼              ▼              ▼               ▼
            bkam.ma        SMTP (opt)     [Sprint 4+: DGI/xHub   backup-db.sh
          (scraped,                        clearance API,        (Sprint 11 —
         24h cached)                       Barid eSign QES]       cron, pg_dump)
```
Single VPS via `docker compose up -d`, unchanged. What's new in Sprint 11 isn't a topology change — it's that for the Moqawil-operated hosted instance specifically, the boxes on the right (`/api/health`, `backup-db.sh`) are no longer optional self-hoster homework; they're the operator's own responsibility, because now it's other people's data, not just the operator's own.

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
| Uptime — self-host | Best-effort | Unchanged — a single AE's own downtime tolerance, not a marketplace's |
| Uptime — Moqawil-operated hosted (Sprint 11) | Best-effort but *monitored* | Still no formal SLA, but now `/api/health` exists so the operator can know it's down instead of finding out from a support email; monitoring tool itself (e.g. UptimeRobot) is an owner choice, not built here |
| Data durability — self-host | Nightly `pg_dump`, documented, self-hoster's own responsibility | Unchanged |
| Data durability — Moqawil-operated hosted (Sprint 11) | Automated, operator's responsibility | `scripts/backup-db.sh` + documented cron (`docs/devops-moqawil.md`) — other people's compliance data can't depend on the operator remembering a manual step |
| Concurrent users per instance — self-host | Single digit | Unchanged — one AE, maybe a bookkeeper |
| Concurrent users per instance — Moqawil-operated hosted (Sprint 11) | Low hundreds (initial target, revisit with real data) | Still a single Next.js process + single Postgres instance; DB pool size now configurable via `DB_POOL_MAX` env var (`packages/db`) instead of hardcoded, so this can be tuned without a code change as real usage is observed |

## 5. What This Project Deliberately Does NOT Need
- No message queue — no async workload exists
- No CDN — Next.js serves its own assets fine at this scale
- No multi-region — Morocco-only user base, one in-region VPS is correct
- No horizontal scaling story — vertical VPS sizing is the only lever that matters, for either deployment mode
- No load-testing infra (k6 or similar) — no concurrency scenario yet justifies it; the "low hundreds" target above is a starting estimate, not load-tested. Revisit if real usage approaches it.
- No Redis/external cache for the Sprint 11 rate limiter — an in-process limiter is consistent with "single VPS, no horizontal scaling"; would need to change if this ever became multi-instance

## 6. Handoff
→ Software Architect: module boundaries within this topology (`docs/architecture-moqawil.md`)
→ DevOps/DevSecOps: container/deployment implementation (`docs/devops-moqawil.md`)
