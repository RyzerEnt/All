# Guide de déploiement Ryzer sur Raspberry Pi

Ce document couvre tout ce qu'il faut faire pour faire tourner Ryzer en production sur un Raspberry Pi : API, base de données, site vitrine, calculateur sport et app mobile.

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
   │     ├── api.ton-domaine.com      → API Express (port 8080)
   │     ├── ryzer.ton-domaine.com    → Site vitrine (fichiers statiques)
   │     └── calc.ton-domaine.com     → Calculateur sport (fichiers statiques)
   └── PostgreSQL (port 5432)

App mobile (APK installé sur téléphone)
   └── → https://api.ton-domaine.com/api
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

### 1.5 Installer Git et Nginx

```bash
sudo apt-get install -y git nginx
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

### 2.3 Configurer les variables d'environnement de l'API

Créer un fichier `.env` dans `artifacts/api-server/` :

```bash
nano artifacts/api-server/.env
```

Contenu du `.env` :

```env
NODE_ENV=production
PORT=8080

# Base de données
RYZER_DATABASE_URL=postgresql://ryzer:ton_mot_de_passe_db@localhost:5432/ryzerdb

# Clerk (récupère sur dashboard.clerk.com → API Keys)
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx

# Admin (interface /admin)
ADMIN_EMAIL=ton@email.com
ADMIN_PASSWORD=ton_mot_de_passe_admin

# JWT (chaîne aléatoire longue)
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Générer un JWT_SECRET :

```bash
openssl rand -hex 64
```

### 2.4 Appliquer les migrations de base de données

```bash
pnpm --filter @workspace/db run push
```

### 2.5 Builder tous les projets

```bash
# API
pnpm --filter @workspace/api-server run build

# Site vitrine
pnpm --filter @workspace/ryzer-site run build

# Calculateur sport
pnpm --filter @workspace/test-app run build
```

Les fichiers statiques sont dans :
- `artifacts/ryzer-site/dist/`
- `artifacts/test-app/dist/`
- `artifacts/api-server/dist/`

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
pm2 save
```

### 3.3 Vérifier

```bash
pm2 logs ryzer-api
curl http://localhost:8080/api/healthz
# doit répondre : {"status":"ok"}
```

---

## Partie 4 — Nginx : servir les sites web

### 4.1 Site vitrine (ryzer.ton-domaine.com)

```bash
sudo nano /etc/nginx/sites-available/ryzer-site
```

```nginx
server {
    server_name ryzer.ton-domaine.com;

    root /home/pi/ryzer/artifacts/ryzer-site/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

### 4.2 Calculateur sport (calc.ton-domaine.com)

```bash
sudo nano /etc/nginx/sites-available/sport-calc
```

```nginx
server {
    server_name calc.ton-domaine.com;

    root /home/pi/ryzer/artifacts/test-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

### 4.3 API (api.ton-domaine.com)

```bash
sudo nano /etc/nginx/sites-available/ryzer-api
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

### 4.4 Activer les sites et recharger Nginx

```bash
sudo ln -s /etc/nginx/sites-available/ryzer-site /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/sport-calc /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ryzer-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Partie 5 — HTTPS avec Let's Encrypt (ou Cloudflare Tunnel)

### Option A — Cloudflare Tunnel (recommandé, sans port forwarding)

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

cloudflared tunnel login
cloudflared tunnel create ryzer
cloudflared tunnel route dns ryzer ryzer.ton-domaine.com
cloudflared tunnel route dns ryzer calc.ton-domaine.com
cloudflared tunnel route dns ryzer api.ton-domaine.com
```

Créer `~/.cloudflared/config.yml` :

```yaml
tunnel: ryzer
credentials-file: /home/pi/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: ryzer.ton-domaine.com
    service: http://localhost:80
  - hostname: calc.ton-domaine.com
    service: http://localhost:80
  - hostname: api.ton-domaine.com
    service: http://localhost:8080
  - service: http_status:404
```

```bash
cloudflared service install
sudo systemctl start cloudflared
```

### Option B — Let's Encrypt (port forwarding requis)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ryzer.ton-domaine.com -d calc.ton-domaine.com -d api.ton-domaine.com
```

---

## Partie 6 — Builder l'app mobile (APK)

L'APK doit être buildé depuis Replit avec l'URL de production de l'API.

### 6.1 Configurer l'URL de l'API dans l'app

Modifier dans `artifacts/ryzer-app/package.json`, script `dev`, changer :
```
EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN
```
en :
```
EXPO_PUBLIC_DOMAIN=api.ton-domaine.com
```

### 6.2 Builder l'APK avec EAS

```bash
# Depuis le shell Replit
cd artifacts/ryzer-app
pnpm exec eas login   # ryzertracker / ryzerdev@hotmail.com
pnpm exec eas build --platform android --profile preview
```

EAS build sur ses serveurs cloud (~5-10 min) et te donne un lien de téléchargement direct.

### 6.3 Installer l'APK sur Android

- Télécharge l'APK depuis le lien EAS
- Active "Sources inconnues" dans les paramètres Android
- Installe le fichier `.apk`

---

## Partie 7 — Mises à jour

```bash
cd ~/ryzer
git pull
pnpm install

# Rebuilder ce qui a changé
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/ryzer-site run build
pnpm --filter @workspace/test-app run build

# Redémarrer l'API
pm2 restart ryzer-api

# Nginx recharge automatiquement les fichiers statiques (pas de redémarrage nécessaire)
```

Pour les migrations DB après un changement de schéma :

```bash
pnpm --filter @workspace/db run push
```

---

## Récapitulatif des URLs

| Service | URL | Type |
|---|---|---|
| Site vitrine | `https://ryzer.ton-domaine.com` | Statique |
| Calculateur sport | `https://calc.ton-domaine.com` | Statique |
| API | `https://api.ton-domaine.com` | Node.js (PM2) |
| Admin | `https://api.ton-domaine.com/admin` | Via API |
| App mobile | APK installé sur le téléphone | — |

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
# API
curl https://api.ton-domaine.com/api/healthz
# → {"status":"ok"}

# Site vitrine
curl -I https://ryzer.ton-domaine.com
# → HTTP/2 200

# Calculateur
curl -I https://calc.ton-domaine.com
# → HTTP/2 200

# PM2
pm2 status
# → ryzer-api : online

# App mobile
# → Ouvrir l'APK → se connecter → vérifier que le profil charge
```
