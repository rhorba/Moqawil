# Sprint 8 — Close Remaining Small Gaps (polish, no new features)

**Goal**: Close the two gaps explicitly carried forward from Sprints 5 and 7, plus tidy up one stale risk-log entry found while scoping. No new user-facing feature — pure hardening, same spirit as Sprint 5. Owner has confirmed the follow-up sprint after this one will be the accountant multi-client dashboard (the last big v0.2 feature).

**Depends on**: Sprint 7 complete ✅
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE

---

## Design

No new `packages/*` module, no new external integration, no schema change — Framework Rules 1/6 don't apply.

**Zod validation-message i18n (the real work)**: surveyed all 5 action files with module-scope Zod schemas. 10 distinct hardcoded French messages, ~19 call sites, across `invoices/actions.ts`, `quotes/actions.ts`, `clients/actions.ts`, `settings/actions.ts`:

| Message | Files |
|---|---|
| `Description requise` | invoices, quotes |
| `Quantité positive requise` | invoices, quotes |
| `Prix unitaire requis` | invoices, quotes |
| `Client requis` | invoices, quotes |
| `Date invalide` | invoices, quotes |
| `Date de validité invalide` | quotes |
| `Nom requis` | clients, settings |
| `Email invalide` | clients |
| `Adresse requise` | settings |
| `Ville requise` | settings |
| `ICE obligatoire pour les entreprises marocaines (CGI Article 145)` (superRefine, clients) | clients |
| `Préfixe: lettres majuscules, chiffres et tirets uniquement` (settings) | settings |

These are unreachable today because Zod schemas are declared at module scope (evaluated once when the file loads), outside any request context — `getTranslations()` is async and needs a request-scoped locale. Fix: convert each module-scope `const xSchema = z.object({...})` into a function that builds the schema per-request, called at the top of each server action after resolving `t = await getTranslations(...)`. `client.iceRequiredMa` and `invoice/quote.linesRequired` etc. already exist as message keys from Sprint 7 — this sprint wires the remaining ~10 into schemas rather than adding wholesale new keys.

**pnpm version consistency**: Sprint 5 found local pnpm (10.28.1) enforces `pnpm-workspace.yaml`'s `minimumReleaseAge`/`trustPolicy` supply-chain-hardening settings that CI's pinned pnpm 9.15.4 (`.github/workflows/ci.yml`'s `PNPM_VERSION`) treats as no-ops — meaning local installs and CI installs can behave differently depending on which pnpm a contributor has. Root cause confirmed while scoping: `package.json` has no `packageManager` field, so Corepack (bundled with Node ≥16.9, already required here via `engines.node: ">=22.0.0"`) has nothing to auto-pin to locally. Fix: add `"packageManager": "pnpm@9.15.4"`, matching CI's exact pin.

**Stale risk cleanup**: `.logs/risks.md`'s "Tax rate constants need legal citations" risk (logged 2026-05-19) has been open since Sprint 0, but `packages/tax-engine/src/index.ts` already has CGI/Law 114-13 citations on every constant — confirmed via grep while scoping this sprint. The mitigation happened; the log entry was just never closed. Quick verification-and-close, not new work.

---

## Sprint Backlog

### BATCH 1 — Zod validation-message i18n
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S8-01 | Add the ~10 missing message keys to `messages/{fr,ar}.json` (reuse existing namespaces: `invoice`, `quote`, `client`, `entrepreneur`/`settings`) | Frontend Dev | S | done | Backend Dev |
| S8-02 | Convert `invoices/actions.ts` + `quotes/actions.ts`: `lineSchema`/`invoiceSchema`/`editInvoiceSchema`/`quoteSchema`/`editQuoteSchema` become functions built per-request via `getTranslations()` | Backend Dev | M | done | Tester |
| S8-03 | Convert `clients/actions.ts` + `settings/actions.ts`: `clientSchema` (incl. the `superRefine` ICE message) + `profileSchema` become functions built per-request | Backend Dev | M | done | Tester |
| S8-04 | Verify: runtime check (real server, curl, both locales) confirms Zod errors now render in the active locale; re-run full Vitest suite (schema behavior unchanged, only message text) | Tester | S | done | DevOps/DevSecOps |

### BATCH 2 — pnpm version consistency
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S8-05 | Add `"packageManager": "pnpm@9.15.4"` to root `package.json`, matching CI's `PNPM_VERSION` exactly; verify Corepack picks it up locally (`pnpm --version` after enabling corepack) | DevOps/DevSecOps | S | done | Project Monitor |

### BATCH 3 — Log hygiene
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S8-06 | Close the stale "Tax rate constants need legal citations" risk in `.logs/risks.md` with evidence (citations already present in `tax-engine/src/index.ts`, confirmed via grep) | Project Monitor | S | done | — |

### BATCH 4 — Wrap
| ID | Task | Specialist | Size | Status | Handoff-To |
|---|---|---|---|---|---|
| S8-07 | Full verification: `pnpm build`, full Vitest suite + coverage gate, full Playwright suite with `--workers=1` | Tester | S | done | Project Monitor |
| S8-08 | Sprint snapshot → `.logs/metrics.md`; `git push origin master` (Framework Rule 3) | Project Monitor | S | done | USER |

---

## Definition of Done (Sprint 8 closes)
- [x] All ~10 Zod validation messages render in the active locale (FR default, AR after switching) — verified live, not just typechecked
- [x] `packageManager` field pins pnpm to the exact version CI uses; local `pnpm install` behaves identically to CI's (no more `minimumReleaseAge`/`trustPolicy` divergence)
- [x] Stale tax-citation risk closed with evidence
- [x] `pnpm build` succeeds, full Vitest suite + coverage gate passes, full Playwright suite passes with `--workers=1`
- [x] `git push origin master` at sprint close

## Explicitly out of scope for this sprint
- Accountant multi-client dashboard — owner-confirmed as the next sprint after this one, not part of this "close small gaps" pass
- Any other new feature surface
