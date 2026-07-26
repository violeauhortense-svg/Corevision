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
    const content = `"""
Outlook Bridge Launcher - GUI Interface
Démarre le Bridge sans droits admin
Double-clique ce fichier pour exécuter
"""

import tkinter as tk
from tkinter import messagebox
import subprocess
import sys
import os
import threading
import time
from pathlib import Path
import json

class BridgeLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("🌉 Outlook Bridge - Launcher")
        self.root.geometry("500x350")
        self.root.resizable(False, False)

        self.bridge_process = None
        self.is_running = False
        self.config_file = Path.home() / ".bridge_launcher.json"
        self.load_config()

        self.setup_ui()
        self.check_bridge_status()

    def load_config(self):
        if self.config_file.exists():
            with open(self.config_file) as f:
                self.config = json.load(f)
        else:
            self.config = {
                'backend_url': 'https://corevision-api.onrender.com/make-server-cac859af',
                'device_id': 'device-001'
            }
            self.save_config()

    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f)

    def setup_ui(self):
        main_frame = tk.Frame(self.root, bg='#f0f0f0')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        tk.Label(main_frame, text="🌉 Outlook Bridge", font=("Arial", 18, "bold"), bg='#f0f0f0').pack(pady=10)

        self.status_label = tk.Label(main_frame, text="🔴 Hors ligne", font=("Arial", 14, "bold"), fg='red', bg='#f0f0f0')
        self.status_label.pack(pady=10)

        self.info_label = tk.Label(main_frame, text="En attente...", font=("Arial", 10), bg='#f0f0f0', fg='#666')
        self.info_label.pack(pady=5)

        button_frame = tk.Frame(main_frame, bg='#f0f0f0')
        button_frame.pack(pady=20)

        self.start_btn = tk.Button(button_frame, text="▶️  Démarrer Bridge", command=self.start_bridge, font=("Arial", 11, "bold"), bg='#4CAF50', fg='white', width=20, height=2)
        self.start_btn.pack(pady=5)

        self.stop_btn = tk.Button(button_frame, text="⏹️  Arrêter Bridge", command=self.stop_bridge, font=("Arial", 11, "bold"), bg='#f44336', fg='white', width=20, height=2, state=tk.DISABLED)
        self.stop_btn.pack(pady=5)

        config_frame = tk.Frame(main_frame, bg='#f0f0f0')
        config_frame.pack(pady=10, fill=tk.X)

        tk.Label(config_frame, text="Device ID:", font=("Arial", 9), bg='#f0f0f0').pack(side=tk.LEFT)

        self.device_id_entry = tk.Entry(config_frame, font=("Arial", 9), width=20)
        self.device_id_entry.pack(side=tk.LEFT, padx=5)
        self.device_id_entry.insert(0, self.config['device_id'])

        tk.Button(config_frame, text="💾 Sauvegarder", command=self.save_device_id, font=("Arial", 8), bg='#2196F3', fg='white').pack(side=tk.LEFT)

    def start_bridge(self):
        try:
            # Créer un script Python qui démarre le Bridge
            bridge_script = """
import subprocess
import sys
import os
from dotenv import load_dotenv

env_file = os.path.expanduser('~/.bridge_launcher.json')
os.chdir('.')
subprocess.Popen([sys.executable, 'app.py'],
                  stdout=subprocess.DEVNULL,
                  stderr=subprocess.DEVNULL)
"""
            self.config['device_id'] = self.device_id_entry.get()
            self.save_config()

            # Démarrer le Bridge en arrière-plan
            self.bridge_process = subprocess.Popen(
                [sys.executable, '-m', 'pip', 'install', '-q', 'flask', 'requests', 'python-dotenv'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            self.is_running = True
            self.start_btn.config(state=tk.DISABLED)
            self.stop_btn.config(state=tk.NORMAL)
            self.status_label.config(text="🟡 Démarrage...", fg='orange')
            self.info_label.config(text="Installation des dépendances...")

            self.verify_bridge()

        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de démarrer: {e}")

    def stop_bridge(self):
        if self.bridge_process:
            try:
                self.bridge_process.terminate()
                self.is_running = False
                self.start_btn.config(state=tk.NORMAL)
                self.stop_btn.config(state=tk.DISABLED)
                self.status_label.config(text="🔴 Hors ligne", fg='red')
            except:
                pass

    def check_bridge_status(self):
        try:
            import urllib.request
            urllib.request.urlopen('http://127.0.0.1:5001/health', timeout=2)
            return True
        except:
            return False

    def verify_bridge(self):
        def check():
            time.sleep(2)
            for i in range(10):
                if self.check_bridge_status():
                    self.status_label.config(text="🟢 En ligne!", fg='green')
                    self.info_label.config(text="Synchronisation active")
                    return
                time.sleep(1)
            self.info_label.config(text="⚠️  Vérifiez que Outlook est installé")

        threading.Thread(target=check, daemon=True).start()

    def save_device_id(self):
        self.config['device_id'] = self.device_id_entry.get()
        self.save_config()
        messagebox.showinfo("✅", "Device ID sauvegardé!")

if __name__ == '__main__':
    root = tk.Tk()
    app = BridgeLauncher(root)
    root.mainloop()
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

echo.
echo 🌉 Outlook Bridge - Launcher Installer
echo ============================================
echo.

REM Vérifier Python
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Python n'est pas installé!
    echo.
    echo Télécharge Python depuis python.org
    echo et installe avec "Add Python to PATH" coché
    echo.
    pause
    exit /b 1
)

echo ✅ Python trouvé

echo.
echo 📦 Installation des dépendances...
python -m pip install flask requests python-dotenv --quiet

echo.
echo 🚀 Téléchargement du launcher...

REM Télécharger le launcher.py
python -c "import urllib.request; urllib.request.urlretrieve('https://corevision-api.onrender.com/make-server-cac859af/download/bridge-launcher-py', 'bridge_launcher.py')"

echo.
echo ✅ Démarrage du launcher...
python bridge_launcher.py

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
