// ============================================
// TASK ROUTES MODULE
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuth } from "./auth.tsx";
import { getTasksWithIdsForStatus } from "./helpers.tsx";

// ✨ Utility functions for task completion tracking
function areAllTasksCompleted(tasks: any[]): boolean {
  return tasks.every((t: any) => t.completed || t.status === 'na');
}

function countTasksByState(tasks: any[]): Record<string, number> {
  return {
    completed: tasks.filter((t: any) => t.completed).length,
    pending: tasks.filter((t: any) => !t.completed && t.status === 'pending').length,
    na: tasks.filter((t: any) => t.status === 'na').length,
  };
}

export function setupTaskRoutes(app: Hono) {
  // Get tasks for a client
  app.get("/make-server-cac859af/clients/:clientId/tasks", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    
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
    const { user, error } = await verifyAuth(c.req);
    
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
    const { user, error } = await verifyAuth(c.req);
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
    const { user, error } = await verifyAuth(c.req);
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
    const { user, error } = await verifyAuth(c.req);
    
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

  // PATCH: Validate/NA a task + AUTO-PROGRESSION (8-status pipeline)
  app.patch("/make-server-cac859af/clients/:clientId/tache/:taskId", async (c) => {
    console.log('🔄 [PATCH Task] Request received');
    const { user, error } = await verifyAuth(c.req);

    if (error || !user) {
      console.error('❌ [PATCH Task] Auth failed:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const taskId = c.req.param('taskId');
      const body = await c.req.json();
      const { completed, status } = body;

      console.log(`🔄 [PATCH Task] Validating: clientId=${clientId}, taskId=${taskId}, completed=${completed}`);

      // Fetch the client
      const kvKey = `client:${user.id}:${clientId}`;
      console.log(`🔄 [PATCH Task] Fetching client: ${kvKey}`);
      const client = await kv.get(kvKey);

      if (!client) {
        console.error('❌ [PATCH Task] Client not found');
        return c.json({ error: 'Client not found' }, 404);
      }

      console.log(`✅ [PATCH Task] Client found: ${client.nom}`);

      const currentStatus = client.statusOuvert || 'Prospect';
      const tasks = client.taches?.[currentStatus] || [];
      console.log(`🔄 [PATCH Task] Current status: ${currentStatus}, tasks count: ${tasks.length}`);

      // Find task by ID
      let taskIdx = tasks.findIndex((t: any) => t.id === taskId);
      if (taskIdx < 0) {
        console.error(`❌ [PATCH Task] Task not found: ${taskId}`);
        return c.json({ error: 'Tâche introuvable' }, 404);
      }

      console.log(`✅ [PATCH Task] Task found at index ${taskIdx}`);

      // 1️⃣ UPDATE TASK
      tasks[taskIdx].completed = completed;
      tasks[taskIdx].status = status || (completed ? 'validated' : 'pending');
      tasks[taskIdx].updated_at = new Date().toISOString();
      console.log(`✅ [PATCH Task] Task updated: ${taskId}, status=${tasks[taskIdx].status}`);

      // 2️⃣ SAVE CLIENT
      client.taches[currentStatus] = tasks;
      client.updated_at = new Date().toISOString();
      await kv.set(`client:${user.id}:${clientId}`, client);
      console.log(`✅ [PATCH Task] Client saved to KV`);

      // 3️⃣ CHECK IF ALL TASKS COMPLETED/NA
      const allCompleted = areAllTasksCompleted(tasks);
      console.log(`📊 [PATCH Task] All completed? ${allCompleted}`);

      if (allCompleted) {
        console.log(`🎯 [PATCH Task] All tasks completed, checking progression...`);
        // 4️⃣ AUTO-PROGRESSION: Move to next status
        const STATUSES = ['Prospect', 'Découverte', 'Simulation', 'Lettre Mission', 'Rapport/Audit', 'Suivi MEP', 'Suivi CSP', 'Arbitrage'];
        const currentIdx = STATUSES.indexOf(currentStatus);
        console.log(`🎯 [PATCH Task] Current index: ${currentIdx}, total: ${STATUSES.length}`);

        if (currentIdx < STATUSES.length - 1) {
          const nextStatus = STATUSES[currentIdx + 1];
          console.log(`🎯 [PATCH Task] Creating tasks for next status: ${nextStatus}`);

          // Create tasks for next status
          const nextTaskDefs = getTasksWithIdsForStatus(nextStatus);
          console.log(`🎯 [PATCH Task] Task defs fetched: ${nextTaskDefs.length} tasks`);

          if (!client.taches) client.taches = {};

          client.taches[nextStatus] = nextTaskDefs.map((def: any) => ({
            id: def.id,
            title: def.title,
            completed: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            clientId: clientId,
            statusPipeline: nextStatus,
          }));

          console.log(`🎯 [PATCH Task] Tasks created for ${nextStatus}: ${client.taches[nextStatus].length}`);

          // Update status and save
          client.statusOuvert = nextStatus;
          client.updated_at = new Date().toISOString();
          await kv.set(`client:${user.id}:${clientId}`, client);

          console.log(`✅ [PATCH Task] AUTO-PROGRESSION: ${currentStatus} → ${nextStatus}`);
        }
      }

      // 5️⃣ RELOAD AND RETURN
      console.log(`🔄 [PATCH Task] Reloading client from KV...`);
      const reloadedClient = await kv.get(`client:${user.id}:${clientId}`);
      console.log(`✅ [PATCH Task] Client reloaded`);

      const responseData = {
        success: true,
        taskId,
        completed,
        status: tasks[taskIdx].status,
        statusProgressed: allCompleted ? true : false,
        client: reloadedClient
      };

      console.log(`✅ [PATCH Task] Sending response...`);
      return c.json(responseData);

    } catch (err) {
      console.error('❌ [PATCH Task] Exception:', err);
      return c.json({ error: 'Failed: ' + (err as Error).message }, 500);
    }
  });

  // POST: Progress to next status
  app.post("/make-server-cac859af/clients/:clientId/progress", async (c) => {
    const { user, error } = await verifyAuth(c.req);

    if (error || !user) {
      console.error('❌ Auth error:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json();
      const { fromStatus, toStatus } = body;

      console.log(`➡️ Progress request:`);
      console.log(`   userId: ${user.id}`);
      console.log(`   clientId: ${clientId}`);
      console.log(`   from: ${fromStatus} → ${toStatus}`);

      // Fetch the client
      const kvKey = `client:${user.id}:${clientId}`;
      console.log(`🔍 Searching for client with key: ${kvKey}`);
      const client = await kv.get(kvKey);

      if (!client) {
        console.error(`❌ Client not found with key: ${kvKey}`);
        return c.json({ error: 'Client not found' }, 404);
      }

      console.log(`✅ Client found: id=${client.id}, nom=${client.nom}`);

      // Validate current status matches
      if (client.statusOuvert !== fromStatus) {
        return c.json({
          error: `Current status is "${client.statusOuvert}", not "${fromStatus}"`
        }, 400);
      }

      // Initialize tasks object if not exists
      if (!client.taches) {
        client.taches = {};
      }

      // Initialize tasks for next status if not exists
      if (!client.taches[toStatus] || client.taches[toStatus].length === 0) {
        const nextTaskDefs = getTasksWithIdsForStatus(toStatus);
        console.log(`📝 Creating ${nextTaskDefs.length} tasks for "${toStatus}":`, nextTaskDefs.map((t: any) => t.id));

        client.taches[toStatus] = nextTaskDefs.map((def: any) => ({
          id: def.id,
          title: def.title,
          completed: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          clientId: clientId,
          statusPipeline: toStatus,
        }));

        console.log(`✅ Created tasks for "${toStatus}":`, client.taches[toStatus].map((t: any) => ({ id: t.id, title: t.title })));
      }

      // Update client status
      client.statusOuvert = toStatus;
      client.updated_at = new Date().toISOString();
      await kv.set(`client:${user.id}:${clientId}`, client);

      // ✨ CRITICAL: Reload client from KV to ensure all data is in sync
      const reloadedClient = await kv.get(`client:${user.id}:${clientId}`);
      console.log(`✅ Client progressed to "${toStatus}" with ${reloadedClient.taches[toStatus]?.length || 0} tasks`);
      console.log(`📊 Client taches structure:`, Object.keys(reloadedClient.taches || {}).map(status =>
        `${status}: ${reloadedClient.taches[status]?.length || 0} tasks`
      ));

      return c.json({
        success: true,
        message: `Client progressed to "${toStatus}"`,
        client: reloadedClient
      });
    } catch (err) {
      console.error('❌ Error progressing status:', err);
      return c.json({ error: 'Failed to progress: ' + (err as Error).message }, 500);
    }
  });
}
