#!/bin/bash
# CoreVision Backend Launcher - macOS/Linux

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🚀 CoreVision Backend - Local Development         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Check PocketBase
echo "📋 Vérification de PocketBase..."
if ! curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "❌ PocketBase n'est pas lancé!"
    echo ""
    echo "   Pour lancer PocketBase:"
    echo "   1. cd ~/pocketbase"
    echo "   2. ./pocketbase serve"
    echo ""
    exit 1
fi

echo "✅ PocketBase est actif"

# 2. Check Tailscale
echo "📋 Vérification de Tailscale..."
if ping -c 1 pc1.tailscale > /dev/null 2>&1; then
    echo "✅ Tailscale est connecté"
else
    echo "⚠️  Tailscale non accessible (but you can continue)"
fi

# 3. Start Deno backend
echo ""
echo "🚀 Démarrage du backend..."
echo ""

export POCKETBASE_URL="http://pc1.tailscale:8090"
export JWT_SECRET="dev_secret_key_change_in_production_12345"
export FRONTEND_URL="http://localhost:5173"
export PORT="3000"
export DENO_ENV="development"

echo "Lancement: deno run --allow-net --allow-env --allow-read src/app/backend/index.ts"
echo ""

deno run \
    --allow-net \
    --allow-env \
    --allow-read \
    --allow-import \
    "src/app/backend/index.ts"

echo ""
echo "❌ Backend arrêté!"
