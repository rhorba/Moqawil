# Activity Log

### 2026-08-08 10:45 BUGFIX — CI's first real run caught a pre-existing migration bug
- **Specialist**: DBA
- **Summary**: `.gitignore` had `packages/db/drizzle/meta/` excluded under a comment claiming it was just "generated snapshots" — it also excluded `_journal.json`, which `drizzle-kit migrate` requires to know what migrations exist and in what order. Every prior `db:migrate` on this project "worked" only because whoever ran it locally still had a stale local `meta/` folder on disk; a genuinely fresh checkout (exactly what CI's `test`/`e2e` jobs are) had none and failed immediately. Regenerated `meta/_journal.json` + `meta/0000_snapshot.json` via `drizzle-kit generate`, renamed the new migration tag back to the original filename (`0000_glossy_lady_ursula`, content byte-identical — confirmed no schema drift) so history stays consistent, deleted the gitignore rule.
- **Status**: resolved
- **Impact**: high — this would have broken every fresh self-host install (`docker compose up -d` → migrate), not just CI
---

### 2026-08-08 10:35 MILESTONE — Adopted tabib-ma's CI/docs patterns after owner review
- **Specialist**: DevOps/DevSecOps + Software Architect
- **Summary**: Owner asked to compare against github.com/rhorba/tabib-ma (a more mature sibling project on the same CTS framework) and match its patterns. Findings applied: (1) added a dedicated `security` CI job — Semgrep SAST (OWASP Top Ten + security-audit rulesets), Trivy SCA (dependency CVE scan against the now-fixed `pnpm-lock.yaml`), Gitleaks secrets scan — this is what actually implements Framework Rule 5, which previously existed only as an unenforced checklist line; (2) corrected a same-session mistake: foundation docs (PRD/Architecture, Framework Rule 6) were redirected into `.claude/sprint-backlog/` earlier under the wrong assumption that repo-root `docs/` collided with the Docusaurus site — it doesn't, the Docusaurus site is at `moqawil/docs/` one level down. Created real `docs/prd-sprint4-e-invoicing.md` and `docs/architecture-sprint4-e-invoicing.md` at repo root matching tabib-ma's exact convention, corrected Rule 6, logged the correction in `.logs/corrections.md`. Confirmed already-matching: `.recordings/v[version]-[date].webm` convention (Framework Rule 7, added earlier this session), full 21-skill set (diff against tabib-ma's `.claude/.skills` came back empty). Deliberately NOT adopted: tabib-ma's `.claude/.skills` (leading-dot) and repo-root `.logs/` path conventions — Moqawil's existing `.claude/skills/` and `.claude/.logs/` are confirmed working (auto-discovered by the harness) with real history; renaming risked breaking that for a cosmetic match. Also not adopted: `load-tests/` (k6) — contradicts this project's own System Designer NFRs (single-tenant self-host, not internet-scale).
- **Status**: resolved
- **Impact**: high
---

### 2026-08-08 10:05 MILESTONE — Sprint 3.5 (infra hardening) executed
- **Specialist**: DevOps/DevSecOps + Test Architect + Frontend Dev
- **Summary**: Owner flagged missing docs deploy, CI/CD, and honest test coverage after reviewing the CTS sync. Closed: (1) added missed Framework Rule 7 — video recording at version completion; (2) moved Playwright video output out of the public `docs/` folder into gitignored `.recordings/e2e-debug/`; (3) fixed `vitest.config.ts` coverage `include` — was scoped to a single file (`threshold-alerts.ts` only), making the 80% gate meaningless; broadened to also include `queries/declaration.ts` (actually unit-tested) and documented the real gap (DB-dependent query files have no unit tests yet) instead of hiding it; (4) added `typecheck` script to root + all 5 workspace packages — none existed; (5) `.github/workflows/ci.yml` — lint, typecheck, unit test, build, e2e, modeled on Kasb's existing CI for consistency; (6) `.github/workflows/docs-deploy.yml` — GitHub Pages deploy for the Docusaurus site, which had zero deploy path since Sprint 3; (7) fixed `docusaurus.config.ts` baseUrl — was hardcoded to an unowned custom domain (`docs.moqawil.ma`), switched to the real default GH Pages project-site path with a comment on how to switch back once the domain exists.
- **Status**: resolved
- **Impact**: high
---

### 2026-08-08 09:40 PLANNING — Sprint 4 backlog drafted (e-invoicing format readiness)
- **Specialist**: Scrum Master + System Designer + Software Architect
- **Summary**: Drafted `.claude/sprint-backlog/sprint-4.md` — UBL 2.1 XML export from existing invoice data + `ClearanceProvider` adapter (NoOp default), explicitly excludes real DGI/xHub submission and Barid eSign signing (both blocked on external access not yet confirmed available). Includes Design section (PRD-lite, ADR-1 on UBL-over-CII, system design, data model delta, security considerations) per Framework Rule 6, since this sprint adds a new external-system boundary. `git push origin *` added to settings.json allow-list per owner approval, enabling Framework Rule 3 (push at sprint close).
- **Status**: resolved (drafted, not started)
- **Impact**: high
- **Open item**: Sprint 3's last task (S3-08, DoD final check) is still `in-progress` per `.claude/sprint-backlog/sprint-3.md` — Sprint 4 code doesn't depend on it, but v0.1 shouldn't be tagged until it closes. Also found a stale duplicate sprint-backlog under `moqawil/.claude/sprint-backlog/` showing false "COMPLETE" status for sprints 2-3 — needs owner decision on whether to delete or was intentionally kept.
---

### 2026-08-08 09:15 MILESTONE — Synced .claude/skills with Claude Team Skills (CTS) upstream
- **Specialist**: Orchestrator
- **Summary**: Diffed local skill set against github.com/rhorba/CTS. Found: 2 missing specialists (System Designer, Software Architect — both mandatory per framework rule 1, never loaded here before), missing `references/` deep-dive docs on all 19 existing skills, and 6 framework rules added upstream since this project's skills were scaffolded (80% coverage gate, push-per-sprint, upfront env-var collection, security-check-before-ship, foundation-docs-for-major-features, mandatory System Designer + Software Architect loading). Added both skills with Moqawil-specific bodies (monorepo boundaries, tax-engine purity rule, adapter pattern for DGI clearance/BAM), copied references/ for all skills, updated orchestrator routing table + auto-handoff tree, added the 6 rules to this file (§ Framework Rules).
- **Status**: resolved
- **Impact**: high
- **Open item**: `settings.json` allow-list has no `git push` permission, but the new push-per-sprint rule requires it — needs explicit owner decision before automating (push is a shared-state action).
---

### 2026-05-19 23:15 MILESTONE — Sprint 2 complete
- **Specialist**: Orchestrator + Frontend Dev + DevOps + Tester
- **Summary**: Sprint 2 all 11 tasks done. RTL audit fixed 6 files; build unblocked on Windows via conditional standalone; 111 tests passing.
- **Status**: resolved
- **Impact**: high
---

### 2026-05-19 00:00 MILESTONE — .claude framework created
- **Specialist**: Orchestrator
- **Summary**: Built complete .claude folder: settings.json, CLAUDE.md, 14 skill files, sprint-0.md backlog, log system. Auto-handoff protocol enabled. Sprint 0 ready to execute.
- **Status**: resolved
- **Impact**: high
---
