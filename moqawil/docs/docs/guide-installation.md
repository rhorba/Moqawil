---
id: guide-installation
title: Installation
sidebar_position: 2
---

# Guide d'installation

Moqawil s'installe en 5 minutes sur n'importe quel VPS Ubuntu 22.04+.

## Prérequis

- Ubuntu 22.04+ (ou Debian 12+)
- Docker + Docker Compose installés
- Un nom de domaine (optionnel — fonctionne aussi en local)

## Installation rapide

### 1. Cloner le dépôt

```bash
git clone https://github.com/rhorba/Moqawil.git
cd Moqawil/moqawil
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez `.env` avec vos valeurs :

```dotenv
# Générez avec : openssl rand -hex 32
AUTH_SECRET=votre_secret_ici

# Base de données (les valeurs par défaut fonctionnent avec docker-compose)
POSTGRES_USER=moqawil
POSTGRES_PASSWORD=changeme_en_prod
DATABASE_URL=postgresql://moqawil:changeme_en_prod@postgres:5432/moqawil

# Authentification Google (optionnel)
# Créez des identifiants sur https://console.cloud.google.com/
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Votre domaine (pour Caddy HTTPS automatique)
APP_DOMAIN=moqawil.votre-domaine.ma
NEXT_PUBLIC_APP_URL=https://moqawil.votre-domaine.ma
```

### 3. Démarrer

```bash
docker compose up -d
```

Caddy configure automatiquement le certificat HTTPS si `APP_DOMAIN` est renseigné.

### 4. Appliquer les migrations

```bash
docker compose exec web pnpm db:migrate
```

### 5. Accéder à l'application

Ouvrez `https://votre-domaine.ma` (ou `http://localhost` en local).

---

## Développement local

### Prérequis

- Node.js 22+, pnpm 9+, Docker

```bash
git clone https://github.com/rhorba/Moqawil.git
cd Moqawil/moqawil
pnpm install
cp .env.example .env

# Démarrer uniquement la base de données
docker compose up -d postgres

# Appliquer les migrations
pnpm db:migrate

# Lancer le serveur de développement
pnpm dev
```

L'application est accessible sur `http://localhost:3000`.

---

## Mise à jour

```bash
git pull
docker compose pull
docker compose up -d
docker compose exec web pnpm db:migrate
```

---

## Variables d'environnement

| Variable | Requis | Description |
|---|---|---|
| `AUTH_SECRET` | ✅ | Clé de signature des sessions (32 octets hex) |
| `DATABASE_URL` | ✅ | URL de connexion PostgreSQL |
| `AUTH_GOOGLE_ID` | Non | Client ID Google OAuth |
| `AUTH_GOOGLE_SECRET` | Non | Client Secret Google OAuth |
| `AUTH_RESEND_KEY` | Non | Clé API Resend pour les liens magiques email |
| `APP_DOMAIN` | Non | Domaine pour Caddy HTTPS automatique |
| `NEXT_PUBLIC_APP_URL` | Non | URL publique de l'application |

:::caution
Ne committez jamais le fichier `.env` dans git. Il est exclu par défaut dans `.gitignore`.
:::

---

## Auto-hébergement — Notes

- **HTTPS** : Caddy gère Let's Encrypt automatiquement si `APP_DOMAIN` est configuré.
- **Sauvegardes** : Le volume PostgreSQL est dans `postgres_data`. Sauvegardez-le régulièrement.
- **Authentification sans Google** : Sans `AUTH_GOOGLE_ID`, seul l'email magic link (via Resend) fonctionne.
- **Conservation des données** : CGI Article 211 impose 10 ans de conservation des factures. Ne supprimez jamais les volumes PostgreSQL.
