// ============================================
// TASK ROUTES MODULE
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuth } from "./auth.tsx";
import { getTasksWithIdsForStatus } from "./helpers.tsx";

export function setupTaskRoutes(app: Hono) {
  // Get tasks for a client
  app.get("/make-server-cac859af/clients/:clientId/tasks", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const tasks = await kv.getByPrefix(`task:${user.id}:${clientId}:`);
      return c.json({ tasks });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      return c.json({ error: 'Failed to fetch tasks: ' + err.message }, 500);
    }
  });

  // Create task for client
  app.post("/make-server-cac859af/clients/:clientId/tasks", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json();
      const { titre, description, priorite, date_echeance } = body;

      const taskId = crypto.randomUUID();
      const task = {
        id: taskId,
        client_id: clientId,
        conseiller_id: user.id,
        titre,
        description,
        statut: 'À faire',
        priorite: priorite || 'Moyenne',
        date_echeance,
        date_creation: new Date().toISOString(),
      };

      await kv.set(`task:${user.id}:${clientId}:${taskId}`, task);
      
      return c.json({ task }, 201);
    } catch (err) {
      console.error('Error creating task:', err);
      return c.json({ error: 'Failed to create task: ' + err.message }, 500);
    }
  });

  // Get ALL tasks for authenticated user (toutes les tâches, tous les clients)
  app.get("/make-server-cac859af/client-tasks", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    try {
      const tasks = await kv.getByPrefix(`task:${user.id}:`);
      return c.json({ tasks });
    } catch (err) {
      return c.json({ error: 'Failed to fetch tasks: ' + err.message }, 500);
    }
  });

  // Delete task
  app.delete("/make-server-cac859af/tasks/:taskId", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    try {
      const taskId = c.req.param('taskId');
      const allTasks = await kv.getByPrefix(`task:${user.id}:`);
      const existing = allTasks.find((t: any) => t.id === taskId);
      if (!existing) return c.json({ error: 'Task not found' }, 404);
      await kv.del(`task:${user.id}:${existing.client_id}:${taskId}`);
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: 'Failed to delete task: ' + err.message }, 500);
    }
  });

  // Update task
  app.put("/make-server-cac859af/tasks/:taskId", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const taskId = c.req.param('taskId');
      const body = await c.req.json();
      
      const allTasks = await kv.getByPrefix(`task:${user.id}:`);
      const existingTask = allTasks.find((t: any) => t.id === taskId);
      
      if (!existingTask) {
        return c.json({ error: 'Task not found' }, 404);
      }

      const updatedTask = {
        ...existingTask,
        ...body,
        id: taskId,
      };

      await kv.set(`task:${user.id}:${existingTask.client_id}:${taskId}`, updatedTask);

      return c.json({ task: updatedTask });
    } catch (err) {
      console.error('Error updating task:', err);
      return c.json({ error: 'Failed to update task: ' + err.message }, 500);
    }
  });

  // PATCH: Validate/NA a task in the 8-status pipeline
  app.patch("/make-server-cac859af/clients/:clientId/tache/:taskIdx", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const taskIdx = parseInt(c.req.param('taskIdx'), 10);
      const body = await c.req.json();
      const { completed, status } = body;

      console.log(`🔄 Task validation: clientId=${clientId}, taskIdx=${taskIdx}, completed=${completed}, status=${status}`);

      // Fetch the client
      const client = await kv.get(`client:${user.id}:${clientId}`);
      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      const currentStatus = client.statusOuvert || 'Prospect';
      const tasks = client.taches?.[currentStatus] || [];

      if (taskIdx < 0 || taskIdx >= tasks.length) {
        return c.json({ error: `Invalid task index ${taskIdx} for status "${currentStatus}"` }, 400);
      }

      console.log(`   Task before: id=${tasks[taskIdx]?.id}, completed=${tasks[taskIdx]?.completed}, status=${tasks[taskIdx]?.status}`);

      // Update the task
      tasks[taskIdx].completed = completed;
      tasks[taskIdx].status = status || (completed ? 'validated' : 'pending');
      tasks[taskIdx].updated_at = new Date().toISOString();

      // Save client
      client.taches[currentStatus] = tasks;
      client.updated_at = new Date().toISOString();
      await kv.set(`client:${user.id}:${clientId}`, client);

      console.log(`   Task after: completed=${tasks[taskIdx].completed}, status=${tasks[taskIdx].status}`);
      console.log(`✅ Task validation successful`);

      return c.json({
        success: true,
        message: `Task ${status === 'na' ? 'marked N.A.' : (completed ? 'validated' : 'unvalidated')}`,
        client
      });
    } catch (err) {
      console.error('❌ Error validating task:', err);
      return c.json({ error: 'Failed to validate task: ' + (err as Error).message }, 500);
    }
  });

  // POST: Progress to next status
  app.post("/make-server-cac859af/clients/:clientId/progress", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json();
      const { fromStatus, toStatus } = body;

      console.log(`➡️ Status progression: ${fromStatus} → ${toStatus}`);

      // Fetch the client
      const client = await kv.get(`client:${user.id}:${clientId}`);
      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      // Validate current status matches
      if (client.statusOuvert !== fromStatus) {
        return c.json({
          error: `Current status is "${client.statusOuvert}", not "${fromStatus}"`
        }, 400);
      }

      // Initialize tasks for next status if not exists
      if (!client.taches[toStatus]) {
        const nextTaskDefs = getTasksWithIdsForStatus(toStatus);
        client.taches[toStatus] = nextTaskDefs.map((def: any) => ({
          id: def.id,
          title: def.title,
          completed: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          clientId: clientId,
          statusPipeline: toStatus,
        }));
      }

      // Update client status
      client.statusOuvert = toStatus;
      client.updated_at = new Date().toISOString();
      await kv.set(`client:${user.id}:${clientId}`, client);

      console.log(`✅ Client progressed to "${toStatus}"`);

      return c.json({
        success: true,
        message: `Client progressed to "${toStatus}"`,
        client
      });
    } catch (err) {
      console.error('❌ Error progressing status:', err);
      return c.json({ error: 'Failed to progress: ' + (err as Error).message }, 500);
    }
  });
}
