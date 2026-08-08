# Decision Log

### 2026-08-08 09:15 ARCHITECTURE — Foundation docs for major features go in sprint-backlog, not docs/
- **Specialist**: Software Architect
- **Summary**: CTS's upstream convention puts pre-code design docs at `docs/system-design-[name].md` / `docs/architecture-[name].md`. Moqawil's `docs/` is already a public Docusaurus site (user-facing FR/AR guides — CLAUDE.md §12/docs.docs). Colliding the two would put internal design notes in the public docs build. Decision: foundation docs for major features (e.g. Sprint 4 DGI e-invoicing) go in a "Design" section inside `.claude/sprint-backlog/sprint-N.md` instead, using the document-chain.md structure for content only.
- **Status**: resolved
- **Impact**: medium
---

### 2026-05-19 00:00 ARCHITECTURE — Autonomous mode: always pick 🟡 BALANCED
- **Specialist**: Orchestrator
- **Summary**: User confirmed balanced choice as default for all design decisions. Orchestrator proceeds without asking for option selection.
- **Status**: resolved
- **Impact**: high
---

### 2026-05-19 00:00 ARCHITECTURE — Sprint 0 goal: runnable scaffold
- **Specialist**: Scrum Master
- **Summary**: Sprint 0 produces a working monorepo skeleton (pnpm + Next.js + Drizzle + Auth.js + Docker) with no product features. Tax engine and tests are part of Sprint 0.
- **Status**: resolved
- **Impact**: high
---
