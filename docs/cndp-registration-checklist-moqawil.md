# CNDP Data-Controller Registration Checklist — Moqawil Hosted Instance

**Version**: 0.1 | **Date**: 2026-08-12 | **Author**: Security Engineer (Claude Code) | **Status**: Checklist for owner to file — not a filing
**References**: Loi 09-08 (protection des données à caractère personnel), `cndp.ma`, `docs/security-moqawil.md` §1 §7, `docs/privacy-policy-moqawil.md`

> **Scope reminder**: this applies only if `[OPERATOR]` operates the Moqawil hosted instance and stores other people's client PII on their behalf. Self-hosters never need this — each self-hoster is their own data controller for their own single-tenant install (`docs/security-moqawil.md` §3).

## Why this is required
Under Loi 09-08, any entity that determines the purposes and means of processing personal data ("responsable du traitement") must declare that processing to the CNDP before it begins, except for processing covered by a simplified/normalized exemption. Once `[OPERATOR]` hosts other auto-entrepreneurs' client data (names, ICE, addresses, sometimes IBANs — see data model in root `CLAUDE.md` §8), `[OPERATOR]` is that entity. This is a **legal filing obligation**, distinct from writing a Privacy Policy — the policy describes intended practice; the filing is what makes the controller status official.

## What Claude Code can and cannot do here
Can: assemble the information CNDP's declaration form asks for, in one place, from what's already documented about the product. Cannot: know `[OPERATOR]`'s real legal-entity identity, submit the filing (requires an account/credentials on `cndp.ma` tied to a real person/company), or give legal advice on whether a simplified-declaration exemption applies — that determination should go through a lawyer or the CNDP's own guidance for the specific form used.

---

## 1. Identity of the data controller (owner to provide)
- [ ] Legal entity name (individual auto-entrepreneur name, or company name if incorporated)
- [ ] ICE / RC / IF of the controller entity
- [ ] Registered address
- [ ] Contact person for data-protection matters (name, email, phone)
- [ ] Legal form (personne physique auto-entrepreneur / SARL / other)

## 2. Description of processing (drawn from the product — ready to hand to counsel)
- [ ] **Purpose of processing**: "Providing a compliance SaaS tool for Moroccan auto-entrepreneurs — invoice generation, per-client revenue cap tracking, quarterly tax declaration preparation." (root `CLAUDE.md` §1)
- [ ] **Categories of data subjects**: (a) the hosted user (the auto-entrepreneur account holder), (b) the hosted user's own clients (name, ICE, contact details stored as invoice recipients — third-party data the controller processes on the account holder's behalf)
- [ ] **Categories of personal data processed**: see table in `docs/privacy-policy-moqawil.md` §2 (account identity, AE profile incl. ICE/IF/address/IBAN, client records, invoice/declaration line items)
- [ ] **Legal basis**: contract performance + legal retention obligation (CGI Art. 211) + legitimate interest (abuse prevention) — see Privacy Policy §3
- [ ] **Recipients / processors**: VPS host, Google (OAuth, opt-in), SMTP provider — see Privacy Policy §4; **no international transfer** unless the chosen VPS host is outside Morocco (flag this explicitly on the form if so — Loi 09-08 has separate rules for cross-border transfer)
- [ ] **Retention period**: account lifetime, aligned to the user's own 10-year CGI Art. 211 obligation — see Privacy Policy §5
- [ ] **Security measures summary** (CNDP forms typically ask for this in narrative form):
  - Passwordless authentication (OAuth/magic link) — no password database to breach
  - Per-tenant ownership filtering on every data-access query (`entrepreneurId` scoping) — prevents cross-tenant exposure
  - HTTPS everywhere (Caddy auto-TLS)
  - Automated CI security scanning: Semgrep SAST, Trivy dependency scanning, Gitleaks secret scanning
  - In-process rate limiting on public auth endpoints
  - Automated, timestamped database backups (`scripts/backup-db.sh`)
  - **Known gap to disclose, not hide**: no independent third-party penetration test has been performed yet (tracked in `docs/pentest-scope-moqawil.md`) — if the CNDP form asks whether an audit has occurred, answer honestly and reference the scheduled/in-progress status once the owner commissions one

## 3. Filing mechanics (owner-only — Claude Code cannot execute these)
- [ ] Determine which CNDP procedure applies: normal declaration ("déclaration normale") vs. simplified/normalized declaration if this processing matches one of CNDP's published normalized categories — **requires checking current CNDP guidance at `cndp.ma`, this checklist does not make that determination**
- [ ] Create an account on the CNDP e-services portal (real legal identity required)
- [ ] Complete and submit the declaration form using the information assembled in §1–§2 above
- [ ] Retain the CNDP receipt/registration number — reference it in the published Privacy Policy once obtained (currently a placeholder there)
- [ ] Re-file/update the declaration if the categories of data processed materially change (e.g., if a future sprint adds payment data collection, which would also trigger PCI-adjacent obligations — currently out of scope per root `CLAUDE.md` §5)

## 4. Before the hosted instance is publicly announced
- [ ] CNDP filing submitted (ideally acknowledged/registered, not just submitted — check expected turnaround on `cndp.ma`)
- [ ] `docs/privacy-policy-moqawil.md` updated with the real registration number and no remaining `[bracketed placeholders]`
- [ ] `docs/terms-of-service-moqawil.md` finalized in parallel (references the same operator identity)

## Handoff
→ **USER**: This is a checklist, not a filing. Steps in §3 require the owner's real identity and an account on `cndp.ma` that Claude Code has no access to. Recommend involving a lawyer if there's any doubt about which declaration type (normal vs. simplified) applies.
