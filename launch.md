# Guide de déploiement Ryzer sur Raspberry Pi

Ce document couvre tout ce qu'il faut faire pour faire tourner Ryzer en production sur un Raspberry Pi : API, base de données, app mobile.

---

## Architecture cible

```
Internet
   │
   ▼
Cloudflare Tunnel (ou port forwarding)
   │
   ▼
Raspberry Pi
   ├── Nginx (reverse proxy HTTPS)
   │     └── → API Express (port 8080)
   └── PostgreSQL (port 5432)

App mobile (APK installé sur téléphone)
   └── → https://ton-domaine.com/api
```

---

## Partie 1 — Préparer le Raspberry Pi

### 1.1 Installer Node.js (v22+)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # doit afficher v22.x
```

### 1.2 Installer pnpm

```bash
npm install -g pnpm
pnpm --version
```

### 1.3 Installer PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Créer la base et l'utilisateur :

```bash
sudo -u postgres psql
```

```sql
CREATE USER ryzer WITH PASSWORD 'ton_mot_de_passe_db';
CREATE DATABASE ryzerdb OWNER ryzer;
GRANT ALL PRIVILEGES ON DATABASE ryzerdb TO ryzer;
\q
```

### 1.4 Installer PM2 (gestionnaire de processus)

```bash
npm install -g pm2
pm2 startup  # suivre les instructions affichées
```

### 1.5 Installer Git

```bash
sudo apt-get install -y git
```

---

## Partie 2 — Déployer le code

### 2.1 Cloner le dépôt

```bash
cd ~
git clone <url-du-repo> ryzer
cd ryzer
```

### 2.2 Installer les dépendances

```bash
pnpm install
```

### 2.3 Configurer les variables d'environnement

Créer un fichier `.env` dans `artifacts/api-server/` :

```bash
nano artifacts/api-server/.env
```

Contenu du `.env` :

```env
NODE_ENV=production
PORT=8080

# Base de données (ta DB sur le Pi ou externe)
RYZER_DATABASE_URL=postgresql://ryzer:ton_mot_de_passe_db@localhost:5432/ryzerdb

# Clerk (récupère sur dashboard.clerk.com → API Keys)
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx

# Admin (interface /admin)
ADMIN_EMAIL=ton@email.com
ADMIN_PASSWORD=ton_mot_de_passe_admin

# JWT (chaîne aléatoire longue, ex: openssl rand -hex 64)
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Générer un JWT_SECRET si besoin :

```bash
openssl rand -hex 64
```

### 2.4 Appliquer les migrations de base de données

```bash
pnpm --filter @workspace/db run push
```

> Cela crée toutes les tables nécessaires dans ta DB.

### 2.5 Builder l'API

```bash
pnpm --filter @workspace/api-server run build
```

Le build est dans `artifacts/api-server/dist/`.

---

## Partie 3 — Lancer l'API avec PM2

### 3.1 Créer le fichier de config PM2

```bash
nano ecosystem.config.cjs
```

```js
module.exports = {
  apps: [
    {
      name: "ryzer-api",
      script: "node",
      args: "--enable-source-maps ./dist/index.mjs",
      cwd: "./artifacts/api-server",
      env_file: "./artifacts/api-server/.env",
      watch: false,
      restart_delay: 3000,
    },
  ],
};
```

### 3.2 Démarrer

```bash
pm2 start ecosystem.config.cjs
pm2 save  # sauvegarde pour redémarrage auto au boot
```

### 3.3 Vérifier

```bash
pm2 logs ryzer-api
curl http://localhost:8080/api/healthz
# doit répondre : {"status":"ok"}
```

---

## Partie 4 — Nginx + HTTPS

### 4.1 Installer Nginx

```bash
sudo apt-get install -y nginx
```

### 4.2 Option A — Cloudflare Tunnel (recommandé, sans port forwarding)

```bash
# Installer cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Authentifier et créer le tunnel
cloudflared tunnel login
cloudflared tunnel create ryzer
cloudflared tunnel route dns ryzer api.ton-domaine.com
```

Créer `~/.cloudflared/config.yml` :

```yaml
tunnel: ryzer
credentials-file: /home/pi/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.ton-domaine.com
    service: http://localhost:8080
  - service: http_status:404
```

```bash
cloudflared tunnel run ryzer &
```

### 4.2 Option B — Port forwarding classique + Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# Config nginx
sudo nano /etc/nginx/sites-available/ryzer
```

```nginx
server {
    server_name api.ton-domaine.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ryzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d api.ton-domaine.com
```

---

## Partie 5 — Builder l'app mobile (APK)

L'APK doit être buildé **avant** de changer d'URL d'API, car l'URL est baked dans le bundle.

### 5.1 Configurer l'URL de l'API dans l'app

Dans `artifacts/ryzer-app/.env` (créer si absent) :

```env
EXPO_PUBLIC_DOMAIN=api.ton-domaine.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
```

Ou modifier directement dans `artifacts/ryzer-app/package.json`, script `dev`, la variable `EXPO_PUBLIC_DOMAIN`.

### 5.2 Builder l'APK avec EAS

```bash
# Depuis le shell Replit (pas le Pi)
cd artifacts/ryzer-app

# Login EAS (compte ryzertracker)
pnpm exec eas login

# Builder l'APK Android
pnpm exec eas build --platform android --profile preview
```

EAS build sur ses serveurs cloud (~5-10 min) et te donne un lien de téléchargement.

### 5.3 Installer l'APK sur Android

- Télécharge l'APK depuis le lien EAS
- Transfère sur le téléphone (USB, email, Drive…)
- Active "Sources inconnues" dans les paramètres Android
- Installe le fichier `.apk`

---

## Partie 6 — Mises à jour

Pour mettre à jour l'API après un changement de code :

```bash
cd ~/ryzer
git pull
pnpm install
pnpm --filter @workspace/api-server run build
pm2 restart ryzer-api
```

Pour mettre à jour les migrations DB :

```bash
pnpm --filter @workspace/db run push
```

---

## Récapitulatif des variables d'environnement

| Variable | Description | Où la trouver |
|---|---|---|
| `RYZER_DATABASE_URL` | URL PostgreSQL | Toi-même (voir Partie 2.3) |
| `CLERK_SECRET_KEY` | Clé secrète Clerk | dashboard.clerk.com → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Clé publique Clerk | dashboard.clerk.com → API Keys |
| `ADMIN_EMAIL` | Email compte admin | Ton choix |
| `ADMIN_PASSWORD` | Mot de passe admin | Ton choix |
| `JWT_SECRET` | Clé signature JWT | `openssl rand -hex 64` |
| `PORT` | Port API (défaut 8080) | Ton choix |

---

## Vérification finale

```bash
# API répond
curl https://api.ton-domaine.com/api/healthz

# DB connectée
pm2 logs ryzer-api | grep -i "listening"

# App mobile
# → Ouvrir l'APK installé → se connecter → vérifier que le profil charge
```
