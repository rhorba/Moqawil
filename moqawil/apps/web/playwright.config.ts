import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3003'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  outputDir: '../../.recordings/e2e-debug',
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
  // In CI, use the production build (next start) — it's already built by this point (see
  // ci.yml's e2e job) and starts near-instantly, unlike `next dev`'s on-demand per-route
  // compile, which was timing out cold on shared CI runners even at 120s.
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: process.env.CI ? 'pnpm exec next start -p 3003' : 'pnpm exec next dev -p 3003',
          // /sign-in, not the bare root: Playwright's webServer readiness check only accepts
          // 2xx-3xx responses. Root `/` 404s (no page defined there), so Playwright silently
          // retried for the full 120s timeout even though the server was healthy and reachable
          // the whole time — confirmed via a manual `next start` + curl diagnostic in CI that
          // reached /sign-in (200) in 2s while Playwright's own poll of `/` never succeeded.
          url: 'http://127.0.0.1:3003/sign-in',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          // Explicit — Playwright's webServer stdout is 'ignore' by default (only stderr
          // surfaces), which is why a genuinely healthy start prints nothing at all while
          // an error prints plenty. Pipe both so a hung/slow start is actually diagnosable.
          stdout: 'pipe',
          stderr: 'pipe',
        },
      }),
})
