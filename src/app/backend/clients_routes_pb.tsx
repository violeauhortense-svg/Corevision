// Clients Routes - PocketBase

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// ─── GET all clients ────────────────────────────────────────────────
app.get('/', async (c) => {
  try {
    const result = await pb.listRecords('clients', {
      sort: 'nom',
      perPage: 100,
    });

    return c.json({
      success: true,
      data: result.items,
      total: result.total,
      error: null,
    });
  } catch (err: any) {
    console.error('Error fetching clients:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── GET single client ──────────────────────────────────────────────
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const client = await pb.getRecord('clients', id);
    return c.json({
      success: true,
      data: client,
      error: null,
    });
  } catch (err: any) {
    console.error('Error fetching client:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 404);
  }
});

// ─── POST create client ─────────────────────────────────────────────
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.nom) {
      return c.json({ error: 'Nom requis' }, 400);
    }

    const client = await pb.createRecord('clients', {
      id: `client_${Date.now()}`,
      nom: body.nom,
      prenom: body.prenom || '',
      email: body.email || '',
      telephone: body.telephone || '',
      status: body.status || 'prospect',
      patrimoine: body.patrimoine || {},
    });

    return c.json({
      success: true,
      data: client,
      error: null,
    }, 201);
  } catch (err: any) {
    console.error('Error creating client:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── PATCH update client ────────────────────────────────────────────
app.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const client = await pb.updateRecord('clients', id, body);

    return c.json({
      success: true,
      data: client,
      error: null,
    });
  } catch (err: any) {
    console.error('Error updating client:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── DELETE client ──────────────────────────────────────────────────
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await pb.deleteRecord('clients', id);
    return c.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err: any) {
    console.error('Error deleting client:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── GET client mails ───────────────────────────────────────────────
app.get('/:id/mails', async (c) => {
  try {
    const clientId = c.req.param('id');
    const mails = await pb.getMailsByClient(clientId);
    return c.json({
      success: true,
      data: mails,
      error: null,
    });
  } catch (err: any) {
    console.error('Error fetching client mails:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

export default app;
