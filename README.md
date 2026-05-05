# Games Played

Web app para registrar los juegos que juegas (horas, plataforma, review) y
buscar juegos/reseñas vía RAWG. Pensado para reusar la infra del VPS existente
(scmining): mismo Postgres, mismo Nginx con Let's Encrypt, mismo cron de las 3am.

## Stack

- **Backend**: FastAPI + SQLAlchemy + Alembic (puerto **8002**, solo `127.0.0.1`)
- **DB**: PostgreSQL **`games_db`** (separada de `scmining_db`, mismo cluster)
- **Auth**: JWT V2 (Access 15m + Refresh 30/90d) en cookies httpOnly + OAuth Google/Discord
- **Frontend**: Next.js 14 (App Router) + Tailwind, standalone, puerto **3002**
- **Reverse proxy**: Nginx + certbot
- **Backups**: `/opt/games-played/backups/` diarios a las **3:10am** (10 min después de scmining)
- **Monitor**: `/api/health` para Uptime Kuma

## Layout en VPS

```
/opt/games-played/
  backend/        FastAPI (.venv, app/, alembic/)
  frontend/       Next.js (.next/standalone)
  deploy/         systemd, nginx, backup.sh, cron
  backups/        dumps gzip de games_db
```

## Despliegue rápido

```bash
# en el VPS, como root
git clone <repo> /opt/games-played
cd /opt/games-played
DOMAIN=games.tudominio.com bash deploy/install.sh
```

El script:
1. Instala Python 3.11, Node 20, nginx, postgres-client.
2. Crea usuario `games`, DB `games_db` y rol `games`.
3. Crea venv backend e instala dependencias.
4. Builda el frontend.
5. Instala unidades systemd `games-played-api` y `games-played-web`.
6. Instala el site nginx y el cron de backup.

Después rellenas `.env` y lanzas:
- `certbot --nginx -d games.tudominio.com`
- `sudo -u games bash -c 'cd /opt/games-played/backend && .venv/bin/alembic revision --autogenerate -m init && .venv/bin/alembic upgrade head'`
- Añadir `https://games.tudominio.com/api/health` a Uptime Kuma.

## Desarrollo local

```bash
# Backend
cd backend
python3.11 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # rellena DATABASE_URL, JWT_SECRET, OAuth, RAWG
alembic revision --autogenerate -m "init"
alembic upgrade head
uvicorn app.main:app --reload --port 8002

# Frontend
cd ../frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8002
npm install
npm run dev   # http://localhost:3002
```

## OAuth callbacks

Configura en cada provider la URL `https://games.tudominio.com/api/auth/callback/{provider}`:
- Google Cloud Console → OAuth client (Web)
- Discord Developer Portal → OAuth2 Redirects

## Endpoints

- `GET  /api/health`
- `GET  /api/auth/login/{google|discord}` → redirect OAuth
- `GET  /api/auth/callback/{google|discord}` → setea cookies y redirige a `/library`
- `POST /api/auth/refresh` (rota refresh token)
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `GET|POST /api/entries`
- `PATCH|DELETE /api/entries/{id}`
- `GET  /api/rawg/search?q=...`
- `GET  /api/rawg/games/{id_or_slug}`

## Backup

`deploy/backup.sh` hace `pg_dump games_db | gzip` en `/opt/games-played/backups/`,
con retención `RETENTION_DAYS` (14 por defecto). El cron está en
`deploy/cron.games-played` y corre a las **3:10am**.

## Próximo: app móvil

La API es la misma. Una app Expo/React Native consumiría los mismos endpoints.
Para auth en móvil, usar el access token en `Authorization: Bearer ...` y un
endpoint extra que emita el par sin cookies (pendiente).
