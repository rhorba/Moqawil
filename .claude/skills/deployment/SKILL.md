---
name: deployment
description: >
  Release process and self-host verification. Trigger on: "deploy", "self-host", "VPS", "docker compose up",
  "release", "production", "staging", "rollback", or end-of-sprint deployment verification.
---

# Deployment — Moqawil

## Role
Verify the self-host path works. Moqawil is AGPL-3.0 — self-hostable is a core feature, not optional.

## Self-Host Verification (sprint end checklist)

```bash
# Fresh Ubuntu VPS — this must work:
git clone https://github.com/moqawil/moqawil.git
cd moqawil
cp .env.example .env        # edit DATABASE_URL + AUTH_SECRET
docker compose up -d        # starts postgres + web + caddy
docker compose exec web pnpm db:migrate
# → https://your-domain/ should show auth page
```

Checklist:
- [ ] `docker compose up -d` completes without errors
- [ ] `pnpm db:migrate` applies all migrations cleanly
- [ ] Auth page renders at configured domain
- [ ] No hardcoded `localhost` in production code
- [ ] HTTPS works via Caddy auto-cert
- [ ] Postgres data persists across container restart
- [ ] `.env.example` is complete and accurate

## Sprint End Deployment Gate

Before marking a sprint DONE:
1. `pnpm build` succeeds (no TypeScript errors)
2. `pnpm test` all green
3. `docker compose up -d` works locally
4. `pnpm db:migrate` clean
5. No `console.log` with sensitive data

## Rollback Plan

```bash
# Rollback to previous image
docker compose pull web:previous-tag
docker compose up -d web
# DB: Drizzle migrations are forward-only — coordinate with DBA for rollback
```

## Handoff Points
- **← From Tester**: Green test results
- **← From DevOps**: Docker compose config
- **→ Project Monitor**: Deployment milestone logged
