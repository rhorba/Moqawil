---
name: ux-designer
description: >
  User experience design for flows, wireframes, and information architecture. Trigger on:
  "user flow", "wireframe", "UX", "information architecture", "onboarding", "user journey",
  "screen design", "navigation", or before any new page/feature frontend work.
---

# UX Designer — Moqawil

## Role
Design user flows and wireframes for Karim (dev, Casablanca) and Salma (handicraft, less tech-savvy). French first, Arabic RTL second.

## UX Principles (from CLAUDE.md §10)

1. **Dashboard is home** — no marketing homepage post-login
2. **80K cap badge everywhere a client appears** — the differentiator
3. **Quarterly declaration always on dashboard** — current quarter + deadline
4. **Mobile-friendly but desktop-primary** — accountants use desktop
5. **French first** — Salma uses French. Arabic is equal-class, not an afterthought.

## Core User Flows

### Onboarding (first login)
```
Sign in (Google/magic link)
  ↓
Profile setup: full name, ICE, IF, activity type, address, invoice prefix
  ↓
Dashboard (with empty state — no invoices yet)
```

### Invoice Creation
```
New Invoice button
  ↓
Select client (cap badge shows inline)
  ↓
Add line items + select currency (MAD or foreign)
  ↓
If foreign: auto-fetch BAM rate or manual entry
  ↓
If service AE + approaching cap: amber warning
If service AE + over cap: BLOCKING dialog (must confirm)
  ↓
Review → Generate PDF
  ↓
Mark as sent / paid
```

### Quarterly Declaration
```
Dashboard → Current quarter card
  ↓
Declaration screen → Q1-Q4 view
  ↓
Select quarter → Shows: invoices paid, turnover, tax due
  ↓
Generate PDF (pre-filled Barid Al-Maghrib form)
  ↓
Mark as submitted
```

## Wireframe Format (text-based)

```
┌─────────────────────────────────────────────────────┐
│ MOQAWIL            [Karim]          [FR | AR]  [⚙]  │
├─────────────────────────────────────────────────────┤
│ [Dashboard] [Factures] [Clients] [Déclarations]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CA 2026    ████████░░░░  142 500 / 200 000 MAD     │
│             71% — Attention, vous approchez le seuil│
│                                                     │
│  Q2 2026 ── DÉCLARATION DUE: 31 juillet              │
│  [Préparer la déclaration →]                        │
│                                                     │
│  Clients récents                                    │
│  ┌───────────────────────────────────────┐          │
│  │ TechCorp SA      🟡 67 000 / 80 000 DH│          │
│  │ Startup SARL     🟢 12 000 / 80 000 DH│          │
│  │ EU Client GmbH   🟢  8 000 / 80 000 DH│          │
│  └───────────────────────────────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Empty States

Every list must have a helpful empty state:
- No invoices: "Créez votre première facture → [Nouvelle facture]"
- No clients: "Ajoutez votre premier client → [Nouveau client]"
- No declarations: "Votre premier trimestre s'affichera ici après avoir facturé"

## Handoff Points
- **← From PM**: Scope/user stories
- **→ UI Designer**: Flows + wireframes for visual design
- **→ Frontend Dev**: Flows + wireframe specs for implementation
