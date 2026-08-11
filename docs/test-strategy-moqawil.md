# Test Strategy: Moqawil
**References**: docs/architecture-moqawil.md, docs/database-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: Test Architect | **Status**: Current (honest as of the 2026-08-08 coverage-config fix)

## 1. Testing Pyramid (as actually built, Sprints 0-3)
```
        ▲  E2E (Playwright)
       ╱ ╲  1 happy-path spec: signup → onboard → client → invoice → paid → cap update → declaration
      ╱   ╲
     ╱     ╲ Unit — tax-engine (packages/tax-engine)
    ╱       ╲ 59+ tests, thresholds: 100% functions, 95% lines — the highest bar in the codebase,
   ╱         ╲ because this is the highest-legal-risk code (docs/architecture-moqawil.md ADR-2)
  ╱───────────╲
 ╱             ╲ Unit — apps/web (Vitest)
╱_______________╲ cap-tracker, invoice-numbering, security, bam-scraper, declaration-queries,
                   threshold-alerts — 6 test files, ~53 tests across Sprints 1-2
```

## 2. Coverage Gate — Framework Rule 2 (80%, honestly scoped)
**History worth keeping**: the original `vitest.config.ts` coverage `include` was scoped to a single file (`threshold-alerts.ts`), which made the "80%" number technically true but practically meaningless — it wasn't measuring the app. Fixed 2026-08-08 to include `threshold-alerts.ts` + `queries/declaration.ts` (both actually exercised by the test suite), with `queries/{client,entrepreneur,invoice}.ts` explicitly documented as an untested gap in the config file itself, not silently excluded. **Rule going forward: never widen the `include` list just to make a number pass — widen it when real tests exist.**

`packages/tax-engine` has its own, separately-configured, stricter gate (100% functions / 95% lines) since it's zero-I/O and has no excuse not to be near-fully tested.

## 3. What Is NOT Unit Tested (tracked honestly)
- DB-touching query functions in `queries/{client,entrepreneur,invoice}.ts` — no integration-test harness exists yet (would need a seeded test DB, not just mocks). This is real technical debt, not an oversight to hide.
- Manual chartered-accountant review of the PDF outputs (invoice + declaration) is a DoD item precisely because automated tests can verify field *presence* but not legal *correctness* of layout/wording — that requires a human domain expert.

## 4. E2E Strategy
One Playwright spec covers the full happy path end-to-end (`apps/web/e2e/`). Deliberately not a large e2e suite — e2e tests are expensive to maintain relative to unit tests for a project this size; edge cases (cap boundary conditions, tax-rate branching, ICE validation) belong in `tax-engine`'s unit suite where they're cheaper to write and faster to run.

## 5. CI Enforcement (`.github/workflows/ci.yml`)
| Job | What it checks |
|---|---|
| `lint` | Biome |
| `typecheck` | `tsc --noEmit` across all 5 workspace packages (script added 2026-08-08 — didn't exist before) |
| `test` | Vitest unit suites (tax-engine + web), coverage uploaded as an artifact |
| `build` | Next.js production build, two-stage (tax-engine first, mirrors the Dockerfile) |
| `e2e` | Playwright against a real Postgres service + migrations |
| `security` | Semgrep SAST, Trivy SCA, Gitleaks — see `docs/security-moqawil.md` |

First real run of this pipeline (2026-08-08) caught two genuine pre-existing bugs on the first try — a stale `pnpm-lock.yaml` missing the `docs` workspace's dependencies, and `drizzle/meta/_journal.json` (required by `drizzle-kit migrate`) being gitignored. Both are exactly the class of bug CI exists to catch: things that "worked" locally only because of stale local state that a fresh checkout doesn't have.

## 6. Video Recording (Framework Rule 7)
At version completion with user-facing changes, record a Playwright video of the critical flows, save to `.recordings/v[version]-[date].webm` at repo root. Distinct from the per-test debug videos Playwright captures on every e2e run (now correctly routed to gitignored `.recordings/e2e-debug/`, not the public docs folder — fixed 2026-08-08).

## 7. Fixture ICE Numbering Convention (added Sprint 11, 2026-08-11)
Vitest DB-integration tests and Playwright e2e/walkthrough specs both write directly to the shared persistent local dev Postgres instance, and neither wipes its rows after a successful run. `entrepreneurs.ice` is UNIQUE, so two suites picking the same hardcoded ICE collide — and because fixture inserts used bare `onConflictDoNothing()` (no `target`), the collision silently no-op'd on the *wrong* constraint (ICE) instead of the intended one (id), leaving a downstream FK-violation error at a confusing point in the test. Hit 4 times across Sprints 10-11 before being fixed properly.

**Fix**: every suite that inserts an `entrepreneurs` or `users` row now owns a reserved, non-overlapping ICE block, and every fixture `onConflictDoNothing()` on those two tables now specifies `{ target: entrepreneursTable.id }` / `{ target: usersTable.id }` — so a real future collision throws a loud, immediate unique-constraint error instead of silently vanishing.

| Block | Owner |
|---|---|
| `000000000000011` | `invoice-numbering.test.ts` |
| `000000000000021` | `declaration-db-integration.test.ts` |
| `000000000000031`/`032` | `client-db-integration.test.ts` |
| `000000000000041`/`042` | `entrepreneur-db-integration.test.ts` |
| `000000000000051`/`052` | `invoice-queries-db-integration.test.ts` |
| `000000000000061`/`062` | `quote-db-integration.test.ts` |
| `000000000000071`-`073` | `accountant-db-integration.test.ts` |
| `000000000000101`/`102` | `e2e/happy-path.spec.ts` |
| `000000000000111` | `e2e/accountant-dashboard.spec.ts` |
| `000000000000201` | `walkthrough-e2e/walkthrough.spec.ts` |
| `000000000000001` (×3, safe — no DB access) | `pdf-templates.test.ts` — pure-function test, never touches the real DB, excluded from this scheme |

**Rule for future test authors**: adding a new DB-touching Vitest file or Playwright spec that creates an `entrepreneurs` row must claim the next unused `0XX`/`1XX`/`2XX` block above and record it in this table — don't reuse a value already listed.

## Handoff
← From all specialists: testability requirements
→ Tester: day-to-day test execution
