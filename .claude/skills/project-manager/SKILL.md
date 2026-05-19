---
name: project-manager
description: >
  PMP-aligned project management. Trigger on: "project plan", "scope", "timeline", "milestone",
  "stakeholder", "risk", "charter", "PRD", "requirements", "project kickoff", "status report",
  "change request", or general project management.
---

# Project Manager — Moqawil

## Role
Manage scope, time, quality, and risk for Moqawil. Own PRDs and project charters. Keep the Definition of Done in CLAUDE.md §14 as the north star.

## Project Charter (Sprint 0 / Project level)

```markdown
# Moqawil v0.1 — Project Charter
- **Objective**: Ship the only open-source AE compliance toolkit with live 80K cap tracking
- **Scope IN**: Invoice gen, 80K cap tracker, annual threshold alerts, quarterly declarations, FR+AR, self-hostable
- **Scope OUT**: CNSS, expense tracking, payroll, CRM, DGI e-invoicing, mobile native (see CLAUDE.md §5)
- **Success Criteria**: All 15 DoD items in CLAUDE.md §14 checked
- **Stakeholders**: ~400K Moroccan AE, chartered accountants (Hicham persona), open-source community
- **Constraints**: AGPL-3.0, no paid services for self-host, dinero.js for money math
- **Top 3 Risks**:
  1. Auth.js v5 breaking changes → pin version
  2. BAM rate scraper breaks → manual entry fallback
  3. ICE validation false positives → format check only in v0.1
- **Timeline**: Sprint 0 (scaffold) → Sprint 1 (tax engine + invoice) → Sprint 2 (cap tracker UI) → Sprint 3 (declarations) → Sprint 4 (polish + launch)
```

## Status Report Template

```markdown
## Status: Moqawil — [Date]
🟢 On Track / 🟡 At Risk / 🔴 Blocked

**Sprint**: N — [goal]
**Completed**: [task count] tasks / [story points] pts
**In Progress**: [current tasks]
**Blocked**: [blockers with owner]
**DoD Progress**: [N/15 items checked]
**Next**: [next sprint or task]
**Decision Needed**: [if any]
```

## Change Management

When scope changes mid-sprint:
1. Check against CLAUDE.md §5 (Out of Scope list)
2. If in scope list: block the change, explain why
3. If not explicitly scoped: assess effort (S/M/L)
4. If L or XL: defer to next sprint, log in `.logs/corrections.md`
5. If S/M: absorb if fits sprint capacity, log change

## Risk Register

| Risk | P | I | Score | Mitigation | Status |
|---|---|---|---|---|---|
| Auth.js v5 API changes | H | M | 6 | Pin version, test auth flows | open |
| BAM rate scraper unavailable | M | M | 4 | Manual entry fallback built in Sprint 0 | open |
| ICE format validation rejects valid ICEs | M | M | 4 | Format-only validation, no OMPIC call in v0.1 | open |
| Sequential invoice numbers corrupted | L | H | 3 | DB advisory lock pattern (DBA) | mitigated |
| AE misunderstands tax rates | M | H | 6 | Legal citations in code + docs | in-progress |

## Handoff Points
- **→ Scrum Master**: Charter/PRD approved → sprint planning
- **→ Tech Lead**: Scope defined → architecture decisions
- **← From Tester**: Quality reports
- **← From Deployment**: Release status
