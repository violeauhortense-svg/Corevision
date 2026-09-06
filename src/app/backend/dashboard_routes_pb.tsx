// Dashboard Routes - PocketBase
// Provides metrics and kanban data for the frontend dashboard

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// ─── GET /metrics ────────────────────────────────────────────────────
app.get('/metrics', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Return hardcoded metrics for now (PocketBase integration can be added later)
    return c.json({
      metrics: {
        rdvAujourdHui: 0,
        rdvCetteSemaine: 0,
        tachesAujourdHui: 0,
        caTotal: 0,
        mailsATraiter: 0,
        suiviDossiers: 0,
      },
    }, 200);
  } catch (err: any) {
    console.error('Dashboard metrics error:', err.message);
    return c.json({
      metrics: {
        rdvAujourdHui: 0,
        rdvCetteSemaine: 0,
        tachesAujourdHui: 0,
        caTotal: 0,
        mailsATraiter: 0,
        suiviDossiers: 0,
      },
    }, 200);
  }
});

// ─── GET /kanban ────────────────────────────────────────────────────
app.get('/kanban', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const STATUSES = [
      'Prospect',
      'Découverte',
      'Simulation',
      'Lettre Mission',
      'Rapport/Audit',
      'Suivi MEP',
      'Suivi CSP',
      'Arbitrage'
    ];

    const kanban: Record<string, any> = {};

    // Initialize all statuses with empty data
    for (const status of STATUSES) {
      kanban[status] = {
        count: 0,
        actions: 0,
        clients: []
      };
    }

    return c.json(kanban, 200);
  } catch (err: any) {
    console.error('Dashboard kanban error:', err.message);

    // Return empty kanban structure
    const STATUSES = ['Prospect', 'Découverte', 'Simulation', 'Lettre Mission', 'Rapport/Audit', 'Suivi MEP', 'Suivi CSP', 'Arbitrage'];
    const kanban: Record<string, any> = {};
    for (const status of STATUSES) {
      kanban[status] = { count: 0, actions: 0, clients: [] };
    }
    return c.json(kanban, 200);
  }
});

export default app;
