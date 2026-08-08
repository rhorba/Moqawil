# DevOps: Moqawil
**References**: docs/architecture-moqawil.md, docs/security-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: DevOps/DevSecOps | **Status**: Current

## 1. Deployment Model
Self-host only for v0.1 — no managed cloud tier exists yet (planned post-v0.1, per the project's own tagline). Target: `docker compose up -d` on a fresh Ubuntu VPS, configured via a single `.env` file.

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
- No automated backup job — nightly `pg_dump` is documented as a manual/cron responsibility for the self-hoster, not automated by Moqawil itself.
- No staging environment — CI's `build`/`e2e` jobs are the closest thing to a pre-production check.
- No image registry / pre-built container publishing — self-hosters build the image themselves via `docker compose up -d`, matching the AGPL self-host-first positioning (no incentive yet to publish pre-built images before there's a managed tier).

## Handoff
← From Software Architect, Security Engineer: constraints this deployment must satisfy
→ Deployment skill: day-to-day release process
