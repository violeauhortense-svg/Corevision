#!/bin/bash
# =============================================================================
# BASCULE FRONTEND : Supabase → Self-hosted
# À exécuter depuis la racine du projet UNIQUEMENT quand le VPS est prêt
# =============================================================================

NEW_API_URL="${1:-https://api.corevision.fr}"

echo "🔀 Bascule frontend vers : $NEW_API_URL"
echo "⚠️  Vérifier que le VPS répond avant de continuer :"
echo "    curl $NEW_API_URL/make-server-cac859af/health"
echo ""
read -p "Le VPS est opérationnel ? (oui/non) : " confirm
[[ "$confirm" != "oui" ]] && echo "Annulé." && exit 1

# 1. Modifier info.tsx (URL de base)
INFO_FILE="src/app/utils/supabase/info.tsx"
cat > "$INFO_FILE" << EOF
// Self-hosted backend (migration depuis Supabase)
export const apiBaseUrl = "${NEW_API_URL}"
export const projectId = "self-hosted"
export const publicAnonKey = "local-auth"
EOF
echo "✅ $INFO_FILE mis à jour"

# 2. Modifier api.ts (activer mode serveur + nouvelle URL)
API_FILE="src/app/services/api.ts"
sed -i 's|const BASE_URL = `https://\${projectId}.supabase.co/functions/v1/make-server-cac859af`;|const BASE_URL = `${apiBaseUrl}/make-server-cac859af`;|' "$API_FILE"
sed -i 's|import { projectId, publicAnonKey } from|import { apiBaseUrl, publicAnonKey } from|' "$API_FILE"
sed -i 's|const FORCE_LOCALSTORAGE_MODE = true;|const FORCE_LOCALSTORAGE_MODE = false;|' "$API_FILE"
echo "✅ $API_FILE mis à jour (localStorage mode désactivé, nouvelle URL)"

echo ""
echo "✅ Bascule effectuée !"
echo "📋 Prochaine étape : git commit + push → Vercel redéploie automatiquement"
echo ""
echo "    git add src/app/utils/supabase/info.tsx src/app/services/api.ts"
echo "    git commit -m 'feat: migrate backend to self-hosted VPS'"
echo "    git push"
