import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3003'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['html'], ['list']],
  outputDir: '../../docs/test-recordings',
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Skip webServer management when PLAYWRIGHT_BASE_URL is set (server is already running)
  ...(process.env['PLAYWRIGHT_BASE_URL']
    ? {}
    : {
        webServer: {
          command: 'pnpm exec next dev -p 3003',
          url: 'http://localhost:3003',
          reuseExistingServer: !process.env['CI'],
          timeout: 120_000,
        },
      }),
})
