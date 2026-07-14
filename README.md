# 🏛️ CoreVision - Plateforme de Conseil Patrimonial & Fiscal

Application web moderne pour l'analyse et l'optimisation patrimoniale et fiscale.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm ou yarn

### Frontend
```bash
npm install
npm run dev
# http://localhost:5173
```

### Déploiement (Vercel)
```bash
vercel deploy
```

---

## 📋 Fonctionnalités principales

- 📊 **Dashboard** - Vue d'ensemble clients & analytics
- 👥 **Gestion Clients** - Profils complets
- 🏛️ **Audit Patrimonial** - Analyse expertisée IA (GPT-4o)
- 📈 **Simulateur** - Scénarios patrimoniaux
- 📚 **Base de Connaissances** - Règles fiscales & légales
- 🔍 **Collecteurs** - Données juridique, sociale, retraite
- ✉️ **Email** - Communication clients
- 📅 **Agenda & Tâches** - Organisation équipe

---

## 🏗️ Architecture

**Frontend:** React 18 + Vercel  
**Backend:** Hono/Deno + Render  
**Database:** PostgreSQL + Render  

👉 Lire [ARCHITECTURE.md](./ARCHITECTURE.md) pour détails complets.

---

## 📁 Structure

```
.
├── ARCHITECTURE.md          ← Architecture complète
├── README.md                ← Ce fichier
├── package.json             ← Dépendances
├── vite.config.ts           ← Build config
├── vercel.json              ← Vercel rewrites
│
└── src/app/
    ├── backend/             ← 🚀 Serveur Render (Deno/Hono)
    ├── components/          ← 🎨 Composants React (200+)
    ├── services/            ← 🔗 API clients
    ├── utils/               ← 🛠️ Helpers
    │   └── api/             ← Configuration API & auth
    ├── hooks/               ← 🪝 Custom React hooks
    ├── types/               ← 📝 TypeScript definitions
    ├── config/              ← ⚙️ Configuration
    └── App.tsx              ← Racine React
```

---

## 🛠️ Technologies

### Frontend
- **React 18** - UI framework
- **Vite 6** - Build tool (lightning fast)
- **React Router 7** - Client routing
- **Tailwind CSS 4** - Styling
- **Radix UI** - Composants accessibles
- **TypeScript** - Type safety

### Backend
- **Deno** - Runtime JS/TS
- **Hono** - HTTP server micro-framework
- **deno-postgres** - PostgreSQL client
- **Cheerio** - HTML parsing

### Infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend + Database hosting
- **PostgreSQL** - Relational database

---

## 🔐 Authentication

Custom JWT implementation:
- Tokens stockés dans `localStorage`
- Vérification à chaque requête backend
- 7 jours TTL
- User data dans token payload

---

## 📚 Documentation

| Doc | Contenu |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Structure complète, déploiement, flux données |
| [src/app/backend/README.md](./src/app/backend/README.md) | Guide serveur backend |
| [src/app/utils/api/README.md](./src/app/utils/api/README.md) | API client utilities |

---

## 🚀 Déploiement

### Vercel (Frontend)
```bash
vercel deploy
```
Auto-deploy on `git push main`

### Render (Backend)
1. Push code to GitHub
2. Connect Render project
3. Set env vars in Render dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - etc.

---

## 🔧 Configuration

### Env vars (Frontend)
```
# vercel.json
/api/:path* → https://corevision-api.onrender.com/make-server-cac859af/:path*
```

### Env vars (Backend)
Configurer dans Render dashboard:
```
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars>
OPENAI_API_KEY=sk-...
NODE_ENV=production
```

---

## 📊 Monitoring

- **Frontend:** Vercel Analytics
- **Backend:** Render logs + custom Deno logging
- **Database:** Render PostgreSQL dashboard

---

## 🐛 Troubleshooting

### Frontend won't connect to backend
1. Check `src/app/utils/api/info.tsx` - URL correcte?
2. Vérifier CORS dans `src/app/backend/index.tsx`
3. Vérifier backend health: `curl https://corevision-api.onrender.com/make-server-cac859af/health`

### Database connection issues
1. Vérifier `DATABASE_URL` dans Render dashboard
2. Vérifier format: `postgresql://user:password@host:port/dbname`
3. Vérifier firewall/network rules

---

## 🎯 Prochaines étapes

- [ ] Augmenter couverture de tests
- [ ] Implémenter caching (Redis)
- [ ] Audit de sécurité complète
- [ ] Optimiser performance (Core Web Vitals)
- [ ] Documentation API (OpenAPI/Swagger)

---

## 📞 Support

- **Issues:** GitHub Issues
- **Documentation:** Voir dossier `docs/`
- **Architecture:** Lire ARCHITECTURE.md

---

## 📄 Licence

Proprietary - 2026

---

**Last updated:** 2026-07-14  
**Version:** 2.0.0 (Post-Supabase migration)  
**Status:** ✅ Production ready
