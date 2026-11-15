#!/usr/bin/env bash
# Logical backup of the database. Prefer Atlas continuous backups in production; use this for extra off-site copies.
set -euo pipefail
: "${MONGO_URI:?set MONGO_URI}"; OUT="${1:-./backups}/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"; mongodump --uri="$MONGO_URI" --gzip --out="$OUT"; echo "Backup written to $OUT"
# Restore (to a NEW/empty database first, then verify): mongorestore --uri="$MONGO_URI" --gzip --drop "$OUT"
