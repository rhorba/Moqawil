---
id: guide-devis
title: Devis
sidebar_position: 3.5
---

# Guide des devis

## Qu'est-ce qu'un devis dans Moqawil ?

Un devis est une **estimation envoyée à un client avant facturation** — utile pour proposer un prix
et obtenir un accord avant de démarrer une mission. Contrairement à la facture :

- Il **n'a aucune valeur comptable ni fiscale**
- Il **ne compte jamais** dans le plafond de 80 000 DH par client ni dans le seuil de chiffre
  d'affaires annuel
- Il n'est soumis à aucune des mentions obligatoires de l'Article 145 du CGI (numérotation
  séquentielle, TVA, etc.) — ces règles s'appliquent uniquement à la facture

:::info
Un devis Moqawil ne devient une pièce fiscale qu'une fois **converti en facture**.
:::

## Créer un devis

Allez dans **Devis → Nouveau devis** :

1. **Sélectionnez le client**
2. **Date d'émission** et **date de validité** (30 jours par défaut)
3. **Devise** — MAD par défaut, ou EUR/USD/GBP/CAD/CHF avec le taux Bank Al-Maghrib
4. **Lignes** — description, quantité, prix unitaire

Le devis obtient un numéro dans sa propre séquence, au format `DEVIS-2026-001`, indépendante de la
numérotation des factures.

## Cycle de vie d'un devis

| Statut | Description |
|---|---|
| **Brouillon** | Modifiable librement. |
| **Envoyé** | Transmis au client (PDF téléchargeable). |
| **Accepté** | Le client a donné son accord — prêt à convertir en facture. |
| **Refusé** | Le client a décliné. Ne peut plus être converti. |
| **Expiré** | La date de validité est dépassée. Ne peut plus être converti. |

## Convertir un devis en facture

Depuis la page de détail du devis, cliquez sur **Convertir en facture**. Moqawil crée alors une
**vraie facture** :

- Numérotée dans la **même séquence** que vos factures créées directement (`FACT-2026-00X`) —
  aucune numérotation parallèle, aucun risque de collision
- Soumise au **même contrôle du plafond de 80 000 DH** que la création directe d'une facture : si
  la conversion ferait dépasser le plafond pour ce client, la même boîte de dialogue de
  confirmation apparaît
- Les lignes, le client et la devise du devis sont repris automatiquement

Un devis ne peut être converti qu'une seule fois. Le devis reste consultable et affiche un lien
vers la facture résultante.

:::caution
Un devis **refusé** ou **expiré** ne peut plus être converti — créez une nouvelle facture
directement si le client change d'avis après expiration.
:::

## Télécharger le PDF

Le PDF d'un devis reprend la mise en page d'une facture mais porte la mention **« DEVIS »** et un
encadré explicite rappelant qu'il ne s'agit pas d'une facture, avec la date de validité en
évidence.
