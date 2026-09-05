# 🚀 QUICK START - CoreVision

## Architecture Finale

```
🌐 Vercel Cloud          https://corevision-main.vercel.app
    ↓
🔐 Tailscale Tunnel      pc1.tailscale:3000
    ↓
💻 PC Local Backend      Deno/Hono (port 3000)
    ↓
🗄️  PocketBase DB        localhost:8090
```

---

## ⚡ Démarrage Rapide

### 1️⃣  Lancer le Backend (à faire une fois)
```bash
cd C:\Users\conta\OneDrive\Documents\Claude\Projects\Corevision-main
deno run -A src/app/backend/index.ts
```

### 2️⃣  Ouvrir l'App
```
https://corevision-main.vercel.app
```

### 3️⃣  Se Connecter
- **Email :** violeau.hortense@gmail.com
- **Password :** Hvguillote78

---

## 🧪 Tester l'App

### Mode 1 : Test Automatique (RECOMMANDÉ)
```bash
bash test-app.sh
```

### Mode 2 : Vérifications Manuels
```bash
# Backend health
curl -s http://localhost:3000/health

# Login test
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"violeau.hortense@gmail.com","password":"Hvguillote78"}'
```

---

## ✅ Checklist Finale

- [ ] Backend fonctionne
- [ ] Dashboard charge
- [ ] 6 cartes visibles (RDV, Tâches, CA, Mails, Dossiers)
- [ ] Kanban visible avec 8 colonnes
- [ ] Console sans erreurs (F12)
- [ ] Logout fonctionne

---

## 🎉 C'EST PRÊT !

Tu peux maintenant utiliser CoreVision !
