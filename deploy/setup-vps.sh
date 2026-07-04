#!/bin/bash
# =============================================================================
# COREVISION - Script d'installation VPS OVHcloud Ubuntu 22.04
# Usage : sudo bash setup-vps.sh
# =============================================================================

set -e
DOMAIN="api.corevision.fr"   # ← CHANGER ICI
APP_DIR="/opt/corevision-api"
DATA_DIR="/opt/corevision/data"
UPLOADS_DIR="/opt/corevision/uploads"
SERVICE_USER="corevision"

echo "🚀 Installation Corevision Backend sur Ubuntu 22.04"
echo "Domain: $DOMAIN"

# =============================================================================
# 1. Mise à jour système
# =============================================================================
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y
apt install -y curl wget unzip git nginx certbot python3-certbot-nginx ufw fail2ban

# =============================================================================
# 2. Firewall
# =============================================================================
echo "🔒 Configuration du firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# =============================================================================
# 3. Fail2ban (protection SSH)
# =============================================================================
echo "🛡️ Configuration fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# =============================================================================
# 4. Deno
# =============================================================================
echo "🦕 Installation de Deno..."
curl -fsSL https://deno.land/install.sh | sh
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
echo 'export DENO_INSTALL="$HOME/.deno"' >> /etc/environment
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> /etc/environment
ln -sf "$HOME/.deno/bin/deno" /usr/local/bin/deno
deno --version

# =============================================================================
# 5. Ollama (IA locale)
# =============================================================================
echo "🤖 Installation d'Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh
systemctl enable ollama
systemctl start ollama

echo "⏳ Téléchargement du modèle Mistral (peut prendre 10-20 min)..."
ollama pull mistral:7b-instruct
ollama pull nomic-embed-text

# =============================================================================
# 6. Docker (pour Qdrant)
# =============================================================================
echo "🐳 Installation de Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# =============================================================================
# 7. Qdrant (base vectorielle)
# =============================================================================
echo "🔍 Lancement de Qdrant..."
mkdir -p /opt/qdrant/storage
docker run -d \
  --name qdrant \
  --restart unless-stopped \
  -p 127.0.0.1:6333:6333 \
  -v /opt/qdrant/storage:/qdrant/storage \
  qdrant/qdrant

# =============================================================================
# 8. Structure des dossiers
# =============================================================================
echo "📁 Création des dossiers..."
mkdir -p "$APP_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$UPLOADS_DIR"
mkdir -p /var/log/corevision

# Créer un utilisateur dédié (sécurité)
useradd -r -s /bin/false "$SERVICE_USER" 2>/dev/null || true
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR" "$DATA_DIR" "$UPLOADS_DIR" /var/log/corevision

# =============================================================================
# 9. Nginx
# =============================================================================
echo "⚙️ Configuration Nginx..."
cp /opt/corevision-api/deploy/nginx.conf /etc/nginx/sites-available/corevision
ln -sf /etc/nginx/sites-available/corevision /etc/nginx/sites-enabled/corevision
rm -f /etc/nginx/sites-enabled/default

# Remplacer le domaine
sed -i "s/api.corevision.fr/$DOMAIN/g" /etc/nginx/sites-available/corevision

nginx -t && systemctl reload nginx

# =============================================================================
# 10. SSL Let's Encrypt
# =============================================================================
echo "🔐 Obtention du certificat SSL..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@$(echo $DOMAIN | cut -d. -f2-) || {
  echo "⚠️  Certbot a échoué - assurez-vous que le DNS pointe vers ce serveur"
  echo "    Relancez manuellement : certbot --nginx -d $DOMAIN"
}

# =============================================================================
# 11. Service systemd
# =============================================================================
echo "⚙️ Configuration du service systemd..."
cp /opt/corevision-api/deploy/corevision-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable corevision-api

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Copier le code serveur dans $APP_DIR/server/"
echo "   2. Créer le fichier $APP_DIR/.env (voir deploy/.env.example)"
echo "   3. sudo systemctl start corevision-api"
echo "   4. sudo systemctl status corevision-api"
echo "   5. Tester : curl https://$DOMAIN/make-server-cac859af/health"
