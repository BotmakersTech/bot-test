#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-vps.sh — One-time VPS provisioning (Ubuntu 22.04 LTS)
#
# Run as root:  bash setup-vps.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR=/opt/botleague
# Detect actual user: prefer SUDO_USER, fall back to current user, then root
DEPLOY_USER=${SUDO_USER:-$(logname 2>/dev/null || echo root)}
REPO_URL="https://github.com/BotmakersTech/BotLeague_v1.git"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   BotLeague VPS Setup — Ubuntu 22.04            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. System update ──────────────────────────────────────────────────────────
echo "[1/8] Updating system packages..."
apt-get update -q && apt-get upgrade -y -q

# ── 2. Install Docker ─────────────────────────────────────────────────────────
echo "[2/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
# Add deploy user to docker group (skip if running as root — root already has access)
if [ "$DEPLOY_USER" != "root" ]; then
  usermod -aG docker "$DEPLOY_USER"
fi

# Docker Compose plugin (v2)
COMPOSE_VERSION="v2.27.0"
COMPOSE_DEST="/usr/local/lib/docker/cli-plugins/docker-compose"
if [ ! -f "$COMPOSE_DEST" ]; then
  mkdir -p "$(dirname "$COMPOSE_DEST")"
  curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o "$COMPOSE_DEST"
  chmod +x "$COMPOSE_DEST"
fi

# ── 3. Install Nginx + Certbot ────────────────────────────────────────────────
echo "[3/8] Installing Nginx and Certbot..."
apt-get install -y -q nginx certbot python3-certbot-nginx

# ── 4. Firewall (UFW) ─────────────────────────────────────────────────────────
echo "[4/8] Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── 5. Create deploy directory ────────────────────────────────────────────────
echo "[5/8] Setting up /opt/botleague..."
mkdir -p "$DEPLOY_DIR"
[ "$DEPLOY_USER" != "root" ] && chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

# ── 6. Clone repo ─────────────────────────────────────────────────────────────
echo "[6/8] Cloning repository..."
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  git clone "$REPO_URL" "$DEPLOY_DIR"
else
  git -C "$DEPLOY_DIR" pull origin main
fi

# ── 7. Nginx config ───────────────────────────────────────────────────────────
echo "[7/8] Deploying Nginx config..."
cp "$DEPLOY_DIR/nginx/botleague.conf" /etc/nginx/sites-available/botleague.conf
ln -sf /etc/nginx/sites-available/botleague.conf /etc/nginx/sites-enabled/botleague.conf
# Remove default site
rm -f /etc/nginx/sites-enabled/default
mkdir -p /var/www/certbot
nginx -t && systemctl reload nginx

# ── 8. .env file ─────────────────────────────────────────────────────────────
echo "[8/8] Environment file..."
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
  [ "$DEPLOY_USER" != "root" ] && chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/.env"
  chmod 600 "$DEPLOY_DIR/.env"
  echo ""
  echo "⚠️  Created .env from template — EDIT IT BEFORE STARTING:"
  echo "     nano $DEPLOY_DIR/.env"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "  VPS provisioning complete!"
echo "════════════════════════════════════════════════════"
echo ""
echo "NEXT STEPS (run as $DEPLOY_USER):"
echo ""
echo "  1. Edit the environment file:"
echo "       nano $DEPLOY_DIR/.env"
echo ""
echo "  2. Obtain SSL certificates:"
echo "       sudo certbot --nginx -d test.botleague.in -d api.botleague.in"
echo ""
echo "  3. Start the application:"
echo "       cd $DEPLOY_DIR"
echo "       docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  4. Watch logs:"
echo "       docker compose -f docker-compose.prod.yml logs -f"
echo ""
