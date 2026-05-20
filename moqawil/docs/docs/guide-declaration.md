---
id: guide-declaration
title: Déclarations trimestrielles
sidebar_position: 4
---

# Déclarations trimestrielles

## Comprendre l'obligation

En tant qu'auto-entrepreneur marocain, vous devez déclarer votre chiffre d'affaires **chaque trimestre** à Al Barid Bank (ou une banque partenaire : Attijariwafa, BMCE, CIH…).

**Délais de dépôt :**

| Trimestre | Période | Délai |
|---|---|---|
| T1 | Janvier–Mars | **30 avril** |
| T2 | Avril–Juin | **31 juillet** |
| T3 | Juillet–Septembre | **31 octobre** |
| T4 | Octobre–Décembre | **31 janvier (année suivante)** |

:::danger Déclaration à zéro obligatoire
Même si votre CA est **nul** pour un trimestre, la déclaration est obligatoire.

**Deux déclarations nulles consécutives** à partir de l'année 2 d'activité entraînent la **perte automatique du statut auto-entrepreneur**.
:::

---

## Taux d'imposition

L'impôt AE est calculé sur le **chiffre d'affaires** (et non sur le bénéfice) :

| Type d'activité | Taux |
|---|---|
| Services (développement, design, consulting…) | **1,0 %** du CA trimestriel |
| Commercial / Industriel / Artisanal | **0,5 %** du CA trimestriel |

Cet impôt est libératoire — il couvre intégralement votre obligation fiscale sur ce revenu.

---

## Générer une déclaration dans Moqawil

### Étape 1 — Aller dans Déclarations

Cliquez sur **Déclarations** dans la navigation. Vous voyez les 4 trimestres de l'année en cours avec leur statut et leur délai.

### Étape 2 — Calculer le CA trimestriel

Cliquez sur **Générer** pour le trimestre souhaité.

Moqawil calcule automatiquement :
- Le **CA trimestriel** = somme des `totalMad` de toutes les factures dont le statut est `Payée` et dont la `paymentDate` tombe dans la fenêtre trimestrielle
- L'**impôt dû** = CA × taux (1 % ou 0,5 % selon votre activité)

### Étape 3 — Imprimer le PDF

Cliquez sur **Imprimer PDF**. Le document est pré-rempli avec :

- Vos coordonnées (nom, ICE, IF, adresse)
- L'année et le trimestre
- Le CA déclaré en MAD
- L'impôt dû en MAD
- Les mentions bilingues (FR + AR) conformes aux formulaires Barid Al-Maghrib

### Étape 4 — Déposer à la banque

Imprimez le PDF, signez-le, et déposez-le à Al Barid Bank ou une banque partenaire avec le règlement correspondant (chèque ou virement au Trésor).

### Étape 5 — Marquer comme soumise

Après le dépôt, cliquez sur **Marquer soumise** dans Moqawil. La carte du trimestre passe au vert et enregistre la date de soumission.

---

## Naviguer entre les années

Utilisez les flèches de navigation en haut à droite de la page Déclarations pour consulter les années précédentes.

---

## Seuil annuel et perte du statut

:::caution Seuil annuel de CA
- **Services** : **200 000 DH/an**
- **Commercial / Industriel / Artisanal** : **500 000 DH/an**

Moqawil affiche un widget sur le tableau de bord indiquant votre progression en temps réel.
:::

| Couleur | Seuil atteint | Action recommandée |
|---|---|---|
| 🟢 Vert | 0–69 % | Aucune — continuez |
| 🟡 Ambre | 70–99 % | Anticipez : consultez un expert-comptable |
| 🔴 Rouge | ≥ 100 % | Alerte — dépassement pour la 2e année = perte du statut AE |

**Dépasser le seuil deux années consécutives** entraîne la migration forcée vers le régime général (IR progressif 0–37 % + TVA).

---

## Intégration SIMPL (future)

Le portail fiscal DGI (tax.gov.ma) ne propose pas encore d'API publique pour les déclarations AE. Moqawil génère un PDF pré-rempli qui reproduit la mise en page du formulaire officiel.

Une intégration directe avec SIMPL est prévue dès qu'une API sera disponible — restez informé sur [GitHub](https://github.com/rhorba/Moqawil).

---

## CNSS / AMO

Les cotisations sociales (CNSS / AMO) sont **hors scope de Moqawil v0.1**. Elles sont prélevées automatiquement par prélèvement bancaire mensuel. Consultez votre banque ou le portail CNSS pour les montants.
