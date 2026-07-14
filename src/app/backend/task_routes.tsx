// ============================================
// TASK ROUTES MODULE
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuthRequest } from "./auth.tsx";
import { getTasksWithIdsForStatus } from "./helpers.tsx";
import {
  TASK_STATES,
  TaskState,
  isValidTaskState,
  areAllTasksCompleted,
  countTasksByState,
  validateTaskUpdate,
  applyTaskUpdate,
  TASK_STATE_LABELS,
} from "./task_states.tsx";

export function setupTaskRoutes(app: Hono) {
  // Get tasks for a client
  app.get("/make-server-cac859af/clients/:clientId/tasks", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
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
    const { user, error } = await verifyAuthRequest(c.req);
    
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
    const { user, error } = await verifyAuthRequest(c.req);
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
    const { user, error } = await verifyAuthRequest(c.req);
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
    const { user, error } = await verifyAuthRequest(c.req);
    
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
  // Accept either task index (legacy) or task ID (preferred)
  app.patch("/make-server-cac859af/clients/:clientId/tache/:taskId", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);

    if (error || !user) {
      console.error('❌ Auth error:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const taskIdParam = c.req.param('taskId');
      const body = await c.req.json();

      console.log(`   userId: ${user.id}`);
      console.log(`   clientId: ${clientId}`);
      console.log(`   taskId (ID or index): ${taskIdParam}`);
      console.log(`   payload: ${JSON.stringify(body)}`);

      // Valider la payload
      const { valid, error: validationError, normalized } = validateTaskUpdate(body, user.id);
      if (!valid) {
        console.error(`❌ Validation error: ${validationError}`);
        return c.json({ error: validationError }, 400);
      }

      // Fetch the client
      const kvKey = `client:${user.id}:${clientId}`;
      const client = await kv.get(kvKey);

      if (!client) {
        console.error(`❌ Client not found with key: ${kvKey}`);
        const allClientKeys = await kv.getByPrefix(`client:${user.id}:`);
        allClientKeys.forEach((c: any, i: number) => {
          console.log(`   [${i}] id=${c.id}, nom=${c.nom}`);
        });
        return c.json({ error: 'Client not found' }, 404);
      }


      const currentStatus = client.statusOuvert || 'Prospect';
      const tasks = client.taches?.[currentStatus] || [];

      // Find task by ID (preferred) or by index (legacy fallback)
      let taskIdx = -1;

      // Try to find by task ID first
      taskIdx = tasks.findIndex((t: any) => t.id === taskIdParam);

      // If not found and taskIdParam is numeric, try as index (backward compatibility)
      if (taskIdx === -1 && !isNaN(Number(taskIdParam))) {
        const idx = parseInt(taskIdParam, 10);
        if (idx >= 0 && idx < tasks.length) {
          taskIdx = idx;
        }
      }

      if (taskIdx === -1) {
        return c.json({
          error: `Task not found: "${taskIdParam}" in status "${currentStatus}". Available tasks: ${tasks.map((t: any) => t.id).join(', ')}`
        }, 404);
      }

      const taskBefore = tasks[taskIdx];
      console.log(`      id=${taskBefore?.id}, status=${taskBefore?.status} (${TASK_STATE_LABELS[taskBefore?.status as TaskState]})`);

      // Appliquer la mise à jour validée
      const taskAfter = applyTaskUpdate(taskBefore, normalized!, user.id);
      tasks[taskIdx] = taskAfter;

      // Sauvegarder le client
      client.taches[currentStatus] = tasks;
      client.updated_at = new Date().toISOString();
      await kv.set(`client:${user.id}:${clientId}`, client);

      // Calculer stats pour debug
      const stats = countTasksByState(tasks);
      const allCompleted = areAllTasksCompleted(tasks);


      return c.json({
        success: true,
        message: `Task marked as ${TASK_STATE_LABELS[taskAfter.status]}`,
        task: taskAfter,
        client,
        stats: {
          taskStatus: taskAfter.status,
          allCompleted,  // ✨ Important for auto-progression
          counts: stats,
        }
      });
    } catch (err) {
      console.error('❌ Error validating task:', err);
      return c.json({ error: 'Failed to validate task: ' + (err as Error).message }, 500);
    }
  });

  // POST: Progress to next status
  app.post("/make-server-cac859af/clients/:clientId/progress", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);

    if (error || !user) {
      console.error('❌ Auth error:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json();
      const { fromStatus, toStatus } = body;

      console.log(`   userId: ${user.id}`);
      console.log(`   clientId: ${clientId}`);

      // Fetch the client
      const kvKey = `client:${user.id}:${clientId}`;
      const client = await kv.get(kvKey);

      if (!client) {
        console.error(`❌ Client not found with key: ${kvKey}`);
        return c.json({ error: 'Client not found' }, 404);
      }


      // Validate current status matches
      if (client.statusOuvert !== fromStatus) {
        return c.json({
          error: `Current status is "${client.statusOuvert}", not "${fromStatus}"`
        }, 400);
      }

      // ✨ IMPORTANT: Vérifier que TOUTES les tâches du statut actuel sont complétées
      const currentTasks = client.taches?.[fromStatus] || [];
      const allCompleted = areAllTasksCompleted(currentTasks);

      if (!allCompleted) {
        const stats = countTasksByState(currentTasks);
        console.error(`❌ Cannot progress: ${stats.pending} task(s) still pending`);

        return c.json({
          error: `Cannot progress: ${stats.pending} task(s) still pending in "${fromStatus}"`,
          code: 'TASKS_NOT_COMPLETED',
          stats: {
            validated: stats.validated,
            na: stats.na,
            pending: stats.pending,
            total: currentTasks.length,
          }
        }, 422); // 422 Unprocessable Entity
      }


      // Initialize tasks for next status if not exists
      if (!client.taches[toStatus]) {
        const nextTaskDefs = getTasksWithIdsForStatus(toStatus);
        client.taches[toStatus] = nextTaskDefs.map((def: any) => ({
          id: def.id,
          title: def.title,
          completed: false,
          status: TASK_STATES.PENDING,
          createdAt: new Date().toISOString(),
          clientId: clientId,
          statusPipeline: toStatus,
        }));
      }

      // Update client status
      client.statusOuvert = toStatus;
      client.updated_at = new Date().toISOString();
      await kv.set(`client:${user.id}:${clientId}`, client);


      return c.json({
        success: true,
        message: `Client progressed to "${toStatus}"`,
        client,
        previousStatus: fromStatus,
        newTaskCount: client.taches[toStatus].length,
      });
    } catch (err) {
      console.error('❌ Error progressing status:', err);
      return c.json({ error: 'Failed to progress: ' + (err as Error).message }, 500);
    }
  });
}
