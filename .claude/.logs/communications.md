# Communications Log

### 2026-08-13 HANDOFF — DevOps/DevSecOps → Security Engineer → Project Monitor (Sprint 13)
- **Task**: S13-01/S13-02 (preprod compose override + deploy-preprod.yml pipeline)
- **Context**: Built the GHCR-image-based CD pipeline and its owner setup doc per the sprint-13.md design (🟡 balanced: prebuilt image + SSH pull-and-restart, manual trigger only).
- **Need**: Security Engineer to review the new external data flow (SSH + registry push) before the sprint closes, per Framework Rule 5.
- **Constraints**: no changes to `docker-compose.yml`/`Dockerfile`/`Caddyfile`; workflow_dispatch only, no auto-deploy; GHCR auth via existing `GITHUB_TOKEN`, no new registry secret.
---

### 2026-08-13 HANDOFF — Security Engineer → Project Monitor (Sprint 13)
- **Task**: S13-04 (security review of deploy-preprod.yml)
- **Context**: Reviewed SSH-key handling (dedicated tempfile, umask 077, chmod 600, always-cleanup), GHCR image scope (private by default, VPS pulls via owner's own read-scoped PAT), and secret blast radius (bounded to the preprod box, environment-scoped secrets). Found and fixed one real issue: the `ref` workflow_dispatch input was being interpolated directly into a `run:` script body for the remote SSH command — a GitHub Actions command-injection class (CWE-78-adjacent) — before this handoff was logged.
- **Need**: Project Monitor to verify no app-code regression, log the sprint snapshot, and push.
- **Constraints**: fix applied in-place (`ref` now only flows through `actions/checkout`'s `with:` field; remote compose config tracks a fixed `origin/master`, app version pinned by computed `DEPLOY_TAG`) — not left as a flagged-but-unfixed finding, since this pipeline hadn't shipped yet.
---

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

### [2026-08-12] HANDOFF — PM/Security Engineer -> Security Engineer
- Task: S12-01, S12-02, S12-03 (Batch 1 legal drafts)
- Context: Wrote docs/terms-of-service-moqawil.md, docs/privacy-policy-moqawil.md, docs/cndp-registration-checklist-moqawil.md. All drafts, all bracketed placeholders for real operator legal-entity info, all explicitly marked pending lawyer review / not in effect. Self-host vs hosted distinction kept explicit in both legal docs per security-moqawil.md.
- Need: Batch 2 -- pentest scope doc + security posture summary.
- Constraints: None of these are to be linked from the live product or treated as final.
---

### [2026-08-12] HANDOFF -- Security Engineer -> DevOps/DevSecOps
- Task: S12-04, S12-05 (Batch 2 security audit prep)
- Context: Wrote docs/pentest-scope-moqawil.md (grey-box scope brief citing the Sprint 9 + Sprint 11 internal IDOR audits, CI coverage already in place, 5 concrete human-required test areas) and docs/security-posture-summary-moqawil.md (one-pager for prospects/auditors).
- Need: Batch 3 -- deployment runbook (VPS/DNS/Docker/Caddy/backups/monitoring).
- Constraints: Pentest doc explicitly flags production must not be tested with real tenant PII without a staging env + written authorization.
---

### [2026-08-12] HANDOFF -- DevOps/DevSecOps -> Copywriter/DevOps
- Task: S12-06 (Batch 3 deployment runbook)
- Context: Wrote docs/deployment-runbook-moqawil.md end to end (VPS sizing, DNS, provisioning, app deploy, HTTPS, cron backups wired to scripts/backup-db.sh, uptime monitoring via /api/health, post-deploy checklist). Verified against real docker-compose.yml/Caddyfile/.env.example rather than assuming -- found and flagged a real inconsistency: docker-compose.yml drives Caddy via caddy-docker-proxy labels + APP_DOMAIN, but the checked-in static Caddyfile (with its security headers) is not actually wired into that path. Not fixed here (architecture decision, not a runbook typo) -- flagged for owner/DevOps follow-up.
- Need: Batch 4 -- launch/distribution content (blog posts, CHANGELOG check, announcement drafts, outreach list).
- Constraints: Runbook explicitly separates staging (for pentest) from production.
---

### [2026-08-12] HANDOFF -- Copywriter/DevOps -> Tester
- Task: S12-07 (Batch 4 bilingual blog posts)
- Context: Wrote 3 FR articles under moqawil/docs/docs/ (declaration CA 2026, plafond 80K DH, eviter perte statut), each with a matching AR translation in moqawil/docs/i18n/ar/docusaurus-plugin-content-docs/current/, wired into an Articles sidebar category.
- Need: Verify docs site builds for both locales.
- Constraints: FR primary, AR full translation not stub.
---

### [2026-08-12] HANDOFF -- Copywriter/PM -> Tester/Project Monitor
- Task: S12-08, S12-09, S12-10 (rest of Batch 4)
- Context: Wrote moqawil/CHANGELOG.md (version history grounded in .logs/metrics.md, no fabricated version tags). Verified LICENSE (AGPL-3.0, fixed from stale MIT) and packages/tax-engine/LICENSE (Apache-2.0) both correct. Drafted docs/announcement-drafts-moqawil.md (5 channels, all pointed at the self-hosted GitHub repo, not a hosted product, per this sprints sequencing rule). Wrote docs/accountant-outreach-list-moqawil.md -- deliberately a sourcing framework + template rather than fabricated named contacts, since a live web search could not turn up independently verifiable individuals; one real unverified lead flagged.
- Need: Batch 5 -- full verification (typecheck/lint/vitest/playwright), README test-count badge refresh with the authoritative number from this run, sprint snapshot, git push.
- Constraints: None of the 5 announcement drafts get submitted without per-post user confirmation in chat.
---
