import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Scoped to files actually exercised by the unit/integration suite.
      // Sprint 5 (S5-07): src/lib/queries/{client,entrepreneur,invoice}.ts and
      // src/lib/bam-parser.ts now have real DB-integration / fixture-backed
      // tests (see __tests__/{client,entrepreneur,invoice-queries}-db-integration.test.ts,
      // invoice-numbering.test.ts, bam-scraper.test.ts).
      // Sprint 6 (S6-11): src/lib/queries/quote.ts and src/lib/invoice-creation.ts
      // (the shared advisory-lock transaction) covered by
      // quote-db-integration.test.ts and invoice-numbering.test.ts.
      // Do not add files to this list just to keep the average up; add them
      // when real tests exist for them.
      include: [
        'src/lib/threshold-alerts.ts',
        'src/lib/queries/declaration.ts',
        'src/lib/queries/client.ts',
        'src/lib/queries/entrepreneur.ts',
        'src/lib/queries/invoice.ts',
        'src/lib/queries/quote.ts',
        'src/lib/bam-parser.ts',
        'src/lib/invoice-creation.ts',
      ],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
