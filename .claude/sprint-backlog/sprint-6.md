# Sprint 6 — Devis (Quote) Management

**Goal**: Let an AE create a devis (quote) for a prospective client before invoicing — CLAUDE.md §5 marks this v0.2, owner-approved to start now (2026-08-10, see `.logs/communications.md`). A devis can be created, sent, marked accepted/rejected, and — the key flow — converted into a real invoice with one click, reusing the exact same sequential-numbering + 80K-cap-check logic invoices already use.
**Depends on**: Sprint 5 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE ✅
**Completed**: 2026-08-10

---

## Design

No new `packages/*` module and no new external-system integration — this is a new feature inside the existing `apps/web` + `packages/db` boundary, so Framework Rules 1/6 (mandatory System Designer + Software Architect, PRD/architecture doc pair) don't trigger. DBA design review still applies per the standing auto-handoff rule (DB schema change → DBA before Backend proceeds).

**Key design decisions (🟡 BALANCED, logged here rather than a separate ADR since no module boundary is affected):**
1. **Separate numbering sequence from invoices.** Quotes get their own `quoteNumber` sequence (`DEVIS-{year}-{seq}`), not sharing `invoices.sequenceNumber`. A quote is not a legal invoice (CGI Article 145's sequential-no-gaps rule is an *invoice* requirement) — conflating the two sequences would be incorrect, not just inconvenient.
2. **Fixed `DEVIS` prefix, not configurable per entrepreneur.** Invoices have a configurable `invoicePrefix` (legal document, entrepreneur's own numbering scheme). Quotes aren't a legal document with the same requirement — keeping the prefix fixed avoids a config surface nobody asked for. Revisit if a real user asks.
3. **Quotes never count toward the 80K cap or the annual threshold.** They're not turnover. This is enforced by construction (cap/threshold queries only ever read the `invoices` table, `quotes` is a separate table) — but gets an explicit regression test anyway, since the cap tracker is the product's core differentiator and this invariant must never silently break.
4. **"Convert to invoice" reuses the real invoice-creation transaction**, not a copy of it — same advisory-lock + sequential-numbering + cap-check path `actions.ts`'s `createInvoice` already uses, called with the quote's line items pre-filled. No duplicate numbering logic.
5. **No PDF legal-mention parity with invoices.** A devis doesn't carry "TVA non applicable" or the Article 145 mandatory-field set — those are invoice-specific. The devis PDF instead carries a clear "Ce document est un devis, pas une facture" statement and a validity date, so it can never be mistaken for a legal invoice.

---

## Sprint Backlog

### BATCH 1 — Data layer
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S6-01 | Schema: `quotes` + `quote_lines` tables, `quote_status` enum (`draft`/`sent`/`accepted`/`rejected`/`expired`), `convertedToInvoiceId` FK on `quotes` → `invoices.id`; migration | DBA | M | todo | Backend Dev |
| S6-02 | Query helpers: `getQuotes(entrepreneurId)`, `getQuoteWithLines(quoteId, entrepreneurId)` — same ownership-scoping pattern as `queries/invoice.ts` (IDOR guard: wrong entrepreneurId → null, not another client's data) | DBA | S | todo | Backend Dev |

### BATCH 2 — Business logic
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S6-03 | Server actions: `createQuote`, `updateQuote` (draft-only), `sendQuote`, `markQuoteAccepted`, `markQuoteRejected`, `deleteQuote` (draft-only) — Zod validation mirroring `invoices/actions.ts` | Backend Dev | M | todo | Tester |
| S6-04 | `convertQuoteToInvoice` action — calls the *same* advisory-lock transaction `createInvoice` uses (extract the shared lock+numbering block into a helper both actions call, rather than duplicating it), pre-fills client/lines/currency from the quote, still runs the 80K cap check and blocking dialog exactly as a normal invoice creation would, sets `quotes.convertedToInvoiceId` and `quotes.status = 'accepted'` on success | Backend Dev | L | todo | Tester |
| S6-05 | Unit + DB-integration tests: quote CRUD, ownership scoping (IDOR guard), status transitions, `convertQuoteToInvoice` (numbering correctness, cap check still fires, `convertedToInvoiceId` set), and the explicit invariant test that quotes never appear in `getClientAnnualTotal`/`getYtdTurnover`/cap or threshold totals | Tester | L | todo | Security Engineer |
| S6-06 | Security review: quote routes/actions scoped by `entrepreneurId` on every read and write (no cross-entrepreneur access), `convertQuoteToInvoice` can't be used to bypass the cap-check or numbering invariants | Security Engineer | S | todo | Frontend Dev |

### BATCH 3 — PDF + UI
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S6-07 | `packages/pdf-templates/src/quote-template.tsx` — mirrors `invoice-template.tsx` layout, headed "DEVIS" not "FACTURE", validity date, explicit "n'est pas une facture" disclaimer, no TVA/Article 145 legal-mention block | Frontend Dev | M | **done** | Tester |
| S6-08 | Pages: `quotes/page.tsx` (list, status badges), `quotes/new/page.tsx` + `quote-form.tsx` (reuse `invoice-form.tsx` line-item UX), `quotes/[id]/page.tsx` (detail, status actions, "Convertir en facture" button with the same cap-warning dialog pattern), `quotes/[id]/edit/` (draft-only) | Frontend Dev | L | **done** | Tester |
| S6-09 | i18n: new `quote` namespace, FR primary + AR (RTL-checked) | Frontend Dev | S | **done** | Tester |

**Batch 3 result**: production build succeeds cleanly with all quote routes generated (`/quotes`, `/quotes/new`, `/quotes/[id]`, `/quotes/[id]/edit`, `/api/quotes/[id]/pdf`). Added the `quote` i18n namespace (+ a `nav.quotes` key) to both `messages/fr.json` and `messages/ar.json` for consistency — worth flagging honestly: discovered while building this that `useTranslations`/`getTranslations` are **never actually called anywhere** in the app's `(app)` route pages (confirmed via repo-wide grep) — every existing page (invoices, clients, declarations) hardcodes French text directly, despite `messages/{fr,ar}.json` existing with a fairly complete key set. AR support that genuinely works today is chrome-level only: RTL layout direction + hardcoded `labelAr` fields in `app-nav.tsx`'s nav items, not per-string page-content translation. This is a pre-existing gap versus CLAUDE.md §5/§11's stated i18n requirement, not something this sprint introduced — followed the same established (hardcoded-FR) pattern for consistency rather than being the only page in the app to use real `useTranslations`, but added the JSON keys so a future i18n-retrofit sprint has them ready. Flagged in `.logs/risks.md`.
While closing out, noticed `deleteQuote` (S6-03) had a working backend action with no UI control wired to it — added a "Supprimer" button to `quote-actions.tsx` (draft-only, matching the edit link's guard) so the DoD's delete requirement is actually reachable, not just implemented.

### BATCH 4 — Quality gate
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S6-10 | Playwright smoke addition: create quote → convert to invoice → confirm it appears in the invoice list with correct sequential number | Tester | M | **done** | Project Monitor |
| S6-11 | Coverage check (Framework Rule 2, ≥80% combined) — add to `vitest.config.ts` include list once real tests exist, same discipline as Sprint 5 | Tester | S | **done** | Project Monitor |
| S6-12 | FR doc: `docs/docs/guide-devis.md` (or extend `guide-facturation.md`) covering the devis → facture flow | Frontend Dev | S | **done** | Project Monitor |
| S6-13 | Sprint 6 snapshot → `.logs/metrics.md`; `git push origin master` (Framework Rule 3) | Project Monitor | S | **done** | USER |

**Batch 4 result**: ran the full Playwright e2e suite locally against a real dev server (not just CI) — 17/17 pass including the new step 8 (create devis → convert → land on the resulting invoice with the correct sequential number, confirmed via the real redirect URL). Local run required setting `AUTH_SECRET`/`E2E_TEST_SECRET` explicitly as shell env vars rather than relying on `.env` autoload — Next.js only auto-loads `.env` from the app's own directory (`apps/web/`), not the monorepo root where this repo's `.env` actually lives; CI's job works because it sets these as explicit GitHub Actions `env:` values, bypassing the issue entirely. Pre-existing environment quirk, not a Sprint 6 regression — noted for anyone else running e2e locally.

---

## Definition of Done (Sprint 6 closes)
- [x] AE can create, edit (draft-only), send, and delete (draft-only) a devis with line items
- [x] Devis PDF generated, clearly marked as not a legal invoice, includes validity date
- [x] "Convertir en facture" creates a real invoice via the same numbering/cap-check path as direct invoice creation — no duplicated locking logic
- [x] Quotes never affect the 80K per-client cap or the annual threshold totals (explicit regression test, not just "it happens to work")
- [x] All quote reads/writes scoped by `entrepreneurId` — no cross-entrepreneur access (IDOR guard tested)
- [x] FR + AR (RTL) UI for the full devis flow — at the same level the rest of the app has today (RTL layout + nav labels; page-content strings hardcoded FR like every other page, see Batch 3 note)
- [x] Combined coverage ≥80% on newly-added logic (Framework Rule 2)
- [x] `git push origin master` at sprint close

## Explicitly out of scope for this sprint
- Client-facing quote acceptance portal / e-signature (CLAUDE.md §5: "Customer portal... — v0.2" is about *internal* AE-side management here, not a client-facing portal — that's a further-out feature)
- Quote templates / saved line-item libraries
- Automatic expiry status transitions (a cron/scheduled job) — `expired` status exists in the enum but is set manually for v0.2; automatic expiry sweeps are a DevOps/infra concern for later
