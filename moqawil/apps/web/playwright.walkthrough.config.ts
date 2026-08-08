import { defineConfig, devices } from '@playwright/test'

/**
 * Separate from playwright.config.ts (the CI e2e config) on purpose — this walkthrough
 * spec is a slow demo/documentation recording, not a correctness test, and must never be
 * picked up by `pnpm test:e2e` / CI. Run explicitly:
 *   pnpm exec playwright test --config=playwright.walkthrough.config.ts
 */
export default defineConfig({
  testDir: './walkthrough-e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  outputDir: '../../.recordings/_walkthrough-test-results',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    // headed, not headless, and video recording OFF: Chromium's CDP screencast (what
    // recordVideo uses under the hood, headless or headed) reproducibly stalled after ~1s on
    // this machine regardless of pipeline — confirmed via ffprobe showing an identical
    // 0.960000s duration across three structurally different recording attempts despite
    // 57-70s real elapsed time, while short (~9s) sessions recorded correctly. The actual
    // video is captured externally instead, via OS-level screen recording — see
    // scripts/run-walkthrough.mjs.
    headless: false,
    launchOptions: {
      args: ['--window-position=0,0', '--window-size=1200,700'],
    },
    video: 'off',
    viewport: { width: 1184, height: 620 },
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
