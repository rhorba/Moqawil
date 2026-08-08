# PRD: Moqawil — Compliance Toolkit for Moroccan Auto-Entrepreneurs
**Version**: 1.0 | **Date**: 2026-08-08 | **Author**: PM | **Status**: v0.1 in progress (Sprint 3 closing)

## 1. Problem Statement
Morocco has roughly 400,000 auto-entrepreneurs (Loi 114-13, 2015) — freelancers, consultants, and small commercial/artisanal operators under a simplified tax regime. None of the existing tools (Hisab.ma, Auto-Entrepreneur.ma, ClicPaie.ma, GFAE/FactureExpress) track the two things that actually get AE status revoked or cost them money: the 80,000 MAD per-client annual cap (Finance Law 2023, CGI Art. 73-II-G-8°, triggers a 30% withholding penalty on the client if crossed) and the quarterly turnover declaration filed physically at Barid Al-Maghrib. Every AE either tracks this by hand in Excel, pays an accountant ~800 MAD/month for compliance-only work, or finds out about a cap breach after their client has already withheld 30%. Moqawil is a free, open-source (AGPL-3.0), self-hostable tool that generates legally compliant bilingual invoices and does the two things nobody else does: live per-client cap tracking and pre-filled quarterly declarations.

## 2. Goals & Success Metrics
| Goal | Metric | Target (6 months post-launch) |
|---|---|---|
| Prove the compliance wedge works | Self-hosted or managed instances with ≥1 real invoice | 200+ |
| Cap tracker actually prevents cap breaches | Support/community reports of accidental cap breach among users | Near zero (vs. anecdotal frequent occurrence today) |
| Reduce accountant dependency | Users reporting reduced/eliminated compliance-only accountant spend | Directional signal via community feedback (no formal survey infra yet) |
| Chartered accountant trust | Invoice/declaration PDF passes manual review by ≥1 practicing Moroccan accountant | Done before v0.1 ships (DoD item) |
| Open-source traction | GitHub stars / forks | Directional — Show HN + Reddit r/Maroc launch |

## 3. Key Roles (personas, see CLAUDE.md §2)
- **Karim**, 28 — full-stack freelance developer, Casablanca. Mix of Moroccan SMEs and EU clients. Currently Excel + an 800 MAD/month accountant. The primary early adopter: technical enough to self-host, motivated by both cost and the cap-tracking gap.
- **Salma**, 35 — small handicraft business, B2C in MAD, under the 500K commercial threshold. Less tech-comfortable, needs a French-first UI with simple flows — the test of whether Moqawil works for non-technical AEs, not just developers.
- **Hicham**, 45 — chartered accountant managing ~30 AE clients. Wants a multi-client view (explicitly post-v0.1). Represents the trust-multiplier channel: one endorsing accountant can bring dozens of AE clients.

## 4. User Stories

### Core invoicing (Karim, Salma)
- [x] As an AE, I want to onboard my profile (name, ICE, IF, activity type, address, invoice prefix) once, so every invoice auto-fills correctly.
- [x] As an AE, I want to create, edit, send, and mark an invoice as paid, with every CGI Art. 145 mandatory field pre-filled, so I never accidentally issue a non-compliant invoice.
- [x] As an AE, I want the invoice PDF to be bilingual (FR/AR legal mentions), so it's valid regardless of which language my client or an inspector expects.
- [x] As an AE billing a foreign client, I want the MAD equivalent at the Bank Al-Maghrib rate shown automatically, so I don't have to look it up myself.

### The cap tracker (the wedge feature)
- [x] As a service-type AE, I want to see a live badge on every client showing how close I am to the 80K MAD annual cap for that client, so I never find out too late.
- [x] As an AE about to cross 80K with a client, I want a blocking confirmation dialog explaining the 30% withholding consequence, so crossing it is a deliberate choice, not an accident.

### Declarations
- [x] As an AE, I want a pre-filled, printable quarterly declaration matching the Barid Al-Maghrib form, so I walk into the bank with paperwork already done instead of filling it there.
- [x] As an AE, I want to see all 4 quarters' status and deadlines on one screen, so I don't miss a filing window.

### Self-hosting
- [x] As a technical AE, I want `docker compose up -d` to give me a working install on my own VPS, so I never have to trust a third party with my financial data.

*(Checked items are built — Sprints 0-3; unchecked items below are Sprint 4+ or post-v0.1.)*

- [ ] As an AE, I want to export an invoice as a structured UBL 2.1 XML, so I can hand it to a client whose system requires one (Sprint 4, see `docs/prd-sprint4-e-invoicing.md`).
- [ ] As Hicham (accountant), I want a multi-client dashboard, so I can manage all my AE clients from one place (post-v0.1).

## 5. Scope
**In (v0.1)**: compliant invoice generator, 80K per-client cap tracker, annual threshold alerts, quarterly declaration generator, bilingual FR/AR UI, self-hostable via Docker Compose.
**Out (explicitly, per CLAUDE.md §5 — do not build without owner instruction)**: expense tracking, payroll, CRM beyond basic client list, payment processing/Stripe/CMI integration, DGI e-invoicing clearance (Hisab's market, unless/until Sprint 4+ changes this), multi-user/team accounts, native mobile apps, customer quote (devis) management, accountant multi-client dashboard, bank account integration, inventory management, CNSS contribution calculator.

## 6. Business Rules (full detail: CLAUDE.md §3)
Auto-entrepreneur regime (Loi 114-13), four activity types, revenue thresholds (200K services / 500K other), tax on turnover (0.5%/1%), the 80K per-client cap and 30% withholding (CGI Art. 73-II-G-8°), VAT-out-of-scope status, mandatory invoice fields (CGI Art. 145), foreign-client invoicing and repatriation rules, quarterly declaration mechanics, CNSS (out of scope for v0.1, tracked for context only).

## 7. Risks
| Risk | P | I | Mitigation |
|---|---|---|---|
| Tax-rule constants wrong or stale | Low | Very High | Every constant in `packages/tax-engine` cites a DGI circular/CGI article/Finance Law in a code comment (CLAUDE.md §9, §13 governance rule) |
| BAM/OMPIC have no public API | High | Low | Scrape-and-cache with manual fallback, documented as a known limitation (CLAUDE.md §15) |
| Accountant review finds a compliance gap before launch | Med | High | Explicit DoD item — v0.1 does not ship without it |
| Self-host adoption requires more Linux/Docker comfort than target user (Salma) has | Med | Med | Managed cloud tier explicitly planned post-launch (CLAUDE.md header) |
