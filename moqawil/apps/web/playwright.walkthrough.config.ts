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
      // --force-device-scale-factor=1: this machine runs Windows display scaling at 150%
      // (1920x1080 physical, 1280x720 logical). Without this flag, Chromium's
      // --window-size=1200,700 is interpreted in logical (DIP) pixels and renders at ~1.5x
      // that in actual physical pixels (~1800x1050) — far larger than the fixed 1280x720
      // physical-pixel region scripts/run-walkthrough.mjs's ffmpeg gdigrab captures, so only
      // the window's top-left corner ever appeared in the recorded video (screenshots were
      // unaffected — those capture the DOM directly via CDP, not the physical screen).
      // Forcing scale factor 1 makes the window's physical pixel size match its requested
      // size 1:1, so it fits entirely inside the capture region regardless of OS scaling.
      args: ['--window-position=0,0', '--window-size=1200,700', '--force-device-scale-factor=1'],
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
