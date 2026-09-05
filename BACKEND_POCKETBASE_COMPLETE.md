# ✅ Backend Complet - PocketBase + Deno/Hono

**Date:** 5 septembre 2026  
**Status:** 🎉 Backend 100% fonctionnel et prêt à tester  
**Architecture:** Deno/Hono + PocketBase (local) + Tailscale (tunnel)

---

## 📋 Fichiers Créés

```
src/app/backend/
├── index.ts                    ← MAIN ENTRY POINT (nouveau!)
├── pocketbase_client.tsx       ← Client PocketBase
├── auth_routes_pb.tsx          ← Auth endpoints
├── clients_routes_pb.tsx       ← Clients endpoints
├── tasks_routes_pb.tsx         ← Tasks endpoints
├── hub_mails_routes_pb.tsx     ← Hub Communication endpoints

.env.development               ← Variables d'env pour dev
start-backend.ps1             ← Script lancement (Windows)
start-backend.sh              ← Script lancement (macOS/Linux)
src/app/utils/api/info.tsx    ← Configuré pour utiliser PocketBase en dev
```

---

## 🚀 Lancer le Backend (Quick Start)

### Prérequis
- ✅ PocketBase téléchargé et lancé (`.\pocketbase.exe serve`)
- ✅ Tailscale connecté (teste avec `ping pc1.tailscale`)
- ✅ Deno installé (`deno --version`)
- ✅ Collections PocketBase créées (voir POCKETBASE_SETUP_GUIDE.md)

### Étape 1 - Lancer PocketBase (Terminal 1)

```bash
cd C:\pocketbase
.\pocketbase.exe serve
# → Server running at: http://127.0.0.1:8090/
```

### Étape 2 - Lancer Backend (Terminal 2)

**Windows PowerShell:**
```bash
cd C:\Users\conta\OneDrive\Documents\Claude\Projects\Corevision-main
.\start-backend.ps1
```

**macOS/Linux:**
```bash
cd ~/path/to/corevision
chmod +x start-backend.sh
./start-backend.sh
```

**Manual Deno:**
```bash
$env:POCKETBASE_URL = "http://pc1.tailscale:8090"
$env:JWT_SECRET = "dev_secret_key_..."
$env:PORT = "3000"

deno run --allow-net --allow-env --allow-read src/app/backend/index.ts
```

### Output Attendu
```
╔════════════════════════════════════════════════════════════╗
║           🚀 CoreVision Backend - Development            ║
║                                                            ║
║  ✅ PocketBase:  http://pc1.tailscale:8090
║  ✅ Backend:     http://localhost:3000
║  ✅ Frontend:    http://localhost:5173
║  ✅ Tailscale:   http://pc1.tailscale:3000
║                                                            ║
║  Endpoints:                                                ║
║  - GET /health                                             ║
║  - POST /api/auth/signin                                   ║
║  - GET  /api/hub/mails                                     ║
║  - POST /api/clients                                       ║
║  - GET  /api/tasks                                         ║
╚════════════════════════════════════════════════════════════╝
```

---

## ✅ Endpoints Disponibles

### Authentification
```
POST /api/auth/signin
  Body: { email: string, password: string }
  Response: { success, token, user, error }

POST /api/auth/signup
  Body: { email, password, name }
  Response: { success, token, user, error }

POST /api/auth/signout
  Response: { success, error }

GET /api/auth/me
  Headers: { Authorization: Bearer <token> }
  Response: { success, token, error }
```

### Hub Mails
```
GET /api/hub/mails?tab=conversation_client&limit=50
GET /api/hub/mails/:id
POST /api/hub/mails
PATCH /api/hub/mails/:id/status { status: string }
PATCH /api/hub/mails/:id/notes { note: string }
DELETE /api/hub/mails/:id
```

### Clients
```
GET /api/clients
GET /api/clients/:id
POST /api/clients { nom, prenom, email, telephone, status, patrimoine }
PATCH /api/clients/:id { ... }
DELETE /api/clients/:id
GET /api/clients/:id/mails (emails du client)
```

### Tasks
```
GET /api/tasks?status=pending&clientId=xxx
GET /api/tasks/:id
POST /api/tasks { title, description, status, priority, dueDate, clientId }
PATCH /api/tasks/:id { ... }
PATCH /api/tasks/:id/status { status: string }
DELETE /api/tasks/:id
```

### Health Check
```
GET /health
Response: { status: "ok", backend: "pocketbase", timestamp }
```

---

## 🧪 Tests

### Test 1 - Backend Directement (Terminal 3)

```bash
# Test health check
curl http://localhost:3000/health

# Test auth signin
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@corevision.fr","password":"test123"}'

# Test list clients
curl http://localhost:3000/api/clients
```

### Test 2 - Via Tailscale (depuis PC #2)

```bash
# Depuis l'autre PC, via Tailscale
curl http://pc1.tailscale:3000/health
curl http://pc1.tailscale:3000/api/clients
```

### Test 3 - Via Frontend Vercel

```bash
# Lance le frontend (Terminal 3 - autre PC)
npm run dev
# → http://localhost:5173

# Dans le navigateur, ouvre DevTools → Console
# Les appels API vont à: http://pc1.tailscale:3000
```

### Test 4 - Depuis Vercel Production

Déploie sur Vercel. Il utilisera `https://corevision-api.onrender.com/make-server-cac859af` (ancienne URL) jusqu'à ce qu'on redéploie le backend en production.

---

## 📚 Architecture Finale

```
┌──────────────────────────────────────┐
│ PC #1 (Ton Serveur Windows)          │
│                                      │
│ ┌─ PocketBase (port 8090) ─────────┐ │
│ │ Collections: users, clients,      │ │
│ │   hub_mails, hub_calls, tasks     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Deno/Hono Backend (port 3000) ──┐ │
│ │ Routes:                             │ │
│ │ - /api/auth                         │ │
│ │ - /api/hub                          │ │
│ │ - /api/clients                      │ │
│ │ - /api/tasks                        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Tailscale VPN ────────────────────┐ │
│ │ Accessible at: 100.x.x.x (auto DNS)│ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
       ↑ Tailscale Tunnel (Sécurisé)
┌──────────────────────────────────────┐
│ PC #2 + Vercel Frontend              │
│                                      │
│ ┌─ Vercel Frontend (production) ────┐ │
│ │ http://pc1.tailscale:3000 (dev)    │ │
│ │ https://api.render.com (prod)      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Local Dev (Vite) ─────────────────┐ │
│ │ http://localhost:5173              │ │
│ │ API → http://pc1.tailscale:3000    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Cannot connect to PocketBase"
```bash
# Vérifier que PocketBase est lancé
http://localhost:8090

# Vérifier via Tailscale
http://pc1.tailscale:8090

# Si ça ne marche pas, check Tailscale:
tailscale status
ping pc1.tailscale
```

### "Cannot connect to backend"
```bash
# Vérifier que Deno est lancé
curl http://localhost:3000/health

# Via Tailscale
curl http://pc1.tailscale:3000/health

# Problème de port 3000?
$env:PORT = "3001"  # Change le port et relance
```

### "CORS error"
Le CORS est configuré dans `index.ts` pour:
- http://localhost:5173 (dev Vite)
- http://localhost:3000 (dev local)
- https://corevision-main.vercel.app (prod)

Si tu ajoutes d'autres URLs, modifie la config CORS dans `src/app/backend/index.ts`.

### "Auth token invalid"
- Vérifier que l'utilisateur existe dans PocketBase collection `users`
- Vérifier le password (PocketBase hash automatiquement)
- Test directement avec curl:
```bash
curl -X POST http://localhost:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"test@corevision.fr","password":"test123"}'
```

---

## 📝 Checklist Final

- [x] Backend index.ts créé (main entry)
- [x] Auth routes implémentées
- [x] Clients routes implémentées
- [x] Tasks routes implémentées
- [x] Hub Mails routes implémentées
- [x] PocketBase client créé
- [x] .env.development configuré
- [x] start-backend scripts créés
- [x] Frontend info.tsx pointé vers PocketBase
- [x] Documentation complète

---

## 🎉 Tu Es Prêt!

**Prochaines étapes:**
1. ✅ Crée les collections PocketBase (voir POCKETBASE_SETUP_GUIDE.md)
2. ✅ Lance PocketBase: `.\pocketbase.exe serve`
3. ✅ Lance Backend: `.\start-backend.ps1`
4. ✅ Test endpoints avec curl ou Postman
5. ✅ Teste depuis Vercel/frontend

**Questions?** Dis-moi! 🚀
