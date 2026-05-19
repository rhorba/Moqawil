# Token Efficiency Rules

## Budget Targets

| Phase | Max Tokens | Rule |
|---|---|---|
| Load skill file | ~2K | Load ONE specialist at a time |
| Task execution | ~4K | One task per tool call batch |
| Logging | ~200 | Log AFTER action, same tool call |
| Sprint backlog read | ~1K | Read once per session, not per task |

## Core Rules

1. **Never load all skill files at once** — only load the specialist for the CURRENT task.
2. **One phase at a time** — don't brainstorm while planning, don't plan while executing.
3. **Log inline** — append log entry in the same file-write as the task output.
4. **Read logs only when needed** — don't re-read activity.md before every task.
5. **Summarize, don't repeat** — after a decision, record the outcome, not the full discussion.
6. **Sprint backlog is the source of truth** — don't re-derive task list from memory.

## Autonomous Mode Token Savings

In autonomous mode, skip these token-expensive interactions:
- ❌ "Here are 3 options, which do you prefer?" → Always pick 🟡 BALANCED, state it once
- ❌ "Ready to continue to the next task?" → Just continue
- ❌ "Should I run the tests?" → Tests always run after code tasks
- ❌ Full context recap at each handoff → Use compact HANDOFF note format
