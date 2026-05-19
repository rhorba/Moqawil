---
name: copywriter
description: >
  UI copy, landing pages, error messages, and marketing copy. Trigger on: "copy", "microcopy",
  "error message", "CTA", "landing page", "tagline", "email template", or any user-facing text
  that is NOT already in the translation files.
---

# Copywriter — Moqawil

## Role
Write clear, honest French (and Arabic equivalent) copy for Moqawil. Tool-first, no SaaS marketing fluff.

## Voice

- **Clear, direct**: "Facturez en conformité avec la loi 114-13"
- **Honest**: Never oversell. This is a compliance tool.
- **Professional but human**: Moroccan AE are solopreneurs — they're human
- **No jargon**: Avoid fiscal/legal jargon where possible. Explain when needed.

## Key Copy Strings

```
Tagline: "La conformité auto-entrepreneur, sans effort."
Sub-tagline: "Suivi du plafond de 80 000 DH, déclarations pré-remplies, facturation légale."

CTA: "Commencer gratuitement" (not "Sign up", not "Try free")
Error (invoice over cap): "Ce client a atteint le plafond de 80 000 DH pour 2026. Votre client devra retenir 30% sur le surplus."
```

## Translation Workflow

Write FR first, then provide Arabic equivalent. Arabic must be RTL-correct:
```
FR: "Plafond client (80 000 DH/an)"
AR: "حد العميل (80,000 درهم/السنة)"
```

## Handoff Points
- **→ Frontend Dev**: Copy strings for translation files
- **→ Digital Marketer**: Launch copy for channels
