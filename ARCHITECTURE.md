# 🏗️ Architecture CoreVision - 2026

## Vue d'ensemble

CoreVision est une **application web de conseils patrimoniaux et fiscaux** avec une architecture moderne séparant frontend et backend sur deux plateformes cloud différentes.

```
┌─────────────────────────────────────────────────────────────┐
│  🌐 FRONTEND (Vercel)                                       │
│  React 18 + Vite + Tailwind + React Router                 │
│  ✨ Single Page Application (SPA)                           │
└─────────────────────────────────────────────────────────────┘
           ↓ HTTP (fetch/API calls) ↓
┌─────────────────────────────────────────────────────────────┐
│  🚀 BACKEND (Render)                                        │
│  Hono + Deno + TypeScript                                  │
│  📍 https://corevision-api.onrender.com/make-server-cac859af│
└─────────────────────────────────────────────────────────────┘
           ↓ SQL queries ↓
┌─────────────────────────────────────────────────────────────┐
│  🗄️ DATABASE (Render)                                       │
│  PostgreSQL 14+                                            │
│  Key-Value Store: `kv_store` (JSONB)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du projet

```
src/app/
├── backend/                    ← 🚀 Code serveur (Deno/Hono)
│   ├── index.tsx              ← Point d'entrée Hono
│   ├── auth.tsx               ← JWT authentication
│   ├── kv_store.tsx           ← PostgreSQL client
│   ├── storage.tsx            ← File system storage
│   │
│   ├── 📊 Routes métier (28 modules)
│   ├── client_routes.tsx
│   ├── task_routes.tsx
│   ├── bilan_routes.tsx
│   ├── audit_patrimonial_routes.tsx
│   │
│   ├── 🔍 Collecteurs de données
│   ├── collecteur_juridique_routes.tsx
│   ├── collecteur_social_routes.tsx
│   ├── collecteur_retraite_routes.tsx
│   │
│   ├── 🧠 Moteurs IA
│   ├── moteur_patrimonial_ia_routes.tsx
│   ├── corevision_routes.tsx
│   ├── knowledge_base_routes.tsx
│   │
│   └── 💰 Patrimoine
│       ├── montages_patrimoniaux_routes.tsx
│       └── simulateur_patrimonial_routes.tsx
│
├── components/                 ← 🎨 Composants React
│   ├── dashboard/
│   ├── client-detail/
│   ├── mails/
│   └── ... (200+ fichiers TSX)
│
├── services/                   ← 🔗 API clients
│   ├── api.ts
│   ├── calculService.ts
│   ├── corevisionAPI.ts
│   └── ...
│
├── utils/                      ← 🛠️ Utilitaires
│   ├── api/                    ← 🔗 API config & auth (ex Supabase)
│   │   ├── client.ts          ← Custom auth client (JWT)
│   │   └── info.tsx           ← Config API (apiBaseUrl)
│   │
│   └── ... (helpers, formatters, etc)
│
├── types/                      ← 📝 TypeScript types
├── hooks/                      ← 🪝 React hooks
├── config/                     ← ⚙️ Configuration
└── App.tsx                     ← 📍 Root component
```

---

## 🚀 Frontend (Vercel)

### Technologies
- **Framework:** React 18 + React Router 7
- **Build:** Vite 6
- **Styling:** Tailwind CSS 4 + Radix UI components
- **Package Manager:** npm
- **Deployment:** Vercel (automatic from git)

### Configuration
- **File:** `vercel.json`
- **Rewrites:** `/api/*` → `https://corevision-api.onrender.com/make-server-cac859af/*`
- **Auth:** JWT tokens stored in `localStorage`
- **API Base:** `https://corevision-api.onrender.com/make-server-cac859af`

### Démarrage en dev
```bash
npm install
npm run dev
# Opens http://localhost:5173
```

### Build
```bash
npm run build
# Output: dist/
```

---

## 🚀 Backend (Render)

### Technologies
- **Runtime:** Deno
- **Framework:** Hono (HTTP server)
- **Language:** TypeScript
- **Database:** PostgreSQL via deno-postgres
- **Server:** `https://corevision-api.onrender.com`

### Modules principaux

#### 🔐 Authentification & Base de données
- `auth.tsx` - JWT custom (signe/vérifie les tokens)
- `kv_store.tsx` - PostgreSQL KV store client
- `storage.tsx` - File storage abstraction (local filesystem)

#### 📊 Routes métier (28)
- `client_routes.tsx` - CRUD clients
- `task_routes.tsx` - Gestion tâches
- `audit_patrimonial_routes.tsx` - Audit patrimoine
- `dashboard_routes.tsx` - Analytics

#### 🔍 Collecteurs de données
- Juridique (Legifrance, BOFiP)
- Social (URSSAF)
- Retraite (cnav.fr, etc)
- Parser XML/HTML avec Cheerio

#### 🧠 Moteurs IA
- `moteur_patrimonial_ia_routes.tsx` - Analyse patrimoine (GPT-4o)
- `corevision_routes.tsx` - Analyse 7 étapes
- `knowledge_base_routes.tsx` - Indexation & RAG

#### 💰 Patrimoine
- `montages_patrimoniaux_routes.tsx` - Structures d'optimisation
- `simulateur_patrimonial_routes.tsx` - Simulation scénarios

### Endpoints principaux
```
GET  /make-server-cac859af/health                    Health check
POST /make-server-cac859af/auth/signin                Login
POST /make-server-cac859af/auth/signup                Register
GET  /make-server-cac859af/clients/:id                Get client
POST /make-server-cac859af/audit/generate             Generate audit
```

### Déploiement
- **Service:** Render (Web Service)
- **Build:** `npm run build` → Vite build
- **Start:** Deno runtime (auto-detected)
- **Env vars:** `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, etc.

---

## 🗄️ Database (PostgreSQL sur Render)

### Connexion
```
Format: postgresql://user:password@host:port/dbname
Env var: DATABASE_URL (configuré dans Render dashboard)
```

### Table principale
```sql
CREATE TABLE kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_key_prefix ON kv_store (key);
```

### Données stockées
- `user:email:*` - Comptes utilisateurs
- `client:*` - Données clients
- `audit:*` - Résultats d'audit
- `task:*` - Tâches utilisateur
- Et 100+ autres clés thématiques

---

## 🔄 Flux de données

### 1. Authentification
```
Frontend (login form)
  ↓ POST /auth/signin (email, password)
Backend (JWT signe)
  ↓ localStorage.setItem(auth_token)
Frontend (stocke + réutilise token)
  ↓ Header: Authorization: Bearer <token>
Backend (vérifie JWT)
```

### 2. Récupération client
```
Frontend (/clients/123)
  ↓ GET /api/clients/123
Vercel (rewrite)
  ↓ → https://corevision-api.onrender.com/make-server-cac859af/clients/123
Backend (cherche client:123)
  ↓ SELECT * FROM kv_store WHERE key = 'client:123'
PostgreSQL
  ↓ return { name, email, patrimoine, ... }
Frontend (affiche dashboard client)
```

### 3. Génération audit IA
```
Frontend (audit form)
  ↓ POST /api/audit/generate { clientId, ... }
Backend
  ├─ Collecte données client depuis kv_store
  ├─ Appelle GPT-4o (analyse 7 étapes)
  ├─ Sauvegarde résultat audit:xyz
  └─ Retourne rapport
Frontend (affiche rapport)
```

---

## 🛠️ Configuration & Variables d'environnement

### Frontend (Vercel)
```
# vercel.json rewrite
/api/:path* → https://corevision-api.onrender.com/make-server-cac859af/:path*

# src/app/utils/api/info.tsx
apiBaseUrl = "https://corevision-api.onrender.com/make-server-cac859af"
```

### Backend (Render)
```
DATABASE_URL=postgresql://...        PostgreSQL connection
JWT_SECRET=<32+ chars>               Signing secret
OPENAI_API_KEY=sk-...                GPT-4o API key
NODE_ENV=production                  Environment
UPLOADS_DIR=/opt/corevision/uploads  File storage path
API_BASE_URL=https://corevision-api.onrender.com
```

---

## ✅ Qu'est-ce qui est obsolète ?

| Ancien | Nouveau | Raison |
|--------|---------|--------|
| Supabase Auth | JWT custom | Render-native + contrôle total |
| Supabase Storage | Local filesystem | Stockage simple et performant |
| Supabase Functions | Hono + Deno | Meilleur support DX + TypeScript |
| `src/app/supabase/` | `src/app/backend/` | Noms plus clairs |
| `src/app/utils/supabase/` | `src/app/utils/api/` | Pas vraiment Supabase |
| `deploy/migrate-from-supabase.ts` | ❌ Supprimé | Migration terminée |

---

## 🔐 Sécurité

### Authentification
- ✅ JWT tokens (HS256)
- ✅ Tokens validés à chaque requête backend
- ✅ LocalStorage (client-side only)
- ✅ 7 jours TTL

### CORS
- ✅ Configuré dans Hono (accept: `*`)
- ✅ Permet Vercel → Render cross-origin

### Base de données
- ✅ PostgreSQL sur Render (encryption at rest)
- ✅ Accès via DATABASE_URL (connection pooling)
- ✅ Pas de SQL injection (parameterized queries via deno-postgres)

---

## 📊 Monitoring & Logs

### Frontend
- Vercel Analytics (Core Web Vitals)
- Console logs (dev tools)

### Backend
- Deno logs (Hono logger middleware)
- Render logs (dashboard)
- Custom console.log in routes

---

## 🚀 Déploiement

### Frontend (Vercel)
```bash
# Auto-deploys on git push to main
# Or manual: vercel deploy
```

### Backend (Render)
```bash
# Auto-deploys on git push (if connected)
# Or manual via Render dashboard
# Env vars configured in Render dashboard
```

---

## 📚 Ressources

- **Hono Docs:** https://hono.dev
- **Deno Docs:** https://deno.com/manual
- **React Docs:** https://react.dev
- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs

---

**Last updated:** 2026-07-14
**Version:** 2.0.0 (Post-Supabase migration)
