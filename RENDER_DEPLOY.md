# Quick Deploy to Render (PostgreSQL)

**Status:** Hub Communication backend ready for Render PostgreSQL

---

## 🚀 Step 1: Add Environment Variable to Render

1. Go to **Render Dashboard** → **corevision-api**
2. **Settings** tab
3. Scroll to **Environment Variables**
4. **Add new variable:**
   ```
   DATABASE_URL=postgresql://corevision:FfkMektjyJJOEWLfOk3wFOUlnd4CznTT@dpg-d95bld0k1i2s73a0q110-a.frankfurt-postgres.render.com/corevision
   ```
5. Click **Save** ✅

Render will auto-redeploy (watch the "Deploys" tab - takes ~3-5 min)

---

## 🗄️ Step 2: Run Database Migrations

Once Render redeploys, run migrations on your PostgreSQL:

### Option A: Via Render Browser (Easiest)
1. **Render Dashboard** → PostgreSQL service
2. **Browser** tab (or **psql**)
3. Copy-paste this SQL:

```sql
-- Create hub_mails table
CREATE TABLE IF NOT EXISTS hub_mails (
  id TEXT PRIMARY KEY,
  messageId TEXT,
  threadId TEXT,
  "from" TEXT NOT NULL,
  fromName TEXT,
  "to" TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  isHtml BOOLEAN DEFAULT false,
  bodyPreview TEXT,
  sentAt TIMESTAMPTZ NOT NULL,
  direction TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  clientId TEXT,
  clientName TEXT,
  clientEmail TEXT,
  hubTab TEXT NOT NULL DEFAULT 'conversation_client',
  traitementStatus TEXT NOT NULL DEFAULT 'a_traiter',
  attachments JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  importedFrom TEXT DEFAULT 'outlook'
);

CREATE INDEX IF NOT EXISTS idx_hub_mails_tab ON hub_mails(hubTab);
CREATE INDEX IF NOT EXISTS idx_hub_mails_status ON hub_mails(traitementStatus);
CREATE INDEX IF NOT EXISTS idx_hub_mails_client ON hub_mails(clientId);
CREATE INDEX IF NOT EXISTS idx_hub_mails_sent_at ON hub_mails(sentAt DESC);
CREATE INDEX IF NOT EXISTS idx_hub_mails_from ON hub_mails("from");

-- Create hub_calls table
CREATE TABLE IF NOT EXISTS hub_calls (
  id TEXT PRIMARY KEY,
  clientId TEXT,
  clientName TEXT,
  clientPhone TEXT,
  clientEmail TEXT,
  subject TEXT NOT NULL,
  reason TEXT,
  dueDate TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  linkedMailId TEXT,
  notes TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completedAt TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hub_calls_status ON hub_calls(status);
CREATE INDEX IF NOT EXISTS idx_hub_calls_priority ON hub_calls(priority);
CREATE INDEX IF NOT EXISTS idx_hub_calls_due_date ON hub_calls(dueDate);
CREATE INDEX IF NOT EXISTS idx_hub_calls_client ON hub_calls(clientId);
```

4. Click **Run** / **Execute**
5. Wait for confirmation ✅

### Option B: Via psql Terminal
```bash
psql postgresql://corevision:FfkMektjyJJOEWLfOk3wFOUlnd4CznTT@dpg-d95bld0k1i2s73a0q110-a.frankfurt-postgres.render.com/corevision < migration.sql
```

---

## ✅ Step 3: Verify Everything Works

### Test Health Check
```bash
curl https://corevision-api.onrender.com/make-server-cac859af/health
```

Should return: `{"status":"ok"}`

### Test Hub API
```bash
curl https://corevision-api.onrender.com/api/hub/stats \
  -H "Authorization: Bearer test-token"
```

Should return JSON stats object (even if empty)

### Test Database Tables
Check in Render PostgreSQL **Browser**:
```sql
SELECT COUNT(*) FROM hub_mails;
SELECT COUNT(*) FROM hub_calls;
```

Both should return `0` (no errors = ✅ good)

---

## 🔗 Step 4: Update Vercel Redirect

Your `vercel.json` is already updated to point to `/api/hub` routes:

```json
{
  "rewrites": [
    {
      "source": "/api/hub/:path*",
      "destination": "https://corevision-api.onrender.com/api/hub/:path*"
    }
  ]
}
```

This is **already correct** - no changes needed!

---

## 🧪 Step 5: Test End-to-End

### 1. Frontend Test
1. Go to https://corevision-main.vercel.app
2. Login
3. Navigate to "Hub Communication" tab
4. Should see empty lists (no data yet)
5. Check browser DevTools → Network tab
6. Should see requests to `/api/hub/...` returning 200

### 2. Add Test Data (Optional)
If you want to test with data:

```sql
INSERT INTO hub_mails (id, "from", "to", subject, body, "sentAt", direction, read, "hubTab", "traitementStatus", attachments, notes, "createdAt", "updatedAt")
VALUES (
  'test-mail-1',
  'test@example.com',
  ARRAY['contact@company.com'],
  'Test Mail Subject',
  'This is a test mail body',
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

Then refresh frontend - mail should appear!

---

## 📊 Check Render Logs

1. **Render Dashboard** → **corevision-api**
2. **Logs** tab
3. Should see:
   ```
   ✅ PostgreSQL connected for Hub Communication
   📧 [COMMUNICATION] received...
   ...
   ```

No errors = ✅ good!

---

## ⚠️ Troubleshooting

### Error: "Database not configured"
**Fix:** 
1. Verify `DATABASE_URL` env var is set in Render
2. Check PostgreSQL is running (Render dashboard)
3. Verify URL is correct (copy from Render again)

### Error: "relation hub_mails does not exist"
**Fix:**
- Run migrations SQL again
- Make sure there are no typos

### Error: Connection timeout
**Fix:**
- Check if PostgreSQL service is healthy
- Verify firewall/security groups allow connections
- Restart PostgreSQL service from Render dashboard

### Frontend shows "Aucun mail trouvé" but DB has data
**Fix:**
1. Hard refresh browser (Ctrl+F5)
2. Check DevTools → Application → Clear localStorage
3. Verify auth token is valid

---

## 🎉 You're Done!

Your Hub Communication system is now live:

- **Frontend:** https://corevision-main.vercel.app (Vercel)
- **Backend:** https://corevision-api.onrender.com (Render)
- **Database:** PostgreSQL (Render)

All three are connected and talking to each other! 🚀

---

## Next Steps

1. **Test thoroughly** on frontend
2. **Monitor logs** in Render for errors
3. **Add real data** (mails, calls) when ready
4. **Set up Outlook integration** (optional, currently mocked)

Enjoy! 🎊
