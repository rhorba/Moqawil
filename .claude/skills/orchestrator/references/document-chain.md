# Document-First Artifact Chain

For medium-to-large features (3+ days) and new sprints, follow: PRD → Architecture → Stories → Code

**YAGNI**: Skip for small tasks. Use for Sprint planning and new epics.

---

## Artifact 1: PRD — `docs/prd-[feature].md`
**Owner**: Project Manager | **Approve before**: Architecture

```markdown
# PRD: [Feature]
**Status**: Draft / Approved | **Date**: [date]

## 1. Problem Statement
[What Moroccan AE pain point are we solving? 2-3 sentences.]

## 2. Goals
| Goal | Metric | Target |
|---|---|---|

## 3. User Stories (As a Karim/Salma/Hicham...)

## 4. Scope
### In: [features]  |  ### Out: [explicitly excluded]

## 5. Requirements
- FR-N: [functional requirement — must be testable]
- NFR-N: [performance / security / a11y]

## 6. Moqawil Business Rules
[Which of CLAUDE.md §3 rules apply to this feature?]

## 7. Risks
| Risk | P | I | Mitigation |
|---|---|---|---|
```

---

## Artifact 2: Architecture — `docs/architecture-[feature].md`
**Owner**: Tech Lead + DBA + Security | **Depends on**: Approved PRD

```markdown
# Architecture: [Feature]
**PRD**: docs/prd-[feature].md

## ADR-N: [Decision]
- Context / Decision / Alternatives / Consequences

## System Design
[Client] → [Next.js API Route / Server Action] → [Drizzle + Postgres]
                                                         ↓
                                                  [dinero.js + tax-engine]

## Data Model Delta
[What tables/columns change? Does it break existing Drizzle schema?]

## Security Considerations
[Auth.js session scope, RLS, input validation, OWASP concerns]
```

---

## Artifact 3: Stories — `docs/stories-[feature].md`
**Owner**: Scrum Master + Test Architect | **Depends on**: Approved Architecture

Each story gets:
- ATDD acceptance criteria (Gherkin)
- Assigned specialist
- Sprint allocation
- Handoff-to field

---

## Traceability
```
PRD Requirement → Architecture ADR → Story → Acceptance Test → Code → Tester passes
```

Nothing is built without a PRD requirement. Nothing is untested.
