import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

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
      // Scoped to files actually exercised by the unit suite without a live DB.
      // KNOWN GAP: src/lib/queries/{client,entrepreneur,invoice}.ts are DB-dependent
      // and untested at the unit level (no integration-test setup yet) — excluded
      // here rather than silently counted as covered. Do not add files to this list
      // just to keep the average up; add them when real tests exist for them.
      include: ['src/lib/threshold-alerts.ts', 'src/lib/queries/declaration.ts'],
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
