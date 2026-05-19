import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts')

const nextConfig: NextConfig = {
  // standalone output only inside Docker (Linux); Windows symlink creation requires elevated privileges
  ...(process.env.DOCKER_BUILD === '1' && { output: 'standalone' }),
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'localhost:3001'] },
  },
}

export default withNextIntl(nextConfig)
