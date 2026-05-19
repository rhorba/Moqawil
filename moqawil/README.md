# Moqawil — Toolkit de conformité auto-entrepreneur marocain

> Suivi du plafond de 80 000 DH par client, alertes de seuil annuel, déclarations trimestrielles pré-remplies, facturation légale.
> **AGPL-3.0 · Open source · Auto-hébergeable · Gratuit**

---

## Démarrage en 5 commandes

```bash
git clone https://github.com/moqawil/moqawil.git
cd moqawil
cp .env.example .env          # Éditez DATABASE_URL + AUTH_SECRET (openssl rand -hex 32)
docker compose up -d          # Démarre PostgreSQL + l'application + Caddy (HTTPS auto)
docker compose exec web pnpm db:migrate  # Applique le schéma initial
```

L'application est disponible sur `https://votre-domaine.com` (ou `http://localhost:3000` en local).

---

## Développement local

```bash
# Prérequis: Node 22+, pnpm 9+, Docker
pnpm install
docker compose up -d postgres   # Démarre PostgreSQL seulement
pnpm db:migrate                  # Applique les migrations
pnpm dev                         # Serveur Next.js sur http://localhost:3000
```

### Scripts utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur de développement Next.js |
| `pnpm build` | Build de production |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Tests end-to-end (Playwright) |
| `pnpm db:migrate` | Applique les migrations Drizzle |
| `pnpm db:studio` | Drizzle Studio (UI base de données) |
| `pnpm lint` | Vérification Biome |
| `pnpm format` | Formatage automatique |

---

## Stack technique

| Technologie | Choix |
|---|---|
| Framework | Next.js 15 (App Router) |
| Base de données | PostgreSQL 16 + Drizzle ORM |
| Authentification | Auth.js v5 (Google OAuth + lien magique) |
| UI | Tailwind CSS v4 + shadcn/ui |
| i18n | next-intl (FR + AR RTL) |
| PDF | @react-pdf/renderer |
| Monnaie | dinero.js (arithmétique MAD) |
| Tests | Vitest + Playwright |
| Proxy | Caddy (HTTPS automatique) |

---

## Architecture du monorepo

```
moqawil/
├── apps/web/              # Application Next.js 15
├── packages/
│   ├── tax-engine/        # Règles fiscales marocaines (Apache-2.0)
│   ├── db/                # Schéma Drizzle + migrations
│   ├── i18n/              # Utilitaires de traduction
│   └── pdf-templates/     # Templates React-PDF
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## Fonctionnalités (v0.1)

- **Génération de factures conformes** — tous les champs obligatoires CGI Article 145
- **Suivi du plafond 80 000 DH par client** — badge 3 couleurs visible partout
- **Alertes de seuil annuel** — 200 000 DH (services) ou 500 000 DH (commercial/artisanal)
- **Déclarations trimestrielles** — PDF pré-rempli pour Barid Al-Maghrib
- **Facturation devise étrangère** — taux BAM intégré
- **Interface bilingue** — Français + Arabe (RTL)
- **Auto-hébergeable** — `docker compose up -d` sur n'importe quel VPS Ubuntu

---

## Licence

- Application : **AGPL-3.0** — les modifications doivent être partagées
- Moteur fiscal (`packages/tax-engine`) : **Apache-2.0** — librement embarquable

---

*Construit pour les ~400 000 auto-entrepreneurs marocains qui méritent de meilleurs outils.*
