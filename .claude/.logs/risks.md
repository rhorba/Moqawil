# Risk Log

### 2026-08-10 SECURITY — Accountant invite has no rate limit (invite-spam / resend abuse)
- **Specialist**: Security Engineer (Sprint 9 mandatory pre-SHIP review, Framework Rule 5)
- **Summary**: `inviteAccountant` (`apps/web/src/app/(app)/settings/accountant-links/actions.ts`) has no cooldown or rate limit — an authenticated entrepreneur can resubmit the invite form repeatedly for the same or different target emails, each resend triggering a fresh email send. Does not enable email-enumeration (the invite path never queries the `users` table to check whether the target email has any other Moqawil account) and doesn't allow unbounded row growth (the `uq_accountant_link_invite` unique constraint on `(entrepreneurId, invitedEmail)` means repeats reuse the same row).
- **Probability**: low (requires an already-authenticated account holder to abuse their own install's SMTP relay) | **Mitigation**: none applied — accepted for v0.2 given the self-hosted, single-tenant-per-install threat model (CLAUDE.md — not internet-scale multi-tenant SaaS); revisit with real rate-limiting if/when the managed multi-tenant cloud tier ships (CLAUDE.md §5/§16).
- **Status**: ACCEPTED (open, by design — not scheduled for this sprint)
- **Impact**: low — worst case is unsolicited email to a third-party inbox from a traceable, already-authenticated account on one self-hosted install, not a data-exposure or account-compromise vector.
- **Full audit context**: IDOR, invite-token entropy/single-use/expiry/race-safety, and revocation-latency were all reviewed and CONFIRMED OK with evidence (see Sprint 9 backlog S9-12–S9-15 and `.logs/communications.md` 2026-08-10 20:10 entry). Two low-severity issues found during the same review were fixed immediately, not deferred: `accountant/accept/page.tsx`'s email-mismatch check now fails closed when `session.user.email` is missing (previously silently skipped the check in that edge case — the real authorization boundary in the Server Action was never affected, this was a display-layer gap only); entrepreneur `SELECT`s in `queries/accountant.ts` and `accountant/[entrepreneurId]/page.tsx` narrowed to only the columns actually rendered, avoiding accidental over-fetch of `bankIban`/ICE/IF/address/phone into Server Component data.
---

### 2026-08-10 GAP — next-intl is configured but never actually used for page content (CLAUDE.md §5/§11 i18n requirement not met)
- **Specialist**: Frontend Dev (found while building Sprint 6 quote pages)
- **Summary**: CLAUDE.md requires "All UI strings extracted to translation files. No hardcoded user-facing text." Confirmed via repo-wide grep: `useTranslations`/`getTranslations` (next-intl's hooks) are never called anywhere in `apps/web/src/app/(app)/**` or `apps/web/src/components/**`. Every page (invoices, clients, declarations, and now quotes) hardcodes French text directly. `messages/fr.json` and `messages/ar.json` exist with a fairly complete key set (common, nav, auth, entrepreneur, client, invoice, quote, cap, ...) but are dead configuration as far as page bodies are concerned. What genuinely works today: `getLocale()` drives `dir="rtl"`/`dir="ltr"` layout switching, and `app-nav.tsx` hardcodes a `labelAr` field per nav item for the sidebar only. This has been true since at least Sprint 1 — not introduced by Sprint 6, just first noticed and documented now.
- **Probability**: certain (already true) | **Mitigation**: none applied yet — would require a dedicated i18n-retrofit sprint to convert every `(app)` page to `useTranslations`/`getTranslations` and verify AR renders correctly end-to-end, not just RTL direction.
- **Status**: CLOSED (2026-08-10, Sprint 7, all 12 tasks)
- **Impact**: medium — doesn't block usage (French-first is the stated primary anyway, per CLAUDE.md §10), but the "AR equal-class second" and "full RTL layout" claims in CLAUDE.md §10/§14 DoD were only partially true (layout direction yes, actual Arabic page content no)
- **Resolution evidence**: converted all 24 `(app)` pages/components, all 3 shared components, and both `(auth)` sign-in files to real `useTranslations`/`getTranslations`, plus the ~26 simple server-action-returned messages (translatable server-side via `getTranslations()` since actions run on the server). Added `dashboard` and `settings` message namespaces (didn't exist before) and filled gaps in the 11 existing ones. Simplified `app-nav.tsx` from its own parallel inline-ternary Arabic system to the same `useTranslations('nav')` mechanism as everything else. Verified genuinely, not just via typecheck: a live runtime check (curl against a real `next start` server, signed in via the e2e test route, with a real onboarded profile) confirmed zero `MISSING_MESSAGE`/`IntlError` and real Arabic *headings* (not just nav) on every converted page in both locales; a new Playwright test clicks the actual locale-toggle button a user would and asserts genuine Arabic content plus `dir="rtl"`, run alongside the full existing suite with `--workers=1` (matching CI) — 18/18 pass. Known remaining gap, explicitly documented rather than silently left: Zod validation-schema messages (e.g. `.min(1, 'Description requise')`) are still French-only since they're defined at module scope outside any request context — translating them would require restructuring every action file's schemas to be built per-request.

### 2026-05-19 00:00 TECHNICAL — Auth.js v5 breaking changes
- **Specialist**: Tech Lead
- **Summary**: Auth.js v5 has a different API from v4. Must pin version and test all auth flows.
- **Probability**: high | **Mitigation**: Pin exact version in package.json; test sign-in, magic link, session
- **Status**: CLOSED (2026-08-10, Sprint 5 S5-03)
- **Impact**: medium
- **Resolution evidence**: Confirmed `trustHost: true` present in both `src/lib/auth.ts:13` and `src/lib/auth.config.ts:10` (the second, Edge-runtime-safe config used by middleware, was the one that shipped with a real self-host-breaking gap during Sprint 3.5 — see `.logs/activity.md` 2026-08-08 14:25 entry — now fixed in both places). CI's e2e job (`auth-redirect` + smoke suite) has been green for the last 5 consecutive runs on `master`, most recently run `31278744178`.
---

### 2026-05-19 00:00 INTEGRATION — BAM rate scraper may break
- **Specialist**: Tech Lead
- **Summary**: bkam.ma has no public API. Scraper may break on site changes.
- **Probability**: medium | **Mitigation**: Build manual entry fallback from day 1. Document as known limitation.
- **Status**: CLOSED (2026-08-10, Sprint 5 S5-01/S5-02) — this had already happened, undetected, since the scraper was first written
- **Impact**: was high in practice, not low — see below
- **Resolution evidence**: Live-fetched the real page and found the scraper's hardcoded URL (`https://www.bkam.ma/Marches/Cours-des-devises`) returns an actual HTTP 404 — it had never worked in production. The graceful fallback masked this completely (app always showed "manual entry" with no visible error trail pointing at the real cause). The real page is `/Marches/Principaux-indicateurs/Marche-des-changes/Cours-de-change/Cours-de-reference` ("Cours de référence" — incidentally the exact legal term CLAUDE.md §3 uses for the foreign-invoice conversion rate). Root cause behind it staying hidden: the unit test suite tested a hand-invented HTML structure that was never validated against the real page, not the actual `parseRates` function (route.ts couldn't export it directly — Next.js route files may only export route handlers). Fixed: extracted `parseRates` to `src/lib/bam-parser.ts` so it's directly testable, rewrote the parser to match the real markup (currency identified via `title="1 EURO (EUR)"` anchors, values in `<span class="number">`), added a real-fixture-backed test suite (`__tests__/fixtures/bkam-cours-reference.sample.html`, captured live) plus a regression guard asserting the URL never points back at the old 404 path. Verified: 12/12 new tests pass, typecheck clean, lint clean.
---

### 2026-05-19 00:00 LEGAL — Tax rate constants need legal citations
- **Specialist**: Security Engineer
- **Summary**: Tax engine constants (80K cap, 0.5%/1% rates) must have CGI/Finance Law citations in code comments.
- **Probability**: certain | **Mitigation**: Add citation comments when writing tax-engine package.
- **Status**: CLOSED (2026-08-10, Sprint 8 S8-06) — mitigation had already happened, just never marked closed
- **Impact**: high
- **Resolution evidence**: Confirmed via grep of `packages/tax-engine/src/index.ts` — every rate/threshold/cap constant carries a citation: `PER_CLIENT_CAP_MAD`/`WHT_RATE_OVER_CAP` → CGI Article 73-II-G-8° (Finance Law 2023); `REVENUE_THRESHOLD_*` → Law 114-13; `TAX_RATE_*` → Law 114-13 (liberatory rates on turnover); `CASH_PAYMENT_LIMIT_MAD`/`CASH_PENALTY_THRESHOLD_MAD` → CGI Article 193; mandatory-mentions output → CGI Article 145 + Article 211 + Loi 114-13. No uncited constant found.
---
