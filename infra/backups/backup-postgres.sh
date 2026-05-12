#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"

mkdir -p "$BACKUP_DIR"

run_backup() {
  local timestamp
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  local file="$BACKUP_DIR/${POSTGRES_DB}_${timestamp}.sql.gz"

  echo "Starting PostgreSQL backup: $file"
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    --host="${POSTGRES_HOST:-postgres}" \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --format=plain \
    --no-owner \
    --no-privileges | gzip > "$file"

  find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
  echo "Backup completed: $file"
}

while true; do
  run_backup
  sleep "$INTERVAL_SECONDS"
done
