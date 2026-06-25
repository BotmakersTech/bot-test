#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Manual deploy / update on the VPS
# Run from /opt/botleague:   bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."   # always run from repo root

echo "[1/4] Pulling latest code..."
git pull origin main

echo "[2/4] Rebuilding Docker images..."
docker compose -f docker-compose.prod.yml build --parallel

echo "[3/4] Restarting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "[4/4] Waiting for backend to come up..."
for i in $(seq 1 18); do
  if curl -sf http://localhost:8081/api/health > /dev/null 2>&1; then
    echo "✓ Backend healthy"
    break
  fi
  if [ "$i" -eq 18 ]; then
    echo "✗ Backend did not come up in time — check logs:"
    echo "    docker compose -f docker-compose.prod.yml logs --tail=50 backend"
    exit 1
  fi
  echo "  waiting... ($i/18)"
  sleep 10
done

echo ""
echo "✓ Deploy complete — $(date)"
echo ""
echo "Useful commands:"
echo "  logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  status:  docker compose -f docker-compose.prod.yml ps"
echo "  restart: docker compose -f docker-compose.prod.yml restart backend"
