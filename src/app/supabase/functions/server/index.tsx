import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { supabaseAdminCompat, UPLOADS_DIR } from "./storage.tsx";
import { verifyAuth, createUser, signInUser } from "./auth.tsx";
// Feature routes
import { setupBilanRoutes } from "./bilan_routes.tsx";
import { setupClientRoutes } from "./client_routes.tsx";
import { setupTaskRoutes } from "./task_routes.tsx";
import { setupDERRoutes } from "./der_routes.tsx";
import { setupCoreVisionRoutes } from "./corevision_routes.tsx";
import { setupSignatureRoutes } from "./signature_routes.tsx";
import { setupSanctionsRoutes } from "./sanctions_routes.tsx";
import knowledgeBaseRoutes from "./knowledge_base_routes.tsx";
import { setupCalculRoutes } from "./calcul_routes.tsx";
import { setupIncoherencesRoutes } from "./incoherences_routes.tsx";
import { setupRecommandationsRoutes } from "./recommandations_routes.tsx";
import { setupBaremesRoutes } from "./baremes_routes.tsx";
import { setupSectionRapportRoutes } from "./section_rapport_routes.tsx";
// Knowledge ingestion routes
import { setupCollecteurJuridiqueRoutes } from "./collecteur_juridique_routes.tsx";
import { setupParserJuridiqueRoutes } from "./parser_juridique_routes.tsx";
import { setupExtracteurReglesRoutes } from "./extracteur_regles_routes.tsx";
import { setupCollecteurSocialRoutes } from "./collecteur_social_routes.tsx";
import { setupCollecteurRetraiteRoutes } from "./collecteur_retraite_routes.tsx";
import { setupIndexIARoutes } from "./index_ia_routes.tsx";
// Patrimoine routes
import { setupMontagesPatrimoniauxRoutes } from "./montages_patrimoniaux_routes.tsx";
import { setupMoteurPatrimonialIARoutes } from "./moteur_patrimonial_ia_routes.tsx";
import { setupSimulateurPatrimonialRoutes } from "./simulateur_patrimonial_routes.tsx";
import { setupReglesFiscalesRoutes } from "./regles_fiscales_routes.tsx";
import { setupAuditPatrimonialRoutes } from "./audit_patrimonial_routes.tsx";
import { setupDashboardRoutes } from "./dashboard_routes.tsx";
// HUB Communication & Agenda (refactored)
import { setupCommunicationsRoutes } from "./communications_routes.tsx";
import { setupAgendaRoutes } from "./agenda_routes.tsx";

// ============================================
// VERSION: 2026-02-27-DER-FIX-V6
// Architecture modulaire refactoris�e  
// FIX: Routes DER publiques accessibles
// ============================================
const SERVER_VERSION = "2026-02-27-DER-FIX-V6";
console.log(`?????? Server starting - ROUTES DER PUBLIQUES - Version ${SERVER_VERSION} ??????`);

const app = new Hono();

const supabaseAdmin = supabaseAdminCompat;

// Initialiser le dossier de documents au d�marrage
(async () => {
  try {
    await Deno.mkdir(`${UPLOADS_DIR}/make-cac859af-documents`, { recursive: true });
    console.log('? Dossier uploads initialis�:', UPLOADS_DIR);
  } catch {
    console.log('? Dossier uploads d�j� existant');
  }
})();

// Middleware
app.use('*', logger(console.log));

// ✨ Custom CORS middleware for credentials support
app.use("/*", async (c, next) => {
  const origin = c.req.header("origin");
  const allowedOrigins = [
    "https://corevision-main.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  // ALWAYS set CORS headers to prevent browser fallback to wildcard
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (isAllowed) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    c.header("Access-Control-Expose-Headers", "Content-Length, Set-Cookie");
    c.header("Access-Control-Max-Age", "600");
  } else {
    // Still set headers but for non-allowed origins without credentials
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type");
  }

  if (c.req.method === "OPTIONS") {
    return c.text("OK");
  }

  await next();
});

// ============================================
// BASIC ROUTES
// ============================================

app.get("/make-server-cac859af/health", (c) => {
  console.log('? Health check called - NO AUTH REQUIRED');
  console.log('?? Headers:', c.req.header('Authorization') ? 'Auth present' : 'NO AUTH');
  return c.json({
    status: "ok",
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
    message: "Server is running - Modular architecture"
  });
});

app.get("/make-server-cac859af/auth/debug", async (c) => {
  console.log('🔍 [DEBUG AUTH]');
  const authHeader = c.req.header('Authorization');
  const cookieHeader = c.req.header('Cookie');
  console.log('   Authorization header:', authHeader ? '✅ present' : '❌ missing');
  console.log('   Cookie header:', cookieHeader ? `✅ present (${cookieHeader})` : '❌ missing');

  const { user, error } = await verifyAuth(c.req);
  console.log('   verifyAuth result:', user ? `✅ user ${user.id}` : `❌ ${error}`);

  return c.json({
    authHeaderPresent: !!authHeader,
    cookieHeaderPresent: !!cookieHeader,
    cookieValue: cookieHeader || 'none',
    verifyAuthResult: user ? { id: user.id, email: user.email } : { error }
  });
});

app.get("/make-server-cac859af/test", (c) => {
  console.log(`?? Test endpoint called`);
  return c.json({
    message: "Server is running correctly!",
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
    success: true
  });
});

// DEBUG: List all users (temporary)
app.get("/make-server-cac859af/debug/users", async (c) => {
  try {
    const users = await kv.getByPrefix("user:email:");
    console.log(`?? Found ${users.length} users`);
    return c.json({
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        nom: u.nom,
        prenom: u.prenom,
        created: u.created
      }))
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Reset endpoint
app.delete("/make-server-cac859af/reset-user-data", async (c) => {
  const { user, error } = await verifyAuth(c.req);
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    console.log('??? RESET: Suppression de toutes les donn�es pour user:', user.id);
    
    const clients = await kv.getByPrefix(`client:${user.id}:`);
    for (const client of clients) {
      await kv.del(`client:${user.id}:${client.id}`);
    }
    
    const tasks = await kv.getByPrefix(`task:${user.id}:`);
    let taskCount = 0;
    for (const task of tasks) {
      const key = `task:${user.id}:${task.client_id}:${task.id}`;
      await kv.del(key);
      taskCount++;
    }
    
    return c.json({ 
      success: true,
      message: 'Toutes les donn�es ont �t� supprim�es',
      deleted: {
        clients: clients.length,
        tasks: taskCount
      }
    });
  } catch (err) {
    console.error('? Erreur reset:', err);
    return c.json({ error: 'Failed to reset data: ' + err.message }, 500);
  }
});

// ============================================
// AUTH ROUTES
// ============================================

app.post("/make-server-cac859af/auth/signup", async (c) => {
  try {
    console.log("?? Signup endpoint called");
    const body = await c.req.json();
    const { email, password, nom, prenom, specialite, certifications } = body;

    console.log(`?? Signup attempt: ${email}`);
    console.log(`?? Creating user with email: ${email}, nom: ${nom}, prenom: ${prenom}`);

    const user = await createUser(email, password, {
      nom: nom || '',
      prenom: prenom || '',
      specialite: specialite || 'Gestion de patrimoine',
      certifications: certifications || 'CIF, AMF',
    });

    console.log(`? User created: ${email}`);
    return c.json({ user });
  } catch (error) {
    const msg = (error as Error).message;
    console.error(`? SIGNUP FAILED: ${msg}`);
    console.error(`Stack:`, (error as Error).stack);
    return c.json({ error: msg, details: String(error) }, 400);
  }
});

app.post("/make-server-cac859af/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    console.log('🔐 [SIGNIN] Request received for:', email);

    const data = await signInUser(email, password);
    console.log('🔐 [SIGNIN] User authenticated:', email, ', token length:', data.access_token.length);

    // ✨ Set JWT as HTTP-only cookie
    // For cross-domain (Vercel frontend → Render backend): use SameSite=None; Secure
    // For localhost dev: use SameSite=Lax
    const isProduction = Deno.env.get("NODE_ENV") === "production";
    const sameSite = isProduction ? "None; Secure" : "Lax";
    const cookieValue = `sessionId=${data.access_token}; HttpOnly; SameSite=${sameSite}; Path=/`;

    console.log('🍪 [SIGNIN] Setting cookie:', cookieValue.substring(0, 80) + '...');
    c.header('Set-Cookie', cookieValue);
    console.log('🍪 [SIGNIN] Headers after setting cookie:', c.res.headers.get('Set-Cookie'));

    console.log('✅ [SIGNIN] Returning response to frontend');
    return c.json({
      access_token: data.access_token,
      session: data.session,
      user: data.user
    });
  } catch (error) {
    console.error('❌ [SIGNIN] Error:', error);
    return c.json({ error: (error as Error).message }, 401);
  }
});

app.get("/make-server-cac859af/auth/profile", async (c) => {
  const { user, error } = await verifyAuth(c.req);
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  return c.json({ user });
});

// ============================================
// SETUP FEATURE MODULES
// ============================================

console.log('?? Chargement des modules...');

// ============================================
// UPLOAD DOCUMENT ROUTE
// ============================================
app.post("/make-server-cac859af/upload-document", async (c) => {
  try {
    console.log('?? Upload document route called');

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !clientId) {
      return c.json({ error: 'Missing file or clientId' }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'Fichier trop volumineux (max 10 MB)' }, 400);
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${clientId}/${documentType || 'document'}/${timestamp}_${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('make-cac859af-documents')
      .upload(filePath, fileBuffer, { contentType: file.type || 'application/octet-stream', upsert: true });

    if (uploadError) {
      console.error('? Erreur upload:', uploadError);
      return c.json({ error: 'Failed to upload file: ' + uploadError.message }, 500);
    }

    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('make-cac859af-documents')
      .createSignedUrl(filePath, 31536000);

    console.log('? Fichier upload�:', uploadData.path);
    return c.json({
      success: true,
      fileUrl: signedUrlData.signedUrl,
      fileName: file.name,
      filePath: uploadData.path,
    });
  } catch (error) {
    console.error('? Erreur upload document:', error);
    return c.json({ error: 'Upload failed: ' + (error as Error).message }, 500);
  }
});

// Serve uploaded files (remplace les signed URLs Supabase)
app.get("/make-server-cac859af/files/*", async (c) => {
  const { user, error } = await verifyAuth(c.req);
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

  const filePath = c.req.path.replace('/make-server-cac859af/files/', '');
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  try {
    const data = await Deno.readFile(`${UPLOADS_DIR}/${filePath}`);
    return new Response(data, {
      headers: { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' }
    });
  } catch {
    return c.json({ error: 'Fichier introuvable' }, 404);
  }
});

// ============================================
// BRIDGE DOWNLOADS
// ============================================

app.get("/make-server-cac859af/download/install-bridge-service", async (c) => {
  try {
    const content = `@echo off
REM ============================================
REM Outlook Bridge V3 - Windows Service Installer
REM ============================================

echo.
echo 🌉 Outlook Bridge V3 - Installation Service Windows
echo ============================================
echo.

REM Vérifier si l'utilisateur est admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Droits administrateur détectés
) else (
    echo ❌ ERREUR: Droits administrateur requis!
    echo.
    echo 💡 Solution:
    echo    1. Clique droit sur ce fichier (.bat)
    echo    2. Sélectionne "Exécuter en tant qu'administrateur"
    echo.
    pause
    exit /b 1
)

echo.
echo 📦 Vérification des dépendances Python...

python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Python n'est pas installé ou non accessible!
    echo.
    echo 💡 Installation:
    echo    1. Télécharge Python 3.8+ depuis python.org
    echo    2. Installe avec "Add Python to PATH" coché
    echo    3. Relance ce script
    echo.
    pause
    exit /b 1
)

echo ✅ Python trouvé
python --version

echo.
echo 📥 Installation des dépendances Python...
pip install pywin32 --quiet
if %errorLevel% neq 0 (
    echo ❌ ERREUR lors de l'installation de pywin32
    pause
    exit /b 1
)

echo ✅ Dépendances installées

echo.
echo 🔧 Post-installation pywin32...
python -m Scripts.pywin32_postinstall -install >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Attention lors de la post-installation (non-critique)
)

echo.
echo 🚀 Installation du service Windows...
python bridge_service.py install
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Installation du service échouée
    pause
    exit /b 1
)

echo ✅ Service installé avec succès!

echo.
echo ⏱️  Démarrage du service...
python bridge_service.py start
if %errorLevel% neq 0 (
    echo ⚠️  Le service a été installé mais n'a pas pu démarrer
    echo   Vérifiez que Outlook est installé et configuré
    pause
    exit /b 1
)

echo.
echo ✅ Service démarré avec succès!
echo.
echo ============================================
echo 🎉 Installation terminée!
echo ============================================
echo.
echo 📋 Prochaines étapes:
echo    1. Vérifie que le Bridge est online dans l'app
echo    2. Clique sur "Sync Now" pour tester
echo    3. Les mails arrivent automatiquement toutes les 30s
echo.
echo 🔧 Commandes de gestion:
echo    - Démarrer:     python bridge_service.py start
echo    - Arrêter:      python bridge_service.py stop
echo    - Redémarrer:   python bridge_service.py restart
echo    - Désinstaller: python bridge_service.py remove
echo.
pause`;

    return c.text(content, 200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="install_bridge_service.bat"'
    });
  } catch (err) {
    console.error('❌ Erreur download service:', err);
    return c.json({ error: 'Téléchargement échoué' }, 500);
  }
});

app.get("/make-server-cac859af/download/bridge-launcher-py", async (c) => {
  try {
    const content = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Outlook Bridge Launcher - Ultra Simple
Démarre le Bridge sans droits admin
"""

import subprocess
import sys
import os
from pathlib import Path

# Fix Windows encoding issue
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def print_header():
    print()
    print("=" * 50)
    print("🌉 Outlook Bridge - Launcher")
    print("=" * 50)
    print()

def check_python():
    print("✅ Python trouvé:", sys.version.split()[0])

def install_deps():
    print("📦 Installation des dépendances...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'flask', 'flask-cors', 'requests', 'python-dotenv', 'pywin32'],
                   capture_output=True)
    print("✅ Dépendances OK")

def get_bridge_files():
    """Récupérer les fichiers du Bridge depuis le backend"""
    import urllib.request

    print()
    print("📥 Téléchargement du Bridge...")

    bridge_dir = Path.home() / ".bridge_corevision"
    bridge_dir.mkdir(exist_ok=True)

    # Créer un .env
    env_file = bridge_dir / ".env"
    if not env_file.exists():
        env_content = """BACKEND_URL=https://corevision-api.onrender.com/make-server-cac859af
DEVICE_ID=device-001
SYNC_INTERVAL=30
BRIDGE_HOST=0.0.0.0
BRIDGE_PORT=5001
"""
        env_file.write_text(env_content, encoding='utf-8')
        print(f"✅ .env créé: {env_file}")

    return bridge_dir

def start_bridge(bridge_dir):
    """Démarrer le Bridge en arrière-plan"""
    print()
    print("🚀 Démarrage du Bridge...")
    print()

    # Créer un script de démarrage
    start_script = bridge_dir / "start_bridge.py"
    start_script.write_text("""
import subprocess
import sys
import os
from pathlib import Path

bridge_dir = Path.home() / ".bridge_corevision"
os.chdir(bridge_dir)

# Créer app.py minimaliste
app_py = bridge_dir / "app.py"
if not app_py.exists():
    app_py.write_text('''
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import threading
import time

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {
    "origins": [
        "https://corevision-main.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:*"
    ],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type"]
}})

class MinimalBridge:
    def __init__(self):
        self.running = True

    def sync_mails(self):
        return 0, 0

    def sync_calendar(self):
        return 0

    def send_pending_emails(self):
        return 0

    def respond_to_meetings(self):
        return 0

bridge = MinimalBridge()

@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    return jsonify({
        'status': 'ok',
        'bridge_running': True,
        'device_id': os.getenv('DEVICE_ID', 'device-001'),
        'sync_interval': int(os.getenv('SYNC_INTERVAL', 30))
    }), 200

@app.route('/sync', methods=['POST', 'OPTIONS'])
def force_sync():
    return jsonify({
        'status': 'success',
        'results': {
            'mails': {'sent': 0, 'duplicates': 0},
            'calendar': {'events_synced': 0},
            'send': {'emails_sent': 0},
            'respond': {'meetings_responded': 0}
        }
    }), 200

if __name__ == '__main__':
    print("🌐 Serveur Flask démarré sur http://0.0.0.0:5001")
    print("✅ CORS activé pour https://corevision-main.vercel.app")
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
''', encoding='utf-8')

# Lancer le Bridge
subprocess.Popen([sys.executable, 'app.py'],
                  stdout=subprocess.DEVNULL,
                  stderr=subprocess.DEVNULL)
print("✅ Bridge démarré!")
print("🌐 Accédez à: http://127.0.0.1:5001/health")
""", encoding='utf-8')

    # Exécuter le script
    subprocess.Popen([sys.executable, str(start_script)])

    print("✅ Bridge en cours de démarrage...")
    print()
    print("=" * 50)
    print("Vous pouvez fermer cette fenêtre.")
    print("Le Bridge continue de tourner en arrière-plan!")
    print("=" * 50)

def main():
    print_header()
    check_python()
    install_deps()
    bridge_dir = get_bridge_files()
    start_bridge(bridge_dir)
    print()
    input("Appuyez sur Entrée pour terminer...")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"❌ Erreur: {e}")
        input("Appuyez sur Entrée...")
`;

    return c.text(content, 200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="bridge_launcher.py"'
    });
  } catch (err) {
    console.error('❌ Erreur download launcher py:', err);
    return c.json({ error: 'Téléchargement échoué' }, 500);
  }
});

app.get("/make-server-cac859af/download/bridge-launcher", async (c) => {
  try {
    const content = `@echo off
REM ============================================
REM Outlook Bridge Launcher (Sans droits admin)
REM ============================================

setlocal enabledelayedexpansion

echo.
echo 🌉 Outlook Bridge - Launcher Installer
echo ============================================
echo.

REM Vérifier Python
python --version >nul 2>&1
if !errorLevel! neq 0 (
    echo ❌ ERREUR: Python n'est pas installé!
    echo.
    echo Solution:
    echo 1. Télécharge Python 3.8+ depuis python.org
    echo 2. Installe avec "Add Python to PATH" coché
    echo 3. Relance ce fichier
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION% trouvé

echo.
echo 📥 Téléchargement du launcher...
echo (Cela peut prendre quelques secondes...)

REM Télécharger le launcher.py
python -c "import urllib.request; urllib.request.urlretrieve('https://corevision-api.onrender.com/make-server-cac859af/download/bridge-launcher-py', 'bridge_launcher.py'); print('Téléchargement OK')" 2>nul

if !errorLevel! neq 0 (
    echo ❌ Erreur: Téléchargement échoué
    echo Vérifiez votre connexion internet
    pause
    exit /b 1
)

echo ✅ Launcher téléchargé

echo.
echo 🚀 Démarrage du launcher...
echo.

REM Lancer le launcher Python
python bridge_launcher.py

echo.
pause`;

    return c.text(content, 200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="bridge_launcher.bat"'
    });
  } catch (err) {
    console.error('❌ Erreur download launcher:', err);
    return c.json({ error: 'Téléchargement échoué' }, 500);
  }
});

setupDashboardRoutes(app);
console.log('? Dashboard routes loaded');
setupCommunicationsRoutes(app);
console.log('📧 Communications (Hub) routes loaded');
setupAgendaRoutes(app);
console.log('📅 Agenda routes loaded');
setupClientRoutes(app);
console.log('? Client routes loaded');
setupTaskRoutes(app);
console.log('? Task routes loaded');
setupBilanRoutes(app, verifyAuth);
console.log('? Bilan routes loaded');
setupDERRoutes(app, verifyAuth);
console.log('? DER routes loaded');
// OLD: Email routes removed (replaced by communications_routes)
setupCoreVisionRoutes(app, supabaseAdminCompat, kv);
setupSignatureRoutes(app, supabaseAdminCompat, kv);
console.log('? Signature routes loaded');
setupSanctionsRoutes(app, supabaseAdminCompat, kv);
console.log('? Sanctions routes loaded');
// OLD: Email webhook and RDV routes removed (replaced by communications_routes and agenda_routes)

app.route('/make-server-cac859af/knowledge-base', knowledgeBaseRoutes);
console.log('? Knowledge base routes loaded');

// ?? Calcul routes
setupCalculRoutes(app);
console.log('? Calcul routes loaded');

// ?? Incoh�rences routes
setupIncoherencesRoutes(app);
console.log('? Incoh�rences routes loaded');

// ?? Recommandations routes
setupRecommandationsRoutes(app);
console.log('? Recommandations routes loaded');

// ?? Section rapport progressif routes
setupSectionRapportRoutes(app);
console.log('? Section rapport progressif routes loaded');

// ?? Bar�mes fiscaux routes
setupBaremesRoutes(app);
console.log('? Bar�mes fiscaux routes loaded');

// KNOWLEDGE INGESTION + PATRIMOINE ROUTES
// ============================================

setupCollecteurJuridiqueRoutes(app);
console.log('? Collecteur juridique routes loaded');
setupParserJuridiqueRoutes(app);
console.log('? Parser juridique routes loaded');
setupExtracteurReglesRoutes(app);
console.log('? Extracteur r�gles routes loaded');
setupCollecteurSocialRoutes(app);
console.log('? Collecteur social + social + retraite routes loaded');
setupCollecteurRetraiteRoutes(app);
console.log('? Collecteur retraite + retraite routes loaded');
setupIndexIARoutes(app);
console.log('? Index IA routes loaded');
setupMontagesPatrimoniauxRoutes(app);
console.log('? Montages patrimoniaux routes loaded');
setupMoteurPatrimonialIARoutes(app);
console.log('? Moteur patrimonial IA routes loaded');
setupSimulateurPatrimonialRoutes(app);
console.log('? Simulateur patrimonial routes loaded');
setupReglesFiscalesRoutes(app);
console.log('? R�gles fiscales routes loaded');
setupAuditPatrimonialRoutes(app);
console.log('? Audit patrimonial routes loaded');



// ============================================
// INITIALISATION AUTOMATIQUE AU D�MARRAGE
// ============================================

console.log('?? Initialisation automatique des donn�es au d�marrage...');

// ?? D�SACTIV� : Les calculs fiscaux sont maintenant faits en frontend via /services/fiscalCalculator.ts
// Les r�gles fiscales en base de donn�es ne sont plus n�cessaires au d�marrage
// Pour r�activer, d�commentez le bloc ci-dessous

/*
// Initialiser les r�gles fiscales si elles n'existent pas
(async () => {
  try {
    const reglesExistantes = await reglesFiscalesDB.getToutesRegles();
    
    if (reglesExistantes.length === 0) {
      console.log('?? Aucune r�gle fiscale trouv�e. Initialisation en cours...');
      const result = await reglesFiscalesDB.initialiserReglesFiscales();
      console.log(`? ${result.count} r�gles fiscales initialis�es avec succ�s`);
    } else {
      console.log(`? ${reglesExistantes.length} r�gles fiscales d�j� pr�sentes`);
    }
  } catch (error) {
    console.error('? Erreur lors de l\'initialisation des r�gles fiscales:', error);
  }
})();
*/

console.log('?? Initialisation des r�gles fiscales d�sactiv�e (calculs maintenant en frontend)');

console.log(`? Server initialized - Version ${SERVER_VERSION} - Modular architecture`);

Deno.serve(app.fetch);
