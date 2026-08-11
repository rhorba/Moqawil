# Sprint 12 — Launch Readiness & Distribution

**Goal**: Everything that must exist before Moqawil is publicly announced as a hosted product, in one sprint: the launch/distribution content reserved for this slot since Sprint 10 (root `CLAUDE.md` §16), plus the four launch-blocker items Sprint 11 deliberately deferred as owner-only (`docs/prd-sprint11-saas-readiness.md` §5, `docs/security-moqawil.md` §7). User instruction (2026-08-11): fold the blockers into this sprint's scope rather than leaving them as an undated side-list.

**Depends on**: Sprint 11 complete ✅ (commit `def5627`)
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: PLANNED (not started — this session only plans it, per explicit user instruction to end the session after planning)

---

## Design

No new `packages/*` module, no new external system integration in the technical sense — Framework Rules 1/6 (System Designer + Software Architect, foundation-docs-before-code) don't apply; this sprint is legal/content/ops deliverables, not application code. No PRD/architecture pair written for it; this backlog is the plan.

**The four deferred items are not uniformly "engineering tasks."** Each splits into a part Claude Code can produce and a part only the owner can execute (signature, payment, real identity, an account on a third-party platform). Every batch below marks this split explicitly. Nothing in Batches 1-3 should be treated as legally reliable or "done" merely because a draft exists — see each batch's caveat.

**Sequencing note**: Batches 1-3 (legal, security, infra) gate *publicizing* a hosted instance. Batch 4 (content) can be drafted in parallel but its actual publishing/posting steps are gated on 1-3 landing — do not post to Show HN/Reddit/LinkedIn advertising a hosted product whose ToS/Privacy Policy/pentest aren't real yet. Self-hosters are unaffected by any of this (root `CLAUDE.md` mission — AGPL-3.0, self-hostable — self-host has no CNDP-controller or pentest gate; only the Moqawil-*operated* hosted instance does, per `docs/security-moqawil.md` §1).

---

## Sprint Backlog

### BATCH 1 — Legal drafts (CNDP data-controller posture, from Sprint 11 §7/§8)
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S12-01 | Draft Terms of Service (FR primary + EN) — hosted-instance-specific: AGPL notice distinguishing self-host vs. hosted, service description, liability limits, account termination, AE data-processing terms | PM + Legal-adjacent drafting | M | USER (legal review) |
| S12-02 | Draft Privacy Policy (FR + EN) — CNDP-oriented: what's collected (ICE/IF/invoices/client PII per the data model in root `CLAUDE.md` §8), 10-year retention (CGI Art. 211), rights of access/rectification/erasure, no third-party sharing beyond the BAM rate scrape (which touches no personal data), breach-notification posture | PM + Legal-adjacent drafting | M | USER (legal review) |
| S12-03 | CNDP data-controller registration checklist — what the filing requires (legal entity identity, processing purpose, security-measures summary, data-retention schedule), assembled as a document the owner can hand to counsel or file directly | Security Engineer | S | USER (files it) |

**Caveat, load-bearing**: S12-01/S12-02 are drafts for a licensed lawyer to review, not finished legal documents — Claude Code is not authorized to represent them as legally sufficient. S12-03 is a checklist, not the filing itself; CNDP registration requires the owner's real legal-entity details and an actual submission Claude cannot make.

### BATCH 2 — Security audit preparation (from Sprint 11 §7, "now a launch blocker")
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S12-04 | Write a pentest/security-audit scope document for an external vendor: attack surface summary, what's already covered by CI (Semgrep SAST, Trivy SCA, Gitleaks) vs. what needs a human (auth flows, cross-tenant IDOR under the hosted multi-tenant model, rate-limiter bypass, session handling), links to the two prior IDOR audits (`.logs/issues.md`, Sprint 9 + Sprint 11) | Security Engineer | M | USER (commissions the vendor) |
| S12-05 | One-page security-posture summary suitable for handing to an auditor or a security-conscious prospective hosted customer | Security Engineer | S | USER |

**Caveat**: Claude Code can scope and prepare for a pentest; it cannot perform an independent third-party audit of itself, and cannot hire/pay a vendor. S12-04's output is the brief the owner sends to whichever firm they choose.

### BATCH 3 — Infrastructure provisioning runbook (from Sprint 11 §5, "no infra credentials held by this work")
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S12-06 | Step-by-step deployment runbook: VPS sizing guidance (consistent with the existing single-VPS/no-horizontal-scaling NFR, `docs/system-design-moqawil.md` §4), DNS record setup, `docker compose up -d` on a fresh Ubuntu VPS (verify README's existing version of this is still accurate), Caddy HTTPS specifics for a real domain, wiring `scripts/backup-db.sh` to cron with off-site upload, pointing an external uptime monitor (e.g. UptimeRobot) at `GET /api/health` | DevOps/DevSecOps | M | USER (executes it) |

**Caveat**: Claude Code holds no VPS/DNS/domain-registrar credentials (same blocked-on-owner pattern as DGI/xHub sandbox access in Sprint 4 and the infra items in Sprint 11). This batch produces the instructions; the owner runs them.

### BATCH 4 — Launch & distribution content (root `CLAUDE.md` §16, reserved for this slot since Sprint 10)
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S12-07 | 3 bilingual (FR primary + AR) SEO blog posts for the `moqawil/docs/` Docusaurus site: "Comment déclarer son CA d'auto-entrepreneur en 2026", "Le plafond de 80 000 DH par client expliqué", "Auto-entrepreneur Maroc : éviter la perte du statut" | Copywriter + Frontend Dev (docs site) | M | Tester (link/build check) |
| S12-08 | GitHub public-release prep: CHANGELOG, verify README version/feature-list is current (Sprint 10 already refreshed once — recheck after Sprint 11's SaaS-readiness additions), confirm `LICENSE` (AGPL-3.0 root) and `packages/tax-engine/LICENSE` (Apache-2.0) are both present and correctly referenced | DevOps/DevSecOps | S | Project Monitor |
| S12-09 | Draft announcement posts (content only, not submission): r/Maroc, r/MoroccanDevs, Facebook group "Auto-entrepreneurs Maroc" (~90K members), LinkedIn post targeting Moroccan chartered accountants, Show HN | Copywriter | M | USER (see caveat) |
| S12-10 | Outreach list: 3-5 named chartered accountants to approach for endorsements post-launch (root `CLAUDE.md` §16, "Weeks 2-4") | PM | S | USER |

**Caveat**: S12-09's posts are drafts. Actually posting to Reddit/Facebook/LinkedIn/Show HN is "publishing public content" / "sending on the user's behalf" — requires the user's explicit per-post go-ahead in chat, not blanket sprint authorization; Claude Code will present each draft and wait for confirmation before submitting anything, if the user wants Claude Code to submit at all rather than posting themselves.

### BATCH 5 — Verify & close
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S12-11 | typecheck + lint + full Vitest + full Playwright green (re-run per the Sprint 11 ICE-fixture-fix baseline: `pnpm test` all 14 files, `playwright test --workers=1`) | Tester | S | Project Monitor |
| S12-12 | Sprint snapshot → `.logs/metrics.md`; `git push origin master` (Framework Rule 3) | Project Monitor | S | USER |

---

## Definition of Done (Sprint 12 closes)
- [ ] ToS + Privacy Policy drafts exist, explicitly marked "pending lawyer review" — not silently treated as final
- [ ] CNDP registration checklist exists
- [ ] Pentest scope doc + security-posture summary exist and are handed to the owner
- [ ] Deployment runbook exists and covers VPS/DNS/HTTPS/backups/monitoring end to end
- [ ] 3 bilingual blog posts published to the docs site
- [ ] CHANGELOG + README + LICENSE files verified current
- [ ] Announcement post drafts exist for all 5 named channels, none submitted without explicit per-post user confirmation
- [ ] Accountant outreach list exists
- [ ] 0 regressions — full test suite + e2e stay green
- [ ] `git push origin master` at sprint close

## Explicitly out of scope for this sprint
- Actually executing Batch 1-3 owner-only steps (signing ToS/Privacy Policy into effect, filing with CNDP, hiring/paying a pentest vendor, buying a VPS/domain, running the runbook) — these remain owner actions; this sprint produces everything up to that line
- Stripe/CMI subscription billing — still a separate, unscheduled follow-up sprint (Sprint 11 scoping: "multi-tenancy first, billing later"), not pulled into this sprint
- Submitting any of the Batch 4 announcement drafts to their platforms without explicit per-post user confirmation in chat
