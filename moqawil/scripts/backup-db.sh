#!/usr/bin/env bash
# Sprint 11 (SaaS readiness): automated database backup for the Moqawil-operated hosted
# instance. Self-hosters keep their existing manual/cron `pg_dump` responsibility unchanged
# (docs/devops-moqawil.md §1) — this script exists specifically for the deployment mode where
# Moqawil itself is the operator and other people's compliance data is at stake.
#
# Usage:
#   ./scripts/backup-db.sh                    # dump + rotate locally under $BACKUP_DIR
#   ./scripts/backup-db.sh | aws s3 cp - s3://bucket/moqawil-backups/$(date +%F).sql.gz
#     (off-site upload is an operator-configured step — needs credentials this script
#      deliberately does not hold; piping stdout is how it composes with whatever the
#      operator chooses, S3-compatible or otherwise)
#
# Cron example (daily at 03:00, keeps 14 days locally):
#   0 3 * * * cd /path/to/moqawil && BACKUP_RETAIN_DAYS=14 ./scripts/backup-db.sh >> /var/log/moqawil-backup.log 2>&1
#
# Requires: DATABASE_URL set (same as the app itself reads), pg_dump on PATH (present in the
# postgres:16-alpine image this project already uses — run via `docker compose exec postgres`
# if invoking from outside the container).

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-14}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required (same variable the app reads) — set it before running this script." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

OUT_FILE="$BACKUP_DIR/moqawil-${TIMESTAMP}.sql.gz"

# --no-owner/--no-privileges: keeps the dump portable to a restore target with different role
# names, which matters for disaster recovery onto fresh infrastructure, not just same-host restore.
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$OUT_FILE"

echo "Backup written: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

# Rotation — only touches this script's own naming pattern, never touches unrelated files.
find "$BACKUP_DIR" -maxdepth 1 -name 'moqawil-*.sql.gz' -mtime "+${BACKUP_RETAIN_DAYS}" -print -delete
