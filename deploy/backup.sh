#!/usr/bin/env bash
# Backup diario de games_db -> /opt/games-played/backups
# Llamado desde cron a las 3am (junto con el de scmining).
set -euo pipefail

BACKUP_DIR="/opt/games-played/backups"
DB_NAME="${PGDATABASE:-games_db}"
DB_USER="${PGUSER:-games}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/${DB_NAME}-${TS}.sql.gz"

# .pgpass debe estar en /home/games/.pgpass con permisos 600
sudo -u postgres pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges \
  | gzip -9 > "$OUT"

# Retencion
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[$(date -Iseconds)] backup ok: $OUT ($(du -h "$OUT" | cut -f1))"
