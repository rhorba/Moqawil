# Moqawil — Security Posture Summary

**Version**: 0.1 | **Date**: 2026-08-12 | **Audience**: security-conscious prospective hosted customers, auditors, pentest vendors (companion to `docs/pentest-scope-moqawil.md`)
**One page by design** — full detail lives in `docs/security-moqawil.md`.

---

**What Moqawil is**: an open-source (AGPL-3.0) compliance tool for Moroccan auto-entrepreneurs. Available two ways: self-hosted (you run it, you control everything) or as a hosted instance operated by `[OPERATOR LEGAL NAME]`. This summary covers the **hosted instance**.

## Data we hold
Your auto-entrepreneur profile (name, ICE, IF, address), your clients' contact details, your invoices and quarterly tax declarations. No payment card data — Moqawil does not process payments (no Stripe/CMI/Adyen integration exists in the product).

## Authentication
Passwordless: Google OAuth or emailed magic link. No password database exists to be breached or credential-stuffed.

## Tenant isolation
Every hosted customer's data is isolated at the application layer: every query and every server action filters by the authenticated user's own account ID before touching the database. This pattern was audited across every data-access function in the codebase in 2026-08 ahead of multi-tenant launch, and one defense-in-depth gap found during that audit was fixed and regression-tested (see `.claude/.logs/issues.md`). Accountant-to-client data sharing (the one deliberate cross-tenant flow in the product) uses single-use, expiring, unguessable invite tokens rather than broad access grants.

## In transit / at rest
HTTPS everywhere (automatic certificate management via Caddy). Secrets (API keys, database credentials) are never committed to source control and are injected via environment variables.

## Continuous security testing (every code change, automated)
- Static analysis for OWASP Top Ten patterns (Semgrep)
- Dependency vulnerability scanning (Trivy)
- Secret-leak scanning (Gitleaks)

## Independent verification
**No third-party penetration test has been completed as of this document's date.** One is scoped and ready to commission — see `docs/pentest-scope-moqawil.md` — and is treated as a launch blocker for publicizing the hosted instance, not an optional follow-up. This summary will be updated with the outcome once complete.

## Compliance posture
As the hosted-instance operator, `[OPERATOR LEGAL NAME]` is registering as data controller with Morocco's CNDP (Loi 09-08) for the personal data it stores on hosted customers' behalf — see `docs/cndp-registration-checklist-moqawil.md` and the published Privacy Policy once finalized. Self-hosted installations are unaffected by any of this — each self-hoster remains their own data controller.

## Contact
Security concerns / responsible disclosure: **[SECURITY CONTACT EMAIL — owner to provide, e.g. security@moqawil domain]**

---
*This is a summary for external audiences, kept intentionally non-technical where the full detail lives in `docs/security-moqawil.md`. Bracketed fields require the owner's real operator details before distribution.*
