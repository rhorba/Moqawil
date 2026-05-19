# Moqawil — Project overview

> Open-source compliance toolkit for Moroccan auto-entrepreneurs.
> Live tracking of the 80,000 MAD per-client cap, threshold alerts, and pre-filled quarterly declarations.
> AGPL-3.0. Free forever, self-hostable. Optional managed cloud tier post-launch.

This document is the source of truth for the project. Read it fully before making changes. If a requested change conflicts with this document, ask before implementing.

---

## 1. Mission and positioning

Moqawil exists to make Morocco's ~400,000 auto-entrepreneurs legally compliant with minimum friction. We compete by going **deeper on the auto-entrepreneur regime itself** than any commercial tool — features the market wants but no live competitor ships:

- **Live per-client 80,000 MAD cap tracker.** Every guide explains this rule; no tool tracks it in real time.
- **Quarterly declaration generator.** Pre-fills the Barid Al-Maghrib quarterly form. No competitor does this.
- **Annual threshold alerts.** Warns before the 200,000 MAD (services) or 500,000 MAD (commercial/industrial/artisanal) ceiling is hit.
- **Foreign-client invoicing** with BAM-rate MAD conversion. ClicPaie's own guides call this "le sujet que personne ne couvre."

### Live competitive landscape (as of 2026)

- **Hisab.ma** — 149+ MAD/month, closed source, targets VAT-registered businesses for the 2026 DGI e-invoicing mandate. Does not track AE-specific compliance.
- **Auto-Entrepreneur.ma** — owns the keyword domain, basic invoice + quote tool, closed source.
- **ClicPaie.ma** — content + Word templates kit, not a live SaaS.
- **GFAE / FactureExpress** — minimal free invoice generators.

None are open source. None track the 80K cap. None generate quarterly declarations. That is our wedge.

---

## 2. Target users

- **Karim**, 28, full-stack freelance developer in Casablanca. Mix of Moroccan SMEs and EU clients. Currently uses Excel + an 800 MAD/month accountant.
- **Salma**, 35, small handicraft business. Sells B2C in MAD, under the 500K commercial threshold. Less tech-comfortable. Needs French-first UI with simple flows.
- **Hicham**, 45, chartered accountant managing ~30 AE clients. Wants multi-client view (post-v0.1).

---

## 3. Morocco-specific business logic (critical — Claude Code will not know this)

### Auto-entrepreneur regime (Law 114-13, 2015)

Simplified regime for solo individual entrepreneurs. ~400,000 active AE in Morocco (2026). Registered via the RNAE portal at `ae.gov.ma`. Identifiers issued: **ICE** (15-digit Common Enterprise Identifier), **IF** (Tax Identifier), and Patente/TP number.

### Activity types (four)

- `commercial` — buying/selling goods
- `industrial` — manufacturing/transformation
- `artisanal` — craft
- `service` — services (development, design, consulting, etc.)

### Annual revenue thresholds

- Commercial / Industrial / Artisanal: **500,000 MAD/year**
- Services: **200,000 MAD/year**

Exceeding the threshold for **two consecutive years** triggers automatic loss of AE status and forced migration to the general regime (progressive IR 0-37% + VAT).

### Tax calculation (on turnover, not profit)

- Commercial / Industrial / Artisanal: **0.5% of turnover**
- Services: **1.0% of turnover**

This is liberatory — it discharges all income tax obligation for the activity.

### The 80,000 MAD per-client annual cap (Finance Law 2023, CGI Article 73-II-G-8°)

**This is the killer pain point and our differentiating feature.**

- An AE service provider cannot invoice more than 80,000 MAD per calendar year to a **single** client without consequences.
- Beyond the cap, the client is legally obligated to withhold **30% at source** on the surplus and remit to the DGI.
- The 30% is a dead loss for the AE (cannot reclaim without renegotiating gross rate up).
- Applies per client, per calendar year — not cumulative across clients.
- Applies to service-type activity. Commercial/industrial/artisanal have no per-client cap, only the annual threshold.

### VAT (TVA)

AE are **out of VAT scope** under Law 114-13 while below thresholds. Invoices must include the mention "TVA non applicable" — note this is NOT the French "Article 293 B du CGI"; Morocco has no single article to cite. AE display a single price (which is de facto both HT and TTC). No VAT line, no rate breakdown.

### Mandatory invoice fields (CGI Article 145 + AE-specific rules)

Every Moroccan AE invoice must contain:

1. The word "Facture" (or equivalent)
2. **Sequential invoice number with no gaps** (e.g. `FACT-2026-001`). Annual reset accepted if format includes year.
3. **Issue date**
4. Seller: full legal name, address, IF, **ICE (mandatory since 2021)**
5. Client: name, address. ICE required only if Moroccan B2B (mandatory since Jan 2019)
6. Item description, quantity, unit price (HT), line total
7. Total amount in MAD
8. Mention "TVA non applicable" (legal requirement for AE)
9. Payment method (espèces, virement, chèque, effet de commerce, carte)
10. If invoice >5,000 MAD to a professional client: payment must be by check/transfer/effet (not cash) — otherwise client cannot deduct
11. Cash payments above 20,000 MAD trigger a 6% penalty for the buyer
12. Conservation requirement: **invoices must be kept 10 years** from end of fiscal year

### Foreign client invoicing rules

- AE may export **services** (development, design, consulting). May NOT export physical goods.
- Foreign-currency invoices must show **both** the foreign currency amount AND the MAD equivalent at Bank Al-Maghrib's reference rate on the date of encashment.
- Currency must be 100% converted to MAD by the bank.
- Mandatory **repatriation within 3 months**.
- Turnover is declared in MAD for tax purposes.
- No client ICE required for foreign clients.

### Quarterly declaration (the paper trip we eliminate)

- AE declare turnover **quarterly** at Barid Al-Maghrib partner banks (Al Barid Bank, Attijariwafa, BMCE, etc.).
- Form is completed online via RNAE then printed, signed, and physically submitted at the bank.
- Tax due = quarterly turnover × rate (0.5% or 1%).
- Deadline: end of month following the quarter end.
- Zero turnover must still be declared. Two consecutive zero declarations from year 2 onward = loss of status.

### CNSS / AMO (social contributions)

- Mandatory for all AE since 2019.
- Paid monthly by automatic bank debit (fixed amounts by activity type).
- AMO health coverage included.
- Registration: Form 328-1-01. Direct debit authorization: Form 329-1-03.
- **Out of scope for v0.1** — we do not collect, calculate, or remit CNSS. Listed here only for context.

---

## 4. MVP scope (v0.1) — what we build

### Feature 1 — Compliant invoice generator

- Creates invoices with every Article 145 + AE mandatory field.
- Strict sequential numbering with no gaps; configurable prefix per entrepreneur.
- PDF output via `@react-pdf/renderer`, server-side.
- Bilingual legal mentions (FR primary, AR equivalent for legal mandatory text).
- Foreign-currency support with BAM rate auto-fetch (see integration note in §15).
- Invoice states: `draft`, `sent`, `paid`, `cancelled`.
- Email PDF to client is optional (requires SMTP env vars; works without).

### Feature 2 — Per-client 80K MAD cap tracker (the killer feature)

This must be visible everywhere the user thinks about a specific client.

- For each client, compute running annual total invoiced (and a separate `paid` total).
- Three visual states based on percent of cap:
  - `safe` (0-69%) — green, informational: "Limite restante: X DH"
  - `warning` (70-99%) — amber: "Attention — au-delà de 80 000 DH, votre client retiendra 30% à la source"
  - `over` (100%+) — red, blocking dialog on invoice creation that must be acknowledged
- Per-client annual ledger view showing all invoices contributing to the YTD total.
- Cap status badge visible on: client list row, client detail page, invoice creation screen, dashboard summary.
- Applies only to `service` activity type. For other activity types, the badge is hidden (per-client cap doesn't apply).

### Feature 3 — Annual threshold alerts

- Dashboard widget showing YTD turnover vs threshold (200K services / 500K others) as a progress bar with the same 3-color logic.
- Email alerts at 70%, 90%, 100% of threshold.
- If 100% reached in two consecutive years: prominent warning that AE status will be lost on year transition.

### Feature 4 — Quarterly declaration generator

- Auto-calculates quarterly turnover from invoices marked `paid` within the quarter window.
- Applies correct rate (0.5% commercial/industrial/artisanal, 1% service).
- Generates a printable PDF laid out to match the Barid Al-Maghrib quarterly declaration form so the user walks into the bank with a pre-filled document.
- Tracks declaration status (`pending` / `submitted`) with timestamp.
- Year view: 4 quarter cards (Q1-Q4) with status + deadline countdown.

### Feature 5 — Bilingual UI (FR + AR)

- French is the primary language. Default locale: `fr-MA`.
- Arabic mode with full RTL layout.
- PDF documents include FR + AR side-by-side or stacked for legally required mentions.
- All UI strings extracted to translation files. No hardcoded user-facing text.
- English deferred to v0.2. Tamazight deferred indefinitely.

### Feature 6 — Self-hostable

- `docker compose up -d` produces a working install on a fresh Ubuntu VPS.
- Configuration via single `.env` file.
- No paid third-party services required for self-host. Email features are optional and gracefully degrade if SMTP is not configured.
- Caddy reverse proxy in the compose file for automatic HTTPS.

---

## 5. Out of scope for v0.1 — do not build without explicit instruction

- Expense tracking (irrelevant for AE — taxed on turnover, not profit)
- Payroll (AE cannot have employees by definition)
- CRM features beyond the basic client list
- Payment processing or any integration with Stripe / CMI / Adyen / banks
- DGI e-invoicing mandate compliance (UBL 2.1 / UN/CEFACT CII clearance) — AE not in first wave; this is Hisab's market
- Multi-user / team accounts (AE is by definition solo)
- Mobile native apps — web responsive + PWA only
- Customer portal / quote (devis) management — v0.2
- Accountant multi-client dashboard — v0.2
- Bank account integration / transaction import
- Inventory management
- CNSS contribution calculator or remittance

---

## 6. Tech stack — committed choices

These are final for v0.1. Do not propose alternatives without a concrete blocker.

| Concern | Choice |
|---|---|
| Language | TypeScript (strict) |
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Auth.js (NextAuth v5), Google OAuth + email magic link |
| UI library | Tailwind CSS v4 + shadcn/ui |
| Forms | React Hook Form + Zod |
| i18n | next-intl |
| PDF generation | @react-pdf/renderer (server-side) |
| Dates | date-fns with `fr-MA` locale |
| Money | dinero.js for MAD arithmetic |
| Testing | Vitest (unit), Playwright (e2e) |
| Linting | Biome |
| Package manager | pnpm |
| Containerization | Docker + Docker Compose |
| Reverse proxy | Caddy (auto-HTTPS for self-hosters) |

---

## 7. Project structure

Monorepo using pnpm workspaces.

```
moqawil/
├── apps/
│   └── web/                       # Next.js application
│       ├── app/
│       │   ├── (auth)/            # Public auth pages
│       │   ├── (app)/             # Authenticated routes
│       │   │   ├── dashboard/     # Threshold widget, current quarter
│       │   │   ├── invoices/
│       │   │   ├── clients/       # Cap tracker per client
│       │   │   ├── declarations/  # Quarterly
│       │   │   └── settings/      # AE profile (ICE, IF, activity)
│       │   └── api/
│       │       ├── auth/
│       │       └── exchange-rate/ # BAM rate fetcher
│       ├── components/
│       │   ├── ui/                # shadcn/ui primitives
│       │   ├── invoice/
│       │   ├── client/
│       │   └── declaration/
│       ├── lib/
│       └── messages/              # next-intl translations
│           ├── fr.json
│           └── ar.json
├── packages/
│   ├── tax-engine/                # Apache-2.0 — Morocco tax math (see §9)
│   ├── pdf-templates/             # React-PDF templates
│   ├── db/                        # Drizzle schema + migrations
│   └── i18n/                      # Shared translation utilities
├── docker-compose.yml
├── Caddyfile
├── .env.example
├── README.md
├── CONTRIBUTING.md
├── LICENSE                        # AGPL-3.0
├── packages/tax-engine/LICENSE    # Apache-2.0
├── docs/                          # Docusaurus (FR/AR/EN later)
└── CLAUDE.md                      # This file
```

---

## 8. Data model

Core tables in `packages/db/src/schema.ts` (Drizzle):

```typescript
// Users — managed by Auth.js
users: id (uuid pk), email, name, image, createdAt

// Auto-entrepreneur profile — one per user
entrepreneurs:
  id              uuid pk
  userId          uuid fk → users.id (unique)
  fullName        text
  ice             text(15)  unique
  ifNumber        text
  activityType    enum('commercial', 'industrial', 'artisanal', 'service')
  activityDescription text
  address         text
  city            text
  phone           text
  bankIban        text  nullable
  registrationDate date
  fiscalYearStart date  default Jan 1
  invoicePrefix   text  default 'FACT'
  createdAt, updatedAt

// Clients
clients:
  id              uuid pk
  entrepreneurId  uuid fk → entrepreneurs.id
  name            text
  type            enum('individual', 'company_ma', 'company_foreign')
  ice             text  nullable  (required if type = company_ma)
  ifNumber        text  nullable
  email           text  nullable
  phone           text  nullable
  address         text  nullable
  countryCode     text  default 'MA'
  createdAt, updatedAt

// Invoices
invoices:
  id                  uuid pk
  entrepreneurId      uuid fk
  clientId            uuid fk
  invoiceNumber       text       (e.g. 'FACT-2026-001')
  fiscalYear          integer
  sequenceNumber      integer
  issueDate           date
  dueDate             date  nullable
  status              enum('draft', 'sent', 'paid', 'cancelled')  default 'draft'
  paymentMethod       enum('virement', 'cheque', 'espece', 'effet', 'carte', 'other') nullable
  paymentDate         date  nullable
  currency            text  default 'MAD'
  exchangeRate        numeric(10,4) nullable   // MAD per unit of foreign currency
  subtotalOriginal    numeric(12,2)
  subtotalMad         numeric(12,2)
  totalMad            numeric(12,2)
  notes               text  nullable
  pdfPath             text  nullable
  createdAt, updatedAt

  unique (entrepreneurId, invoiceNumber)
  unique (entrepreneurId, fiscalYear, sequenceNumber)

// Invoice lines
invoiceLines:
  id                  uuid pk
  invoiceId           uuid fk → invoices.id (cascade delete)
  position            integer
  description         text
  quantity            numeric(10,3)
  unitPriceOriginal   numeric(12,2)
  lineTotalOriginal   numeric(12,2)
  lineTotalMad        numeric(12,2)

// Quarterly declarations
quarterlyDeclarations:
  id                  uuid pk
  entrepreneurId      uuid fk
  year                integer
  quarter             integer  (1-4)
  totalTurnoverMad    numeric(12,2)
  taxRate             numeric(4,3)  // 0.005 or 0.010
  taxDueMad           numeric(12,2)
  status              enum('pending', 'submitted')  default 'pending'
  submittedAt         timestamp  nullable
  pdfPath             text  nullable
  createdAt, updatedAt

  unique (entrepreneurId, year, quarter)
```

Helper query for the cap tracker:

```typescript
getClientAnnualTotal(clientId, year): {
  totalInvoicedMad: number
  totalPaidMad: number
  remainingToCapMad: number     // 80,000 - totalInvoicedMad
  percentOfCap: number           // 0-200+
  status: 'safe' | 'warning' | 'over'
}
```

---

## 9. The tax-engine package — the moat

`packages/tax-engine/` is published separately under **Apache-2.0** so other Moroccan tools can depend on it. Pure functions, no I/O. This is the strategic asset of the project.

Required exports:

```typescript
export type ActivityType = 'commercial' | 'industrial' | 'artisanal' | 'service'

export const PER_CLIENT_CAP_MAD = 80_000
export const REVENUE_THRESHOLD_COMMERCIAL = 500_000
export const REVENUE_THRESHOLD_SERVICE = 200_000
export const TAX_RATE_COMMERCIAL = 0.005
export const TAX_RATE_SERVICE = 0.010
export const WHT_RATE_OVER_CAP = 0.30
export const VAT_STANDARD = 0.20
export const CASH_PAYMENT_LIMIT_MAD = 20_000
export const CHECK_REQUIRED_THRESHOLD_MAD = 5_000

export function getRevenueThreshold(activityType: ActivityType): number
export function getTaxRate(activityType: ActivityType): number
export function computeTax(turnoverMad: number, activityType: ActivityType): number
export function computeWithholdingOverCap(amountAboveCapMad: number): number

export function getCapStatus(invoicedYtdToClient: number): {
  status: 'safe' | 'warning' | 'over'
  percentOfCap: number
  remainingMad: number
}

export function getThresholdStatus(ytdTurnover: number, activityType: ActivityType): {
  status: 'safe' | 'warning' | 'over'
  percentOfThreshold: number
  remainingMad: number
}

export function validateICE(ice: string): { valid: boolean; reason?: string }
export function validateIF(ifNumber: string): { valid: boolean; reason?: string }
export function formatInvoiceNumber(prefix: string, year: number, sequence: number): string

export function getMandatoryMentions(ctx: InvoiceContext): string[]
```

All exports require unit tests in `packages/tax-engine/test/`. Tax-rule constants must cite a source (DGI circular, CGI article, or Finance Law) in a code comment.

---

## 10. UI / UX principles

- **French first, Arabic equal-class second.** Default `fr-MA`. Arabic is full RTL.
- **No SaaS marketing fluff.** Tool, not brochure. Dashboard is the post-login home.
- **Mobile-friendly but desktop-primary.** Accountants use desktop; on-the-go invoice creation must work on mobile.
- **The 80K cap is visible everywhere a client is mentioned.** This is the differentiator — surface it relentlessly.
- **Quarterly declaration always visible on dashboard.** Show current quarter status + deadline countdown.
- **Flat, clean, readable.** shadcn/ui defaults. No gradients, no glassmorphism, no AI-generated illustrations.
- **Bilingual PDFs.** Legal mentions in both FR and AR, side-by-side or stacked.
- **Print-friendly first.** The quarterly declaration gets printed and physically delivered — print CSS matters.

---

## 11. Localization

Translation files in `apps/web/messages/`. Namespaces:

- `common` — buttons, navigation
- `auth` — sign-in / sign-up flows
- `entrepreneur` — profile, ICE, IF
- `client` — client management
- `invoice` — invoice creation, line items
- `cap` — the 80K tracker UX (critical strings — see below)
- `threshold` — annual threshold UX
- `declaration` — quarterly declaration
- `legal` — mandatory PDF mentions

Critical strings to nail in the `cap` namespace (FR):

```json
{
  "cap.label": "Plafond client (80 000 DH/an)",
  "cap.safe": "Vous avez facturé {amount} DH à {client} cette année. Limite restante : {remaining} DH.",
  "cap.warning": "Attention — {amount} DH facturés à {client} cette année. Au-delà de 80 000 DH, votre client retiendra 30 % à la source.",
  "cap.over": "Plafond atteint avec {client}. Toute facturation supplémentaire entraîne 30 % de retenue à la source pour votre client.",
  "cap.confirmDialog": "Voulez-vous vraiment dépasser le plafond de 80 000 DH avec {client} ? Votre client devra retenir 30 % sur le surplus de {surplus} DH."
}
```

Arabic equivalents in `ar.json` with RTL-aware number formatting.

---

## 12. Development setup

```bash
# Prerequisites: Node 22+, pnpm 9+, Docker
git clone https://github.com/moqawil/moqawil.git
cd moqawil
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

Scripts:

- `pnpm dev` — Next.js dev server
- `pnpm build` — production build
- `pnpm test` — unit tests
- `pnpm test:e2e` — Playwright e2e
- `pnpm db:migrate` — apply Drizzle migrations
- `pnpm db:studio` — Drizzle Studio
- `pnpm lint` / `pnpm format` — Biome

---

## 13. License and governance

- **Application** (`apps/web`): **AGPL-3.0**. Modifications must be shared.
- **Tax engine** (`packages/tax-engine`): **Apache-2.0**. Anyone can embed.
- **Brand assets** (logo, name, domain): all rights reserved.

Governance starts as Benevolent Dictator (repo owner). Transitions to a 3-person steering committee at 100+ contributors. PRs require one maintainer approval. **Tax-rule changes require a citation (DGI circular, Finance Law article, CGI reference) in the PR description.**

---

## 14. Definition of done for v0.1

The MVP ships when all of these are true:

- [ ] A new user can sign up via Google or email magic link.
- [ ] Onboarding captures the AE profile: full name, ICE, IF, activity type, address, invoice prefix.
- [ ] User can create, edit, send, and mark-as-paid an invoice with all legal mandatory fields.
- [ ] Invoice PDF is bilingual (FR + AR legal mentions) and passes manual review by one Moroccan chartered accountant.
- [ ] Foreign-currency invoices include the MAD equivalent at the fetched BAM rate, dated.
- [ ] Sequential invoice numbering has no gaps, configurable prefix per entrepreneur.
- [ ] Client list shows per-client annual total + cap status with three-color states.
- [ ] Creating an invoice that would push past 80K shows a blocking confirmation dialog.
- [ ] Dashboard shows YTD turnover vs annual threshold with color status.
- [ ] Quarterly declarations screen lists Q1-Q4, calculates turnover and tax, generates printable PDF.
- [ ] UI works in FR and AR (RTL) end to end.
- [ ] `docker compose up -d` produces a working install on a fresh Ubuntu VPS.
- [ ] Docs site (FR primary) covers setup, invoice creation, declaration filing.
- [ ] Unit tests cover all `tax-engine` functions.
- [ ] One e2e Playwright test covers: signup → onboard → create client → create invoice → mark paid → see cap update → generate declaration.

---

## 15. Known integration challenges

- **BAM exchange rate.** Bank Al-Maghrib publishes daily reference rates on `bkam.ma` but there is no clean public API. v0.1 implementation: scrape and cache daily; fallback to manual entry if scrape fails. Track this as a known limitation in docs.
- **ICE validation.** OMPIC exposes a lookup at `ompic.ma` but no public API. v0.1: validate format (15 digits) and checksum only; full registry lookup deferred.
- **SIMPL integration.** The DGI tax portal currently requires manual login. No API for AE quarterly declarations. We generate a printable form; users physically submit at Barid Al-Maghrib. Future: lobby for API access via OEC partnerships.

---

## 16. Distribution (post-launch, for context)

- Day 1: GitHub public release. Announce in `r/Maroc`, `r/MoroccanDevs`, Facebook group "Auto-entrepreneurs Maroc" (~90K members), LinkedIn Moroccan accountants, Show HN.
- Weeks 2-4: Outreach to 3-5 chartered accountants for endorsements. Write 3 bilingual SEO blog posts: "Comment déclarer son CA d'auto-entrepreneur en 2026", "Le plafond de 80 000 DH par client expliqué", "Auto-entrepreneur Maroc : éviter la perte du statut".
- Month 2: Submit to Innov Invest Fund, Maroc PME. Apply for GitHub Sponsors, Open Collective. Approach Al Barid Bank for partnership.

---

## 17. What to ask before deviating

Claude Code should ask the project owner before:

- Adding a new dependency outside the committed stack
- Changing the tech stack
- Adding any feature from the out-of-scope list (§5)
- Modifying the data model in a breaking way
- Changing license terms
- Modifying tax-engine values (rates, thresholds, caps) — these are legal numbers and require citation

---

## 18. References

- **Law 114-13** — Auto-entrepreneur regime (enacted 2015)
- **CGI Article 145** — Mandatory invoice mentions
- **CGI Article 73-II-G-8°** — 30% withholding tax over 80K per-client cap
- **CGI Article 211** — Invoice conservation (10 years)
- **CGI Article 193** — Cash payment limits
- **Finance Law 2023** — Introduction of 80,000 MAD per-client cap
- **DGI portal**: `tax.gov.ma`
- **RNAE portal**: `ae.gov.ma`
- **OMPIC**: `ompic.ma`
- **Bank Al-Maghrib**: `bkam.ma`

---

*Built for the ~400,000 Moroccans who deserve better tools.*
