# Decision Log

### 2026-08-12 SCOPE — Owner's business-structure + hosting-provider plan for the managed cloud tier (not v0.1, informational discussion — no code/infra changed)
- **Specialist**: Orchestrator, on direct user instruction (advisory conversation, logged for later reference)
- **Summary**: Owner asked how Moqawil's future managed cloud tier (CLAUDE.md §1 "Optional managed cloud tier post-launch") should be structured legally and where to host it. Discussed and the owner settled on a phased plan:
  - **Legal entity**: start as Auto-Entrepreneur (the owner themself, using Moqawil's own regime) rather than a US LLC. A foreign-owned US LLC was considered and rejected as the *starting* structure — it adds Office des Changes exposure (Moroccan-resident ownership of a foreign entity needs declaration/authorization), mandatory IRS Form 5472 filing even at zero activity (min penalty $25k for a miss), and does not remove Moroccan worldwide-income tax residency, so it would add a second compliance surface without removing the first. Plan is to scale later to a **SARL Maroc** (direct fit with Moroccan law, eligible for services-export IS incentives) or a **hybrid** (SARL as the operating entity + a US LLC/Stripe Atlas used only as a payment pass-through for USD/EUR billing, funds repatriated to the SARL as service-export revenue) once AE's 200,000 MAD/year or 80,000 MAD/client caps are close to binding.
  - **CNDP**: hosting on AWS's EU region (or an EU-based alternative) is a cross-border personal-data transfer under Loi 09-08, which needs a **déclaration normale** (processing) *and* a separate **demande d'autorisation** (transfer abroad — a real CNDP-council approval, not a fast notification, can take weeks-to-months) — not just one filing. This obligation attaches to the owner as *responsable de traitement* only once the **managed cloud tier actually launches and starts processing real customer data**; self-hosters remain their own responsable de traitement and are unaffected. Not a v0.1 blocker (v0.1 is self-host only per the Definition of Done) — the CNDP filing should start ~1-2 months before the managed tier's public launch, not on launch day, given the authorization step's timeline. Retention duration to declare: 10 years, matching CGI Article 211's existing invoice-retention rule.
  - **Hosting cost**: for this workload (single Docker Compose monolith — Next.js + Postgres + Caddy), a hyperscaler (AWS/GCP/Azure) is not actually the cheapest fit. Of the three, GCP was assessed as cheapest for sustained small-VM workloads (automatic sustained-use discounts, real always-free e2-micro tier); AWS's egress pricing is the most expensive of the three. But boutique EU VPS providers (Hetzner, Scaleway, OVHcloud) were flagged as ~10x cheaper than any hyperscaler for this exact workload while still qualifying as EU-based for CNDP transfer-adequacy purposes, and align with CLAUDE.md §4 Feature 6's "no paid third-party services required" self-host ethos. No hosting decision was finalized in this conversation — flagged for a real System Designer pass (Framework Rule 1) when the managed-cloud-tier sprint is actually scoped.
- **Status**: informational / not yet actioned — no sprint scoped, no infra provisioned, no CNDP filing started. Revisit with System Designer + Software Architect (Framework Rule 1) before the managed cloud tier sprint begins.
- **Impact**: medium — shapes a future sprint's legal/infra scope, but v0.1 (self-host only) is unaffected.
---

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
