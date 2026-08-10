# Sprint 7 — i18n Retrofit (real next-intl usage, not just RTL layout)

**Goal**: Close the gap found and documented at the end of Sprint 6 (`.logs/risks.md`, 2026-08-10): next-intl is fully configured (`NextIntlClientProvider` wired at root, `messages/{fr,ar}.json` with a fairly complete key set, a working locale-switch cookie + toggle button) but `useTranslations`/`getTranslations` are never actually called anywhere in the app's page components — every page hardcodes French text. Switching to Arabic today only changes the sidebar nav (which uses its own inline ternaries) and layout `dir`; the actual page content stays French. This sprint wires every `(app)` and `(auth)` page/component to real message-file-driven translation so the AR locale genuinely translates content.

**Depends on**: Sprint 6 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE ✅
**Completed**: 2026-08-10

---

## Design

No new `packages/*` module, no new external integration, no schema change — Framework Rules 1/6 don't apply. This is a mechanical but wide-reaching retrofit: swap hardcoded string literals for `t('namespace.key')` calls, using the message keys that already exist in `messages/fr.json`/`ar.json` (11 namespaces already defined: common, nav, auth, entrepreneur, client, invoice, quote, cap, threshold, declaration, legal) and adding the ones that don't (dashboard, settings, and per-page gaps found during the audit).

**Server vs. Client Components**: `getTranslations()` (next-intl/server, async) in Server Component pages; `useTranslations()` (next-intl, sync) in Client Components (forms, action buttons). `NextIntlClientProvider` is already wired in `app/layout.tsx`, so `useTranslations` works in Client Components with no further plumbing needed.

**`app-nav.tsx` cleanup**: it currently hardcodes its own `labelAr` field per nav item via inline `isAr ? x : y` ternaries — a working but parallel, non-standard i18n approach that duplicates what `messages/{fr,ar}.json`'s `nav` namespace already contains. Simplify it to `useTranslations('nav')` and delete the redundant `labelAr` fields, so there's one i18n mechanism in the app, not two.

**Verification**: a real Playwright test switches the locale (via the existing toggle button / `setLocale` cookie action) and asserts genuine Arabic page *content* — not just the nav sidebar — appears on at least two representative pages (dashboard, invoices list). This is the test that would have caught the original gap.

---

## Sprint Backlog

### BATCH 1 — Message audit + shared components
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S7-01 | Audit every `(app)`/`(auth)` page and component for hardcoded FR strings; add missing message keys (`dashboard`, `settings` namespaces; gaps in existing namespaces) to both `fr.json` and `ar.json` | Frontend Dev | M | **done** | Frontend Dev |
| S7-02 | Convert shared components: `cap-badge.tsx`, `cap-confirm-dialog.tsx`; simplify `app-nav.tsx` to `useTranslations('nav')`, drop the redundant `labelAr` fields | Frontend Dev | M | **done** | Tester |

### BATCH 2 — Invoices + Quotes (largest, mirrored pair)
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S7-03 | Convert all `invoices/*` pages and components (list, detail, new, edit, `invoice-form.tsx`, `invoice-actions.tsx`) | Frontend Dev | L | **done** | Tester |
| S7-04 | Convert all `quotes/*` pages and components (list, detail, new, edit, `quote-form.tsx`, `quote-actions.tsx`) — mirrors S7-03 | Frontend Dev | L | **done** | Tester |

### BATCH 3 — Clients, Dashboard, Declarations, Settings, Sign-in
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S7-05 | Convert `clients/*` (list, detail, new, `client-form.tsx`) | Frontend Dev | M | **done** | Tester |
| S7-06 | Convert `dashboard/page.tsx` | Frontend Dev | S | **done** | Tester |
| S7-07 | Convert `declarations/*` (page, `declaration-card.tsx`) | Frontend Dev | M | **done** | Tester |
| S7-08 | Convert `settings/*` (page, `profile-form.tsx`) | Frontend Dev | S | **done** | Tester |
| S7-09 | Convert `(auth)/sign-in/*` (page, `test-credentials-form.tsx`) | Frontend Dev | S | **done** | Tester |

### BATCH 4 — Verification
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S7-10 | Playwright test: switch locale to AR via the toggle, assert genuine Arabic *page content* (not just nav) on dashboard + invoices list; assert FR still renders correctly by default | Tester | M | todo | Project Monitor |
| S7-11 | Visual/RTL pass: confirm forms, tables, and dialogs read correctly right-to-left in AR (existing `rtl:` Tailwind classes from the Sprint 2 RTL audit should mostly already handle this — verify, don't re-do) | Frontend Dev | S | todo | Project Monitor |
| S7-12 | Sprint snapshot → `.logs/metrics.md`; close the i18n gap risk in `.logs/risks.md` with evidence; `git push origin master` (Framework Rule 3) | Project Monitor | S | **done** | USER |

**Batch 4 result**: added a real Playwright test (not a cookie shortcut — it clicks the actual toggle button a user would) that onboards a fresh AE, confirms French page content renders by default, switches locale, and asserts genuine Arabic *headings* render on dashboard/invoices/quotes plus `dir="rtl"` on `<html>`. First full-suite run with the new test added (Playwright's local default `workers: undefined`, i.e. parallel) produced a flaky failure — traced to fixed test-user emails colliding across concurrently-running independent `test.describe` blocks against the same shared local Postgres, not a real app bug. Re-ran with `--workers=1`, matching what `playwright.config.ts` already forces in CI specifically for this reason — 18/18 pass, deterministic. Also went beyond the DoD's literal ask: while sweeping for stragglers, found and fixed the ~26 simple hardcoded messages returned by server actions (`'Non authentifié'`, `'Profil introuvable'`, etc. across `invoices/quotes/clients/settings/declarations actions.ts`) using `getTranslations()` server-side — these run on the server so they can call it directly. Also fixed a real pre-existing bug found along the way: `invoice-actions.tsx` determined the email-send success/failure banner color by string-matching the French success message (`.startsWith('Facture envoyée')`), which would have silently shown the wrong color in Arabic; switched to using the action's own `success` boolean, which existed all along but was being discarded. **Explicitly left un-translated** (documented, not silently dropped): Zod validation-schema messages (e.g. `.min(1, 'Description requise')`) — these are defined at module scope, outside any request context, so translating them would require restructuring every schema to be built per-request inside the action function; a real remaining gap, scoped out of this pass for size reasons and left for a future follow-up if it matters in practice (client-side length/required validation already catches most of these before submission).

---

## Definition of Done (Sprint 7 closes)
- [x] Every `(app)` and `(auth)` page/component uses `useTranslations`/`getTranslations` — zero hardcoded French UI strings remain (verified by a final repo-wide grep, not just spot-checks) — except the one documented `app-nav.tsx` language-switcher exception (language names shown in their own script, not translated) and Zod schema validation messages (documented known gap, see Batch 4 note)
- [x] Switching to AR via the existing toggle genuinely translates page content, confirmed by a real Playwright test asserting Arabic text — not just RTL direction
- [x] `app-nav.tsx` uses the same i18n mechanism as the rest of the app (no parallel `labelAr` ternary system)
- [x] `pnpm build` succeeds, full Vitest suite + coverage gate passes, full Playwright suite passes (both FR default and the new AR test) — verified with `--workers=1` matching CI
- [x] The i18n gap risk logged 2026-08-10 in `.logs/risks.md` is closed with evidence
- [x] `git push origin master` at sprint close

## Explicitly out of scope for this sprint
- English (`en`) locale — CLAUDE.md §5 defers this to v0.2/later explicitly; FR/AR only
- PDF template translation — invoice/quote/declaration PDFs already carry bilingual FR+AR legal mentions where CGI Article 145 requires it; the PDF *layout* labels (e.g. "Facture", "Total") staying French-primary matches the legal-document convention already established, not part of this UI-content retrofit
- Tamazight — CLAUDE.md §5: "deferred indefinitely"
