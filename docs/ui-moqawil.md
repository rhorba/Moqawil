# UI: Moqawil
**UX**: docs/ux-moqawil.md | **Version**: 1.0 | **Date**: 2026-08-08 | **Author**: UI Designer | **Status**: Draft (matches Sprint 0-3 build)

## 1. Foundations
- **Component library**: shadcn/ui defaults, Tailwind CSS v4. No custom design system built from scratch — deliberate YAGNI choice, a solo-maintainer open-source project doesn't need one.
- **Style**: flat, clean, readable. No gradients, no glassmorphism, no AI-generated illustrations, no SaaS-marketing visual language inside the authenticated app.
- **Print CSS matters**: the quarterly declaration is meant to be printed and physically carried to a bank — this is not a nice-to-have, it's a core user flow (`docs/ux-moqawil.md` §2).

## 2. Cap Status Colors (the one piece of visual language that must never drift)
| State | Color | Usage |
|---|---|---|
| Safe (0-69%) | Green | Badge, progress bar fill |
| Warning (70-99%) | Amber | Badge, progress bar fill, dialog accent |
| Over (100%+) | Red | Badge, blocking dialog |

These three colors are load-bearing for the product's core value proposition — they should be defined once as design tokens and referenced everywhere, never redefined ad hoc per component.

## 3. Typography & Direction
- Default `lang="fr"` / `dir="ltr"`. Arabic mode: `lang="ar"` / `dir="rtl"`, full mirror — not just text alignment flipped, but logical CSS properties (`border-e` not `border-right`, etc.) throughout, per the Sprint 2 RTL audit that fixed 6 files for exactly this class of bug.
- Numbers/currency: always formatted per `fr-MA` locale conventions regardless of UI language (MAD amounts don't flip direction even in RTL mode).

## 4. Key Components
| Component | Purpose |
|---|---|
| `CapBadge` | The three-state cap indicator — appears on client list, client detail, invoice form, dashboard |
| `CapConfirmDialog` | Blocking dialog when an invoice would cross the 80K cap |
| `InvoiceDocument` (PDF) | Bilingual, all CGI Art. 145 fields, `@react-pdf/renderer` |
| `DeclarationDocument` (PDF) | Barid Al-Maghrib form layout replica, bilingual |
| `DeclarationCard` | Per-quarter status + deadline countdown |

## 5. Dark Mode
Not currently a stated requirement in the PRD — not built, not blocking v0.1. Revisit only if user feedback asks for it (YAGNI).

## Handoff
→ Frontend Dev: implementation
→ Test Architect: visual/accessibility test coverage (`docs/test-strategy-moqawil.md`)
