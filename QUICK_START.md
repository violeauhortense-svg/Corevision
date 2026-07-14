# 🚀 CoreVision - Quick Start Guide

## ✨ Qu'est-ce qui a changé?

Votre application utilise réellement:
- **Frontend:** React 18 sur Vercel
- **Backend:** Hono/Deno sur Render  
- **Database:** PostgreSQL sur Render

**Mais le code parlait de Supabase partout.** ❌

Nous venons d'aligner le code avec la réalité. ✅

---

## 📁 Nouvelle structure

```
src/app/
├── backend/           ← Serveur Render (était: supabase/functions/server)
├── components/        ← Interface React (200+ fichiers)
├── services/          ← API clients
├── utils/api/         ← Config API (était: utils/supabase)
└── ...
```

---

## 🚀 Démarrage

### Frontend
```bash
npm install
npm run dev
# http://localhost:5173
```

### Push vers production
```bash
git push main
# Frontend → auto-deploys to Vercel
# Backend → auto-deploys to Render
```

---

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| **ARCHITECTURE.md** | 🏗️ Architecture complète, flux données, déploiement |
| **README.md** | 📖 Overview projet, technologies, installation |
| **src/app/backend/README.md** | 🚀 Guide serveur Deno/Hono |
| **src/app/utils/api/README.md** | 🔗 API client utilities |
| **REFACTORING_SUMMARY.md** | 📋 Ce qui a changé exactement |

---

## 🔐 Authentification

JWT custom stocké dans localStorage:
```typescript
import { supabase } from '@/utils/api/client';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

---

## 🌐 API calls

Via Vercel rewrite → Render backend:
```typescript
import { apiBaseUrl } from '@/utils/api/info';

const res = await fetch(`${apiBaseUrl}/clients/123`);
```

---

## 🗄️ Database

PostgreSQL sur Render:
```
Connexion: DATABASE_URL (env var)
Table: kv_store (key TEXT, value JSONB)
```

---

## ✅ Checklist avant production

- [ ] Lire ARCHITECTURE.md
- [ ] Tester login
- [ ] Tester audit complet
- [ ] Vérifier logs Render
- [ ] Check Core Web Vitals Vercel
- [ ] Vérifier env vars Render

---

## 🐛 Troubleshooting

### "Cannot connect to API"
→ Vérifier `src/app/utils/api/info.tsx` - URL correcte?

### "JWT verification failed"
→ Vérifier JWT_SECRET en Render dashboard

### "Database connection timeout"
→ Vérifier DATABASE_URL format

---

**Besoin d'aide?** Lire ARCHITECTURE.md ou les README.md des dossiers.

Happy coding! 🎉
