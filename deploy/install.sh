#!/usr/bin/env bash
# Instalacion en VPS Debian. Idempotente.
set -euo pipefail

APP_DIR=/opt/games-played
DOMAIN="${DOMAIN:-games-played.duckdns.org}"
DB_NAME="${DB_NAME:-games_db}"
DB_USER="${DB_USER:-games}"
DB_PASS="${DB_PASS:-$(openssl rand -hex 16)}"

echo ">> Paquetes"
apt-get update
apt-get install -y python3.11 python3.11-venv python3-pip postgresql nginx curl git

echo ">> Node 20 (si no esta)"
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo ">> Usuario games"
id -u games >/dev/null 2>&1 || useradd -r -m -d "$APP_DIR" -s /usr/sbin/nologin games

echo ">> Postgres: DB y usuario"
sudo -u postgres psql <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
  | grep -q 1 || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

echo ">> Layout"
mkdir -p "$APP_DIR/backups"
chown -R games:games "$APP_DIR"

echo ">> Backend venv"
sudo -u games python3.11 -m venv "$APP_DIR/backend/.venv"
sudo -u games "$APP_DIR/backend/.venv/bin/pip" install -U pip
sudo -u games "$APP_DIR/backend/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

echo ">> Frontend build"
cd "$APP_DIR/frontend"
sudo -u games npm ci
sudo -u games npm run build

echo ">> systemd"
install -m 644 "$APP_DIR/deploy/games-played-api.service" /etc/systemd/system/
install -m 644 "$APP_DIR/deploy/games-played-web.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now games-played-api.service games-played-web.service

echo ">> nginx"
install -m 644 "$APP_DIR/deploy/nginx.games.conf" "/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t && systemctl reload nginx

echo ">> cron backup"
install -m 644 "$APP_DIR/deploy/cron.games-played" /etc/cron.d/games-played
chmod +x "$APP_DIR/deploy/backup.sh"

cat <<EOF

== Listo ==
DB:   ${DB_NAME} (user ${DB_USER})
Pass: ${DB_PASS}   <-- guardalo en backend/.env (DATABASE_URL)
API:  127.0.0.1:8002
Web:  127.0.0.1:3002
Nginx site: ${DOMAIN}

Siguientes pasos manuales:
  1. Editar /opt/games-played/backend/.env con secretos reales (JWT_SECRET, OAuth, RAWG)
  2. Editar /opt/games-played/frontend/.env.production (NEXT_PUBLIC_API_URL=https://${DOMAIN}/api)
  3. certbot --nginx -d ${DOMAIN}
  4. Ejecutar migraciones:
       sudo -u games bash -c 'cd /opt/games-played/backend && .venv/bin/alembic upgrade head'
  5. Anadir https://${DOMAIN}/api/health a Uptime Kuma
EOF
