// Tasks Routes - PocketBase

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// ─── GET all tasks ──────────────────────────────────────────────────
app.get('/', async (c) => {
  try {
    const status = c.req.query('status'); // optional filter
    const clientId = c.req.query('clientId'); // optional filter

    let filter = '';
    if (status) filter += `status = "${status}"`;
    if (clientId) {
      if (filter) filter += ' && ';
      filter += `clientId = "${clientId}"`;
    }

    const result = await pb.listRecords('tasks', {
      filter: filter || undefined,
      sort: '-dueDate',
      perPage: 100,
    });

    return c.json({
      success: true,
      data: result.items,
      total: result.total,
      error: null,
    });
  } catch (err: any) {
    console.error('Error fetching tasks:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── GET single task ────────────────────────────────────────────────
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const task = await pb.getRecord('tasks', id);
    return c.json({
      success: true,
      data: task,
      error: null,
    });
  } catch (err: any) {
    console.error('Error fetching task:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 404);
  }
});

// ─── POST create task ───────────────────────────────────────────────
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.title) {
      return c.json({ error: 'Title requis' }, 400);
    }

    const task = await pb.createRecord('tasks', {
      id: `task_${Date.now()}`,
      title: body.title,
      description: body.description || '',
      status: body.status || 'pending',
      priority: body.priority || 'normal',
      dueDate: body.dueDate || new Date().toISOString(),
      clientId: body.clientId || '',
      assignedTo: body.assignedTo || '',
    });

    return c.json({
      success: true,
      data: task,
      error: null,
    }, 201);
  } catch (err: any) {
    console.error('Error creating task:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── PATCH update task ──────────────────────────────────────────────
app.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const task = await pb.updateRecord('tasks', id, body);

    return c.json({
      success: true,
      data: task,
      error: null,
    });
  } catch (err: any) {
    console.error('Error updating task:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── PATCH update task status ───────────────────────────────────────
app.patch('/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();

    if (!status) {
      return c.json({ error: 'Status requis' }, 400);
    }

    const task = await pb.updateRecord('tasks', id, { status });

    return c.json({
      success: true,
      data: task,
      error: null,
    });
  } catch (err: any) {
    console.error('Error updating task status:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── DELETE task ────────────────────────────────────────────────────
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await pb.deleteRecord('tasks', id);
    return c.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err: any) {
    console.error('Error deleting task:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

export default app;
