# Deployment Runbook — Moqawil-Operated Hosted Instance

**Version**: 0.1 | **Date**: 2026-08-12 | **Author**: DevOps/DevSecOps (Claude Code) | **Status**: Instructions for the owner to execute — not executed by this work
**References**: `docs/devops-moqawil.md`, `docs/system-design-moqawil.md` §4-5, `docker-compose.yml`, `Caddyfile`, `scripts/backup-db.sh`, `.env.example`

> **Who runs this**: the owner. Claude Code holds no VPS, DNS registrar, domain, or cloud-provider credentials (same blocked-on-owner pattern as DGI/xHub sandbox access in Sprint 4, and the infra items already flagged in Sprint 11 — see `docs/devops-moqawil.md` §1, §4). This document is the missing piece between "code/config ready" and "actually deployed." Every step below is written to be followable end-to-end by someone comfortable with a Linux shell; it doesn't assume prior Moqawil-specific ops knowledge.

---

## 0. Before you start — what you need

- [ ] A VPS running Ubuntu 22.04 or 24.04 LTS (sizing guidance in §1)
- [ ] A domain name you control, with access to its DNS records
- [ ] SSH access to the VPS as a user with `sudo`
- [ ] Google OAuth credentials (Google Cloud Console) if you want Google sign-in — optional, the app runs without it
- [ ] A Resend API key if you want email magic-link sign-in — optional, same
- [ ] Decide now whether this VPS backs a **staging** environment (for the pentest in `docs/pentest-scope-moqawil.md`) or **production** — do not skip staging if you plan to commission a pentest against real request/response behavior without exposing real customer data

---

## 1. VPS sizing

Consistent with the existing NFR: **single VPS, no horizontal scaling, no queue, no CDN** (`docs/system-design-moqawil.md` §4 — this is a deliberate architectural choice for a self-host-shaped product, not a temporary limitation to engineer around here).

| Tier | Specs | Fits |
|---|---|---|
| Minimum | 2 vCPU / 4 GB RAM / 40 GB SSD | Self-host (single AE) or early hosted instance with a handful of tenants |
| Recommended for launch | 4 vCPU / 8 GB RAM / 80 GB SSD | Hosted instance at public-launch traffic (root `CLAUDE.md` §16 distribution plan — Show HN, community posts) |

Postgres + Next.js + Caddy all run as containers on the same box (`docker-compose.yml`) — no separate DB host in this topology. If real usage later proves this insufficient, that is itself a signal to revisit the NFR with System Designer, not a reason to over-provision speculatively now.

## 2. DNS setup

1. Point an `A` record (and `AAAA` if the VPS has IPv6) for your chosen hostname (e.g. `app.yourdomain.com`) at the VPS's public IP.
2. Wait for propagation (`dig +short app.yourdomain.com` should return the VPS IP) before proceeding — Caddy's automatic HTTPS (§4) will fail its ACME challenge if DNS isn't live yet.
3. If also deploying the public docs site to a custom domain (`docs.moqawil.ma` per `docusaurus.config.ts`'s comment), add that DNS record too, then flip `docusaurus.config.ts`'s `url`/`baseUrl` back to the custom-domain values and set it in GitHub Pages → Settings → Pages → Custom domain. This is separate from the app deployment below.

## 3. Server provisioning

```bash
# On the VPS, as a sudo-capable user
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # or log out/in
docker compose version   # confirm the Compose plugin is present
```

## 4. Application deployment

```bash
git clone https://github.com/rhorba/Moqawil.git
cd Moqawil/moqawil
cp .env.example .env
```

Edit `.env` — at minimum:
- `POSTGRES_PASSWORD` — a real generated password, not `changeme`
- `AUTH_SECRET` — generate with `openssl rand -hex 32`
- `NEXT_PUBLIC_APP_URL=https://app.yourdomain.com`
- `APP_DOMAIN=app.yourdomain.com` (this drives the Caddy label in `docker-compose.yml` — `caddy-docker-proxy` reads it and requests the certificate automatically; no manual `Caddyfile` edit needed for this path)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` if using Google sign-in
- `AUTH_RESEND_KEY` if using email magic-link sign-in
- Leave `E2E_TEST_SECRET` **empty** — never set this outside CI/local dev (`docs/security-moqawil.md` §2); a production instance with this set has a live authentication bypass
- Leave `DB_POOL_MAX` unset unless you have a specific reason to deviate from the default of 10 (`docs/system-design-moqawil.md` §4)

```bash
docker compose up -d
docker compose ps   # confirm postgres is healthy before migrating
docker compose exec web pnpm db:migrate   # if migrate isn't wired into the image's entrypoint — verify against the current Dockerfile
```

> **Confirmed 2026-08-13** (was previously an unverified assumption): the manual `docker compose exec web pnpm db:migrate` above is the real, working mechanism — there is no automatic migration-on-start. This was actually broken until the preprod pipeline's first real deploy caught it: `drizzle-kit` (a `packages/db` devDependency) was never present in the production image because Next.js's standalone build output only traces what the server itself imports, not separate CLI invocations. Fixed by copying the full builder-stage `node_modules` into the runner image (see the Dockerfile and `.logs/activity.md`'s 2026-08-13 entry) — self-host `docker compose build` now includes it too, not just the preprod GHCR image.
>
> **Also confirmed the same day**: if you ever change `NEXT_PUBLIC_APP_URL` after the initial `docker compose up -d`, you must `docker compose up -d --build` (a real rebuild), not just edit `.env` and restart. It's a Next.js client-inlined variable — webpack bakes it into the compiled JS bundle at build time, so `docker-compose.yml`'s runtime `environment:` block has no effect on it once the image exists. Every other env var in this doc (`DATABASE_URL`, `AUTH_SECRET`, etc.) *is* correctly runtime-configurable via `environment:` — this one is the sole exception.

Visit `https://app.yourdomain.com` — you should see the public landing page (Sprint 11, FR-6) render in French by default.

## 5. HTTPS specifics

`docker-compose.yml`'s `caddy` service uses `lucaslorentz/caddy-docker-proxy`, which auto-configures Caddy from the `web` service's `caddy` / `caddy.reverse_proxy` Docker labels — driven by the `APP_DOMAIN` env var, **not** by manually editing the checked-in `Caddyfile`. Certificates are issued automatically via Let's Encrypt on first request to the domain; no manual certbot step. Confirm ports 80 and 443 are open in the VPS's firewall/security-group before expecting the ACME challenge to succeed.

> **Note for whoever edits infra next**: the repo also ships a static `Caddyfile` with a placeholder `your-domain.com` and explicit security headers (HSTS, X-Content-Type-Options, X-Frame-Options, gzip, JSON access log). That file is not wired into `docker-compose.yml`'s `caddy-docker-proxy` setup as written — it reads as an alternate/legacy path. This runbook follows what `docker-compose.yml` actually does today (label-driven). If the intent is to use the static `Caddyfile` instead (e.g. to get its explicit security headers, which the label-driven path does not currently set), that requires a `docker-compose.yml` change and is Software Architect/DevOps scope, not a runbook footnote — flagging here rather than silently picking one.

## 6. Automated backups

`scripts/backup-db.sh` already exists (Sprint 11) — it isn't wired into cron by default; that's this runbook's job.

```bash
# On the VPS, from the moqawil/ directory
crontab -e
```

Add:
```
0 3 * * * cd /home/YOUR_USER/Moqawil/moqawil && DATABASE_URL="postgresql://moqawil:YOUR_PG_PASSWORD@localhost:5434/moqawil" BACKUP_RETAIN_DAYS=14 ./scripts/backup-db.sh >> /var/log/moqawil-backup.log 2>&1
```

Notes:
- Use the *host*-reachable connection string (`localhost:5434`, matching the port mapping in `docker-compose.yml`), not the in-container `postgres:5432` one the `web` service uses — cron runs on the host, not inside a container.
- For off-site upload (recommended — a backup living on the same VPS as the database it backs up doesn't survive that VPS's disk failure), pipe the script's stdout per the header comment in `scripts/backup-db.sh`, e.g. to an S3-compatible bucket:
  ```
  0 3 * * * cd /home/YOUR_USER/Moqawil/moqawil && DATABASE_URL="..." ./scripts/backup-db.sh && aws s3 sync ./backups s3://your-bucket/moqawil-backups/
  ```
  This requires the VPS to have `aws` CLI (or equivalent) configured with credentials scoped to only that bucket — provisioning those credentials is an owner step, same pattern as everything else in this runbook.
- Test the restore path at least once before going live: `gunzip -c backups/moqawil-<timestamp>.sql.gz | psql "$DATABASE_URL"` against a throwaway database. A backup that has never been restored is unverified.

## 7. Uptime monitoring

`GET /api/health` (Sprint 11) returns 200 with a live DB check, non-200 if the DB is unreachable (`docs/devops-moqawil.md` §5).

1. Sign up for an external monitor (UptimeRobot's free tier is sufficient for a single-VPS instance's needs — no specific vendor requirement, pick what you're comfortable with).
2. Point an HTTP(S) monitor at `https://app.yourdomain.com/api/health`, interval 5 minutes is reasonable for a single-tenant-or-early-hosted instance.
3. Configure the alert contact (email/SMS/Slack per the monitor's options) to somewhere you'll actually see it.

## 8. Post-deploy checklist

- [ ] `docker compose ps` shows all 3 services (`web`, `postgres`, `caddy`) healthy
- [ ] `https://app.yourdomain.com` loads the landing page over valid HTTPS (check the padlock, not just "it loaded")
- [ ] Sign-in works (Google and/or magic link, whichever you configured)
- [ ] `/api/health` returns 200
- [ ] Cron backup job runs once manually to confirm it works before trusting the schedule: `./scripts/backup-db.sh`
- [ ] Uptime monitor shows the endpoint as up
- [ ] `E2E_TEST_SECRET` confirmed **unset** in the deployed `.env`
- [ ] This is a **staging** deploy if it's meant to receive the pentest from `docs/pentest-scope-moqawil.md` §4 — do not point that engagement at a box holding real tenant data without a separate written authorization

## Handoff
→ **USER**: Executes every step above — no infra credentials are held by this work. Recommend running this once against a disposable staging VPS first (cheap to tear down) before repeating it for production, given §5's Caddyfile-vs-label-driven-config note is worth resolving before the box that pentesters or real customers hit.
