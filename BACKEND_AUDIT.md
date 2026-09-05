# CoreVision Backend Architecture - Audit Report

## Date: 2026-09-05

### ✅ PRODUCTION READY
- **Frontend**: Vercel (corevision-main.vercel.app)
- **Backend**: Deno/Hono running on local PC
- **Database**: PocketBase (local)
- **Tunnel**: Tailscale (pc1.tailscale:3000)

### Architecture Flow
```
┌─────────────────┐
│  Vercel Cloud   │ (corevision-main.vercel.app)
└────────┬────────┘
         │ HTTPS
         ↓
    [Tailscale VPN]
         │
         ↓
┌──────────────────────────┐
│  PC Local Backend        │ (pc1.tailscale:3000)
│  - Deno/Hono Server      │
│  - Port 3000             │
└────────┬─────────────────┘
         │ HTTP
         ↓
┌──────────────────────────┐
│  PocketBase              │ (localhost:8090)
│  - Collections           │
│  - Auth                  │
│  - Data Storage          │
└──────────────────────────┘
```

### API Endpoints
- `GET /health` - Server health check
- `POST /api/auth/signin` - Authentication
- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/dashboard/kanban` - Kanban board data
- `GET /api/hub/mails` - Hub communications
- `GET /api/clients` - Clients CRUD
- `GET /api/tasks` - Tasks CRUD

### Verified Clean
✅ No active Render references in active code
✅ All API base URLs pointing to Tailscale backend
✅ PocketBase configured as primary database
✅ Dashboard components using localStorage auth + API calls
✅ .env.development correctly configured

### Known: Supabase Imports in Non-Critical Modules
The following modules still have Supabase imports (not critical for dashboard):
- agendaView (Agenda module)
- Hub communications (hubMailService, hubCallsService)
- Advanced reports (derived helpers, diagnostic documents)

These can be migrated to PocketBase in future iterations.

### Test User
- Email: violeau.hortense@gmail.com
- Password: Hvguillote78
