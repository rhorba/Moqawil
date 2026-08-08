import { defineConfig, devices } from '@playwright/test'

// 127.0.0.1, not localhost: Node's DNS resolution can prefer IPv6 (::1) for "localhost" on
// Linux, while `next start` binds IPv4 only by default. That mismatch let the server log
// "Ready" while Playwright's own readiness poll silently never connected — confirmed via
// piped webServer output showing a clean start with zero request activity afterward.
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
          url: 'http://127.0.0.1:3003',
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
