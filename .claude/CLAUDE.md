# Moqawil — Claude Code Team Framework

> Read `../CLAUDE.md` (project root) for full business rules, data model, and tech stack.
> This file governs HOW the AI team works — workflow, roles, autonomy, and sprint execution.

---

## Autonomous Mode (default)

Claude Code operates **autonomously by default** on this project. This means:

- **Design choices**: When 3 options are presented (🟢 Simple / 🟡 Balanced / 🔴 Comprehensive), always pick 🟡 **BALANCED** unless the user explicitly says otherwise.
- **Specialist handoffs**: Proceed automatically after each task — do NOT ask "ready to continue?"
- **Sprint execution**: Work through the sprint backlog top-to-bottom without pausing between tasks.
- **Testing handoffs**: After ANY code task completes, automatically invoke the Tester skill — do NOT wait for user to ask.

### When to STOP and ask the user
Only pause for these four reasons:
1. A genuine **blocker** (missing credentials, missing file, external dependency broken)
2. A **scope question** not covered in `../CLAUDE.md`
3. A **data model change** that breaks existing migrations
4. Reaching a **sprint boundary** (all sprint tasks done — present summary, ask for Sprint N+1 approval)

---

## Framework Rules (synced from Claude Team Skills — non-negotiable)

These are enforced in addition to the four STOP conditions above. In autonomous mode, apply them without asking — log the outcome, don't ask permission to follow them:

1. **System Designer + Software Architect are always loaded for new projects and large features.** Never skip either for a feature that adds a new `packages/*` module or a new external integration (DGI, Barid eSign, new API) — even for a "quick" pass.
2. **80% code coverage required before SHIP.** Before marking a sprint complete, run the coverage report (unit + integration combined). Below 80% → add tests, don't ship. Log the % to `.logs/metrics.md`.
3. **Push at the end of every sprint.** After a sprint's tasks are DONE and tests pass, run `git push origin <branch>`. Log the push to `.logs/activity.md`. No sprint ends without a push.
4. **Collect all new environment variables upfront.** Before starting a sprint that adds an external integration (e.g. DGI clearance API keys, Barid eSign credentials), identify every env var it needs and add placeholders to `.env.example` before EXECUTE starts. Never hardcode values that belong in env vars.
5. **Security check before SHIP.** Any sprint touching auth, an external API, or a new data flow triggers Security Engineer review before the sprint is marked complete — not just the Tester.
6. **Foundation docs for major new features.** Before writing code for a feature big enough to need System Designer + Software Architect (see rule 1), produce a design note in the sprint backlog file itself (`.claude/sprint-backlog/sprint-N.md`, "Design" section, using the structure in `skills/orchestrator/references/document-chain.md`) and commit it before the first line of implementation code. **Note:** `docs/` at project root is the public Docusaurus site (user-facing guides) — foundation/design docs never go there.
7. **Video recording at version completion.** When a sprint ships user-facing changes (not pure infra), record a Playwright video covering the critical flows touched, saved to `.recordings/v[version]-[date].webm` at the repo root — distinct from the per-test debug videos Playwright already captures during normal e2e runs. Log to `.logs/activity.md`.

---

## Sprint System

Sprint backlogs live in `.claude/sprint-backlog/`. Format: `sprint-N.md`.

### Sprint 0 — Scaffold (CURRENT)
Goal: `pnpm install && docker compose up -d && pnpm dev` works. No features, just the runnable skeleton.
File: `.claude/sprint-backlog/sprint-0.md`

### Sprint 1 — Tax Engine + Invoice Core
Goal: `packages/tax-engine` fully tested + invoice creation with PDF works end-to-end.
File: `.claude/sprint-backlog/sprint-1.md` (created after Sprint 0 ships)

---

## Auto-Handoff Protocol

This is the core rule that makes the team work without interruption.

```
TASK DONE → CHECK sprint backlog → FIND newly unblocked tasks → TRIGGER next specialist
```

### Automatic handoff rules (always apply, no confirmation needed)

| When | Auto-trigger |
|---|---|
| Backend/Frontend/DBA task DONE | → Tester: write & run tests for that task |
| Tests PASS for a sprint | → Deployment: verify docker-compose works |
| Security concern detected in code | → Security Engineer: immediate review |
| DB schema change planned | → DBA: review before Backend proceeds |
| API contract defined | → Frontend Dev: can start in parallel |
| Sprint all-green | → Project Monitor: generate sprint snapshot |

### Handoff note format (log to `.claude/.logs/communications.md`)
```
HANDOFF: [From Specialist] → [To Specialist]
Task: [which task]
Context: [1 sentence — what was done]
Need: [what the next specialist must do]
Constraints: [decisions already made]
```

---

## Specialist Skills

| Specialist | Load from | Trigger |
|---|---|---|
| Orchestrator | `skills/orchestrator/SKILL.md` | Session start, routing |
| Project Manager | `skills/project-manager/SKILL.md` | Scope, charter, PRD |
| Scrum Master | `skills/scrum-master/SKILL.md` | Sprint planning, backlog |
| System Designer | `skills/system-designer/SKILL.md` | Integration topology, NFRs, before any new external system |
| Software Architect | `skills/software-architect/SKILL.md` | Module boundaries, adapter design, new `packages/*` |
| Tech Lead | `skills/tech-lead/SKILL.md` | Architecture, ADRs |
| DBA | `skills/dba/SKILL.md` | Schema, migrations, Drizzle |
| Backend Dev | `skills/backend-dev/SKILL.md` | Next.js API routes, server actions |
| Frontend Dev | `skills/frontend-dev/SKILL.md` | React components, pages |
| Tester | `skills/tester/SKILL.md` | Vitest, Playwright tests |
| Test Architect | `skills/test-architect/SKILL.md` | Test strategy, adversarial |
| Security Engineer | `skills/security-engineer/SKILL.md` | Auth, OWASP, secrets |
| DevOps/DevSecOps | `skills/devops-devsecops/SKILL.md` | Docker, CI/CD, infra |
| Deployment | `skills/deployment/SKILL.md` | Docker Compose, self-host |
| UX Designer | `skills/ux-designer/SKILL.md` | User flows, wireframes |
| UI Designer | `skills/ui-designer/SKILL.md` | Design tokens, shadcn |
| Project Monitor | `skills/project-monitor/SKILL.md` | Logs, KPIs, reports |

---

## Log Files

All logs in `.claude/.logs/` — append-only markdown.

- `activity.md` — completed tasks, milestones
- `decisions.md` — architecture decisions (ADRs)
- `issues.md` — bugs, blockers
- `risks.md` — identified risks + mitigations
- `corrections.md` — scope changes, plan pivots
- `communications.md` — handoffs between specialists
- `sessions.md` — session start/end snapshots
- `metrics.md` — sprint KPI snapshots

---

## Moqawil-Specific Rules (supplement to root CLAUDE.md)

1. **Tax-engine is Apache-2.0** — zero I/O, pure functions only. No imports from app code.
2. **80K cap badge** must appear in every client-facing component. Never omit it.
3. **Invoice numbers are sacred** — sequential, no gaps, configurable prefix. Use DB transaction + advisory lock.
4. **dinero.js for all MAD arithmetic** — never use floating-point math for money.
5. **date-fns with fr-MA locale** for all date formatting.
6. **TVA mention**: Always "TVA non applicable" — never cite French CGI Article 293B.
7. **BAM exchange rate**: Cache daily, fallback to manual entry if scrape fails. Never silently drop.
8. **RTL support**: Every component must work in both `dir="ltr"` and `dir="rtl"`.
