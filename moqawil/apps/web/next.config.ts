import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts')

const nextConfig: NextConfig = {
  output: 'standalone',  // Required for Docker multi-stage build
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'localhost:3001'] },
  },
}

export default withNextIntl(nextConfig)
