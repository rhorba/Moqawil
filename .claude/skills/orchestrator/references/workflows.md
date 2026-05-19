# Workflow Templates — Moqawil

Quick-start paths for common scenarios. In autonomous mode, select 🟡 BALANCED and proceed.

---

## 🚀 Sprint Execution (most common)

```
1. READ sprint-backlog/sprint-N.md
2. FIND first todo task with satisfied dependencies
3. LOAD specialist skill
4. EXECUTE task
5. MARK done in sprint backlog
6. LOG to .logs/activity.md
7. AUTO-HANDOFF (see orchestrator/SKILL.md protocol)
8. GOTO 2 until sprint done
9. STOP → present sprint summary → ask for next sprint
```

---

## ✨ New Feature Workflow (within sprint)

```
SCOPE (PM — 5 min)
  → What AE pain point? Min viable version? In CLAUDE.md scope?

UX FLOW (UX Designer — 10 min, skip for pure backend)
  → Flow for Karim/Salma
  → Mobile-first, FR primary, AR RTL

TECHNICAL DESIGN (Tech Lead — 10 min)
  → 🟡 BALANCED approach auto-selected
  → API route or server action?
  → DBA: schema delta if new data

PLAN (Scrum Master — 5 min)
  → Batch 1: DB + API  |  Batch 2: UI  |  Batch 3: Tests

EXECUTE → batch by batch, auto-handoff to Tester after each code batch

VERIFY → Tester runs tests, Security Engineer reviews if auth/data touched

SHIP (Sprint complete) → Docker Compose verify
```

---

## 🐛 Bug Fix

```
1. LOCATE: find file:line
2. OPTIONS: 🟡 proper root-cause fix (auto-selected)
3. FIX: apply, show diff
4. TEST: write regression test + run suite
5. LOG: → .logs/issues.md (resolved)
```

---

## 🗄️ Database Change (Drizzle)

```
1. DBA: schema.ts change
2. DBA: drizzle-kit generate migration
3. DBA: verify migration file
4. Backend Dev: update query helpers
5. Tester: run integration test with real Postgres (docker compose up -d)
```

---

## 🔐 Auth / Security Work

```
1. Security Engineer: threat model (STRIDE on affected surface)
2. Tech Lead: architecture decision
3. Backend Dev: implement
4. Tester: auth abuse test cases
5. Test Architect: adversarial review
6. Security Engineer: sign off
```

---

## 📄 Tax Engine Change

Tax-engine changes REQUIRE:
- Citation of law/article in code comment (CGI / Finance Law / DGI circular)
- 100% test coverage for changed functions
- Log to .logs/decisions.md with legal citation

```
1. Tech Lead: identify which constant/function changes
2. Tech Lead: update packages/tax-engine (with legal citation comment)
3. Tester: update/add unit tests — 100% coverage for changed exports
4. Test Architect: adversarial edge cases (negative amounts, boundary values)
5. Log: ARCHITECTURE entry in .logs/decisions.md citing the law
```

---

## 🖨️ PDF Template Work

```
1. Tech Lead: define template spec (fields from CLAUDE.md §3 mandatory mentions)
2. Frontend Dev: React-PDF template (server-side)
3. Tester: generate sample PDF, verify all mandatory fields present
4. Manual: human review for bilingual FR+AR layout
```

---

## 📢 Launch / Marketing (post-v0.1)

```
1. PM: strategy + channels (CLAUDE.md §16)
2. Copywriter: FR primary copy
3. Content Marketer: SEO articles (3 target topics in CLAUDE.md §16)
4. Frontend Dev: landing page
5. Digital Marketer: SEO + analytics setup
```
