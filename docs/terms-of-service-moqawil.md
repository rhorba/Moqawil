# Terms of Service — Moqawil (Hosted Instance) / Conditions Générales d'Utilisation

**Version**: 0.1 — DRAFT | **Date**: 2026-08-12 | **Author**: PM (Claude Code) | **Status**: DRAFT — PENDING LAWYER REVIEW, NOT LEGALLY IN EFFECT

> **⚠️ Legal status of this document**: This is a first-pass draft produced by an AI coding assistant working from the project's own technical documentation (`CLAUDE.md`, `docs/security-moqawil.md`, `docs/prd-sprint11-saas-readiness.md`). It is written in the structure and register of a real Terms of Service, but **it has not been reviewed by a licensed Moroccan lawyer and must not be published, linked from the product, or treated as binding until it has been.** Every bracketed field (`[…]`) is a placeholder the owner must fill with real legal-entity information before this document means anything. Claude Code is not authorized to represent this draft as legally sufficient, and it is not qualified to give legal advice.

---

## 0. Scope note — self-host vs. hosted

Moqawil the software is AGPL-3.0 and free to self-host (root `CLAUDE.md` §1, §6). **These Terms apply only to the Moqawil-operated hosted instance** — the version where `[OPERATOR LEGAL NAME]` runs the application on its own infrastructure and a user signs up without installing anything. If you download the source and run `docker compose up -d` on your own server, you are a self-hoster: these Terms do not apply to you, you are not "using the Service" as defined below, and you are your own CNDP data controller (see `docs/security-moqawil.md` §3). This distinction must stay visible in the published version — do not let hosted-instance ToS language get quoted as if it governs self-hosted installs.

---

## FR — Conditions Générales d'Utilisation

### 1. Objet
Les présentes Conditions Générales d'Utilisation ("CGU") régissent l'accès et l'utilisation de l'instance hébergée de Moqawil, accessible à l'adresse **[DOMAINE — ex. app.moqawil.ma]**, exploitée par **[RAISON SOCIALE DE L'OPÉRATEUR]**, **[FORME JURIDIQUE — ex. auto-entrepreneur / SARL]**, ICE **[ICE OPÉRATEUR]**, dont le siège est **[ADRESSE]** ("l'Opérateur", "nous"). Le Service désigne l'application web Moqawil telle qu'hébergée et exploitée par l'Opérateur (le "Service"), à distinguer du logiciel Moqawil lui-même, distribué sous licence AGPL-3.0 et librement auto-hébergeable par toute personne (voir §0 ci-dessus).

### 2. Description du Service
Moqawil est un outil de conformité destiné aux auto-entrepreneurs marocains soumis à la Loi 114-13 : génération de factures conformes (CGI Article 145), suivi du plafond de 80 000 DH par client, alertes de seuil annuel, génération de déclarations trimestrielles pré-remplies. **Le Service ne constitue pas un conseil fiscal, comptable ou juridique.** Les calculs sont fournis à titre d'aide à la conformité ; l'utilisateur reste seul responsable de l'exactitude de ses déclarations fiscales et de leur dépôt auprès des administrations compétentes (DGI, Barid Al-Maghrib, CNSS). L'Opérateur ne transmet aucune déclaration au nom de l'utilisateur (voir `docs/system-design-moqawil.md`, aucune intégration SIMPL/DGI automatisée à ce jour).

### 3. Création de compte
L'accès au Service nécessite un compte, créé via authentification Google OAuth ou lien magique par courriel. L'utilisateur doit avoir au moins 18 ans et disposer de la capacité juridique de contracter. Un compte est personnel — le régime auto-entrepreneur étant par définition individuel (CLAUDE.md §2), aucun compte partagé ou multi-utilisateur n'est proposé en v0.1/v0.2.

### 4. Exactitude des données saisies
L'utilisateur est seul responsable de l'exactitude des informations qu'il saisit (identité, ICE, IF, informations client, montants facturés). Le Service applique les règles de calcul définies dans `packages/tax-engine` (taux, plafonds, seuils — voir CLAUDE.md §3, §9), fondées sur la Loi 114-13, la Loi de Finances 2023 et le CGI, mais ne vérifie pas l'exactitude des données sources fournies par l'utilisateur.

### 5. Tarification
**[À COMPLÉTER PAR LE PROPRIÉTAIRE]** — à la date de rédaction du présent brouillon, aucune facturation par abonnement n'est implémentée (Sprint 11 : "multi-tenancy first, billing later" — voir `.claude/sprint-backlog/sprint-11.md`). Si le Service est proposé gratuitement à titre temporaire, préciser explicitly la durée et les conditions de passage à un modèle payant. Ne pas publier ces CGU en laissant ce paragraphe vide.

### 6. Disponibilité et sauvegardes
Le Service est hébergé sur une infrastructure mono-serveur (VPS unique, sans redondance horizontale — voir `docs/system-design-moqawil.md` §5). L'Opérateur met en œuvre des sauvegardes automatisées de la base de données (`scripts/backup-db.sh`, voir runbook `docs/deployment-runbook-moqawil.md`) mais **ne garantit pas un taux de disponibilité contractuel (pas de SLA)** en l'absence d'infrastructure redondante. L'utilisateur conserve la responsabilité de conserver ses propres copies des factures et déclarations émises (export PDF), en complément des sauvegardes de l'Opérateur.

### 7. Propriété des données
Les données saisies par l'utilisateur (factures, clients, déclarations) lui appartiennent. L'utilisateur peut à tout moment exporter ses factures et déclarations au format PDF. En cas de résiliation de compte, voir §9.

### 8. Limitation de responsabilité
Dans toute la mesure permise par la loi marocaine, l'Opérateur ne saurait être tenu responsable : (a) des conséquences d'une déclaration fiscale incorrecte résultant de données erronées saisies par l'utilisateur ; (b) de la perte du statut auto-entrepreneur résultant du dépassement des seuils légaux (200 000 / 500 000 DH) ou du non-dépôt de déclarations, le Service n'étant qu'un outil d'aide et non un mandataire ; (c) d'une interruption de service, sous réserve du respect par l'Opérateur de ses obligations de sauvegarde (§6). **[CLAUSE À FAIRE VALIDER PAR UN AVOCAT — les limitations de responsabilité opposables à des consommateurs sont encadrées par le droit marocain de la consommation ; ce paragraphe est un point de départ, pas une clause opposable en l'état.]**

### 9. Résiliation
L'utilisateur peut supprimer son compte à tout moment depuis les paramètres du compte **[À VÉRIFIER : cette fonctionnalité existe-t-elle dans l'application au moment de la publication ? Si non, l'implémenter avant de promettre ce droit dans les CGU, ou fournir un canal de demande manuel (courriel) et le documenter ici].** L'Opérateur peut suspendre ou résilier un compte en cas d'usage abusif du Service (voir `docs/security-moqawil.md` §8, limiteur de débit sur les points d'authentification). En cas de résiliation, les données sont conservées **[DURÉE À DÉFINIR]** puis supprimées, sous réserve des obligations légales de conservation des factures (10 ans, CGI Article 211) qui incombent à l'utilisateur, non à l'Opérateur.

### 10. Droit applicable et juridiction
Les présentes CGU sont soumises au droit marocain. Tout litige relève de la compétence exclusive des tribunaux de **[VILLE — siège social de l'Opérateur]**, sous réserve des règles impératives de protection des consommateurs.

### 11. Modification des CGU
L'Opérateur peut modifier les présentes CGU. Les utilisateurs seront informés par courriel **[ET/OU bannière in-app]** au moins **[DÉLAI — ex. 30 jours]** avant l'entrée en vigueur de modifications substantielles.

### 12. Contact
**[ADRESSE COURRIEL DE CONTACT LÉGAL]**

---

## EN — Terms of Service (informational translation)

> This English version is provided for accessibility to non-Arabic/French-reading users (e.g., foreign clients researching the tool). **In case of conflict, the French version governs**, consistent with the product's French-first posture (root `CLAUDE.md` §10). Mirror the French sections 1–12 above; do not let this translation drift out of sync — regenerate it whenever the French text changes.

1. **Purpose** — These Terms govern the Moqawil-operated hosted instance at **[DOMAIN]**, operated by **[OPERATOR LEGAL NAME]**. They do not apply to self-hosted installations (AGPL-3.0, see §0).
2. **Service description** — Compliance tooling for Moroccan auto-entrepreneurs (Law 114-13): compliant invoicing, 80,000 MAD per-client cap tracking, annual threshold alerts, quarterly declaration generation. **Not tax, accounting, or legal advice.** No declarations are filed on the user's behalf.
3. **Account creation** — Google OAuth or email magic link. 18+, personal (non-shared) accounts only, matching the solo nature of the AE regime.
4. **Data accuracy** — User is solely responsible for the accuracy of entered data; calculations follow `packages/tax-engine`'s implementation of Law 114-13 / Finance Law 2023 / CGI rules, applied to whatever the user enters.
5. **Pricing** — **[OWNER TO COMPLETE]**.
6. **Availability & backups** — Single-VPS hosting, no horizontal redundancy, no contractual SLA; automated DB backups exist but users should keep their own PDF exports.
7. **Data ownership** — User-entered data belongs to the user; PDF export available at any time.
8. **Limitation of liability** — **[REQUIRES LAWYER SIGN-OFF]** — draft language limits liability for incorrect filings from user-entered errors, loss of AE status from threshold breaches, and service interruptions subject to the backup obligation.
9. **Termination** — **[VERIFY: does account self-deletion exist in-app before publishing this promise]**; abuse-based suspension per the rate-limiter posture in `docs/security-moqawil.md` §8.
10. **Governing law** — Moroccan law; courts of **[CITY]**, subject to mandatory consumer-protection rules.
11. **Changes to these Terms** — Email **[and/or in-app]** notice, **[X days]** before material changes take effect.
12. **Contact** — **[LEGAL CONTACT EMAIL]**.

---

## Handoff
→ **USER**: This draft requires (a) filling every `[bracketed placeholder]` with real legal-entity details, (b) review by a lawyer licensed in Morocco before publication, (c) a decision on §5 pricing before this can be published — do not link this document from the live product until both are done.
