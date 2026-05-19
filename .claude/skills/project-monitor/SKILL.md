---
name: project-monitor
description: >
  Project monitoring and logging. AUTO-TRIGGERED at: task completion, sprint end, session start/end,
  milestones. Also trigger on: "status", "what did we do", "show metrics", "KPIs", "retro",
  "sprint report", "what's changed", or any monitoring request.
---

# Project Monitor — Moqawil

## Role
The project's memory. Log everything. Generate sprint reports. Support session resumption.

## Log Files (`.claude/.logs/`)

All append-only markdown files:

| File | Contents |
|---|---|
| `activity.md` | Completed tasks, milestones |
| `decisions.md` | Architecture decisions, tax rule changes (with legal citations) |
| `issues.md` | Bugs, blockers (with status) |
| `risks.md` | Risks identified + mitigations |
| `corrections.md` | Scope changes, plan pivots |
| `communications.md` | Handoffs between specialists |
| `sessions.md` | Session start/end snapshots |
| `metrics.md` | Sprint KPI snapshots |

## Log Entry Format

```markdown
### [YYYY-MM-DD HH:MM] [CATEGORY] — [Short Title]
- **Specialist**: [who]
- **Summary**: [1-2 sentences max]
- **Status**: open | in-progress | resolved
- **Impact**: low | medium | high | critical
---
```

## AUTO-TRIGGER Events

| Event | Log File | Entry Type |
|---|---|---|
| Task DONE | `activity.md` | COMPLETED |
| Batch DONE | `activity.md` | MILESTONE |
| Sprint DONE | `metrics.md` | SPRINT_SNAPSHOT |
| Tax rule change | `decisions.md` | TAX_RULE (include legal citation) |
| Bug found | `issues.md` | BUG |
| Blocker hit | `issues.md` | BLOCKER |
| Handoff | `communications.md` | HANDOFF |
| Session start | `sessions.md` | SESSION_START |
| Session end | `sessions.md` | SESSION_END |

## Sprint Snapshot (generate at sprint end)

```markdown
### [date] SPRINT_SNAPSHOT — Sprint N
- **Planned**: [N tasks]
- **Completed**: [N tasks]
- **Blocked**: [N tasks]
- **Dropped**: [N tasks]
- **Velocity**: [pts/sprint]
- **Tests**: [unit pass rate] / [E2E pass rate]
- **DoD items checked**: [N/15]
- **Top bugs**: [list]
- **Open risks**: [count]
---
```

## Session Resumption Protocol

At session start, read ONLY the last `SESSION_END` entry from `sessions.md`:

```
📋 Last session ([date]):
  ✅ Completed: [task names]
  🔄 In progress: [task name — batch N, step X]
  🚧 Blocked: [blocker or "none"]
  → Next: [task ID from sprint backlog]

Continuing from here...
```

## Retrospective Template (on demand)

```markdown
## Retro — Sprint N

### ✅ Went Well
[from fast completions, auto-handoffs that worked, tests that caught bugs early]

### ❌ Didn't Go Well
[from blockers, rework, missed estimates, adversarial findings in production]

### 💡 Improvements for Sprint N+1
[concrete changes: better batching, earlier security review, etc.]

### Metrics
| KPI | This Sprint | Last Sprint |
|---|---|---|
| Velocity | | |
| Completion rate | | |
| Bug rate | | |
| Scope creep | | |
```

## Handoff Points
- **← From ALL specialists**: Receives log entries
- **→ PM**: Provides metrics for status reports
- **→ Scrum Master**: Velocity for next sprint planning
- **→ User**: Status reports, retros on demand
