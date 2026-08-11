import { Font } from '@react-pdf/renderer'
import { NOTO_SANS_ARABIC_REGULAR_BASE64 } from './noto-sans-arabic-font'

// Sprint 10: every template renders literal Arabic legal text (CGI Article 145
// bilingual mentions, quarter names, the devis disclaimer) — but no font with
// Arabic glyph coverage was ever registered. Helvetica (react-pdf's default)
// has none. This was silently broken since Sprint 1: no test ever rendered a
// real PDF and checked its bytes, so `pickFontFromFontStack` returning
// undefined for every Arabic codepoint (no font in the stack covers it) went
// unnoticed until it started crashing `renderToBuffer` outright — see the
// Sprint 10 entry in the repo root `.logs/risks.md` for the full incident.
//
// Registered from an in-memory Buffer, not a filesystem path or a fetched
// URL — both were tried first and both failed for reasons specific to this
// app's structure, not just theoretical: (1) `__dirname`-relative paths
// break because this package has no build step of its own (no `dist/`,
// unlike `@moqawil/tax-engine`), so at runtime this file's compiled location
// depends entirely on wherever Next's bundler last put it, which differs
// between `next dev`, `next start`, and the Docker `output: 'standalone'`
// build (see Dockerfile) — confirmed via a real ENOENT reading the
// resolved-wrong path. (2) Registering via a URL (even the app's own
// `/fonts/...` public route) confirmed-reproduced the exact same
// `unitsPerEm of undefined` crash this whole fix exists to solve — the fetch
// is async and isn't reliably finished before `renderToBuffer`'s text-layout
// pass runs, in both a real Next.js server AND in Vitest. A Buffer is
// synchronously available the instant this module loads: no path resolution,
// no network round-trip, no race.
//
// Bundled locally (not a third-party URL, unlike the emoji source below)
// because Arabic legal mentions are a mandatory compliance requirement
// (CLAUDE.md §4/§10), not a best-effort cosmetic feature — a self-hoster
// without outbound internet access at PDF-generation time must still be able
// to produce a compliant invoice. Noto Sans Arabic, SIL Open Font License
// 1.1 (see ../fonts/OFL.txt), free to embed and redistribute.
let registered = false

export function registerFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: 'NotoSansArabic',
    // @react-pdf/font's FontSource type is `src: string` only (no Buffer
    // overload despite some ecosystem docs suggesting otherwise) — a data:
    // URI keeps this a string while still being fully in-memory: no real
    // network round-trip, so nothing to race against during layout.
    src: `data:font/ttf;base64,${NOTO_SANS_ARABIC_REGULAR_BASE64}`,
  })

  // Emoji image source — unrelated to Arabic text support (kept from the
  // original invoice template; harmless if unreachable when self-hosted
  // offline, since no template currently renders an actual emoji character).
  Font.registerEmojiSource({
    format: 'png',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/',
  })
}
