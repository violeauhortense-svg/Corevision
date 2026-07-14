import { Hono } from "npm:hono";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as sessions from "./sessions.tsx";
import { supabaseAdminCompat, UPLOADS_DIR } from "./storage.tsx";
import { verifyAuth, createUser, signInUser } from "./auth.tsx";
import { schemas } from "./validation.tsx";
// Feature routes
import { setupBilanRoutes } from "./bilan_routes.tsx";
import { setupClientRoutes } from "./client_routes.tsx";
import { setupTaskRoutes } from "./task_routes.tsx";
import { setupDERRoutes } from "./der_routes.tsx";
import { setupEmailRoutes } from "./email_routes.tsx";
import { setupCoreVisionRoutes } from "./corevision_routes.tsx";
import { setupSignatureRoutes } from "./signature_routes.tsx";
import { setupSanctionsRoutes } from "./sanctions_routes.tsx";
import { setupEmailWebhookRoutes } from "./email_webhook.tsx";
import { setupRDVRoutes } from "./rdv_routes.tsx";
import knowledgeBaseRoutes from "./knowledge_base_routes.tsx";
import { setupCalculRoutes } from "./calcul_routes.tsx";
import { setupIncoherencesRoutes } from "./incoherences_routes.tsx";
import { setupRecommandationsRoutes } from "./recommandations_routes.tsx";
import { setupBaremesRoutes } from "./baremes_routes.tsx";
import { setupSectionRapportRoutes } from "./section_rapport_routes.tsx";
import { mailRoutes } from "./mail_routes.tsx";
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
  } catch {
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

  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (isAllowed) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
  }

  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  c.header("Access-Control-Expose-Headers", "Content-Length, Set-Cookie");
  c.header("Access-Control-Max-Age", "600");

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
  const { user, error } = await verifyAuth(c.req.header('Authorization'));
  
  if (error || !user) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }

  try {
    
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
    const body = await c.req.json();

    // Validate email and password
    const validation = schemas.signup(body);
    if (!validation.valid) {
      return c.json({ error: 'Validation failed', errors: validation.errors }, 400);
    }

    const { email, password, nom, prenom, specialite, certifications } = body;

    const user = await createUser(email, password, {
      nom: nom || '',
      prenom: prenom || '',
      specialite: specialite || 'Gestion de patrimoine',
      certifications: certifications || 'CIF, AMF',
    });

    return c.json({ user });
  } catch (error) {
    const msg = (error as Error).message;
    console.error('Signup error:', msg);
    return c.json({ error: msg }, 400);
  }
});

app.post("/make-server-cac859af/auth/signin", async (c) => {
  try {
    const body = await c.req.json();

    // Validate email and password
    const validation = schemas.signup(body);
    if (!validation.valid) {
      return c.json({ error: 'Validation failed', errors: validation.errors }, 400);
    }

    const { email, password } = body;

    const data = await signInUser(email, password);

    // Set sessionId in HTTP-only cookie
    const setCookieHeader = sessions.setSessionIdCookie(data.sessionId);
    c.header("Set-Cookie", setCookieHeader);

    return c.json({ session: data.session, user: data.user });
  } catch (error) {
    console.error('Sign in error:', error);
    return c.json({ error: (error as Error).message }, 401);
  }
});

app.get("/make-server-cac859af/auth/profile", async (c) => {
  const { user, error } = await verifyAuth(c.req.header('Authorization'));
  
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
  const { user, error } = await verifyAuth(c.req.header('Authorization'));
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

setupDashboardRoutes(app);
console.log('? Dashboard routes loaded');
setupClientRoutes(app);
console.log('? Client routes loaded');
setupTaskRoutes(app);
console.log('? Task routes loaded');
setupBilanRoutes(app, verifyAuth);
console.log('? Bilan routes loaded');
setupDERRoutes(app, verifyAuth);
console.log('? DER routes loaded');
setupEmailRoutes(app, verifyAuth);
console.log('? Email routes loaded');
setupCoreVisionRoutes(app, supabaseAdminCompat, kv);
console.log('? CoreVision routes loaded');
setupSignatureRoutes(app, supabaseAdminCompat, kv);
console.log('? Signature routes loaded');
setupSanctionsRoutes(app, supabaseAdminCompat, kv);
console.log('? Sanctions routes loaded');
setupEmailWebhookRoutes(app);
console.log('? Email webhook routes loaded');
setupRDVRoutes(app);
console.log('? RDV routes loaded');

// Knowledge Base routes
app.route('/make-server-cac859af/knowledge-base', knowledgeBaseRoutes);
console.log('? Knowledge base routes loaded');

// ?? Calcul routes
setupCalculRoutes(app);
console.log('? Calcul routes loaded');

// ?? Incoh�rences routes
setupIncoherencesRoutes(app);

// ?? Recommandations routes
setupRecommandationsRoutes(app);
console.log('? Recommandations routes loaded');

// ?? Section rapport progressif routes
setupSectionRapportRoutes(app);
console.log('? Section rapport progressif routes loaded');

// ?? Bar�mes fiscaux routes
setupBaremesRoutes(app);

// ?? Mail routes
app.route('/make-server-cac859af', mailRoutes);
console.log('? Mail routes loaded');

// ============================================
// KNOWLEDGE INGESTION + PATRIMOINE ROUTES
// ============================================

setupCollecteurJuridiqueRoutes(app);
console.log('? Collecteur juridique routes loaded');
setupParserJuridiqueRoutes(app);
console.log('? Parser juridique routes loaded');
setupExtracteurReglesRoutes(app);
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
setupAuditPatrimonialRoutes(app);
console.log('? Audit patrimonial routes loaded');



// ============================================
// INITIALISATION AUTOMATIQUE AU D�MARRAGE
// ============================================


// ?? D�SACTIV� : Les calculs fiscaux sont maintenant faits en frontend via /services/fiscalCalculator.ts
// Les r�gles fiscales en base de donn�es ne sont plus n�cessaires au d�marrage
// Pour r�activer, d�commentez le bloc ci-dessous

/*
// Initialiser les r�gles fiscales si elles n'existent pas
(async () => {
  try {
    const reglesExistantes = await reglesFiscalesDB.getToutesRegles();
    
    if (reglesExistantes.length === 0) {
      const result = await reglesFiscalesDB.initialiserReglesFiscales();
    } else {
    }
  } catch (error) {
    console.error('? Erreur lors de l\'initialisation des r�gles fiscales:', error);
  }
})();
*/


// ✨ Initialize PostgreSQL sessions table (replaces localStorage)
await sessions.initializeSessions();

console.log(`? Server initialized - Version ${SERVER_VERSION} - Modular architecture`);

Deno.serve(app.fetch);
