#!/bin/bash
# =============================================================================
# COREVISION - Script de déploiement du code serveur vers le VPS
# Usage (depuis ta machine locale) : bash deploy/deploy.sh
# =============================================================================

set -e

VPS_USER="ubuntu"
VPS_IP="54.38.176.9"
APP_DIR="/opt/corevision-api"
SERVER_DIR="src/app/supabase/functions/server"

echo "🚀 Déploiement Corevision vers $VPS_USER@$VPS_IP..."

# 1. Créer le dossier distant
ssh "$VPS_USER@$VPS_IP" "sudo mkdir -p $APP_DIR/server && sudo chown -R \$USER:$USER $APP_DIR"

# 2. Copier le code serveur
echo "📤 Copie du code serveur..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  "$SERVER_DIR/" \
  "$VPS_USER@$VPS_IP:$APP_DIR/server/"

# 3. Copier les scripts de déploiement
echo "📤 Copie des scripts de config..."
rsync -avz \
  "deploy/corevision-api.service" \
  "deploy/nginx.conf" \
  "$VPS_USER@$VPS_IP:$APP_DIR/deploy/"

# 4. Redémarrer le service
echo "🔄 Redémarrage du service..."
ssh "$VPS_USER@$VPS_IP" "
  sudo systemctl daemon-reload
  sudo systemctl restart corevision-api
  sleep 2
  sudo systemctl status corevision-api --no-pager
"

# 5. Test de santé
echo "🔍 Test de santé..."
DOMAIN=$(ssh "$VPS_USER@$VPS_IP" "grep server_name /etc/nginx/sites-available/corevision | head -1 | awk '{print \$2}' | tr -d ';'")
sleep 3
curl -s "https://$DOMAIN/make-server-cac859af/health" | python3 -m json.tool 2>/dev/null || \
curl -s "http://$VPS_IP:3000/make-server-cac859af/health"

echo ""
echo "✅ Déploiement terminé !"
