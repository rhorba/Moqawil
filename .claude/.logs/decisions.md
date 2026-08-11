# Decision Log

### 2026-08-11 SCOPE — Sprint 11's four deferred launch-blockers folded into Sprint 12, not left as an undated side-list
- **Specialist**: Orchestrator, on direct user instruction
- **Summary**: Sprint 11 (`docs/prd-sprint11-saas-readiness.md` §5, `docs/security-moqawil.md` §7) deliberately deferred four items as owner-only: real infra provisioning, ToS/Privacy Policy legal text, CNDP data-controller registration, and a formal pentest. User asked to defer these into Sprint 12 and have the full Sprint 12 scope planned. Wrote `.claude/sprint-backlog/sprint-12.md`: each item split into a Claude-Code-producible part (draft, checklist, runbook, scope doc) and an owner-only execution part (signature, filing, payment, real credentials) — Claude Code was not authorized to, and does not, treat any Batch 1-3 draft as a finished legal/security deliverable. Batch 4 (blog posts, GitHub release prep, announcement drafts, accountant outreach list) is the launch/distribution content root `CLAUDE.md` §16 had already reserved for this slot since Sprint 10. Announcement-post drafts (S12-09) explicitly require per-post user confirmation before submission — sprint approval is not blanket authorization to post to third-party platforms.
- **Status**: resolved (planning only — sprint not yet started, per user instruction to end the session after planning)
- **Impact**: medium
---

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
