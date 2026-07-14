// ============================================
// CLIENT ROUTES MODULE
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuthRequest } from "./auth.tsx";
import { getTasksForStatus, getTasksWithIdsForStatus } from "./helpers.tsx";

export function setupClientRoutes(app: Hono) {
  // Get all clients for authenticated user
  app.get("/make-server-cac859af/clients", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clients = await kv.getByPrefix(`client:${user.id}:`);
      return c.json({ clients });
    } catch (err) {
      console.error('Error fetching clients:', err);
      return c.json({ error: 'Failed to fetch clients: ' + err.message }, 500);
    }
  });

  // Get client by ID
  app.get("/make-server-cac859af/clients/:id", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('id');
      const client = await kv.get(`client:${user.id}:${clientId}`);

      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      // Charger et regrouper les tâches par statut
      const STATUSES = ['Prospect', 'Découverte', 'Simulation', 'Lettre Mission', 'Rapport/Audit', 'Suivi MEP', 'Suivi CSP', 'Arbitrage'];
      const currentStatus = client.statusOuvert || 'Prospect';
      const currentStatusIdx = STATUSES.indexOf(currentStatus);


      // Initialiser client.taches si absent
      if (!client.taches) {
        client.taches = {};
      }

      let tasksSaved = false;

      // ✨ S'assurer que TOUS les statuts jusqu'au statut courant sont initialisés
      for (let i = 0; i <= currentStatusIdx; i++) {
        const status = STATUSES[i];

        if (!client.taches[status]) {

          const taskTemplates = getTasksWithIdsForStatus(status);
          client.taches[status] = taskTemplates.map((def: any, idx: number) => ({
            id: def.id,
            title: def.title,
            description: def.description,
            completed: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            clientId: clientId,
            statusPipeline: status,
          }));

          // Auto-complete first task of Prospect only
          if (status === 'Prospect' && client.taches[status].length > 0) {
            client.taches[status][0].completed = true;
          }

          tasksSaved = true;
        }
      }

      // Sauvegarder si des tâches ont été initialisées
      if (tasksSaved) {
        await kv.set(`client:${user.id}:${clientId}`, client);
      }


      return c.json({ client });
    } catch (err) {
      console.error('Error fetching client:', err);
      return c.json({ error: 'Failed to fetch client: ' + err.message }, 500);
    }
  });

  // Create new client
  app.post("/make-server-cac859af/clients", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      const { nom, prenom, email, telephone, statut, patrimoine, statusOuvert, cspSigne, taches } = body;

      const clientId = crypto.randomUUID();
      const client = {
        id: clientId,
        nom,
        prenom,
        email,
        telephone,
        statut: statut || 'R0',
        patrimoine: patrimoine || 0,
        statusOuvert: statusOuvert || 'Prospect',
        cspSigne: cspSigne || false,
        taches: taches || {},
        conseiller_id: user.id,
        date_creation: new Date().toISOString().split('T')[0],
      };

      await kv.set(`client:${user.id}:${clientId}`, client);

      // Créer les tâches initiales avec le nouveau statut
      const newStatus = statusOuvert || 'Prospect';
      const taskTemplates = getTasksWithIdsForStatus(newStatus);
      const tasks = [];
      const tasksByStatus: Record<string, any[]> = {};
      tasksByStatus[newStatus] = [];

      for (let i = 0; i < taskTemplates.length; i++) {
        const { id: taskDefId, title } = taskTemplates[i];
        const isFirstTask = i === 0 && title === 'Origine du prospect';

        const task = {
          id: taskDefId, // Utiliser l'ID de taskDefinitions.ts (p1, p2, p3, etc.)
          title,
          completed: isFirstTask, // Première tâche automatiquement complétée
          status: 'pending',
          createdAt: new Date().toISOString(),
          clientId: clientId,
          clientName: `${prenom} ${nom}`,
          client_id: clientId,
          conseiller_id: user.id,
          statusPipeline: newStatus, // Nouveau champ pour le pipeline
          // Champs spécifiques pour la tâche "Origine du prospect"
          ...(isFirstTask && {
            prospectOrigin: '',
            referrerName: '',
          }),
        };

        await kv.set(`task:${user.id}:${clientId}:${taskDefId}`, task);
        tasks.push(task);
        tasksByStatus[newStatus].push(task);
      }

      // Mettre à jour le client avec les tâches groupées par statut
      client.taches = tasksByStatus;
      await kv.set(`client:${user.id}:${clientId}`, client);


      return c.json({ client, tasks }, 201);
    } catch (err) {
      console.error('Error creating client:', err);
      return c.json({ error: 'Failed to create client: ' + err.message }, 500);
    }
  });

  // Update client
  app.put("/make-server-cac859af/clients/:id", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('id');
      const body = await c.req.json();
      
      const existingClient = await kv.get(`client:${user.id}:${clientId}`);
      if (!existingClient) {
        return c.json({ error: 'Client not found' }, 404);
      }

      const updatedClient = {
        ...existingClient,
        ...body,
        id: clientId,
        conseiller_id: user.id,
      };

      await kv.set(`client:${user.id}:${clientId}`, updatedClient);
      
      return c.json({ client: updatedClient });
    } catch (err) {
      console.error('Error updating client:', err);
      return c.json({ error: 'Failed to update client: ' + err.message }, 500);
    }
  });

  // Delete client
  app.delete("/make-server-cac859af/clients/:id", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('id');
      await kv.del(`client:${user.id}:${clientId}`);

      return c.json({ success: true });
    } catch (err) {
      console.error('Error deleting client:', err);
      return c.json({ error: 'Failed to delete client: ' + err.message }, 500);
    }
  });

  // DEBUG: Inspect a specific client (INTERNAL USE ONLY - ADMIN ACCESS REQUIRED)
  app.get("/make-server-cac859af/admin/inspect/:clientId", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);

    // Only allow if user owns the client
    try {
      const clientId = c.req.param('clientId');
      const client = await kv.get(`client:${user.id}:${clientId}`);

      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      return c.json({
        client: {
          id: client.id,
          nom: client.nom,
          statusOuvert: client.statusOuvert,
          updated_at: client.updated_at,
          tachesStatuses: Object.keys(client.taches || {}),
        }
      });
    } catch (err) {
      return c.json({ error: 'Failed to inspect' }, 500);
    }
  });
}
