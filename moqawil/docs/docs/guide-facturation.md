---
id: guide-facturation
title: Facturation
sidebar_position: 3
---

# Guide de facturation

## Créer une facture

### 1. Configurer votre profil AE

Avant de créer votre première facture, renseignez votre profil auto-entrepreneur dans **Paramètres** :

- **Nom complet** (tel qu'inscrit au RNAE)
- **ICE** — Identifiant Commun de l'Entreprise (15 chiffres, obligatoire depuis 2021)
- **IF** — Identifiant Fiscal
- **Type d'activité** — Commercial, Industriel, Artisanal ou **Services** (détermine le taux d'imposition)
- **Adresse** et ville
- **Préfixe de facture** — ex. `FACT` → donnera `FACT-2026-001`

### 2. Créer un client

Allez dans **Clients → Nouveau client** :

| Champ | Entreprise MA | Particulier | Client étranger |
|---|---|---|---|
| Nom | ✅ | ✅ | ✅ |
| ICE | ✅ obligatoire | — | — |
| Email | Recommandé | Recommandé | Recommandé |
| Adresse | ✅ | ✅ | ✅ |

:::info Plafond 80 000 DH
Si vous êtes en activité **service**, un badge coloré indique en temps réel la limite restante pour chaque client.
:::

### 3. Créer la facture

Allez dans **Factures → Nouvelle facture** :

1. **Sélectionnez le client** — le badge de plafond s'affiche immédiatement
2. **Date d'émission** et date d'échéance (optionnel)
3. **Devise** — MAD par défaut. Sélectionnez EUR/USD/GBP pour une facturation en devises
4. **Lignes de facture** — description, quantité, prix unitaire
5. **Mode de paiement** — requis pour les factures > 5 000 DH à un professionnel

### 4. Champs obligatoires (CGI Article 145)

Moqawil pré-remplit automatiquement toutes les mentions légales :

- ✅ Le mot « Facture »
- ✅ Numéro séquentiel sans saut (`FACT-2026-001`, `FACT-2026-002`…)
- ✅ Date d'émission
- ✅ Vos coordonnées complètes (nom, adresse, ICE, IF)
- ✅ Coordonnées du client (ICE obligatoire pour les entreprises marocaines)
- ✅ Désignation, quantité, prix unitaire, total HT
- ✅ Mention **« TVA non applicable — Régime auto-entrepreneur (Loi 114-13) »**
- ✅ Mode de paiement

---

## Le plafond de 80 000 DH par client

:::danger Règle critique — Finance Law 2023, CGI Art. 73-II-G-8°
Au-delà de **80 000 DH facturés à un même client dans l'année civile**, votre client est légalement obligé de retenir **30 % à la source** sur le surplus et de le verser à la DGI.

Cette retenue est une perte sèche pour vous — elle ne peut pas être récupérée.
:::

### Les trois états du badge

| Couleur | Seuil | Message |
|---|---|---|
| 🟢 Vert | 0–69 % | Limite restante : X DH |
| 🟡 Ambre | 70–99 % | Attention — retenue de 30 % au-delà de 80 000 DH |
| 🔴 Rouge | ≥ 100 % | Plafond atteint — dialog de confirmation obligatoire |

### À la création de facture

Si le total cumulé avec ce client **dépasserait** 80 000 DH, une boîte de dialogue de confirmation apparaît :

> "Voulez-vous vraiment dépasser le plafond de 80 000 DH avec [Client] ? Votre client devra retenir 30 % sur le surplus de [X] DH."

Vous pouvez confirmer ou annuler. Moqawil enregistre votre choix et crée la facture avec la mention appropriée dans le PDF.

---

## Facturation en devises étrangères

Moqawil prend en charge la facturation en EUR, USD, GBP, CHF et CAD.

### Règles applicables (Office des Changes)

- Les AE peuvent exporter des **services** (développement, design, consulting). Pas de biens physiques.
- Le paiement doit être **rapatrié en MAD dans les 3 mois**.
- Votre CA est déclaré en **MAD** pour l'impôt.

### Dans Moqawil

1. Sélectionnez la devise dans le formulaire de facture
2. Moqawil récupère automatiquement le **taux de référence Bank Al-Maghrib** (bkam.ma)
3. Si la récupération échoue, saisissez le taux manuellement
4. Le PDF affiche le montant en devise ET l'équivalent MAD au taux du jour d'encaissement

---

## Télécharger le PDF

Depuis la page de détail d'une facture, cliquez sur **Télécharger PDF**.

Le PDF est bilingue : les mentions légales apparaissent en français et en arabe, côte à côte.

---

## Règles de paiement importantes

| Règle | Seuil | Base légale |
|---|---|---|
| Virement ou chèque obligatoire | > 5 000 DH entre professionnels | CGI Art. 145 |
| Pénalité acheteur si paiement espèces | > 20 000 DH | CGI Art. 193 |
| Conservation de la facture | 10 ans | CGI Art. 211 |

---

## Changer le statut d'une facture

| Statut | Description |
|---|---|
| **Brouillon** | Modifiable. Numéro réservé, non définitif. |
| **Envoyée** | PDF transmis au client. Numéro définitif. |
| **Payée** | Contribue au CA trimestriel et au suivi de plafond. |
| **Annulée** | La facture est conservée (obligation 10 ans) mais exclue des totaux. |

:::caution
Une facture **Payée** ne peut plus être modifiée — la numérotation séquentielle et l'intégrité fiscale l'exigent.
:::
