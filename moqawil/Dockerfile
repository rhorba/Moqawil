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

# Copy pnpm-lock so migrations can be run at start if needed
COPY --from=builder --chown=nextjs:nodejs /app/packages/db ./packages/db

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
