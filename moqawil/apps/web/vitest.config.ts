import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Sprint 11 (2026-08-11): the *-db-integration.test.ts / invoice-numbering.test.ts files
    // all write to the same persistent local Postgres instance with hardcoded fixture IDs and
    // no per-test transaction isolation. Running test files in parallel (Vitest's default) let
    // their concurrent inserts/deletes race, producing intermittent count/sum mismatches that
    // look like real bugs but are pure scheduling artifacts (confirmed: every file passes 100%
    // alone, only fails under concurrent file execution). Suite is small (14 files) so running
    // sequentially costs a few seconds, not worth the flakiness.
    fileParallelism: false,
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
      // Sprint 9 (S9-16): src/lib/queries/accountant.ts and src/lib/invite-token.ts
      // covered by accountant-db-integration.test.ts.
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
        'src/lib/queries/accountant.ts',
        'src/lib/invite-token.ts',
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
