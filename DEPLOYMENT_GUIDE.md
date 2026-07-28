# Deployment Guide - Render + Vercel

**Last Updated:** 2026-07-28  
**Backend:** Render (Deno/Hono)  
**Frontend:** Vercel (React/Vite)  
**Database:** Supabase PostgreSQL

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   VERCEL (Frontend)                      │
│        https://corevision-main.vercel.app                │
│                  React + Vite + Tailwind                 │
└─────────────────────────────────────────────────────────┘
                         ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│                    RENDER (Backend)                      │
│        https://corevision-api.onrender.com               │
│              Deno + Hono + Supabase Client               │
└─────────────────────────────────────────────────────────┘
                         ↓ Queries
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE (Database)                      │
│                  PostgreSQL + Auth                       │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (repo access)
- [ ] Render account (https://render.com)
- [ ] Vercel account (https://vercel.com)
- [ ] Supabase account (https://supabase.com)

### Required Credentials
- [ ] GitHub SSH key or personal access token
- [ ] Supabase project URL
- [ ] Supabase Anon Key
- [ ] Supabase Service Role Key (for admin operations)

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Select a region (Frankfurt recommended)
4. Create project

### 1.2 Run Database Migrations
1. In Supabase dashboard, go to "SQL Editor"
2. Create new query
3. Copy content from `src/app/backend/migrations/001_create_hub_tables.sql`
4. Execute query
5. Verify tables created:
   - `hub_mails` (check columns and indices)
   - `hub_calls` (check columns and indices)

### 1.3 Get Credentials
1. Go to Settings → API
2. Copy:
   - `Project URL` → Save as `SUPABASE_URL`
   - `anon public` key → Save as `SUPABASE_ANON_KEY`
   - `service_role` key → Save as `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Deploy Backend to Render

### 2.1 Connect Repository
1. Go to https://render.com/dashboard
2. Click "New +" → "Blueprint"
3. Select repository: `Corevision-main`
4. Branch: `main`
5. Confirm auto-deploy enabled

### 2.2 Configure Environment Variables
In Render dashboard, go to `corevision-api` service settings:

1. **Basic Settings**
   - Name: `corevision-api`
   - Environment: `Docker`
   - Region: `Frankfurt`
   - Plan: `Standard`

2. **Environment Variables** (add/update)
   ```
   PORT=3000
   NODE_ENV=production
   DATA_DIR=/data
   UPLOADS_DIR=/uploads
   JWT_SECRET=<use-32-char-random-string>
   API_BASE_URL=https://corevision-api.onrender.com
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

3. **Health Check**
   - Path: `/make-server-cac859af/health`
   - Timeout: 30 seconds

4. Click "Save"

### 2.3 Verify Deployment
1. Wait for build to complete (5-10 minutes)
2. Check logs for errors
3. Test health endpoint:
   ```bash
   curl https://corevision-api.onrender.com/make-server-cac859af/health
   ```
   Expected response: `{ "status": "ok" }`

4. Test Hub API endpoint:
   ```bash
   curl https://corevision-api.onrender.com/api/hub/stats \
     -H "Authorization: Bearer test-token"
   ```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect Repository
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import GitHub repo: `Corevision-main`
4. Select branch: `main`

### 3.2 Configure Build Settings
1. **Framework Preset:** `Vite`
2. **Build Command:** 
   ```bash
   npm run build
   ```
3. **Output Directory:** `dist`
4. **Root Directory:** `./` (default)

### 3.3 Environment Variables
Add to Vercel project settings:

```
VITE_API_BASE_URL=https://corevision-api.onrender.com
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 3.4 Verify API Rewrites
File: `vercel.json` (already configured)
```json
{
  "rewrites": [
    {
      "source": "/api/hub/:path*",
      "destination": "https://corevision-api.onrender.com/api/hub/:path*"
    },
    {
      "source": "/api/:path*",
      "destination": "https://corevision-api.onrender.com/make-server-cac859af/:path*"
    }
  ]
}
```

### 3.5 Deploy
1. Vercel auto-deploys on push to main
2. Or manually: Dashboard → `corevision-main` → "Deployments" → "Redeploy"
3. Wait 2-3 minutes for build
4. Check deployment logs for errors

### 3.6 Verify Deployment
1. Go to `https://corevision-main.vercel.app`
2. Login with credentials
3. Navigate to Hub Communication tab
4. Test:
   - Load mails
   - Create note
   - Change status
   - Search mails

---

## Step 4: Test End-to-End

### 4.1 Test Backend Endpoints
```bash
# Test all Hub Communication endpoints
export BEARER_TOKEN="your-auth-token"

# Get mails
curl https://corevision-api.onrender.com/api/hub/mails \
  -H "Authorization: Bearer $BEARER_TOKEN"

# Get stats
curl https://corevision-api.onrender.com/api/hub/stats \
  -H "Authorization: Bearer $BEARER_TOKEN"

# Get calls
curl https://corevision-api.onrender.com/api/hub/calls \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

### 4.2 Test Frontend Workflow
1. **Login** → Navigate to "Hub Communication" tab
2. **Load Data** → Verify mails appear
3. **Click Mail** → Verify detail panel opens
4. **Add Note** → Verify note saves
5. **Change Status** → Verify status updates
6. **Search** → Verify results return
7. **Reply** → Verify reply dialog opens

### 4.3 Check Browser Console
1. Open DevTools (F12)
2. Console tab → Check for errors
3. Network tab → Verify API calls to `/api/hub/*`
4. Should see:
   - 200 responses from Render
   - No CORS errors
   - No 401 authorization errors

### 4.4 Check Render Logs
1. Render dashboard → `corevision-api`
2. "Logs" tab
3. Should see:
   - No errors in output
   - No database connection errors
   - Incoming requests logged

---

## Troubleshooting

### Issue: Database Error (500)
**Symptoms:** `/api/hub/mails` returns `{ error: "Database not configured" }`

**Solution:**
1. Verify Supabase credentials in Render env vars
2. Test Supabase connection:
   ```bash
   curl -X GET https://your-project.supabase.co/rest/v1/hub_mails \
     -H "apikey: your-anon-key" \
     -H "Authorization: Bearer your-anon-key" \
     -H "Content-Type: application/json" | head -50
   ```
3. Verify tables exist in Supabase SQL Editor
4. Run migration again if tables missing

### Issue: CORS Errors
**Symptoms:** Frontend errors like "CORS policy blocked"

**Solution:**
1. Verify Vercel rewrites in `vercel.json`
2. Verify Render allows origin headers
3. Check backend logs for Access-Control headers
4. Clear browser cache and retry

### Issue: 401 Unauthorized
**Symptoms:** All API calls return 401

**Solution:**
1. Verify JWT token is valid
2. Check token stored in localStorage
3. Verify token format: `Authorization: Bearer <token>`
4. Check token expiration

### Issue: Build Fails on Render
**Symptoms:** Docker build fails

**Solution:**
1. Check Dockerfile compatibility:
   ```bash
   docker build -f Dockerfile -t corevision-api .
   ```
2. Verify Deno cache build:
   ```bash
   deno cache src/app/supabase/functions/server/index.tsx
   ```
3. Check file permissions

### Issue: Build Fails on Vercel
**Symptoms:** `npm run build` fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify dependencies installed:
   ```bash
   npm install
   ```
3. Test build locally:
   ```bash
   npm run build
   ```
4. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

### Issue: Mails Not Loading
**Symptoms:** Hub shows "Aucun mail trouvé"

**Solution:**
1. Verify database tables have data
2. Check Supabase directly:
   ```sql
   SELECT COUNT(*) FROM hub_mails;
   ```
3. If empty, add test data:
   ```sql
   INSERT INTO hub_mails (id, "from", "to", subject, body, sentAt, direction, read, hubTab, traitementStatus, attachments, notes, createdAt, updatedAt)
   VALUES (
     'mail-test-1',
     'test@example.com',
     ARRAY['contact@company.com'],
     'Test Mail',
     'This is a test mail',
     NOW(),
     'received',
     false,
     'conversation_client',
     'a_traiter',
     '[]'::jsonb,
     '[]'::jsonb,
     NOW(),
     NOW()
   );
   ```

### Issue: API Timeout
**Symptoms:** Requests hang and timeout

**Solution:**
1. Increase Render plan to "Pro" for better resources
2. Optimize database queries
3. Add caching for stats endpoint
4. Check Render CPU/memory usage

---

## Monitoring & Maintenance

### Weekly Checks
- [ ] Review Render logs for errors
- [ ] Check Vercel deployment health
- [ ] Monitor Supabase database size
- [ ] Check error rates in console

### Monthly Maintenance
- [ ] Review and rotate JWT_SECRET
- [ ] Update dependencies:
  ```bash
  npm update
  npm audit
  ```
- [ ] Review database indices performance
- [ ] Archive old mails (optional)

### Database Backups
1. Supabase → Database → Backups
2. Enable automatic backups
3. Download backups regularly

---

## Scaling Considerations

### When to Scale

**Render**
- CPU high → Upgrade plan to "Pro" or "Business"
- Memory high → Increase instance count or upgrade plan
- Disk space → Increase data/uploads directories

**Vercel**
- Build times exceed 10 min → Check dependencies
- Deploy frequently → Use preview deployments
- Large bundle → Analyze and optimize

**Supabase**
- Slow queries → Check indices and query plans
- High connection count → Add connection pooling
- Storage full → Archive old data

### Budget Estimation (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Render | Standard | $12 |
| Supabase | Pro | $25 |
| **Total** | | **$57** |

---

## Rollback Procedures

### Rollback Frontend (Vercel)
1. Dashboard → Deployments
2. Find previous deployment
3. Click "..." → "Redeploy"
4. Confirm redeploy

### Rollback Backend (Render)
1. Dashboard → corevision-api
2. Deployments tab
3. Click previous deployment
4. Click "Redeploy"

### Rollback Database
1. Supabase → Database → Backups
2. Select backup to restore
3. Confirm restore
4. **⚠️ This will overwrite all data after backup!**

---

## Environment Variables Reference

### Render (Backend)
```
PORT=3000
NODE_ENV=production
DATA_DIR=/data
UPLOADS_DIR=/uploads
JWT_SECRET=<random-32-char-string>
API_BASE_URL=https://corevision-api.onrender.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Vercel (Frontend)
```
VITE_API_BASE_URL=https://corevision-api.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Useful Commands

### Local Testing
```bash
# Frontend
npm install
npm run dev        # Start dev server on localhost:5173

# Backend (requires Deno)
deno run --allow-all src/app/supabase/functions/server/index.tsx

# Build
npm run build      # Frontend
docker build . -t corevision-api  # Backend
```

### Verify Deployment
```bash
# Frontend URL
curl https://corevision-main.vercel.app

# Backend health
curl https://corevision-api.onrender.com/make-server-cac859af/health

# API endpoint
curl -X GET https://corevision-api.onrender.com/api/hub/stats \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json"
```

### Database Operations
```bash
# Connect to Supabase
psql postgresql://<user>:<password>@<host>/postgres

# Common queries
SELECT COUNT(*) FROM hub_mails;
SELECT COUNT(*) FROM hub_calls;
SELECT * FROM hub_mails WHERE clientId = 'client-123';
```

---

## Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to random 32+ char string
- [ ] Enable Supabase RLS (Row Level Security)
- [ ] Set CORS allowed origins in Render
- [ ] Rotate API keys regularly
- [ ] Enable database backups
- [ ] Enable HTTPS everywhere
- [ ] Update dependencies for vulnerabilities
- [ ] Remove test/dummy data
- [ ] Set rate limiting on API
- [ ] Enable monitoring and alerts

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Deno Docs:** https://deno.land/manual
- **Hono Docs:** https://hono.dev

---

## Post-Deployment

### 1. Share URLs with Team
- **Frontend:** https://corevision-main.vercel.app
- **API Docs:** See `HUB_COMMUNICATION_IMPLEMENTATION.md`

### 2. Set Up Monitoring
- [ ] Enable error tracking (Sentry, LogRocket)
- [ ] Set up alerts for deployment failures
- [ ] Monitor database performance

### 3. Document Access
- Database access credentials → Store in secure vault
- API tokens → Rotate regularly
- SSH keys → Store safely

### 4. Schedule Follow-ups
- Week 1: Monitor for issues
- Week 2: Optimize based on usage
- Month 1: Review performance and costs

---

**Deployment Complete!** ✅

Your Hub Communication system is now live on:
- **Frontend:** https://corevision-main.vercel.app
- **Backend:** https://corevision-api.onrender.com
- **Database:** Supabase PostgreSQL
