// CoreVision Backend - Deno/Hono
// Main entry point for local development with PocketBase

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { pb } from './pocketbase_client.tsx';
import { initializePocketBase } from './init-pocketbase.tsx';

// Import routes
import hubMailsRoutes from './hub_mails_routes_pb.tsx';
import authRoutes from './auth_routes_pb_fixed.tsx';
import clientsRoutes from './clients_routes_pb.tsx';
import tasksRoutes from './tasks_routes_pb.tsx';
import dashboardRoutes from './dashboard_routes_pb.tsx';

const app = new Hono();
const PORT = Deno.env.get('PORT') || '3000';

// ─── Middleware ───────────────────────────────────────────────────────
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://corevision-main.vercel.app',
      'http://100.75.233.10:3000',  // Tailscale IP (cvh-patrimoine)
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Initialize PocketBase ────────────────────────────────────────────
const pbUrl = Deno.env.get('POCKETBASE_URL') || 'http://localhost:8090';
await initializePocketBase(pbUrl);

// ─── Health Check ─────────────────────────────────────────────────────
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    backend: 'pocketbase',
    timestamp: new Date().toISOString(),
  });
});

// ─── Test Endpoint (no PocketBase dependency) ───────────────────────
app.get('/test', (c) => {
  return c.json({
    message: 'Backend is reachable from Vercel',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────
app.route('/api/auth', authRoutes);
app.route('/api/hub', hubMailsRoutes);
app.route('/api/clients', clientsRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/dashboard', dashboardRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// ─── Error Handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  return c.json({ error: err.message }, 500);
});

// ─── Start Server ────────────────────────────────────────────────────
console.log(`
╔════════════════════════════════════════════════════════════╗
║           🚀 CoreVision Backend - Development            ║
║                                                            ║
║  ✅ PocketBase:  ${Deno.env.get('POCKETBASE_URL') || 'http://pc1.tailscale:8090'}
║  ✅ Backend:     http://localhost:${PORT}
║  ✅ Frontend:    http://localhost:5173                    ║
║  ✅ Tailscale:   http://pc1.tailscale:${PORT}
║                                                            ║
║  Endpoints:                                                ║
║  - GET /health                                             ║
║  - POST /api/auth/signin                                   ║
║  - GET  /api/hub/mails                                     ║
║  - POST /api/clients                                       ║
║  - GET  /api/tasks                                         ║
║  - GET  /api/dashboard/metrics                             ║
║  - GET  /api/dashboard/kanban                              ║
╚════════════════════════════════════════════════════════════╝
`);

Deno.serve({ port: parseInt(PORT as string) }, app.fetch);
