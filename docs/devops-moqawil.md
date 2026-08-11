# DevOps: Moqawil
**References**: docs/architecture-moqawil.md, docs/security-moqawil.md, docs/prd-sprint11-saas-readiness.md | **Version**: 1.1 | **Date**: 2026-08-11 | **Author**: DevOps/DevSecOps | **Status**: Current

## 1. Deployment Model
Two modes as of Sprint 11: **self-host** (unchanged — `docker compose up -d` on a fresh Ubuntu VPS, configured via a single `.env` file, operator owns their own uptime/backups) and **Moqawil-operated hosted** (new — same `docker-compose.yml`, same image, deployed to infrastructure Moqawil itself owns and is responsible for keeping backed up and observably healthy). **Sprint 11 delivers the code/config/script side of the hosted mode only** — no VPS or domain has actually been provisioned by this work; that remains an owner action (no infrastructure credentials are held by the engineering work itself). Do not treat this sprint's completion as "the hosted product is live."

```
docker-compose.yml
  ├── web        (Next.js, two-stage Dockerfile: tax-engine built first, then web)
  ├── postgres   (16-alpine)
  └── caddy      (reverse proxy, automatic HTTPS)
```

## 2. CI/CD Pipeline (`.github/workflows/`)
### `ci.yml` — every push/PR to `master`
6 jobs: `security` (Semgrep/Trivy/Gitleaks, independent), `lint`, `typecheck`, `test` (Postgres service + migrations + coverage), `build` (needs lint+typecheck+test), `e2e` (needs build, Postgres service + migrations + Playwright).

**This pipeline didn't exist until 2026-08-08** — added alongside the rest of the framework hardening that day. Its first real run immediately caught two genuine pre-existing bugs (stale lockfile, gitignored migration journal) that had been silently masked by every prior session's stale local state. This is the expected, healthy outcome of adding CI to a project that didn't have it — not a sign anything is unusually broken.

### `docs-deploy.yml` — push to `moqawil/docs/**`
Builds the Docusaurus site (`moqawil/docs/`, the *public* user-facing FR/AR guides — not to be confused with the repo-root `docs/` internal design docs you're reading right now) and deploys via GitHub Pages Actions. Live at `https://rhorba.github.io/Moqawil/`. `docusaurus.config.ts`'s `baseUrl` is currently set for this default Pages path; switch to `docs.moqawil.ma` + `baseUrl: '/'` once that domain is bought and pointed at this Pages deployment (repo Settings → Pages → Custom domain).

## 3. Environment Variables (`.env.example`)
| Category | Vars |
|---|---|
| Database | `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| Auth.js | `AUTH_SECRET`, `AUTH_GOOGLE_ID`/`SECRET`, `AUTH_RESEND_KEY` |
| App | `NEXT_PUBLIC_APP_URL`, `APP_DOMAIN` |
| BAM | `BAM_RATE_CACHE_DAYS` |
| E2E only | `E2E_TEST_SECRET` — never set in production |
| Email (optional) | `SMTP_HOST`/`PORT`/`USER`/`PASS`/`FROM` — features degrade gracefully if unset |

Per Framework Rule 4: any Sprint 4+ external integration (DGI/xHub API keys, Barid eSign credentials) must have its env vars added to `.env.example` *before* implementation starts, never hardcoded.

## 4. Known Infra Gaps (tracked, not silently dropped)
- No automated backup job for **self-host** — nightly `pg_dump` remains a manual/cron responsibility for the self-hoster; unchanged.
- **Moqawil-operated hosted instance (Sprint 11)**: automated backups are the operator's own responsibility, not the self-hoster's — `scripts/backup-db.sh` (pg_dump + timestamped rotation) exists for exactly this; wire it into a cron job on whatever infrastructure is actually provisioned. Off-site upload (S3-compatible) is left to the operator's own credentials/bucket — the script supports piping its output to one.
- No staging environment — CI's `build`/`e2e` jobs are the closest thing to a pre-production check. Still true for both modes.
- No image registry / pre-built container publishing — self-hosters build the image themselves via `docker compose up -d`. Still true; the hosted instance also just runs `docker compose up -d` on Moqawil's own infrastructure rather than pulling a published image.
- No uptime monitoring configured — `GET /api/health` (Sprint 11) exists for a monitor to poll (UptimeRobot or similar), but no monitor has actually been wired up to it. Owner action.
- No formal load testing — see `docs/system-design-moqawil.md` §5; the "low hundreds concurrent" target for the hosted instance is a starting estimate, not measured.

## 5. Sprint 11 additions
| Item | Purpose | Location |
|---|---|---|
| `GET /api/health` | DB-connectivity check for an external uptime monitor | `apps/web/src/app/api/health/route.ts` |
| `DB_POOL_MAX` (env) | Tunable Postgres connection pool size, was hardcoded `max: 10` | `.env.example`, `packages/db/src/index.ts` |
| `scripts/backup-db.sh` | Timestamped `pg_dump` + rotation, pipeable to off-site storage | repo root `scripts/` |
| In-process rate limiter | Throttles `/api/auth/*` sign-in/magic-link bursts | `apps/web/src/middleware.ts` |

## Handoff
← From Software Architect, Security Engineer: constraints this deployment must satisfy
→ Deployment skill: day-to-day release process
