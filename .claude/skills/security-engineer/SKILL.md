---
name: security-engineer
description: >
  Security engineering for threat modeling, auth design, OWASP review, and compliance. Trigger on:
  "security", "auth", "OWASP", "threat model", "IDOR", "XSS", "injection", "secrets", "env vars",
  "compliance", "CNDP", or when a new auth/data flow is designed.
---

# Security Engineer — Moqawil

## Role
Threat model new features, review auth/data flows, enforce OWASP top 10, and ensure CNDP compliance.

## Moqawil Threat Surface

| Component | Threat | Mitigation |
|---|---|---|
| Invoice numbers | Enumeration / IDOR | Verify `entrepreneurId` on every query |
| Cap tracker | Data exposure across AE | Row-level: always filter by `entrepreneurId` |
| Auth.js session | Session hijack | HTTPS only (Caddy), httpOnly cookies |
| BAM rate scraper | SSRF | Fixed URL, no user input, timeout 10s |
| PDF generation | HTML injection in invoice fields | Sanitize all user input before PDF |
| Foreign currency | Precision manipulation | dinero.js + server-side calculation only |
| Magic link auth | Token replay | Auth.js handles expiry + one-time use |

## OWASP Top 10 Checklist (apply to each feature)

- [ ] A01 Broken Access Control — every DB query filters by `entrepreneurId` from session
- [ ] A02 Cryptographic Failures — no sensitive data in URLs or logs; HTTPS via Caddy
- [ ] A03 Injection — Drizzle parameterized queries (no raw SQL with user input)
- [ ] A04 Insecure Design — invoice sequence uses DB advisory lock (not app-level)
- [ ] A05 Security Misconfiguration — `.env.example` docs required vars; no secrets in code
- [ ] A07 Auth Failures — Auth.js v5 for all authentication; no custom session management
- [ ] A09 Logging Failures — no PII in logs; log auth events

## Secrets Management

```
REQUIRED env vars (must exist in .env.example with placeholder):
  AUTH_SECRET=          # nextauth secret — 32+ random bytes
  AUTH_GOOGLE_ID=       # Google OAuth client ID
  AUTH_GOOGLE_SECRET=   # Google OAuth secret
  AUTH_RESEND_KEY=      # Email magic link (optional — graceful degrade)
  DATABASE_URL=         # postgres://user:pass@host:5432/dbname
  
NEVER in code:
  - No hardcoded secrets
  - No .env in git (add to .gitignore)
  - No secrets in console.log
```

## CNDP Compliance (Moroccan Data Protection)

- Collect minimum required data (no phone if not needed)
- ICE and IF numbers are business identifiers — not personal data
- Invoice data retention: 10 years (CGI Article 211) — do NOT delete invoices
- Soft delete pattern for clients (never hard delete — invoices reference them)

## Auth Pattern Verification

Before shipping any route:
```
1. Is the route behind `(app)/` group? → Auth.js middleware protects it
2. Does every server action call `auth()` and check session?
3. Does every Drizzle query include `where eq(table.entrepreneurId, session.user.entrepreneurId)`?
4. Are there any `findMany()` without a user scope filter? → IDOR vulnerability
```

## Handoff Points
- **← From Tech Lead**: Architecture for threat review
- **→ Backend Dev**: Security requirements, auth patterns
- **→ Tester**: Security test cases (IDOR, auth bypass)
- **→ DevOps**: Infra security requirements
