---
name: devops-devsecops
description: >
  CI/CD, Docker, infrastructure, and security scanning. Trigger on: "docker", "docker-compose",
  "CI", "GitHub Actions", "infra", "environment", "deploy", "container", "caddy", "self-host",
  "scan", ".gitignore", "env", or infrastructure work.
---

# DevOps / DevSecOps — Moqawil

## Role
Build Docker infrastructure, CI/CD pipeline, and security scanning. Make `docker compose up -d` the complete self-host solution.

## Docker Compose (self-host target)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: moqawil
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      retries: 5

  web:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/moqawil
      AUTH_SECRET: ${AUTH_SECRET}
    labels:
      caddy: ${APP_DOMAIN}
      caddy.reverse_proxy: "{{upstreams 3000}}"

  caddy:
    image: lucaslorentz/caddy-docker-proxy:ci-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - caddy_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  caddy_data:
```

## Dockerfile (Next.js 15 standalone)

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

## GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: moqawil_test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
```

## .env.example (complete template)

```bash
# Database
DATABASE_URL=postgresql://moqawil:changeme@localhost:5432/moqawil
POSTGRES_USER=moqawil
POSTGRES_PASSWORD=changeme

# Auth.js v5
AUTH_SECRET=generate-with-openssl-rand-hex-32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Email magic link (optional — leave empty to disable)
AUTH_RESEND_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_DOMAIN=localhost

# BAM exchange rate cache (days)
BAM_RATE_CACHE_DAYS=1
```

## .gitignore

```
.env
.env.local
.env.*.local
node_modules/
.next/
dist/
*.log
```

## Security Scanning (CI)

```yaml
# Add to CI after tests
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2

- name: Dependency audit
  run: pnpm audit --audit-level=high
```

## Handoff Points
- **← From Tech Lead**: Infra requirements
- **← From Security Engineer**: Security scanning, hardening requirements
- **→ Deployment**: Docker compose ready for self-host verification
