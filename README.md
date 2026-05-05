# Games Played

App web para registrar los juegos que juegas: horas, plataforma y review breve.
Búsqueda de juegos y reseñas vía RAWG. Autenticación con Google / Discord.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- NextAuth (Google + Discord, sesión en DB)
- RAWG API para metadata y reseñas
- Docker Compose + Nginx para deploy en VPS

## Desarrollo local

```bash
cp .env.example .env
# Rellena DATABASE_URL, NEXTAUTH_SECRET (openssl rand -base64 32),
# GOOGLE_*, DISCORD_*, RAWG_API_KEY

npm install
npx prisma db push
npm run dev
```

Abre http://localhost:3000.

## OAuth

- **Google**: https://console.cloud.google.com → OAuth client → Web app
  - Redirect URI: `http://localhost:3000/api/auth/callback/google` (y la versión prod)
- **Discord**: https://discord.com/developers/applications
  - Redirect URI: `http://localhost:3000/api/auth/callback/discord`

## RAWG

Pide una API key gratuita en https://rawg.io/apidocs y ponla en `RAWG_API_KEY`.

## Deploy en VPS (Docker + Nginx)

```bash
# en el VPS
git clone <repo> games-played && cd games-played
cp .env.example .env   # rellena valores reales (NEXTAUTH_URL=https://tudominio)
docker compose up -d --build
```

Nginx del compose escucha en `HTTP_PORT` (8080 por defecto). En tu VPS, configura
el reverse proxy frontal (el Nginx/Caddy ya existente con TLS) para reenviar
`tudominio` → `127.0.0.1:8080`.

Migraciones: el contenedor `app` ejecuta `prisma migrate deploy` (o `db push` si
no hay migraciones) al arrancar.

## Modelo

- `User` (NextAuth)
- `Game`: catálogo cacheado desde RAWG (`rawgId`, `title`, `cover`, ...)
- `GameEntry`: registro del usuario para un juego
  (`platform`, `hours`, `rating`, `review`, `status`, `startedAt`, `finishedAt`)

## Próximos pasos

- Migrar a app móvil con React Native / Expo reusando la API
- Página detalle de juego con reseñas RAWG agregadas
- Filtros por estado/plataforma y estadísticas (horas totales, top géneros)
