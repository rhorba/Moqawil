# Communications Log

### 2026-08-10 DECISION — Owner approved Sprint 6 scope: devis (quote) management, a v0.2 feature
- **Specialist**: Orchestrator
- **Summary**: CLAUDE.md §5 lists "Customer portal / quote (devis) management" as out-of-scope for v0.1, deferred to v0.2 — §17 requires asking before building anything on that list. Presented 3 candidate Sprint 6 directions (devis management, accountant multi-client dashboard, launch-prep/distribution content); owner chose devis management.
- **Status**: resolved — proceeding to scope and execute Sprint 6
- **Impact**: high
---

### 2026-05-19 00:00 PREFERENCE — Autonomous mode confirmed
- **Specialist**: Orchestrator
- **Summary**: User wants Claude Code to operate autonomously: pick 🟡 BALANCED automatically, execute sprint without pausing, auto-handoff to Tester after code tasks. Stop only at sprint boundaries.
- **Status**: resolved
- **Impact**: high
---

### [2026-08-10 19:00] HANDOFF — DBA → Backend Dev
- Task: S9-01 (accountant_links schema + migration)
- Context: Added `accountantLinkStatusEnum` + `accountantLinks` table + relations to packages/db/src/schema.ts per docs/architecture-accountant-dashboard.md §1; generated migration 0003_stiff_emma_frost.sql and applied it against local dev Postgres (Docker Desktop needed a force-restart after a stuck first startup — resolved, not a code blocker). Verified table/indexes/FKs match spec via psql \d.
- Need: Build invite-token util (S9-02) and accountant.ts authorization queries (S9-03) against this schema.
- Constraints: accountantUserId is nullable text (matches users.id type), unique(entrepreneurId, invitedEmail) not (entrepreneurId, accountantUserId) since the latter is null pre-acceptance.
---

### [2026-08-10 19:25] HANDOFF — Backend Dev → Tester
- Task: S9-02 through S9-05 (invite-token util, accountant.ts authorization queries, invite/revoke actions, accept flow)
- Context: All backend pieces built per docs/architecture-accountant-dashboard.md. Necessary groundwork also touched: middleware.ts (added /accountant to isAppRoute + callbackUrl preservation), (app)/layout.tsx (onboarding redirect now exempts /accountant since accountants may have no AE profile), sign-in/page.tsx (honors callbackUrl so an invite link survives a not-yet-signed-in accountant's login detour).
- Need: Tests written and passing (9/9 in accountant-db-integration.test.ts, isolated run). Full-suite local run showed pre-existing flakiness from real manual-testing data in the shared dev DB colliding with unrelated test files' fixture ICE values (documented, not touched, not a Sprint 9 regression) — CI's fresh-DB run is the real signal.
- Constraints: accept flow does NOT reuse Auth.js verificationTokens (architecture doc §4); race-safety via conditional UPDATE (id + status='pending'), verified by concurrent-submission test.
---

### [2026-08-10 20:10] HANDOFF — Security Engineer → Tester
- Task: S9-12 through S9-15 (mandatory pre-SHIP security review, Framework Rule 5)
- Context: Audited all Sprint 9 accountant-dashboard files (schema, queries, actions, routes, middleware, layout guards). Full findings logged to .logs/issues.md and .logs/risks.md.
- Findings: IDOR (CONFIRMED OK), invite-token entropy/single-use/race-safety/expiry (CONFIRMED OK), revocation latency (CONFIRMED OK, JWT never carries link status, verified live), invite-spam/enumeration (ACCEPTED RISK, reasoning logged). Two low-severity issues found and FIXED during review: accept/page.tsx email-mismatch check now fails closed on missing session email; entrepreneur SELECTs narrowed (queries/accountant.ts, accountant/[entrepreneurId]/page.tsx) to avoid over-fetching bankIban/ICE/IF/address/phone into Server Component data.
- Need: Full verification pass (S9-16) — build, coverage gate, full Playwright suite with --workers=1.
- Constraints: All fixes re-verified — typecheck clean, accountant-db-integration.test.ts 9/9 passing, accountant-dashboard.spec.ts e2e passing.
---
