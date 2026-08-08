---
id: guide-e-facturation
title: Export e-facturation (UBL 2.1)
sidebar_position: 5
---

# Export e-facturation (UBL 2.1)

## Ce que c'est

Depuis toute facture **envoyée** ou **payée** (pas les brouillons), vous pouvez télécharger un fichier XML au format **UBL 2.1** (Universal Business Language), un standard international ouvert utilisé pour l'échange de factures électroniques.

Ce fichier contient les mêmes mentions légales obligatoires que le PDF (article 145 du CGI) : numéro de facture séquentiel, dates, coordonnées complètes (ICE/IF), désignation et montants des lignes, et la mention « TVA non applicable — Régime auto-entrepreneur (Loi 114-13) ».

## Ce que ce n'est PAS

:::danger Important — à lire avant d'utiliser ce fichier
- **Ce n'est pas une facture électronique certifiée par la DGI.** Aucune transmission n'est effectuée vers la plateforme de facturation électronique de la DGI (opérée par xHub).
- **Ce n'est pas signé électroniquement.** Aucune signature qualifiée (QES/AES via Barid eSign) n'est appliquée.
- **Cela ne remplace pas votre PDF** comme document de référence légal — le PDF reste la facture officielle que vous envoyez à vos clients.
:::

## Pourquoi ce fichier existe déjà

Le calendrier de la facturation électronique obligatoire au Maroc est progressif : grandes entreprises (2026), moyennes entreprises (juillet 2026), puis TPE/PME et indépendants dont le chiffre d'affaires dépasse 500 000 DH (janvier 2027). Le statut exact des auto-entrepreneurs dans ce calendrier n'est pas encore confirmé par une circulaire DGI précise — **avant de faire reposer une décision sur ce point, consultez un expert-comptable**.

Ce qui est certain : certains de vos clients professionnels, soumis plus tôt à cette obligation, pourraient apprécier de recevoir un fichier structuré que leur propre système comptable peut traiter automatiquement. Ce fichier UBL 2.1 sert cet usage dès aujourd'hui, sans attendre la confirmation réglementaire.

## Télécharger le fichier

Depuis la page de détail d'une facture envoyée ou payée, cliquez sur **Télécharger XML (UBL 2.1)**, à côté du bouton de téléchargement PDF.

## Et la vraie transmission DGI ?

C'est prévu, mais pas encore construit — l'accès à la plateforme DGI/xHub (API, bac à sable) n'est pas encore confirmé disponible, et la signature électronique Barid eSign nécessite un compte professionnel séparé. L'architecture est prête à intégrer ces deux éléments (voir `docs/architecture-sprint4-e-invoicing.md` dans le dépôt) le jour où ils seront accessibles, sans qu'aucun changement ne soit nécessaire dans votre façon de créer des factures.
