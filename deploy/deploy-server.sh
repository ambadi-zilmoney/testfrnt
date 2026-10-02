#!/usr/bin/env bash
# Build the React app and upload it to the EC2 server over SSH (bash version of deploy-server.ps1).
# Each deploy goes into /var/www/<domain>/releases/<timestamp>, then the "current"
# symlink is switched atomically. The last 5 releases are kept for rollback.
#
# Usage:
#   ./deploy/deploy-server.sh ubuntu@203.0.113.10 example.com [path/to/key.pem]
set -euo pipefail
cd "$(dirname "$0")/.."

SERVER="${1:?Usage: $0 <user@host> <domain> [ssh-key]}"
DOMAIN="${2:?Usage: $0 <user@host> <domain> [ssh-key]}"
KEY="${3:-}"
SSH_OPTS=(); [[ -n "$KEY" ]] && SSH_OPTS=(-i "$KEY")

RELEASE="$(date -u +%Y%m%d-%H%M%S)"
ROOT="/var/www/${DOMAIN}"
TARGET="${ROOT}/releases/${RELEASE}"

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Building (mode: production)"
npm run build

echo "==> Uploading build to ${SERVER}:${TARGET}"
ssh "${SSH_OPTS[@]}" "$SERVER" "mkdir -p '${TARGET}'"
scp "${SSH_OPTS[@]}" -r -q dist/* "${SERVER}:${TARGET}/"

echo "==> Switching to the new release"
ssh "${SSH_OPTS[@]}" "$SERVER" "set -e
ln -sfn '${TARGET}' '${ROOT}/current.tmp' && mv -Tf '${ROOT}/current.tmp' '${ROOT}/current'
cd '${ROOT}/releases' && ls -1dt */ | tail -n +6 | xargs -r rm -rf"

echo "==> Done: https://${DOMAIN}"
