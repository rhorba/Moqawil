/**
 * Runs the walkthrough Playwright test (walkthrough-e2e/walkthrough.spec.ts, headed,
 * screenshots only — see playwright.walkthrough.config.ts) while an external ffmpeg process
 * screen-records the desktop region the browser window opens in. Playwright's own
 * recordVideo (CDP screencast) is not used: it reproducibly stalled after ~1s of a 60-70s
 * real session on this machine, in both headless and headed mode, while screenshots kept
 * working the whole time — see the comment in playwright.walkthrough.config.ts.
 *
 * Usage: node scripts/run-walkthrough.mjs
 * Requires: ffmpeg on PATH, E2E_TEST_SECRET set, the app already running.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', '..', '..') // apps/web/scripts -> repo root
const RECORDINGS_DIR = join(ROOT, '.recordings')
const WEB_DIR = join(ROOT, 'apps', 'web')
const TMP_VIDEO = join(RECORDINGS_DIR, '_screen-recording-tmp.mp4')

mkdirSync(RECORDINGS_DIR, { recursive: true })

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    // shell: true — pnpm.cmd is a Windows batch file and can't be spawned directly.
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts })
    child.on('error', reject)
    child.on('exit', (code) => resolve(code))
  })
}

async function main() {
  // Matches playwright.walkthrough.config.ts's --window-position=0,0 --window-size=1200,700
  const ffmpeg = spawn(
    'ffmpeg',
    [
      '-y',
      '-f',
      'gdigrab',
      '-framerate',
      '12',
      '-offset_x',
      '0',
      '-offset_y',
      '0',
      '-video_size',
      '1280x720',
      '-i',
      'desktop',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-pix_fmt',
      'yuv420p',
      TMP_VIDEO,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  )

  // Give ffmpeg a moment to actually start capturing before the browser opens
  await new Promise((resolve) => setTimeout(resolve, 1500))

  console.log('Screen recording started, running walkthrough test...')
  const testExitCode = await run(
    'pnpm',
    ['exec', 'playwright', 'test', '--config=playwright.walkthrough.config.ts'],
    { cwd: WEB_DIR }
  )

  // Graceful stop: ffmpeg finalizes (writes the moov atom) on 'q' over stdin, unlike a hard
  // kill which would leave the mp4 unplayable.
  ffmpeg.stdin.write('q')
  await new Promise((resolve) => ffmpeg.on('exit', resolve))

  if (testExitCode !== 0) {
    console.error(`Walkthrough test failed with exit code ${testExitCode}`)
    process.exit(testExitCode ?? 1)
  }

  if (!existsSync(TMP_VIDEO)) {
    console.error('No screen recording produced — ffmpeg may have failed to start.')
    process.exit(1)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const finalName = `walkthrough-${timestamp}.mp4`
  renameSync(TMP_VIDEO, join(RECORDINGS_DIR, finalName))
  console.log(`Video saved: .recordings/${finalName}`)
}

main()
