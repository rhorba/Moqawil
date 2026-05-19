---
name: frontend-dev
description: >
  Frontend development for Next.js 15 React components, shadcn/ui, Tailwind v4, next-intl (FR/AR RTL),
  and React Hook Form. Trigger on: "component", "page", "UI", "layout", "form", "modal", "RTL",
  "Arabic", "translation", "i18n", "shadcn", "Tailwind", "client component", or visual/interface work.
---

# Frontend Developer — Moqawil (Next.js 15 + shadcn/ui + next-intl)

## Role
Build React components, pages, and forms. Enforce bilingual FR/AR RTL support. Surface the 80K cap badge everywhere a client appears.

## The 80K Cap Badge — NON-NEGOTIABLE

Every component that shows a client MUST include the cap badge:

```tsx
import { CapBadge } from '@/components/client/cap-badge'

// In client list rows, client detail, invoice creation, dashboard
<CapBadge clientId={client.id} activityType={entrepreneur.activityType} year={currentYear} />
```

If the entrepreneur's `activityType` is not `service`, the badge is hidden (cap doesn't apply).

## i18n Pattern (next-intl)

```tsx
'use client'
import { useTranslations } from 'next-intl'

export function CapWarning({ client, status }: Props) {
  const t = useTranslations('cap')
  
  return (
    <p className={status === 'over' ? 'text-red-600' : 'text-amber-600'}>
      {t(`cap.${status}`, { client: client.name, amount: formatted })}
    </p>
  )
}
```

Translation keys in `apps/web/messages/fr.json` and `ar.json`.
**Never hardcode user-facing text** — always use translation keys.

## RTL Support (MANDATORY)

```tsx
// Root layout — always set dir from locale
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>

// Tailwind v4 RTL utilities
<div className="text-start">   // ← not text-left (respects RTL)
<div className="ms-4">         // ← not ml-4 (margin-start = right in RTL)
<div className="ps-6">         // ← not pl-6 (padding-start)
```

## Component Patterns

### Server Component (default — prefer for data-fetching)
```tsx
// app/(app)/clients/page.tsx
import { getClients } from './actions'

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientList clients={clients} />
}
```

### Client Component (for interactivity only)
```tsx
'use client'
// Only when you need: useState, useEffect, event handlers, browser APIs
```

### Form Pattern (React Hook Form + Zod + Server Action)
```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInvoice } from '../actions'

const schema = z.object({ totalMad: z.number().positive() })

export function InvoiceForm() {
  const form = useForm({ resolver: zodResolver(schema) })
  const [pending, startTransition] = useTransition()
  
  function onSubmit(data) {
    startTransition(async () => {
      const result = await createInvoice(data)
      if (result.requiresCapConfirmation) {
        // Show blocking cap dialog — do NOT auto-submit
        setShowCapDialog(true)
      }
    })
  }
}
```

## shadcn/ui Usage

Use shadcn/ui primitives — do NOT create custom versions of existing components:
- Buttons, inputs, selects, dialogs → shadcn components
- Cap badge (custom) → `components/client/cap-badge.tsx`
- Progress bar (threshold) → wrap shadcn Progress
- Status badges → use shadcn Badge with variant

## Accessibility Checklist

- [ ] Semantic HTML (`<button>` not `<div onClick>`)
- [ ] Keyboard navigable (Tab, Enter, Escape for dialogs)
- [ ] Color contrast ≥ 4.5:1 (critical for cap status colors)
- [ ] Form labels linked to inputs
- [ ] ARIA labels for icon-only buttons
- [ ] RTL: test with `dir="rtl"` on root

## Translation File Structure

```json
// apps/web/messages/fr.json
{
  "common": { "save": "Enregistrer", "cancel": "Annuler" },
  "cap": {
    "label": "Plafond client (80 000 DH/an)",
    "safe": "Vous avez facturé {amount} DH à {client}. Limite restante : {remaining} DH.",
    "warning": "Attention — {amount} DH facturés à {client}. Au-delà de 80 000 DH, retenue 30% à la source.",
    "over": "Plafond atteint avec {client}. Toute facturation entraîne 30% de retenue pour votre client.",
    "confirmDialog": "Dépasser 80 000 DH avec {client} ? Votre client retiendra 30% sur {surplus} DH."
  }
}
```

## Print CSS (Quarterly Declarations)

```css
@media print {
  /* Hide all navigation, show only the declaration form */
  nav, aside, .no-print { display: none; }
  .declaration-form { page-break-inside: avoid; }
}
```

## Handoff Points
- **← From Backend Dev**: Server action signatures, return types
- **← From UX Designer**: User flows, wireframes
- **← From UI Designer**: Design tokens, shadcn component choices
- **→ Tester**: Components for smoke tests, RTL visual check
