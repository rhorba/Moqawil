# UI: Moqawil
**UX**: docs/ux-moqawil.md | **Version**: 2.0 | **Date**: 2026-08-11 | **Author**: UI Designer + Design Loop | **Status**: Active (supersedes v1.0's "no design system" call)

## 0. Why this revised (v1.0 → v2.0)
v1.0 deliberately skipped building a design system as YAGNI for a 3-4 screen MVP. The app has since
grown past that: 10+ screens (dashboard, invoices, quotes, clients, declarations, settings, accountant
multi-client views), shadcn's own dependencies (`cva`, `clsx`, `tailwind-merge`, `lucide-react`) were
already added to `package.json` but never actually used to build shared primitives, and every screen
hand-rolls its own Tailwind classes — the exact condition that produces visible inconsistency (a modal's
border-radius doesn't match a card's, spacing drifts screen to screen). This revision applies the
`skills/design-loop/SKILL.md` method: codify the system explicitly here first, then build/re-review every
screen against it with independent critics — rather than each screen improvising its own look.

## 1. Foundations
- **Component library**: shadcn/ui, built on the already-installed primitives (`cva`, `clsx`,
  `tailwind-merge`, `lucide-react` + `@radix-ui/*` added as needed) — this is completing the committed
  stack from root `CLAUDE.md` §6, not deviating from it.
- **Style**: flat, clean, readable. No gradients, no glassmorphism, no AI-generated illustrations, no
  SaaS-marketing visual language inside the authenticated app. "Brilliant" here means disciplined
  craft — consistent spacing/type/elevation rhythm, restrained color, real information hierarchy — not
  more visual noise. Motion is selective, functional (status changes, dialog entry), never decorative.
- **Print CSS matters**: the quarterly declaration is meant to be printed and physically carried to a
  bank — this is not a nice-to-have, it's a core user flow (`docs/ux-moqawil.md` §2).

## 1.1 Design tokens

### Color
| Role | Token | Value | Used for |
|---|---|---|---|
| Primary | `--color-primary` | `oklch(0.45 0.15 200)` (deep teal) | primary CTAs, active nav, links |
| Primary foreground | `--color-primary-foreground` | `oklch(0.98 0 0)` | text/icons on primary fill |
| Background | `--color-background` | `oklch(1 0 0)` | page background |
| Card | `--color-card` / `--color-card-foreground` | `oklch(0.985 0.002 200)` / `oklch(0.2 0.01 200)` | cards, panels — one step off pure white |
| Border / input | `--color-border` / `--color-input` | `oklch(0.9 0.005 200)` | dividers, input borders |
| Foreground | `--color-foreground` | `oklch(0.2 0.01 200)` | primary text |
| Muted | `--color-muted` / `--color-muted-foreground` | `oklch(0.96 0.003 200)` / `oklch(0.5 0.01 200)` | secondary/meta text, subtle backgrounds |
| Destructive | `--color-destructive` / `--color-destructive-foreground` | `oklch(0.55 0.2 25)` / `oklch(0.98 0 0)` | destructive actions (shares hue with danger) |
| Safe | `--color-safe` / `--color-safe-bg` | `oklch(0.55 0.15 145)` / `oklch(0.96 0.03 145)` | cap/threshold 0-69% |
| Warning | `--color-warning` / `--color-warning-bg` | `oklch(0.65 0.16 75)` / `oklch(0.97 0.04 75)` | cap/threshold 70-99% |
| Danger | `--color-danger` / `--color-danger-bg` | `oklch(0.55 0.2 25)` / `oklch(0.97 0.03 25)` | cap/threshold 100%+, destructive actions |

Safe/warning/danger are unchanged from the existing tokens (`apps/web/src/app/globals.css`) — per §2
below they are load-bearing and must never be redefined ad hoc.

### Typography
- Family: `Inter` (Latin), `Cairo` (Arabic) — unchanged.
- Scale: `xs` 12px (meta/labels) · `sm` 14px (secondary text, table cells) · `base` 16px (body) ·
  `lg` 20px (card titles) · `xl` 24px (section headings) · `2xl` 30px (page titles).
- Weights in use: 400 body, 500 labels/buttons, 600 headings/emphasis. Never 700+ — this is a compliance
  tool, not a marketing page.

### Spacing
4px base grid: `1` 4px (icon-to-label gaps) · `2` 8px · `3` 12px (compact stacks) · `4` 16px (default
gap, card padding) · `6` 24px (section padding) · `8` 32px (between major sections) · `12` 48px
(page-level vertical rhythm).

### Radius & elevation
- Radius: `sm` 6px (badges, inputs) · `md` 10px (cards, buttons, dialogs) — one scale, used consistently
  (the current app mixes implicit browser-default and ad hoc `rounded-lg` with no shared value).
- Elevation: border-based, not shadow-based (`--color-border` on `--color-surface`) — matches the flat,
  print-friendly, no-glassmorphism rule. Shadows reserved only for floating/dismissible layers (dialogs,
  dropdowns), never for static cards.

### Motion
- Durations: 150ms (hover/focus), 200ms (dialog/dropdown enter). Easing: standard ease-out.
- Allowed to move: dialogs, dropdowns, the cap-bar fill on data change, toast/alert entry.
- Never moves: body text, table rows, PDF-bound content, anything under `@media print`.

### Explicit out-of-bounds
No gradients · no glassmorphism/frosted panels · no AI-generated stock imagery · no more than the
primary + 3 semantic colors on screen at once · must stay legible printed in grayscale (declarations) ·
must mirror correctly under `dir="rtl"` (logical properties only, never `left`/`right`).

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

### 4.1 Shared primitives (new in v2.0 — `apps/web/src/components/ui/`)
Built shadcn-style (owned copy-paste source, not an npm black box) on the tokens above: `Button`,
`Card`, `Badge`, `Input`, `Label`, `Select`, `Table`, `Dialog`, `Textarea`. Every screen rebuild in this
pass must compose from these rather than hand-rolling raw Tailwind per page — that inconsistency is the
root cause this revision exists to fix.

### 4.2 Domain components
| Component | Purpose |
|---|---|
| `CapBadge` | The three-state cap indicator — appears on client list **row**, client detail, invoice form, dashboard. **v1.0 gap found and fixed in v2.0**: it was missing from the client list row, rendering only on detail — a direct violation of root `CLAUDE.md` §4 ("cap status badge visible on: client list row, client detail page, invoice creation screen, dashboard summary"). |
| `CapConfirmDialog` | Blocking dialog when an invoice would cross the 80K cap |
| `InvoiceDocument` (PDF) | Bilingual, all CGI Art. 145 fields, `@react-pdf/renderer` |
| `DeclarationDocument` (PDF) | Barid Al-Maghrib form layout replica, bilingual |
| `DeclarationCard` | Per-quarter status + deadline countdown |

## 5. Dark Mode
Not currently a stated requirement in the PRD — not built, not blocking v0.1. Revisit only if user feedback asks for it (YAGNI).

## Handoff
→ Frontend Dev: implementation
→ Test Architect: visual/accessibility test coverage (`docs/test-strategy-moqawil.md`)
