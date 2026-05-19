---
name: ui-designer
description: >
  Visual design, design tokens, shadcn/ui configuration, and component styling. Trigger on:
  "design tokens", "colors", "typography", "dark mode", "visual design", "shadcn theme",
  "CSS variables", or any visual/styling work.
---

# UI Designer — Moqawil

## Role
Define design tokens and configure shadcn/ui for a clean, readable, professional tool aesthetic. No gradients, no glassmorphism, no AI illustrations.

## Design Tokens (Tailwind v4 CSS variables)

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Primary: Moroccan professional — deep teal */
  --color-primary: oklch(0.45 0.15 200);
  --color-primary-foreground: oklch(0.98 0 0);
  
  /* Status colors */
  --color-safe:    oklch(0.55 0.15 145);   /* green */
  --color-warning: oklch(0.70 0.15 75);    /* amber */
  --color-danger:  oklch(0.55 0.20 25);    /* red */
  
  /* Cap badge backgrounds (low saturation) */
  --color-safe-bg:    oklch(0.95 0.04 145);
  --color-warning-bg: oklch(0.97 0.04 75);
  --color-danger-bg:  oklch(0.96 0.04 25);
  
  /* Typography */
  --font-sans: "Inter", "Arial", sans-serif;
  --font-arabic: "Cairo", "Amiri", sans-serif;  /* RTL */
  
  /* Spacing scale — 4px base */
  --spacing: 0.25rem;
}
```

## Cap Badge Variants

The cap badge is the most important UI element. Three variants:

```tsx
// Tailwind classes by status
const badgeVariant = {
  safe:    'bg-[--color-safe-bg]    text-[--color-safe]    border-[--color-safe]/30',
  warning: 'bg-[--color-warning-bg] text-[--color-warning] border-[--color-warning]/30',
  over:    'bg-[--color-danger-bg]  text-[--color-danger]  border-[--color-danger]/30',
}
```

## shadcn/ui Configuration

Use default shadcn component styles. Only customize:
- Button primary color → use `--color-primary`
- Alert variants → add `cap-warning` and `cap-over` variants
- Progress → use for threshold and cap progress bars

## Typography

- Body: Inter (system fallback) — clean, readable at small sizes
- Arabic text: Cairo or Amiri — both support Moroccan Arabic script
- Numbers: tabular lining (for MAD amounts in tables)

## Print Styles (Declarations)

```css
@media print {
  :root { --font-size-base: 11pt; }
  nav, .sidebar, .no-print { display: none !important; }
  .declaration-form { 
    font-family: serif;  /* more formal for printed docs */
    color: #000;
  }
  .bilingual-mention {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
}
```

## Handoff Points
- **← From UX Designer**: Wireframes to apply visual layer
- **→ Frontend Dev**: Design tokens + component variant specs
