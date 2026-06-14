#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
OUT_FILE="$ROOT_DIR/modern/sql/glpi-legacy-schema.sql"

: "${GLPI_DB_HOST:=127.0.0.1}"
: "${GLPI_DB_PORT:=3306}"
: "${GLPI_DB_NAME:=glpi}"
: "${GLPI_DB_USER:=glpi}"
: "${GLPI_DB_PASSWORD:=glpi_termux_pass}"

mariadb-dump \
  --no-data \
  --routines \
  --events \
  --triggers \
  --host="$GLPI_DB_HOST" \
  --port="$GLPI_DB_PORT" \
  --user="$GLPI_DB_USER" \
  --password="$GLPI_DB_PASSWORD" \
  "$GLPI_DB_NAME" \
  -r "$OUT_FILE"

printf 'Wrote %s\n' "$OUT_FILE"
