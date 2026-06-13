#!/data/data/com.termux/files/usr/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
PREFIX_DIR=${PREFIX:-/data/data/com.termux/files/usr}
DB_SESSION=${GLPI_DB_SESSION:-glpi-db}
WEB_SESSION=${GLPI_WEB_SESSION:-glpi-web}
GLPI_HOST=${GLPI_HOST:-127.0.0.1}
GLPI_PORT=${GLPI_PORT:-8080}

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required. Install it with: pkg install tmux" >&2
  exit 1
fi

if ! tmux has-session -t "$DB_SESSION" 2>/dev/null; then
  tmux new-session -d -s "$DB_SESSION" -c "$PREFIX_DIR" \
    "mariadbd-safe --datadir=$PREFIX_DIR/var/lib/mysql"
fi

if tmux has-session -t "$WEB_SESSION" 2>/dev/null; then
  echo "GLPI web session '$WEB_SESSION' is already running."
else
  tmux new-session -d -s "$WEB_SESSION" -c "$ROOT_DIR" \
    "php -d opcache.enable=0 -S $GLPI_HOST:$GLPI_PORT -t public"
fi

echo "GLPI: http://$GLPI_HOST:$GLPI_PORT/"
echo "Sessions: $DB_SESSION, $WEB_SESSION"
