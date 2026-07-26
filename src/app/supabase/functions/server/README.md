# 🚀 Backend - CoreVision

Code serveur Deno/Hono - Render

## Démarrage rapide

### Local
```bash
deno run --allow-all --allow-env src/app/backend/index.tsx
```

### Render
Configuré automatiquement via git. Vérifiez les env vars dans le dashboard Render.

---

## Architecture modulaire

### Core
- **index.tsx** - Point d'entrée Hono, enregistrement routes
- **auth.tsx** - JWT sign/verify
- **kv_store.tsx** - PostgreSQL client
- **storage.tsx** - File operations abstraction

### 28 Route modules
Chacun dans son fichier `*_routes.tsx`:

#### 🔐 Auth & système
- `client_routes.tsx` - Clients CRUD
- `task_routes.tsx` - Tasks management

#### 📊 Métier
- `dashboard_routes.tsx` - Analytics
- `bilan_routes.tsx` - Bilan patrimonial
- `audit_patrimonial_routes.tsx` - Audit expertise

#### 🔍 Collecteurs
- `collecteur_juridique_routes.tsx` - Legifrance, BOFiP
- `collecteur_social_routes.tsx` - URSSAF
- `collecteur_retraite_routes.tsx` - cnav.fr

#### 🧠 IA
- `moteur_patrimonial_ia_routes.tsx` - GPT-4o patrimoine
- `corevision_routes.tsx` - Analyse 7 étapes
- `knowledge_base_routes.tsx` - RAG indexing

#### 💰 Patrimoine
- `montages_patrimoniaux_routes.tsx` - Montages
- `simulateur_patrimonial_routes.tsx` - Simulations

---

## Ajouter une nouvelle route

```typescript
// new_feature_routes.tsx
export function setupNewFeatureRoutes(app: Hono) {
  app.post('/make-server-cac859af/new-feature', verifyAuth, async (c) => {
    const data = await c.req.json();
    
    // Logic here
    
    return c.json({ success: true, data });
  });
}

// Dans index.tsx, ajouter:
import { setupNewFeatureRoutes } from "./new_feature_routes.tsx";
// ... puis appeler:
setupNewFeatureRoutes(app);
```

---

## Env vars requises

```
DATABASE_URL=postgresql://...         (Render Postgres)
JWT_SECRET=<32+ chars>                (Token signing)
OPENAI_API_KEY=sk-...                 (GPT-4o)
NODE_ENV=production                   (Environment)
UPLOADS_DIR=/opt/corevision/uploads   (File storage)
API_BASE_URL=https://...              (Base API URL)
```

---

## Troubleshooting

### "DATABASE_URL env var not set"
→ Configurer dans Render dashboard Settings → Environment

### "PostgreSQL connection timeout"
→ Vérifier DATABASE_URL format et connectivité Render

### "JWT verification failed"
→ Frontend token expiré, redirection login

---

**Last updated:** 2026-07-14
