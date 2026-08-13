FROM node:22-alpine AS base
RUN corepack enable pnpm

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tax-engine/package.json ./packages/tax-engine/
COPY packages/db/package.json ./packages/db/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/pdf-templates/package.json ./packages/pdf-templates/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Install workspace packages so pnpm links are correct
RUN pnpm install --frozen-lockfile --ignore-scripts

ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1

# next build statically analyzes every route (including /api/auth/[...nextauth]), which imports
# packages/db at module scope — that throws without DATABASE_URL even though nothing is actually
# queried at build time (the `postgres` client is lazy, see packages/db/src/index.ts). These are
# placeholders only: the real values are injected at container start via docker-compose's
# `environment:` block and completely override whatever was baked in at build time.
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ARG AUTH_SECRET=build-time-placeholder-not-used-at-runtime
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build tax-engine first (web app imports from dist/)
RUN pnpm --filter @moqawil/tax-engine build
# Build the Next.js app
RUN pnpm --filter @moqawil/web build

# ── Production image ──────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# drizzle-kit (a packages/db devDependency) is never in the Next.js standalone trace above --
# standalone only bundles what the Next.js server itself imports, not separate CLI invocations
# like `pnpm --filter @moqawil/db migrate`. Copy the full workspace node_modules so that command
# actually works inside this image, at the cost of the "lean standalone" size savings. A future
# optimization could split this into a dedicated migrator stage instead.
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/db ./packages/db

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
