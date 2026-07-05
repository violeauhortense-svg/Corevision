// ============================================
// DASHBOARD ROUTES - Métriques et Pipeline
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuth } from "./auth.tsx";

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

export function setupDashboardRoutes(app: Hono) {

  // ============================================
  // GET /dashboard/metrics - Les 6 cartes principales
  // ============================================
  app.get("/make-server-cac859af/dashboard/metrics", async (c) => {
    const { user, error: authError } = await verifyAuth(c.req.header('Authorization'));

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    try {
      // Récupérer tous les clients
      const allClients = await kv.getByPrefix(`client:${user.id}:`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // 1️⃣ RDV Aujourd'hui
      const rdvAujourdHui = allClients.filter(client => {
        if (!client.dateNextRdv) return false;
        const rdvDate = new Date(client.dateNextRdv);
        rdvDate.setHours(0, 0, 0, 0);
        return rdvDate.getTime() === today.getTime();
      }).length;

      // 2️⃣ RDV Cette semaine
      const rdvCetteSemaine = allClients.filter(client => {
        if (!client.dateNextRdv) return false;
        const rdvDate = new Date(client.dateNextRdv);
        rdvDate.setHours(0, 0, 0, 0);
        return rdvDate >= weekStart && rdvDate <= weekEnd;
      }).length;

      // 3️⃣ Tâches aujourd'hui
      let tachesAujourdHui = 0;
      for (const client of allClients) {
        const status = client.statusOuvert || 'Prospect';
        const taches = client.taches?.[status] || [];
        tachesAujourdHui += taches.filter((t: any) => {
          if (t.completed || t.status === 'na') return false;
          if (!t.deadline) return false;
          const deadline = new Date(t.deadline);
          deadline.setHours(0, 0, 0, 0);
          return deadline.getTime() === today.getTime();
        }).length;
      }

      // 4️⃣ Chiffre d'affaires total
      const caTotal = allClients.reduce((sum, client) => sum + (client.tauxCA || 0), 0);

      // 5️⃣ Mails à traiter
      const mailsATraiter = allClients.reduce((sum, client) => sum + (client.mailsATraiter || 0), 0);

      // 6️⃣ Suivi Dossiers (clients avec catégories)
      const suiviDossiers = allClients.filter(client =>
        client.categoriesDossier && client.categoriesDossier.length > 0
      ).length;

      return c.json({
        metrics: {
          rdvAujourdHui,
          rdvCetteSemaine,
          tachesAujourdHui,
          caTotal,
          mailsATraiter,
          suiviDossiers
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ Erreur dashboard metrics:', err);
      return c.json({ error: (err as Error).message }, 500);
    }
  });

  // ============================================
  // GET /dashboard/kanban - Clients groupés par statut
  // ============================================
  app.get("/make-server-cac859af/dashboard/kanban", async (c) => {
    const { user, error: authError } = await verifyAuth(c.req.header('Authorization'));

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    try {
      const allClients = await kv.getByPrefix(`client:${user.id}:`);

      // Grouper les clients par statut
      const kanban: Record<string, any[]> = {};
      STATUSES.forEach(status => {
        kanban[status] = [];
      });

      for (const client of allClients) {
        const status = client.statusOuvert || 'Prospect';
        if (!kanban[status]) kanban[status] = [];

        // Compter les tâches
        const taches = client.taches?.[status] || [];
        const taskCount = taches.filter((t: any) => !t.completed && t.status !== 'na').length;

        kanban[status].push({
          id: client.id,
          nom: `${client.prenom || ''} ${client.nom || ''}`.trim(),
          email: client.email,
          taskCount,
          dateNextRdv: client.dateNextRdv,
          tauxCA: client.tauxCA || 0
        });
      }

      // Ajouter le compte de clients par statut
      const result: Record<string, any> = {};
      for (const [status, clients] of Object.entries(kanban)) {
        result[status] = {
          count: clients.length,
          actions: clients.reduce((sum, c) => sum + c.taskCount, 0),
          clients
        };
      }

      return c.json(result);
    } catch (err) {
      console.error('❌ Erreur kanban:', err);
      return c.json({ error: (err as Error).message }, 500);
    }
  });

  // ============================================
  // POST /clients/{id}/status - Changer le statut d'un client
  // ============================================
  app.post("/make-server-cac859af/clients/:clientId/status", async (c) => {
    const { user, error: authError } = await verifyAuth(c.req.header('Authorization'));

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json() as { status: string };

      if (!STATUSES.includes(body.status)) {
        return c.json({ error: 'Statut invalide' }, 400);
      }

      const key = `client:${user.id}:${clientId}`;
      const client = await kv.get(key);

      if (!client) {
        return c.json({ error: 'Client introuvable' }, 404);
      }

      client.statusOuvert = body.status;
      client.updatedAt = new Date().toISOString();

      await kv.set(key, client);

      console.log(`✅ Statut client ${clientId} changé à: ${body.status}`);

      return c.json({ success: true, client });
    } catch (err) {
      console.error('❌ Erreur changement statut:', err);
      return c.json({ error: (err as Error).message }, 500);
    }
  });

  // ============================================
  // PATCH /clients/{id}/tache/{taskId} - Valider une tâche
  // ============================================
  app.patch("/make-server-cac859af/clients/:clientId/tache/:taskId", async (c) => {
    const { user, error: authError } = await verifyAuth(c.req.header('Authorization'));

    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const taskId = c.req.param('taskId');
      const body = await c.req.json() as { completed?: boolean; status?: string; deadline?: string };

      const key = `client:${user.id}:${clientId}`;
      const client = await kv.get(key);

      if (!client) {
        return c.json({ error: 'Client introuvable' }, 404);
      }

      const status = client.statusOuvert || 'Prospect';
      const taches = client.taches?.[status] || [];
      const task = taches.find((t: any) => t.id === taskId);

      console.log(`🔍 Recherche tâche ${taskId} dans statut "${status}"`);
      console.log(`📋 Tâches disponibles:`, taches.map((t: any) => t.id));
      console.log(`🎯 Tâche trouvée:`, task ? `✅ ${task.id}` : '❌ Introuvable');

      if (!task) {
        return c.json({ error: 'Tâche introuvable' }, 404);
      }

      // Mettre à jour la tâche
      if (body.completed !== undefined) task.completed = body.completed;
      if (body.status !== undefined) task.status = body.status;
      if (body.deadline !== undefined) task.deadline = body.deadline;
      task.completedAt = new Date().toISOString();

      await kv.set(key, client);

      // Vérifier si toutes les tâches du statut actuel sont complétées
      const allCompleted = taches.every((t: any) => t.completed || t.status === 'na');

      if (allCompleted) {
        // Passer au statut suivant automatiquement
        const currentIndex = STATUSES.indexOf(status);
        if (currentIndex < STATUSES.length - 1) {
          const nextStatus = STATUSES[currentIndex + 1];
          client.statusOuvert = nextStatus;
          client.updatedAt = new Date().toISOString();
          await kv.set(key, client);
          console.log(`✅ Client ${clientId} passé automatiquement au statut: ${nextStatus}`);
        }
      }

      return c.json({ success: true, task, autoProgressed: allCompleted });
    } catch (err) {
      console.error('❌ Erreur validation tâche:', err);
      return c.json({ error: (err as Error).message }, 500);
    }
  });

}
