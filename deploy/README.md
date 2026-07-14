# 🚀 Deployment

## Frontend (Vercel)
Automatic deployment on `git push main`

Configuration: `vercel.json`

## Backend (Render)
Automatic deployment on `git push main` (if Render is connected)

Manual deployment:
1. Push to GitHub
2. Render auto-detects and deploys
3. Check: https://corevision-api.onrender.com/make-server-cac859af/health

### Environment variables (Render Dashboard)
```
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars>
OPENAI_API_KEY=sk-...
NODE_ENV=production
UPLOADS_DIR=/opt/corevision/uploads
API_BASE_URL=https://corevision-api.onrender.com
```

## Database (PostgreSQL on Render)
- Managed automatically by Render
- No migration scripts needed
- Backup configured in Render dashboard

---

**Note:** VPS deployment scripts (.sh, .ps1) have been removed as we're now using managed Render deployment.
