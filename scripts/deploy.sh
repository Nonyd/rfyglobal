#!/bin/bash
# Production deploy for rfyglobal.org on the Webuzo VPS. Run by scripts/webhook-server.js on every
# push to main (log: /var/log/rfyglobal-deploy.log). Safe to run by hand: `bash scripts/deploy.sh`.
#
# - Re-execs itself from /tmp, because `git reset --hard` rewrites this file while bash is still reading it.
# - Keeps the previous .next build and puts it back if install/build fails, so a broken push never takes
#   the site down ("self-restoring").
# - Never touches the database: schema changes are a manual `npx prisma db push` (see CLAUDE.md).
# - Uploaded media lives in $UPLOAD_DIR outside this folder, so reset/clean can't delete it.
set -euo pipefail

APP_DIR=/home/sonshubco/rfyglobal.org
PM2_APP=rfyglobal

if [ "${RFY_DEPLOY_FROM_TMP:-}" != "1" ]; then
  tmp="$(mktemp /tmp/rfyglobal-deploy.XXXXXX.sh)"
  cp "$0" "$tmp"
  RFY_DEPLOY_FROM_TMP=1 exec bash "$tmp" "$@"
fi
trap 'rm -f "$0"' EXIT

echo "=== RFY deploy $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="
cd "$APP_DIR"

restore() {
  echo "!!! Deploy failed: restoring previous build and commit"
  if [ -d .next.prev ]; then
    rm -rf .next
    mv .next.prev .next
  fi
  git reset --hard "$PREV_COMMIT"
  pm2 restart "$PM2_APP" --update-env || true
  echo "=== Restored $PREV_COMMIT ==="
  exit 1
}

PREV_COMMIT="$(git rev-parse HEAD)"

echo "Pulling latest code..."
git fetch origin main
git reset --hard origin/main
echo "Now at $(git log -1 --oneline)"

rm -rf .next.prev
if [ -d .next ]; then cp -a .next .next.prev; fi

trap restore ERR

echo "Installing dependencies..."
# Plain env: never source .env in this shell (Next reads it at runtime).
npm install --no-audit --no-fund

echo "Building..."
npm run build

trap - ERR

echo "Restarting PM2..."
pm2 restart "$PM2_APP" --update-env
rm -rf .next.prev

echo "=== Deploy complete: $(git log -1 --oneline) ==="
