# Sprint 13 — Preprod CI/CD Deployment Pipeline

**Goal**: A manually-triggered GitHub Actions pipeline that builds Moqawil, pushes an image to GHCR, and deploys it to a cheap preprod VPS over SSH — so the owner can test a real CI/CD deploy before this becomes the pattern for the eventual managed-hosting tier. This is a **testbed pipeline**, not the managed-cloud-tier launch (that remains gated on the CNDP path in `.claude/.logs/decisions.md`'s 2026-08-13 entry).

**Depends on**: Sprint 12 complete ✅ (commit — see `.logs/sessions.md` 2026-08-12 SESSION_END)
**Auto-handoff**: ENABLED — 🟡 BALANCED
**Status**: COMPLETE (2026-08-13)

---

## Design

**Why Framework Rules 1/6 (System Designer + Software Architect + foundation docs) don't apply here**: this sprint automates a manual process that's already fully documented (`docs/deployment-runbook-moqawil.md`, written in Sprint 12) — it adds no new `packages/*` module and no new external system in the architectural sense (no new API being integrated into the app, e.g. DGI/Barid eSign). Same reasoning Sprint 12 itself used for its own infra runbook. Not a foundation-docs feature.

**Hosting-provider pick for this sprint is preliminary, not final**: the 2026-08-12 decision log entry explicitly flagged the *managed cloud tier's* real hosting-provider decision for a proper System Designer pass once that tier is actually scoped. This sprint reuses that entry's cost comparison (boutique EU VPS ~10x cheaper than any hyperscaler for this single-Docker-Compose-box workload) to pick a cheap testbed VPS — Hetzner is the default recommendation — purely to exercise the CI/CD pipeline end-to-end. It is not a commitment to Hetzner for the eventual managed tier.

**🟡 BALANCED design choice for the deploy mechanism** (three options considered):
- 🟢 Simple: reuse the existing manual runbook's `git pull && docker compose up -d --build` directly over SSH from the Action. Fast to build, but building the Next.js image on a 2 vCPU / 4 GB testbed box on every deploy is slow and can OOM on the smallest tier.
- 🟡 **Balanced (selected)**: build the image once in CI, push to GHCR (free, same GitHub account, no new paid service), then the SSH step only pulls the tagged image and restarts. Adds one small additive compose override file; self-host (`docker compose up -d` building from source) is completely untouched.
- 🔴 Comprehensive: full GitOps (Argo/Flux-style) with a staging branch, auto-deploy on merge, Slack notifications, automated rollback. Way beyond what a single-VPS NFR (`docs/system-design-moqawil.md` §4) or a one-off preprod test needs.

**Trigger model**: `workflow_dispatch` only (manual button in GitHub Actions), not auto-deploy on push. No staging branch exists yet and the owner is testing the pipeline itself, not running a continuous staging environment — auto-triggering on every push would be scope creep for what's actually being asked (YAGNI).

**No new packages/* code, no changes to `docker-compose.yml`, `Dockerfile`, or `Caddyfile`** — those stay exactly as Sprint 12 left them (including the still-open Caddyfile-vs-label-driven-config note, unaffected by this sprint).

---

## Sprint Backlog

### BATCH 1 — Pipeline
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S13-01 | `docker-compose.preprod.yml`: standalone preprod compose file, `web` uses `image: ghcr.io/rhorba/moqawil-preprod:${DEPLOY_TAG}` instead of building from source — additive, self-host path (`docker-compose.yml`) untouched | DevOps/DevSecOps | S | DevOps | **DONE** → `moqawil/docker-compose.preprod.yml` |
| S13-02 | `.github/workflows/deploy-preprod.yml`: `workflow_dispatch` (ref input) → build & push image to GHCR (`GITHUB_TOKEN`, no new secret) → SSH to preprod VPS (`docker compose -f docker-compose.preprod.yml pull && up -d`, `pnpm db:migrate`) → health-check `/api/health` with retries → always-cleanup SSH key | DevOps/DevSecOps | M | Security Engineer | **DONE** → `.github/workflows/deploy-preprod.yml` |

### BATCH 2 — Docs (owner-executed steps)
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S13-03 | `docs/preprod-deployment-moqawil.md`: cheap testbed VPS pick + caveat to verify live pricing, GitHub Environment (`preprod`) + secrets to add, DNS subdomain, first manual run walkthrough, explicit link back to `docs/deployment-runbook-moqawil.md` for anything unchanged (VPS provisioning, backups, monitoring) | Deployment | M | USER (executes it) | **DONE** → `docs/preprod-deployment-moqawil.md` |

### BATCH 3 — Security review (Framework Rule 5 — new external data flow: SSH + a registry push)
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S13-04 | Review SSH private-key handling (written to a runner tempfile, never logged, always cleaned up), GHCR image visibility/scope, secret blast radius if `PREPROD_SSH_PRIVATE_KEY` leaked (bounded to the preprod box only, not prod), and whether the health-check step could leak anything sensitive on failure | Security Engineer | S | Project Monitor | **DONE** — 1 real finding (command injection via unsanitized `ref` interpolation into a `run:` script body), fixed same session, not left open — see `.logs/activity.md` + `.logs/communications.md` 2026-08-13 entries |

### BATCH 4 — Verify & close
| ID | Task | Specialist | Size | Handoff-To |
|---|---|---|---|---|
| S13-05 | Confirm zero app-code changes (typecheck/lint unaffected), validate new YAML files parse cleanly, log activity/communications/metrics/decisions, `git push origin master` | Project Monitor | S | USER | **DONE** — `pnpm lint` clean (143 files), YAML validated via `yaml.safe_load`, `git status` confirmed no app-code files touched |

**Caveat, load-bearing**: this sprint produces the pipeline and the setup doc. Actually running it against a real VPS requires the owner to provision that VPS, add GitHub Environment secrets, and click "Run workflow" — same blocked-on-owner pattern as every infra item since Sprint 4. Claude Code holds no VPS/DNS/GHCR-visibility credentials beyond the repo's own `GITHUB_TOKEN`.

## Definition of Done (Sprint 13 closes)
- [x] `docker-compose.preprod.yml` exists, additive only
- [x] `.github/workflows/deploy-preprod.yml` exists, manually triggered, builds+pushes+deploys+health-checks
- [x] `docs/preprod-deployment-moqawil.md` exists with the full owner-executed setup path
- [x] Security Engineer review complete, findings resolved (1 found, fixed same session)
- [x] 0 regressions — `pnpm lint` clean, no app-code files touched
- [x] `git push origin master` at sprint close

## Explicitly out of scope for this sprint
- Actually provisioning the preprod VPS, DNS, or GitHub Environment secrets (owner action)
- Auto-deploy on push / a dedicated staging branch (YAGNI for a one-off pipeline test)
- Any change to the self-host `docker-compose.yml`/`Dockerfile`/`Caddyfile` path
- The managed-cloud-tier's real hosting-provider decision (still gated on a full System Designer pass + the CNDP/employment path in the 2026-08-13 decision log entry)
