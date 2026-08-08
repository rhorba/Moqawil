# Corrections & Plan Changes

<!-- Scope changes, pivots, and plan corrections are logged here. -->

### 2026-08-08 10:20 CORRECTION — Foundation docs belong at repo-root docs/, not sprint-backlog
- **Specialist**: Software Architect
- **What was wrong**: Earlier this session (see `.logs/decisions.md`, 09:15), Framework Rule 6 (foundation docs before code) was redirected to embed design notes inside `.claude/sprint-backlog/sprint-N.md`, reasoning that `docs/` at project root was the public Docusaurus site and would collide with internal design docs.
- **Actual state**: The Docusaurus site lives at `moqawil/docs/` (one level down, inside the app monorepo) — confirmed by inspecting github.com/rhorba/tabib-ma's structure, which uses a bare repo-root `docs/` for its PRD/architecture/etc. artifacts with no such collision, prompting a re-check of Moqawil's actual layout. Repo-root `docs/` was empty/unused the whole time.
- **Fix**: Created `docs/prd-sprint4-e-invoicing.md` and `docs/architecture-sprint4-e-invoicing.md` at repo root, matching tabib-ma's naming convention. Updated `.claude/CLAUDE.md` Rule 6 accordingly. Sprint 4's backlog file now points to these two docs instead of embedding the content inline.
- **Status**: resolved

