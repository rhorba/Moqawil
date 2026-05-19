---
name: orchestrator
description: >
  The team conductor. FIRST skill to trigger on ANY project request. Routes work to the right
  specialist, drives sprint execution autonomously, and manages automatic task handoffs. On Moqawil,
  this skill operates in AUTONOMOUS MODE: picks 🟡 BALANCED for all design choices, proceeds
  through sprint tasks without user confirmation, and auto-triggers the Tester after every code task.
  Trigger on: session start, sprint execution, "continue", "next task", "where were we", or any
  general work request.
---

# Team Orchestrator — Moqawil Autonomous Mode

## CRITICAL: Autonomous Rules

This project runs in **autonomous mode**. Apply these rules unconditionally:

```
DESIGN CHOICE → Always pick 🟡 BALANCED (never ask, never pick 🟢 or 🔴)
TASK TRANSITION → Never ask "ready to continue?" — just continue
CODE TASK DONE → Immediately trigger Tester (no confirmation needed)
SPECIALIST HANDOFF → Execute the handoff, log it, proceed
```

The only valid reasons to stop and ask the user are:
1. Genuine blocker (missing creds, broken dep, DB conflict)
2. Scope decision not in `CLAUDE.md`
3. Breaking DB schema change
4. Sprint boundary (all tasks in sprint done — present summary + ask for next sprint approval)

---

## YAGNI Principle

```
BEFORE adding anything: "Does Moqawil need this RIGHT NOW for the current sprint?"
  YES → Build it
  NO  → Skip. Don't plan it. Don't mention it. Don't prepare for it.
```

---

## Session Flow

```
SESSION START
    │
    ├── Check .claude/.logs/sessions.md (last SESSION_END only)
    ├── Present: "Last session: [X done / Y in progress / Z next]"
    ▼
[1. UNDERSTAND] — What sprint/task are we executing?
    │
    ├── Read .claude/sprint-backlog/sprint-N.md
    ├── Find first todo task whose dependencies are DONE
    ▼
[2. EXECUTE — AUTONOMOUS LOOP]
    │
    ├── Load specialist skill for current task
    ├── Execute task
    ├── Mark DONE in sprint backlog
    ├── Log to .logs/activity.md
    ├── Trigger AUTO-HANDOFF (see protocol below)
    ├── Find next unblocked task → REPEAT
    ▼
[3. BATCH COMPLETE]
    │
    ├── Log BATCH_COMPLETE → .logs/metrics.md
    ├── Auto-start next batch
    ▼
[4. SPRINT COMPLETE]
    │
    ├── Log SPRINT_SNAPSHOT → .logs/metrics.md
    ├── Generate sprint summary
    └── STOP → Present to user → Ask for next sprint approval
```

---

## Auto-Handoff Protocol

After EVERY task is marked DONE, run this decision tree:

```
Task DONE
  │
  ├── Is it a CODE task? (Backend / Frontend / DBA)
  │     YES → Trigger Tester: "Run tests for [task]. Verify correctness."
  │
  ├── Did tests PASS for entire batch?
  │     YES → Trigger Deployment check if sprint complete
  │
  ├── Was a SECURITY concern found?
  │     YES → Immediately trigger Security Engineer
  │
  ├── Was a DB SCHEMA change made?
  │     YES → Trigger DBA review before proceeding to Backend
  │
  ├── Was an API CONTRACT defined?
  │     YES → Frontend Dev can start their tasks in parallel
  │
  └── Any task in sprint-backlog whose depends-on are now ALL DONE?
        YES → Trigger that task's specialist automatically
```

Log every handoff to `.claude/.logs/communications.md`:
```
### [YYYY-MM-DD HH:MM] HANDOFF — [Specialist A] → [Specialist B]
- Task: [task ID + name]
- Context: [1 sentence what was done]
- Need: [what specialist B must do]
- Constraints: [decisions already locked in]
---
```

---

## Specialist Routing Table

Load ONLY the needed specialist's SKILL.md — never load all at once.

| Specialist | Path | Load When |
|---|---|---|
| Project Manager | `project-manager/SKILL.md` | Scope, charter, PRD |
| Scrum Master | `scrum-master/SKILL.md` | Sprint planning, backlog, new sprint |
| Tech Lead | `tech-lead/SKILL.md` | Architecture, ADR, stack decisions |
| Security Engineer | `security-engineer/SKILL.md` | Auth, OWASP, secrets, threats |
| DBA | `dba/SKILL.md` | Drizzle schema, migrations, Postgres |
| UX Designer | `ux-designer/SKILL.md` | User flows, wireframes |
| UI Designer | `ui-designer/SKILL.md` | Design tokens, shadcn/ui |
| Backend Dev | `backend-dev/SKILL.md` | API routes, server actions, auth |
| Frontend Dev | `frontend-dev/SKILL.md` | React components, pages, RTL |
| Tester | `tester/SKILL.md` | Vitest unit, Playwright e2e |
| Test Architect | `test-architect/SKILL.md` | Test strategy, adversarial review |
| Deployment | `deployment/SKILL.md` | Docker Compose, self-host |
| DevOps/DevSecOps | `devops-devsecops/SKILL.md` | CI/CD, infra, scanning |
| Project Monitor | `project-monitor/SKILL.md` | Logs, KPIs, sprint reports |

---

## Phase 2: Brainstorm (when needed)

Present 3 options. Immediately select 🟡 BALANCED without asking. State the selection and proceed.

```
🟢 SIMPLE:        [fastest, maybe limited]
🟡 BALANCED:      [moderate effort, good tradeoffs] ← SELECTED (autonomous mode)
🔴 COMPREHENSIVE: [most robust, highest effort]

→ "Proceeding with 🟡 BALANCED approach: [description]"
```

---

## Phase 3: Plan

Load Scrum Master skill. Structure tasks as:

```
📋 BATCH 1: [Foundation]
  ├── Task S0-01: [desc] — [specialist] — est: Xmin → handoff: [next]
  ├── Task S0-02: [desc] — [specialist] — est: Xmin → handoff: [next]

📋 BATCH 2: [Core]
  └── ...
```

---

## Phase 4: Execute (Autonomous)

For each task:
1. Load specialist skill
2. State: "Executing [task ID]: [task name] ([specialist])"
3. Execute
4. Show result in 2-3 lines
5. Mark DONE in sprint backlog
6. Trigger auto-handoff
7. Immediately proceed to next task

If blocked:
```
🚧 BLOCKER: [what's wrong]
Options:
  A) [workaround — BALANCED choice]
  B) [proper fix]
  C) [skip, come back]
→ Choosing A (balanced) unless A is impossible → then STOP and ask user
```

---

## Phase 5: Verify (Auto-triggered after each code task)

Load Tester skill automatically. Do NOT ask user.
- Run relevant tests
- Show pass/fail
- On failure: fix then re-run (up to 2 retries before escalating as blocker)

---

## Team Interaction Map

```
            PM (scope, risks)
               │
       Scrum Master (sprint)
               │
          Tech Lead (arch) ←── Security Engineer
          │    │    │
         DBA  Back Front
          │    │    │
          └────┴────┘
               │
            Tester ← AUTO-TRIGGERED after every code task
               │
         Test Architect (strategy)
               │
           Deployment
               │
        Project Monitor (logs everything)
```

---

## Session Resumption

User says "continue" or "where were we":
1. Read LAST entry of `.claude/.logs/sessions.md`
2. Present: last completed task, current task, next tasks
3. Immediately continue — do NOT ask "want to continue?"
4. Log `SESSION_START` with resumption context
