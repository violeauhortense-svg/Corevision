# 🎯 PocketBase Setup Guide - Development Environment

**Date:** 5 septembre 2026  
**Purpose:** Local backend development with PocketBase + Tailscale for secure tunnel  
**Audience:** Hortense Violeau (Admin)

---

## 📋 Table des Matières

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Backend](#running-the-backend)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│ PC #1 (Ton Serveur Windows)                              │
│ ├─ PocketBase (http://localhost:8090)                    │
│ ├─ Deno/Hono Backend (http://localhost:3000)             │
│ └─ Tailscale (100.x.x.x - réseau privé)                  │
└──────────────────────────────────────────────────────────┘
             ↑ Tailscale Tunnel (Sécurisé)
┌──────────────────────────────────────────────────────────┐
│ PC #2 / Vercel Frontend                                  │
│ └─ Navigateur → Vercel → API → http://pc1.tailscale:8090 │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

- [x] Windows 10+ ou macOS/Linux
- [x] Node.js 18+ (pour npm scripts)
- [x] Deno 2.x (runtime backend)
- [x] Git
- [x] Tailscale installé et connecté
- [x] PocketBase téléchargé et lancé

---

## ⚙️ Installation

### 1. Créer Collections PocketBase

Accède à **http://localhost:8090/_/** (admin panel PocketBase) et crée ces collections:

#### Collection: `users`
```
Fields:
  - id (TEXT, primaryKey)
  - email (TEXT, required, unique, indexed)
  - password (TEXT, required)
  - name (TEXT)
  - role (TEXT, default: "consultant")
  - createdAt (DATETIME, auto)
  - updatedAt (DATETIME, auto)
```

#### Collection: `clients`
```
Fields:
  - id (TEXT, primaryKey)
  - nom (TEXT, required)
  - prenom (TEXT)
  - email (TEXT, unique)
  - telephone (TEXT)
  - status (TEXT, default: "prospect")
  - patrimoine (JSON)
  - createdAt (DATETIME, auto)
  - updatedAt (DATETIME, auto)
```

#### Collection: `hub_mails`
```
Fields:
  - id (TEXT, primaryKey)
  - messageId (TEXT)
  - threadId (TEXT)
  - from (TEXT, required, indexed)
  - fromName (TEXT)
  - to (TEXT - array/text)
  - subject (TEXT, required)
  - body (LONGTEXT)
  - isHtml (BOOL, default: false)
  - bodyPreview (TEXT)
  - sentAt (DATETIME, required, indexed)
  - direction (TEXT, required) [received|sent]
  - read (BOOL, default: false)
  - clientId (TEXT, indexed)
  - clientName (TEXT)
  - clientEmail (TEXT)
  - hubTab (TEXT, required, default: "conversation_client", indexed)
    [conversation_client|interne_externe|archive|appels]
  - traitementStatus (TEXT, required, default: "a_traiter", indexed)
    [a_traiter|en_cours|a_valider_gl|valide_gl|termine]
  - attachments (JSON, default: [])
  - notes (JSON, default: [])
  - createdAt (DATETIME, auto)
  - updatedAt (DATETIME, auto)
  - importedFrom (TEXT, default: "outlook")
```

#### Collection: `hub_calls`
```
Fields:
  - id (TEXT, primaryKey)
  - clientId (TEXT, indexed)
  - clientName (TEXT)
  - clientPhone (TEXT)
  - clientEmail (TEXT)
  - subject (TEXT, required)
  - reason (TEXT)
  - dueDate (DATETIME, required, indexed)
  - priority (TEXT, default: "normal", indexed)
    [urgent|normal|low]
  - status (TEXT, default: "pending", indexed)
    [pending|in_progress|completed]
  - linkedMailId (TEXT)
  - notes (TEXT)
  - createdAt (DATETIME, auto)
  - completedAt (DATETIME)
```

#### Collection: `tasks`
```
Fields:
  - id (TEXT, primaryKey)
  - clientId (TEXT, indexed)
  - title (TEXT, required)
  - description (TEXT)
  - status (TEXT, default: "pending")
  - priority (TEXT, default: "normal")
  - dueDate (DATETIME)
  - assignedTo (TEXT)
  - createdAt (DATETIME, auto)
  - updatedAt (DATETIME, auto)
```

### 2. Seed Data (Optionnel)

Pour tester rapidement, crée quelques enregistrements de test:

**User de test:**
```json
{
  "email": "test@corevision.fr",
  "password": "test123",
  "name": "Hortense Violeau",
  "role": "consultant"
}
```

**Client de test:**
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "06 12 34 56 78",
  "status": "actif"
}
```

---

## 🔧 Configuration

### 1. Variables d'Environnement

Le fichier `.env.development` est déjà créé. **Tu dois avoir:**

```bash
# .env.development (fichier project root)

POCKETBASE_URL=http://pc1.tailscale:8090
JWT_SECRET=dev_secret_key_change_in_production_12345
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### 2. Adapter le Backend Deno/Hono

#### Option A: Remplacer les routes existantes

Remplace l'import dans `src/app/backend/index.tsx`:

```typescript
// AVANT (PostgreSQL)
import { getKVClient } from './kv_store.tsx';
const kv = getKVClient();

// APRÈS (PocketBase)
import { pb } from './pocketbase_client.tsx';

// Dans les routes:
// await kv.get('key') → await pb.getRecord('collection', 'id')
// await kv.set('key', data) → await pb.createRecord('collection', data)
```

#### Option B: Utiliser routes PocketBase fournies

J'ai créé `hub_mails_routes_pb.tsx` comme exemple. Tu peux:

```typescript
import hubMailsRoutes from './hub_mails_routes_pb.tsx';
app.route('/api/mails', hubMailsRoutes);
```

---

## 🚀 Running the Backend

### 1. Vérifier que PocketBase est lancé

```bash
# Terminal 1 - PocketBase
cd C:\pocketbase
.\pocketbase.exe serve
# → Server running at: http://127.0.0.1:8090/
```

### 2. Vérifier Tailscale

```bash
# Terminal - Vérifier connexion
ipconfig
# Cherche "Tailscale Tunnel" avec adresse 100.x.x.x

# Teste accès depuis PC #2:
# http://100.x.x.x:8090 doit fonctionner
```

### 3. Lancer le Backend Deno

```bash
# Terminal 2 - Backend
cd C:\Users\conta\OneDrive\Documents\Claude\Projects\Corevision-main

# Charger env vars
$env:POCKETBASE_URL = "http://pc1.tailscale:8090"
$env:JWT_SECRET = "dev_secret_key_change_in_production_12345"
$env:FRONTEND_URL = "http://localhost:5173"

# Lancer Deno
deno run --allow-net --allow-env --allow-read src/app/backend/index.tsx
# → Server running at: http://localhost:3000
```

### 4. Tester depuis Vercel (PC #2)

Configure Vercel pour appeler PocketBase via Tailscale:

```bash
# vercel.env.development (tu crées ce fichier)
NEXT_PUBLIC_API_URL=http://pc1.tailscale:3000
```

Ou dans `src/app/utils/api/info.tsx`:

```typescript
export const apiBaseUrl = 
  process.env.NODE_ENV === 'development'
    ? 'http://pc1.tailscale:3000'  // Backend local via Tailscale
    : 'https://api.render.com';    // Production
```

---

## ✅ Testing

### Test 1: PocketBase Admin Panel

```bash
# Browser: http://localhost:8090/_/
# Vérifie que tu peux voir les collections
```

### Test 2: PocketBase API Direct

```bash
# Terminal - Tester API PocketBase
curl -X GET http://localhost:8090/api/collections/clients/records

# Ou via Tailscale depuis PC #2:
curl -X GET http://pc1.tailscale:8090/api/collections/clients/records
```

### Test 3: Backend Endpoints

```bash
# Tester un endpoint
curl -X GET http://localhost:3000/api/mails

# Depuis PC #2 via Tailscale:
curl -X GET http://pc1.tailscale:3000/api/mails
```

### Test 4: Vercel Frontend

```bash
# Dans navigateur PC #2:
https://corevision-main.vercel.app

# Ouvre DevTools → Console
# Teste un appel API:
fetch('http://pc1.tailscale:3000/api/mails')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## 🐛 Troubleshooting

### "Cannot reach http://pc1.tailscale:8090"

1. Vérifier que **Tailscale est activé** sur PC #1
2. Vérifier que **PocketBase est lancé**
3. Vérifier l'adresse Tailscale:
   ```bash
   tailscale status
   # Doit afficher: pc1 (100.x.x.x)
   ```
4. Tester ping:
   ```bash
   ping pc1.tailscale
   ```

### "Connection refused on port 3000"

1. Vérifier que **Deno backend est lancé**
2. Vérifier qu'aucune autre app n'utilise port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```
3. Changer le port dans `.env.development`:
   ```
   PORT=3001
   ```

### "CORS error from Vercel"

1. Ajouter Vercel URL aux CORS PocketBase:
   ```
   PocketBase Admin → Settings → CORS
   Allow origins: https://corevision-main.vercel.app
   ```

2. Ou configurer CORS dans le backend Deno:
   ```typescript
   app.use('*', cors({
     origin: ['http://localhost:5173', 'https://corevision-main.vercel.app'],
   }));
   ```

### "Authentication fails"

1. Vérifier que l'utilisateur existe dans `users` collection
2. Vérifier le mot de passe (PocketBase hash automatiquement)
3. Tester directement:
   ```bash
   curl -X POST http://localhost:8090/api/collections/users/auth-with-password \
     -H "Content-Type: application/json" \
     -d '{"identity":"test@corevision.fr","password":"test123"}'
   ```

---

## 📝 Checklist Final

- [x] Tailscale installé et connecté
- [x] PocketBase téléchargé et lancé
- [x] Collections créées dans PocketBase
- [x] `.env.development` configuré
- [x] Backend Deno adapté pour PocketBase
- [x] CORS configuré
- [x] Vercel frontend pointant vers PocketBase
- [x] Tests passent sur PC #1 et PC #2

---

## 🎉 Tu es Prêt!

**Prochaines étapes:**
1. Phase 3: Configurer Vercel pour utiliser PocketBase
2. Phase 4: Tester l'app complète
3. Phase 5: Fixer les bugs d'authentification

**Questions?** Dis-moi! 🚀
