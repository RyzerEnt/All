# Ryzer - Site Vitrine

## Architecture

Monorepo pnpm avec 3 artifacts :

- **ryzer-site** (`artifacts/ryzer-site/`) — Site vitrine React + Vite + Tailwind CSS, servi sur `/` (port 25115)
- **api-server** (`artifacts/api-server/`) — API Express.js, servie sur `/api` (port 8080)
- **mockup-sandbox** (`artifacts/mockup-sandbox/`) — Sandbox de design, servi sur `/__mockup`

## Bibliothèques partagées (`lib/`)

- **@workspace/db** — Schéma Drizzle ORM + connexion PostgreSQL
- **@workspace/api-spec** — Spec OpenAPI + codegen Orval
- **@workspace/api-zod** — Schémas Zod générés
- **@workspace/api-client-react** — Hooks React Query générés

## Base de données

PostgreSQL provisionné via Replit. Variables d'environnement : `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

Schéma : table `roadmap_items` (id, title, description, status, quarter, sort_order, created_at, updated_at).

Migration : `pnpm --filter @workspace/db run push`

## Authentification

JWT simple avec admin unique. Credentials stockés dans les variables d'environnement :
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`

## Routes API

- `GET /api/healthz` — Health check
- `POST /api/auth/login` — Connexion admin
- `GET /api/roadmap` — Liste des items roadmap (public)
- `POST /api/roadmap` — Créer un item (admin)
- `PUT /api/roadmap/:id` — Mettre à jour un item (admin)
- `DELETE /api/roadmap/:id` — Supprimer un item (admin)

## Workflows

- `artifacts/ryzer-site: web` — Frontend dev server
- `artifacts/api-server: API Server` — Backend API server

## Pages frontend

- `/` — Page d'accueil (site vitrine)
- `/admin` — Interface d'administration
