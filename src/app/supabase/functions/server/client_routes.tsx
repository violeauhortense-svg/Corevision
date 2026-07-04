// ============================================
// CLIENT ROUTES MODULE
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuth } from "./auth.tsx";
import { getTasksForStatus } from "./helpers.tsx";

export function setupClientRoutes(app: Hono) {
  // Get all clients for authenticated user
  app.get("/make-server-cac859af/clients", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clients = await kv.getByPrefix(`client:${user.id}:`);
      console.log(`✅ ${clients.length} clients trouvés pour l'utilisateur ${user.id}`);
      return c.json({ clients });
    } catch (err) {
      console.error('Error fetching clients:', err);
      return c.json({ error: 'Failed to fetch clients: ' + err.message }, 500);
    }
  });

  // Get client by ID
  app.get("/make-server-cac859af/clients/:id", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('id');
      const client = await kv.get(`client:${user.id}:${clientId}`);
      
      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }
      
      return c.json({ client });
    } catch (err) {
      console.error('Error fetching client:', err);
      return c.json({ error: 'Failed to fetch client: ' + err.message }, 500);
    }
  });

  // Create new client
  app.post("/make-server-cac859af/clients", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      const { nom, prenom, email, telephone, statut, patrimoine } = body;

      const clientId = crypto.randomUUID();
      const client = {
        id: clientId,
        nom,
        prenom,
        email,
        telephone,
        statut: statut || 'R0',
        patrimoine: patrimoine || 0,
        conseiller_id: user.id,
        date_creation: new Date().toISOString().split('T')[0],
      };

      await kv.set(`client:${user.id}:${clientId}`, client);
      console.log(`✅ Client ${clientId} créé pour l'utilisateur ${user.id}`);

      // Créer les tâches initiales
      const taskTemplates = getTasksForStatus(statut || 'R0');
      const tasks = [];
      
      for (let i = 0; i < taskTemplates.length; i++) {
        const taskId = `task-${clientId}-${i}`;
        const isFirstTask = i === 0 && taskTemplates[i] === 'Origine du prospect';
        
        const task = {
          id: taskId,
          title: taskTemplates[i],
          completed: isFirstTask, // Première tâche automatiquement complétée
          createdAt: new Date().toISOString(),
          clientId: clientId,
          clientName: `${prenom} ${nom}`,
          client_id: clientId,
          conseiller_id: user.id,
          // Champs spécifiques pour la tâche "Origine du prospect"
          ...(isFirstTask && {
            prospectOrigin: '',
            referrerName: '',
          }),
        };
        
        await kv.set(`task:${user.id}:${clientId}:${taskId}`, task);
        tasks.push(task);
      }
      
      console.log(`✅ ${tasks.length} tâches créées pour le client ${clientId}`);
      
      return c.json({ client, tasks }, 201);
    } catch (err) {
      console.error('Error creating client:', err);
      return c.json({ error: 'Failed to create client: ' + err.message }, 500);
    }
  });

  // Update client
  app.put("/make-server-cac859af/clients/:id", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
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
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
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
}