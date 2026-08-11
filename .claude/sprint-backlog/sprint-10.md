# Sprint 10 — Hardening/Polish + Full Walkthrough Refresh

**Goal**: Close documentation/coverage gaps found while sweeping the repo now that both v0.2 features (devis, accountant dashboard) are shipped, then produce a fully current screenshot set + walkthrough video covering every feature including generated PDFs. Launch/distribution content (CLAUDE.md §16) is explicitly deferred to Sprint 11.

**Depends on**: Sprint 9 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE

---

## Design

No new `packages/*` module, no new external integration, no schema change — Framework Rules 1/6 don't apply, same spirit as Sprints 5/8.

**Gaps found while scoping** (repo sweep before writing this backlog):
- `docs/docs/guide-devis.md` exists on disk but was never added to `docs/sidebars.ts` — orphaned since Sprint 6, unreachable from the docs site nav.
- No docs guide exists at all for the accountant multi-client dashboard (Sprint 9).
- Root `README.md` is stamped `version-0.1.0` / `tests-111 passing` (both stale) and its "Fonctionnalités (v0.1)" section never mentions devis/quotes, e-invoicing UBL readiness, or the accountant dashboard — written before any v0.2 work shipped.
- `.recordings/screenshots/` (22 PNGs) and `.recordings/walkthrough-2026-08-08T20-09-25.mp4` predate Sprint 6 (quotes), Sprint 7 (real AR translation), and Sprint 9 (accountant dashboard) entirely, and never show a rendered PDF (the existing script only clicks-and-closes the download link).
- Existing walkthrough infra (`apps/web/walkthrough-e2e/walkthrough.spec.ts` + `apps/web/scripts/run-walkthrough.mjs`, an external-ffmpeg screen-recorder — Playwright's own CDP video recording reproducibly stalls on this machine, documented in-file) is solid and reusable — extend it rather than rewrite it.
- Coverage report (Sprint 9's clean run) shows a handful of uncovered lines worth a look: `invoice-creation.ts` 54,70; `threshold-alerts.ts` 24,44; `accountant.ts` 96-102; `client.ts` 40-41; `declaration.ts` 52; `invoice.ts` 47,74.

---

## Sprint Backlog

### BATCH 1 — Hardening/polish
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S10-01 | Add `guide-devis` to `docs/sidebars.ts` nav (orphaned page fix) | Frontend Dev | S | done | Tester |
| S10-02 | Write `docs/docs/guide-comptable.md` (FR, matching existing guide style/tone): accountant invite flow, what the accountant sees, revocation — add to sidebar | Frontend Dev | M | done | Tester |
| S10-03 | Update root `README.md`: version/test-count badges, add devis + e-invoicing UBL readiness + accountant dashboard to the feature list, add guide links | Project Manager | S | done | Tester |
| S10-04 | Review the 6 uncovered-line spots from the Sprint 9 coverage report; add tests for genuinely-reachable gaps, leave a one-line comment for defensive/unreachable branches rather than forcing coverage | Tester | M | done | Project Monitor |
| S10-05 | Verify `.env.example` still lists every env var the app actually reads (grep `process.env` across `apps/web/src` and `packages/*/src`, diff against the file) | DevOps/DevSecOps | S | done | Tester |

### BATCH 2 — Walkthrough script extension
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S10-06 | Extend `walkthrough.spec.ts`: add a full devis section (create → detail → PDF view → convert to invoice), matching the existing `humanType`/`shot`/`pause` conventions | Frontend Dev | M | done | Tester |
| S10-07 | Extend `walkthrough.spec.ts`: replace the existing click-and-close PDF steps with direct `page.goto(pdfUrl)` + screenshot (invoice PDF, invoice UBL XML, quote PDF, declaration PDF) so every generated PDF is actually visible in the screenshot set | Frontend Dev | S | done | Tester |
| S10-08 | Extend `walkthrough.spec.ts`: add the accountant multi-actor flow at the end — from the same page/context, invite an accountant from Settings, switch identity via `page.request.post('/api/e2e/signin', ...)` (same trick as `happy-path.spec.ts`'s multi-actor pattern, keeps everything in one recorded window instead of a second OS window ffmpeg wouldn't capture), accept the invite, screenshot the dashboard + drill-down (real cap-badge data from the earlier client/invoice steps), switch back | Frontend Dev | M | done | Tester |
| S10-09 | Dry-run the extended script once (`pnpm dev` + `node scripts/run-walkthrough.mjs`), confirm every new step's selector actually resolves and every screenshot looks correct before the real recording | Tester | S | done | Frontend Dev |

### BATCH 3 — Produce the real recording
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S10-10 | Clean `.recordings/screenshots/` + delete the stale mp4, run the full walkthrough for real via `node scripts/run-walkthrough.mjs`, verify the produced video plays and every numbered screenshot exists and looks right | Tester | M | done | Project Monitor |

### BATCH 4 — Wrap
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S10-11 | Sprint snapshot → `.logs/metrics.md`; `git push origin master` (Framework Rule 3) — recordings are binary/large, confirm they're not accidentally `.gitignore`d before pushing | Project Monitor | S | done | USER |

---

## Definition of Done (Sprint 10 closes)
- [x] `guide-devis` reachable from the docs site nav
- [x] New accountant-dashboard guide page exists and is reachable
- [x] README reflects actual current version/features, not the v0.1 snapshot
- [x] Coverage gaps reviewed with a real verdict per spot (tested or explicitly justified), not silently ignored
- [x] `.env.example` verified complete against actual `process.env` usage
- [x] Walkthrough script covers: sign-in, onboarding, dashboard, AR/RTL toggle, clients + cap badge, devis (create/detail/PDF/convert), invoices (create/edit/PDF/UBL/paid), declarations (generate/PDF), cap-over-limit dialog, settings, accountant invite→accept→dashboard→drill-down
- [x] Every PDF the app generates (invoice, invoice UBL, quote, declaration) has a real screenshot of its rendered content, not just a downloaded-and-closed link
- [x] Fresh screenshot set + fresh walkthrough video committed, replacing the stale 2026-08-08 ones
- [x] `git push origin master` at sprint close

## Unplanned but resolved this sprint (not in original scope, found during execution)
- **Critical PDF-generation bug**: all 4 document routes (invoice, invoice UBL, quote, declaration) returned HTTP 500 in both dev and production builds — silently broken since Sprint 1, never caught because no test ever checked real PDF bytes. Root cause: (1) `@react-pdf/renderer`'s reconciler-based architecture is incompatible with Next.js RSC/webpack bundling when imported transitively through a workspace package — fixed via explicit `webpack.externals` in `next.config.ts`; (2) an upstream `@react-pdf/renderer` bug in the `4.1.6`-`4.5.1` range crashing on `unitsPerEm of undefined` — fixed by pinning the exact working version `4.6.0`. Found and fixed alongside it: Arabic legal-mention text (mandatory per CLAUDE.md §4/§10) had no font registered with Arabic glyph coverage — Helvetica has none, so it hit the same crash for a legitimate reason. Fixed via a base64-embedded Noto Sans Arabic (SIL OFL 1.1) `data:` URI font registration (`packages/pdf-templates/src/fonts.ts`). Full incident writeup: `.logs/risks.md`, 2026-08-11 entry. New regression test: `apps/web/src/__tests__/pdf-templates.test.ts` — asserts real `%PDF` magic bytes on all 3 template renderers, the first test in the project's history to check actual PDF output.
- **User feedback mid-sprint** ("dont forget to scrolldown in the video and the screenshots"): the walkthrough's `shot()` helper was viewport-only, silently truncating any page taller than 620px (worst offender: Settings' profile form + accountant-links section, cut off before the Enregistrer button). Fixed: `shot()` now passes `fullPage: true`; added a `scrollThroughPage()` helper invoked on the Settings steps so the recorded video also visibly scrolls rather than only the screenshot capturing the full content invisibly.
- `.recordings/_walkthrough-test-results/` (Playwright's ephemeral `.last-run.json`) was about to be committed — added to `.gitignore` alongside the existing `.recordings/e2e-debug/` rule.

## Explicitly out of scope for this sprint
- Launch/distribution content (blog posts, Show HN, community posts, GitHub release) — Sprint 11
- Blocked-on-owner items (DGI e-invoicing legal citation, DGI/xHub sandbox, Barid eSign account) — need the project owner, not sprint work
- Any new feature — this sprint is polish only
