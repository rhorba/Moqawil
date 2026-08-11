import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts')

const nextConfig: NextConfig = {
  // standalone output only inside Docker (Linux); Windows symlink creation requires elevated privileges
  ...(process.env.DOCKER_BUILD === '1' && { output: 'standalone' }),
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3003'] },
  },
  // Sprint 10: @react-pdf/renderer builds a custom React renderer via
  // @react-pdf/reconciler (react-reconciler under the hood), which must attach
  // to the exact same React instance that created its elements. Bundled through
  // Next's App Router webpack "(rsc)" layer, it instead gets Next's own
  // internally-aliased React copy — a mismatch that crashed every PDF route
  // (invoice, quote, declaration) with `TypeError: Cannot read properties of
  // undefined (reading 'S')` deep inside the reconciler, on every request, with
  // zero automated test ever catching it (no test previously checked actual PDF
  // byte output — see pdf-templates.test.ts). The documented fix for this class
  // of problem is `serverExternalPackages`, but it doesn't reach these packages
  // here since they're imported transitively through the @moqawil/pdf-templates
  // workspace package rather than directly from apps/web — webpack's RSC layer
  // still bundled them even with every package listed there (confirmed:
  // identical crash, still webpack-internal:// paths). Forcing them into
  // config.externals directly is the lower-level escape hatch that actually
  // works — confirmed via file:// (not webpack-internal://) paths in the
  // resulting stack traces.
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : []
      config.externals = [
        ...externals,
        '@react-pdf/renderer',
        '@react-pdf/reconciler',
        '@react-pdf/fns',
        '@react-pdf/font',
        '@react-pdf/image',
        '@react-pdf/layout',
        '@react-pdf/pdfkit',
        '@react-pdf/png-js',
        '@react-pdf/primitives',
        '@react-pdf/render',
        '@react-pdf/stylesheet',
        '@react-pdf/svg',
        '@react-pdf/textkit',
        '@react-pdf/types',
        'yoga-layout',
      ]
    }
    return config
  },
}

export default withNextIntl(nextConfig)
