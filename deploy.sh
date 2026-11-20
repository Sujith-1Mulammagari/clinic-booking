#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

git pull --ff-only
docker compose up -d --build

DOMAIN=$(grep '^DOMAIN=' .env | cut -d= -f2)
echo "Waiting for https://$DOMAIN ..."
for i in $(seq 1 30); do
  if curl -fsS --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/doctors" > /dev/null; then
    echo "Deploy OK"
    docker image prune -f
    exit 0
  fi
  sleep 5
done
echo "Health check failed" >&2
docker compose logs --tail 50 backend
exit 1