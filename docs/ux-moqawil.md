# UX: Moqawil
**PRD**: docs/prd-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: UX Designer | **Status**: Draft (matches Sprint 0-3 build)

## 1. Core Principle
The 80K per-client cap is the entire product's reason to exist over a generic invoice generator — it must be **visible everywhere a client is mentioned**, not tucked into a report. Every other UX decision is secondary to this one.

## 2. Primary User Flows

### Onboarding (first login → first invoice)
```
Sign in (Google/magic link)
  → AE profile setup: name, ICE, IF, activity type, address, invoice prefix
  → Dashboard (empty state: "Add your first client")
  → Add client (name, type, ICE if MA company)
  → Create invoice (client pre-selected → cap badge shows immediately)
```
No forced tour, no multi-step wizard beyond what's legally necessary — Salma (non-technical persona) needs to reach "invoice sent" in under 5 minutes.

### Invoice creation (the highest-frequency flow)
```
Clients → select client (cap badge visible: 🟢/🟡/🔴)
  → New invoice → issue date, currency, line items
  → [if would cross 80K] blocking confirmation dialog, explicit consequence stated
  → Save draft → Send (PDF generated) → Mark paid (contributes to YTD + quarterly totals)
```

### Quarterly declaration
```
Declarations screen → 4 quarter cards (Q1-Q4), deadline countdown per card
  → Generate (auto-calculates from paid invoices in window)
  → Download printable PDF (matches Barid Al-Maghrib form layout)
  → Physically submit at bank → mark "submitted" in-app
```
This flow ends outside the app (a physical bank visit) by design — the DGI/SIMPL integration gap (`docs/system-design-moqawil.md` §3) is a real limitation, and the UX should make the handoff to "print and go to the bank" feel intentional, not broken.

## 3. Cap Tracker UX (the differentiator — do not compromise this)
Three states, consistent everywhere a client's total appears (client list row, client detail, invoice creation, dashboard):
| State | Threshold | Message pattern |
|---|---|---|
| 🟢 Safe | 0-69% | "Limite restante: X DH" |
| 🟡 Warning | 70-99% | "Attention — au-delà de 80 000 DH, votre client retiendra 30% à la source" |
| 🔴 Over | 100%+ | Blocking confirmation dialog required before proceeding |

## 4. Bilingual / RTL
- French is default (`fr-MA`), Arabic is full RTL, not a translated afterthought.
- Every component must render correctly in both `dir="ltr"` and `dir="rtl"` — this is a hard requirement, verified via an RTL audit each sprint that touches UI (see Sprint 2 activity log).
- PDFs show legal mentions in FR and AR side-by-side or stacked, never FR-only.

## 5. Device Priority
Desktop-primary (accountants and desk-based invoicing), but mobile-friendly enough for on-the-go invoice creation — not a native app, not a dedicated mobile-first redesign.

## 6. What This Product Is NOT
No SaaS marketing chrome inside the authenticated app — dashboard is the post-login home, not a upsell surface. No AI-generated illustrations, no gradients, no glassmorphism — flat, clean, shadcn/ui defaults (`docs/ui-moqawil.md`).

## Handoff
→ UI Designer: `docs/ui-moqawil.md`
→ Frontend Dev: flow implementation
