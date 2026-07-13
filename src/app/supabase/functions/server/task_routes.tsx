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

  // PATCH: Validate task in pipeline (mark as completed + auto-progress if all done)
  app.patch("/make-server-cac859af/clients/:clientId/tache/:taskId", async (c) => {
    const { user, error } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const taskIdx = parseInt(c.req.param('taskId'), 10); // taskId is actually the index
      const body = await c.req.json();
      const { completed } = body;

      // Fetch the client
      const client = await kv.get(`client:${user.id}:${clientId}`);
      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      const STATUSES = ['Prospect', 'Découverte', 'Simulation', 'Lettre Mission', 'Rapport/Audit', 'Suivi MEP', 'Suivi CSP', 'Arbitrage'];
      const currentStatus = client.statusOuvert || 'Prospect';
      const tasks = client.taches?.[currentStatus] || [];

      if (taskIdx < 0 || taskIdx >= tasks.length) {
        return c.json({ error: 'Invalid task index' }, 400);
      }

      console.log(`🔄 Validating task ${taskIdx} in status "${currentStatus}" for client ${clientId}`);
      console.log(`   Before: completed=${tasks[taskIdx]?.completed}`);

      // Update the task
      tasks[taskIdx].completed = completed;
      tasks[taskIdx].updated_at = new Date().toISOString();

      console.log(`   After: completed=${tasks[taskIdx].completed}`);

      // Check if all tasks in current status are completed
      const allCompleted = tasks.every((t: any) => t.completed === true);
      console.log(`✓ All tasks completed in "${currentStatus}"? ${allCompleted}`);

      if (allCompleted) {
        // Find next status
        const currentIdx = STATUSES.indexOf(currentStatus);
        const nextStatus = currentIdx < STATUSES.length - 1 ? STATUSES[currentIdx + 1] : null;

        if (nextStatus) {
          console.log(`✅ Auto-progressing from "${currentStatus}" → "${nextStatus}"`);

          // Initialize tasks for next status
          const nextTaskDefs = getTasksWithIdsForStatus(nextStatus);
          const nextTasks = nextTaskDefs.map((def: any) => ({
            id: def.id,
            title: def.title,
            completed: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            clientId: clientId,
            statusPipeline: nextStatus,
          }));

          // Update client
          client.statusOuvert = nextStatus;
          client.taches[nextStatus] = nextTasks;
          client.updated_at = new Date().toISOString();

          await kv.set(`client:${user.id}:${clientId}`, client);
          console.log(`✅ Client progressed to "${nextStatus}"`);

          return c.json({
            success: true,
            message: `Task completed. Client auto-progressed to ${nextStatus}`,
            client,
            autoProgressed: true,
            newStatus: nextStatus
          });
        } else {
          // All statuses completed
          client.taches[currentStatus] = tasks;
          client.updated_at = new Date().toISOString();
          await kv.set(`client:${user.id}:${clientId}`, client);
          console.log(`✅ All pipeline statuses completed for client ${clientId}`);

          return c.json({
            success: true,
            message: 'Task completed. All pipeline statuses are now complete!',
            client,
            allComplete: true
          });
        }
      } else {
        // Just update the task without progression
        client.taches[currentStatus] = tasks;
        client.updated_at = new Date().toISOString();
        await kv.set(`client:${user.id}:${clientId}`, client);

        return c.json({
          success: true,
          message: 'Task completed',
          client,
          autoProgressed: false
        });
      }
    } catch (err) {
      console.error('❌ Error validating task:', err);
      return c.json({ error: 'Failed to validate task: ' + (err as Error).message }, 500);
    }
  });
}
