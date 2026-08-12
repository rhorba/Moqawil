# S12-09 — Launch announcement drafts

**Status**: DRAFTS ONLY. Nothing here has been submitted. Per Sprint 12's scope note,
these advertise the **open-source, self-hostable repo** — not a Moqawil-hosted
product, since the hosted instance's ToS/Privacy Policy are still lawyer-review drafts
and no pentest has run yet (`.claude/sprint-backlog/sprint-12.md`). Do not add a hosted
sign-up link to any of these until Batches 1–3's owner-only steps are actually executed.

Each post needs the user's explicit go-ahead in chat before Claude Code submits it
anywhere — or the user may post it themselves and just wants the copy. Either way,
nothing goes out without that per-post confirmation.

Repo link used throughout: `https://github.com/rhorba/Moqawil`

---

## 1. r/Maroc

**Suggested flair**: Discussion / Tech (check current sub rules before posting)

**Title**: J'ai créé un outil open source gratuit pour suivre le plafond de 80 000 DH par client (auto-entrepreneurs)

**Body** (FR):

> Salam à tous,
>
> Je suis développeur et je connais plusieurs auto-entrepreneurs (dont moi à une époque) qui galèrent avec deux choses : la déclaration trimestrielle du CA, et surtout la règle du **plafond de 80 000 DH par client par an** introduite par la Loi de Finances 2023. Presque personne ne la connaît bien, et si tu la dépasses, ton client doit retenir 30% à la source — une perte sèche pour toi.
>
> J'ai construit **Moqawil**, un outil gratuit et open source (AGPL-3.0) qui :
> - suit ce plafond en temps réel, client par client, avec des alertes avant que ça devienne un problème
> - génère des factures conformes (mentions légales CGI Article 145 incluses)
> - pré-remplit la déclaration trimestrielle pour Barid Al-Maghrib
> - alerte avant d'atteindre le seuil annuel (200 000 DH services / 500 000 DH autres)
> - fonctionne en français ET en arabe
>
> C'est auto-hébergeable (`docker compose up -d` sur un VPS Ubuntu) et gratuit pour toujours. Le code est sur GitHub : https://github.com/rhorba/Moqawil
>
> Je ne suis pas comptable, donc si un comptable ou quelqu'un du RNAE/DGI veut relire la logique fiscale et me corriger, c'est très bienvenu — tout est dans `packages/tax-engine`, avec les articles du CGI cités en commentaire.
>
> Curieux d'avoir vos retours, surtout si vous êtes AE et que cette règle du plafond vous a déjà surpris.

---

## 2. r/MoroccanDevs

**Title**: Show & Tell: Moqawil — open-source (AGPL-3.0) compliance toolkit for Moroccan auto-entrepreneurs, Next.js 15 + Drizzle + Postgres

**Body** (FR/EN mix, dev-audience tone):

> Built this over the last few months and figured this sub would appreciate both the
> problem and the stack.
>
> **The problem**: Morocco's ~400K auto-entrepreneurs (Law 114-13) have a genuinely
> nasty compliance trap — a 2023 Finance Law rule caps service invoicing at 80,000 MAD
> per client per year (CGI Art. 73-II-G-8°). Cross it and your client is legally
> required to withhold 30% at source on the surplus. Every guide mentions it, nothing
> tracks it live. Same for the quarterly turnover declaration — still a manual RNAE
> form → print → walk into Al Barid Bank process.
>
> **What Moqawil does**: live per-client cap tracking, compliant invoice generation
> (CGI Art. 145 fields, bilingual FR/AR PDFs), pre-filled quarterly declarations,
> annual threshold alerts, foreign-client invoicing with BAM-rate conversion, an
> accountant multi-client view, UBL 2.1 export (ready for whenever DGI's e-invoicing
> mandate reaches AE).
>
> **Stack**: Next.js 15 (App Router), TypeScript strict, PostgreSQL + Drizzle ORM,
> Auth.js v5, Tailwind v4 + shadcn/ui, `@react-pdf/renderer`, next-intl for real FR/AR
> (RTL) — not just layout-mirrored, actual translated content. Vitest + Playwright,
> CI on every push (Semgrep, Trivy, Gitleaks).
>
> The tax/compliance logic lives in its own zero-I/O package
> (`packages/tax-engine`, Apache-2.0) so anyone building a competing or complementary
> tool can depend on it without touching the AGPL app code.
>
> Self-hostable, `docker compose up -d` on a fresh Ubuntu VPS, no paid services
> required. Repo: https://github.com/rhorba/Moqawil
>
> Feedback on the tax logic especially welcome — I've cited the CGI articles / Finance
> Law provisions in code comments, but I'm not a chartered accountant, and getting this
> wrong has real financial consequences for people.

---

## 3. Facebook group "Auto-entrepreneurs Maroc" (~90K membres)

**Body** (FR, warm/practical tone, no jargon, addressed to non-technical members like the Salma persona):

> Bonjour à toutes et à tous,
>
> Beaucoup d'entre vous connaissent la galère de la déclaration trimestrielle et
> certains ont été surpris par la règle du **plafond de 80 000 DH par client par an**
> (pour les activités de services) — au-delà, le client doit retenir 30% sur le
> surplus, ce qui vous coûte de l'argent.
>
> J'ai développé **Moqawil**, un outil 100% gratuit qui vous aide à :
> - suivre en temps réel combien vous avez facturé à chaque client, avec une alerte
>   avant d'atteindre 80 000 DH
> - créer des factures conformes à la loi, avec toutes les mentions obligatoires
> - préparer votre déclaration trimestrielle, prête à imprimer pour la banque
> - être prévenu avant d'atteindre le seuil annuel (200 000 DH ou 500 000 DH selon
>   votre activité)
>
> L'interface est disponible en français et en arabe. C'est un outil open source
> (le code est public et vérifiable), pas un produit fermé — vous pouvez l'utiliser
> gratuitement sur votre propre serveur, ou en attendant qu'on propose une version
> hébergée.
>
> Lien du projet : https://github.com/rhorba/Moqawil
>
> Je suis ouvert à toutes vos questions et remarques, surtout si vous avez déjà été
> surpris par le plafond des 80 000 DH ou si la déclaration trimestrielle vous a déjà
> posé problème.

---

## 4. LinkedIn (targeting Moroccan chartered accountants)

**Body** (FR, professional register, leads with the accountant-facing feature):

> 30 clients auto-entrepreneurs à suivre individuellement pour le plafond de 80 000 DH,
> plus les déclarations trimestrielles de chacun — la charge de suivi manuel pour un
> expert-comptable qui accompagne des AE est réelle.
>
> Je viens de lancer **Moqawil**, un outil open source et gratuit de conformité pour
> les auto-entrepreneurs marocains (Loi 114-13), avec un espace dédié aux
> comptables : chaque auto-entrepreneur peut vous inviter en lecture seule, et vous
> retrouvez pour chacun de vos clients le suivi du plafond de 80 000 DH par client, le
> seuil annuel, et l'état des déclarations trimestrielles — dans un seul tableau de
> bord, sans ressaisie.
>
> Fonctionnalités principales :
> - Suivi en temps réel du plafond de 80 000 DH par client (Loi de Finances 2023,
>   CGI Art. 73-II-G-8°)
> - Facturation conforme (CGI Art. 145), bilingue français/arabe
> - Déclarations trimestrielles pré-remplies pour Barid Al-Maghrib
> - Export UBL 2.1, prêt pour la future obligation de facturation électronique DGI
> - Auto-hébergeable ou (bientôt) en version hébergée
>
> Le code est public (licence AGPL-3.0) : https://github.com/rhorba/Moqawil
>
> Je serais ravi d'échanger avec des experts-comptables qui accompagnent des
> auto-entrepreneurs, pour affiner l'outil sur la base de votre pratique réelle — la
> logique fiscale du projet gagnerait à être relue par des professionnels du métier.

---

## 5. Show HN

**Title**: Show HN: Moqawil – Open-source compliance toolkit for Moroccan auto-entrepreneurs

**Body** (EN, HN register — factual, no hype, technical honesty, invites scrutiny):

> Moqawil is an open-source (AGPL-3.0) compliance toolkit for Morocco's "auto-entrepreneur" regime — roughly 400,000 solo freelancers/small businesses taxed on turnover instead of profit (Law 114-13, 2015).
>
> The feature I built it around: a 2023 Finance Law rule caps how much an AE can invoice a single client for services — 80,000 MAD/year. Cross it, and the client is legally required to withhold 30% at source on the surplus, which the AE can't reclaim. Every guide covering this regime mentions the rule; as far as I could find, no existing tool (commercial or otherwise) tracks it live per client. Same gap for the quarterly turnover declaration, which today means filling a government portal form, printing it, and walking it into a bank branch.
>
> What it does: live per-client cap tracking with three-state alerts, compliant invoice generation (all CGI Art. 145 mandatory fields, bilingual French/Arabic PDF output — Arabic is a real RTL translation, not a mirrored layout), pre-filled quarterly declaration PDFs matching the bank's paper form, annual revenue-threshold alerts, foreign-client invoicing with Bank Al-Maghrib reference-rate conversion, an accountant-facing multi-client read-only dashboard, and UBL 2.1 export (ahead of Morocco's DGI e-invoicing mandate, which hasn't reached this segment yet).
>
> Stack: Next.js 15 (App Router, TypeScript strict), PostgreSQL + Drizzle ORM, Auth.js v5, Tailwind v4 + shadcn/ui, `@react-pdf/renderer`, next-intl. The tax/compliance rules live in a separate zero-I/O package under Apache-2.0 (`packages/tax-engine`) specifically so other tools in this space can depend on it without AGPL obligations on their own code — the app itself is AGPL-3.0.
>
> Self-hostable via `docker compose up -d`, no paid third-party services required. I'm not a chartered accountant — every tax constant in the code cites its legal source (CGI article, Finance Law), and I'd genuinely welcome scrutiny from anyone who knows this regime better than I do, since getting it wrong has real financial consequences for the people using it.
>
> Repo: https://github.com/rhorba/Moqawil

---

## Posting order / sequencing note

Batch 4's own sequencing rule still applies: none of these should go out before
Batches 1–3 land for real (ToS/Privacy Policy signed into effect if a hosted tier is
being advertised — which, per the framing above, it currently is not; these five
drafts point at the self-hosted repo only). If the plan changes to promote a live
hosted instance instead, these drafts need a rewrite with real ToS/Privacy links, not
just an added sign-up URL.
