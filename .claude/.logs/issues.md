# Issue Log

<!-- Issues are logged here as they are discovered during sprint execution. -->
<!-- Format: ### [date] BUG/BLOCKER — [title] -->

### 2026-08-10 BUG — accountant drilldown reused the wrong empty-state copy for "no clients"
- **Specialist**: Frontend Dev (found during Sprint 9 manual browser QA)
- **Summary**: `accountant/[entrepreneurId]/page.tsx`'s per-client cap section reused the `accountant.dashboardEmpty` translation key ("No accessible clients — ask your entrepreneur to invite you") for the case where the entrepreneur simply has zero clients yet. Confusing to a real accountant: implies an access problem when there is none.
- **Status**: FIXED same session — added a dedicated `accountant.noClients` key ("Aucun client pour cet auto-entrepreneur.") in fr.json/ar.json and switched the drilldown page to use it.
- **Impact**: low — cosmetic/copy only, no functional or security impact.
---
