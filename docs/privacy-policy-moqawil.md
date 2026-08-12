# Privacy Policy — Moqawil (Hosted Instance) / Politique de Confidentialité

**Version**: 0.1 — DRAFT | **Date**: 2026-08-12 | **Author**: PM + Security Engineer (Claude Code) | **Status**: DRAFT — PENDING LAWYER REVIEW, NOT LEGALLY IN EFFECT
**References**: `docs/security-moqawil.md` §1, §3, §7 | `docs/database-moqawil.md` | root `CLAUDE.md` §8 (data model)

> **⚠️ Legal status**: Same caveat as `docs/terms-of-service-moqawil.md` — this is an AI-drafted starting point, not a filed or lawyer-reviewed policy. CNDP (Morocco's data protection authority, Loi 09-08) compliance requires the operator to actually register as data controller (see `docs/cndp-registration-checklist-moqawil.md`) — publishing this document does not substitute for that filing.

---

## 0. Scope note — self-host vs. hosted

This Privacy Policy describes what **`[OPERATOR LEGAL NAME]`** does with personal data when you use the **Moqawil-operated hosted instance** at **[DOMAIN]**. If you self-host Moqawil (AGPL-3.0, `docker compose up -d` on your own server), no data ever reaches the operator — **you are the data controller for your own instance** under Loi 09-08, not `[OPERATOR LEGAL NAME]` (see `docs/security-moqawil.md` §3). This policy does not apply to self-hosted installs.

---

## FR — Politique de Confidentialité

### 1. Responsable du traitement
Pour l'instance hébergée, le responsable du traitement au sens de la Loi 09-08 est **[RAISON SOCIALE DE L'OPÉRATEUR]**, ICE **[ICE]**, **[ADRESSE]**, contact protection des données : **[COURRIEL DPO/CONTACT]**. Ce statut de responsable de traitement pour l'instance hébergée est nouveau depuis le Sprint 11 (`docs/security-moqawil.md` §1, §7) — auparavant, en mode auto-hébergé exclusif, chaque auto-hébergeur était son propre responsable de traitement.

### 2. Données collectées
Conformément au modèle de données (`CLAUDE.md` §8), le Service collecte :

| Catégorie | Données | Finalité |
|---|---|---|
| Compte utilisateur | Email, nom, photo (si connexion Google) | Authentification (Auth.js, OAuth Google ou lien magique par courriel) |
| Profil auto-entrepreneur | Nom complet, ICE (15 chiffres), IF, type d'activité, adresse, ville, téléphone, IBAN (optionnel) | Génération de factures et déclarations conformes |
| Clients de l'utilisateur | Nom, type (particulier / société marocaine / société étrangère), ICE (si B2B marocain), IF, email, téléphone, adresse, pays | Facturation, suivi du plafond de 80 000 DH par client |
| Factures et lignes de facture | Numéro, dates, statut, montants, devise, taux de change, description des prestations | Obligation légale de conservation (CGI Article 211, 10 ans) |
| Déclarations trimestrielles | CA trimestriel, taux, impôt dû, statut | Génération du document pré-rempli pour dépôt à Al Barid Bank |
| Données techniques | Adresse IP (limiteur de débit sur l'authentification uniquement, voir `docs/security-moqawil.md` §8), journaux d'erreur serveur | Sécurité, prévention des abus |

**Le Service ne collecte aucune donnée de paiement** (pas d'intégration Stripe/CMI/Adyen à ce jour — CLAUDE.md §5) et ne scrape aucune donnée personnelle depuis Bank Al-Maghrib (le taux de change BAM est une donnée publique de marché, sans lien avec une personne physique).

### 3. Base légale du traitement
- Exécution du contrat (CGU) : création de compte, génération de factures/déclarations.
- Obligation légale : conservation des factures 10 ans (CGI Article 211) — cette obligation incombe à l'utilisateur, mais le Service la facilite en conservant les documents pendant la durée du compte.
- Intérêt légitime : prévention des abus (limiteur de débit sur `/api/auth/*`).

### 4. Destinataires des données
Les données ne sont **transmises à aucun tiers à des fins commerciales**. Sous-traitants techniques nécessaires au fonctionnement du Service :
- **[HÉBERGEUR VPS — ex. OVH, Scaleway, à préciser]** — hébergement de la base de données et de l'application.
- **Google** (uniquement si l'utilisateur choisit la connexion OAuth Google) — authentification.
- **[FOURNISSEUR SMTP — ex. Resend, mentionné dans `.env.example`]** — envoi du lien magique de connexion et, si configuré, envoi de factures par courriel.
- Bank Al-Maghrib (`bkam.ma`) est une source consultée par le Service (taux de change), pas un destinataire de données utilisateur — aucune donnée personnelle ne lui est transmise.

Aucun transfert hors du Maroc n'est effectué à l'exception de l'hébergement technique lui-même **[À PRÉCISER : localisation du VPS choisi — si hors Maroc/UE, ajouter la clause de transfert international requise par la Loi 09-08]**.

### 5. Durée de conservation
- Factures et déclarations : conservées pendant toute la durée d'activité du compte, en cohérence avec l'obligation légale de 10 ans (CGI Article 211) qui pèse sur l'utilisateur.
- Compte : jusqu'à suppression par l'utilisateur ou résiliation (voir CGU §9).
- Journaux techniques (IP, tentatives de connexion) : **[DURÉE À DÉFINIR — recommandation : 6 à 12 mois maximum]**, finalité de sécurité uniquement.

### 6. Droits des personnes concernées (Loi 09-08)
Tout utilisateur peut exercer, en écrivant à **[COURRIEL CONTACT]** :
- **Droit d'accès** — obtenir une copie des données le concernant.
- **Droit de rectification** — corriger des données inexactes (déjà possible en libre-service pour la plupart des champs via les paramètres du compte).
- **Droit d'opposition et de suppression** — sous réserve des obligations légales de conservation des factures qui peuvent limiter une suppression immédiate et complète.
- **[SI APPLICABLE] Droit à la portabilité** — export PDF des factures/déclarations déjà disponible en v0.1 comme mécanisme de portabilité partielle.

### 7. Sécurité
Voir `docs/security-moqawil.md` pour le détail technique. Résumé : authentification sans mot de passe (OAuth/lien magique), filtrage systématique des requêtes par propriétaire (`entrepreneurId`) pour empêcher l'accès croisé entre clients hébergés, chiffrement en transit (HTTPS via Caddy), scans automatisés de sécurité en intégration continue (Semgrep, Trivy, Gitleaks). **Aucun audit de sécurité externe indépendant n'a été réalisé à ce jour** — voir `docs/pentest-scope-moqawil.md`, blocage de lancement suivi séparément.

### 8. Violation de données
En cas de violation de données à caractère personnel présentant un risque pour les droits des personnes concernées, l'Opérateur s'engage à notifier la CNDP et, le cas échéant, les personnes concernées, dans les meilleurs délais conformément à la Loi 09-08. **[PROCÉDURE INTERNE À DOCUMENTER SÉPARÉMENT — ce paragraphe engage l'Opérateur, la procédure opérationnelle doit exister avant publication.]**

### 9. Cookies
**[À COMPLÉTER — auditer les cookies réellement posés (session Auth.js, préférence de langue/locale FR-AR) avant publication ; le Service n'utilise à la connaissance de cette rédaction aucun cookie publicitaire ou de tracking tiers.]**

### 10. Contact et réclamation
Pour toute question : **[COURRIEL]**. Vous pouvez également adresser une réclamation à la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP), `cndp.ma`.

---

## EN — Privacy Policy (informational translation)

> Mirrors the French version above; **French governs in case of conflict**. Provided for accessibility (e.g., foreign clients).

1. **Data controller** — For the hosted instance: `[OPERATOR LEGAL NAME]`, contact `[EMAIL]`. Self-hosters remain their own data controller (§0).
2. **Data collected** — Account (email/name/photo), AE profile (name, ICE, IF, activity type, address, IBAN optional), client records, invoices/lines, quarterly declarations, technical logs (IP for auth rate-limiting only). No payment data collected (no Stripe/CMI/Adyen integration exists).
3. **Legal basis** — Contract performance, legal retention obligation (10-year invoice conservation, CGI Art. 211 — the user's obligation, facilitated by the Service), legitimate interest (abuse prevention).
4. **Recipients** — No commercial third-party sharing. Technical processors: VPS host `[TO SPECIFY]`, Google (only if OAuth chosen), SMTP provider `[TO SPECIFY]`. BAM rate scraping touches no personal data.
5. **Retention** — Invoices/declarations for account lifetime (aligned with the user's 10-year CGI obligation); technical logs `[6–12 months recommended]`.
6. **Rights** — Access, rectification, objection/erasure (subject to legal retention limits), partial portability via existing PDF export.
7. **Security** — See `docs/security-moqawil.md`; passwordless auth, per-tenant ownership filtering, HTTPS, CI security scanning. **No independent external audit performed yet** — tracked in `docs/pentest-scope-moqawil.md`.
8. **Breach notification** — CNDP + affected users notified per Loi 09-08; internal procedure to be documented before publication.
9. **Cookies** — **[TO COMPLETE after an actual cookie audit]**.
10. **Contact / complaints** — `[EMAIL]`; CNDP (`cndp.ma`) for regulatory complaints.

---

## Handoff
→ **USER**: Requires (a) real operator legal-entity details in every bracket, (b) an actual cookie audit before §9 is filled in truthfully, (c) lawyer review, (d) the CNDP registration in `docs/cndp-registration-checklist-moqawil.md` actually filed — this policy describes intended practice, filing is what makes the controller status real.
