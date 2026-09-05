// Hub Mails Routes - PocketBase Version
// Replace hub_mails_routes.tsx avec cette version pour PocketBase

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// ─── GET all mails with filters ───────────────────────────────────────
app.get('/mails', async (c) => {
  try {
    const tab = c.req.query('tab') || 'conversation_client'; // Filter by tab
    const status = c.req.query('status'); // Optional status filter
    const clientId = c.req.query('clientId'); // Optional client filter

    let filter = `hubTab = "${tab}"`;
    if (status) filter += ` && traitementStatus = "${status}"`;
    if (clientId) filter += ` && clientId = "${clientId}"`;

    const result = await pb.listRecords('hub_mails', {
      filter,
      sort: '-sentAt',
      perPage: 50,
    });

    return c.json({
      success: true,
      data: result.items,
      total: result.total,
      error: null,
    });
  } catch (err: any) {
    console.error('Error fetching mails:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── GET single mail ──────────────────────────────────────────────────
app.get('/mails/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const mail = await pb.getRecord('hub_mails', id);
    return c.json({ success: true, data: mail, error: null });
  } catch (err: any) {
    console.error('Error fetching mail:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 404);
  }
});

// ─── POST create mail ─────────────────────────────────────────────────
app.post('/mails', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.from || !body.subject || !body.body) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const mail = await pb.createRecord('hub_mails', {
      id: `mail_${Date.now()}`,
      ...body,
      sentAt: body.sentAt || new Date().toISOString(),
      hubTab: body.hubTab || 'conversation_client',
      traitementStatus: body.traitementStatus || 'a_traiter',
    });

    return c.json({ success: true, data: mail, error: null }, 201);
  } catch (err: any) {
    console.error('Error creating mail:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── PATCH update mail status ─────────────────────────────────────────
app.patch('/mails/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    if (!status) {
      return c.json({ success: false, error: 'Status required' }, 400);
    }

    const mail = await pb.updateRecord('hub_mails', id, {
      traitementStatus: status,
    });

    return c.json({ success: true, data: mail, error: null });
  } catch (err: any) {
    console.error('Error updating mail status:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── PATCH add note to mail ───────────────────────────────────────────
app.patch('/mails/:id/notes', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { note } = body;

    if (!note) {
      return c.json({ success: false, error: 'Note required' }, 400);
    }

    // Get current mail to append note
    const mail = await pb.getRecord('hub_mails', id);
    const notes = mail.notes || [];
    notes.push({
      id: `note_${Date.now()}`,
      text: note,
      createdAt: new Date().toISOString(),
    });

    const updated = await pb.updateRecord('hub_mails', id, { notes });
    return c.json({ success: true, data: updated, error: null });
  } catch (err: any) {
    console.error('Error adding note:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── DELETE mail ──────────────────────────────────────────────────────
app.delete('/mails/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await pb.deleteRecord('hub_mails', id);
    return c.json({ success: true, data: null, error: null });
  } catch (err: any) {
    console.error('Error deleting mail:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

export default app;
