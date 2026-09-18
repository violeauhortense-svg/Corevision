// Hub Mails Routes - PocketBase Version
// Backs the Hub Communication UI (components/communications/*): mail
// list per tab, full mail detail, classification (client association),
// treatment status, notes, and replies.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

function toHubMail(m: any) {
  const to = typeof m.to === 'string' ? m.to.split(';').map((s: string) => s.trim()).filter(Boolean) : (m.to || []);
  // A handful of mails imported before the bridge existed never had
  // their recipient captured. For a *received* mail that's still a
  // knowable fact, not a mystery: it's in this mailbox, so she was a
  // recipient (directly or via a distribution list) - showing that
  // beats a bare "unknown".
  if (to.length === 0 && m.direction !== 'sent') to.push('Hortense VIOLEAU');

  return {
    id: m.id,
    messageId: m.messageId || '',
    from: m.from || '',
    fromName: m.fromName || '',
    to,
    cc: m.cc || [],
    bcc: m.bcc || [],
    subject: m.subject || '',
    body: m.body || '',
    isHtml: false,
    sentAt: m.sentAt || m.receivedAt || m.created,
    receivedAt: m.receivedAt || '',
    direction: m.direction === 'sent' ? 'sent' : 'received',
    read: !!m.read,
    clientId: m.clientId || '',
    clientName: m.clientName || '',
    clientEmail: m.clientEmail || '',
    hubTab: m.hubTab || 'interne_externe',
    traitementStatus: m.traitementStatus || 'a_traiter',
    notes: m.notes || [],
    attachments: m.attachments || [],
    importedFrom: 'outlook',
    createdAt: m.created,
    updatedAt: m.updated,
  };
}

async function computeStats() {
  const result = await pb.listRecords('hub_mails', { perPage: 500 });
  const stats = {
    conversation_client: 0,
    interne_externe: 0,
    archive: 0,
    appels: 0,
    a_traiter: 0,
    en_cours: 0,
    a_valider_gl: 0,
    valide_gl: 0,
    unread: 0,
  };

  for (const m of result.items as any[]) {
    const status = m.traitementStatus || 'a_traiter';
    const tab = status === 'termine' ? 'archive' : (m.hubTab || 'interne_externe');

    if (tab === 'conversation_client') stats.conversation_client++;
    else if (tab === 'archive') stats.archive++;
    else stats.interne_externe++;

    if (status in stats) (stats as any)[status]++;
    if (!m.read) stats.unread++;
  }

  const calls = await pb.listRecords('hub_calls', { perPage: 500, filter: 'status = "pending"' }).catch(() => ({ items: [] }));
  stats.appels = calls.items.length;

  return stats;
}

// ─── GET /mails (list by tab, with stats) ─────────────────────────────
app.get('/mails', async (c) => {
  try {
    const tab = c.req.query('tab') || 'conversation_client';
    const limit = parseInt(c.req.query('limit') || '50', 10);

    let filter: string;
    if (tab === 'archive') {
      filter = 'traitementStatus = "termine"';
    } else if (tab === 'conversation_client') {
      filter = 'hubTab = "conversation_client" && traitementStatus != "termine"';
    } else {
      filter = 'hubTab = "interne_externe" && traitementStatus != "termine"';
    }

    // Mail synced by the bridge only ever sets receivedAt, never sentAt
    // (only queued replies do) - sorting on -sentAt at the DB level left
    // almost every real mail with nothing to sort by, so the list came
    // back in near-arbitrary order instead of newest-first. Fetch
    // unsorted, then sort in memory on the same resolved date toHubMail
    // already computes (sentAt || receivedAt || created), which every
    // record has one of.
    const result = await pb.listRecords('hub_mails', { filter, perPage: 500 });
    const stats = await computeStats();

    const mails = result.items
      .map(toHubMail)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, limit);

    return c.json({ mails, total: result.total, stats });
  } catch (err: any) {
    console.error('Error fetching mails:', err.message);
    return c.json({ mails: [], total: 0, error: err.message }, 500);
  }
});

// ─── GET /mails/:id (full detail) ─────────────────────────────────────
app.get('/mails/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const mail = await pb.getRecord('hub_mails', id);
    return c.json(toHubMail(mail));
  } catch (err: any) {
    console.error('Error fetching mail:', err.message);
    return c.json({ error: err.message }, 404);
  }
});

// ─── PUT /mails/:id (status, notes, client association) ──────────────
app.put('/mails/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const updates: Record<string, any> = {};

    if (body.traitementStatus !== undefined) updates.traitementStatus = body.traitementStatus;
    if (body.clientId !== undefined) updates.clientId = body.clientId;
    if (body.clientName !== undefined) updates.clientName = body.clientName;
    if (body.clientEmail !== undefined) updates.clientEmail = body.clientEmail;

    // Associating a client reclassifies the mail into "Conversation
    // Client"; clearing the association sends it back to "Interne/Externe".
    if (body.clientId !== undefined) {
      updates.hubTab = body.clientId ? 'conversation_client' : 'interne_externe';
    }

    const updated = await pb.updateRecord('hub_mails', id, updates);
    return c.json(toHubMail(updated));
  } catch (err: any) {
    console.error('Error updating mail:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── PATCH /mails/:id/status (kept for backward compat) ──────────────
app.patch('/mails/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    if (!status) return c.json({ error: 'Status required' }, 400);
    const mail = await pb.updateRecord('hub_mails', id, { traitementStatus: status });
    return c.json(toHubMail(mail));
  } catch (err: any) {
    console.error('Error updating mail status:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST /mails/:id/notes (append a note) ────────────────────────────
app.post('/mails/:id/notes', async (c) => {
  try {
    const id = c.req.param('id');
    const { content, createdBy, createdByName } = await c.req.json();
    if (!content || !content.trim()) return c.json({ error: 'Note required' }, 400);

    const mail = await pb.getRecord('hub_mails', id);
    const notes = mail.notes || [];
    const note = {
      id: `note_${Date.now()}`,
      content,
      createdBy: createdBy || '',
      createdByName: createdByName || '',
      createdAt: new Date().toISOString(),
    };
    notes.push(note);

    await pb.updateRecord('hub_mails', id, { notes });
    return c.json(note, 201);
  } catch (err: any) {
    console.error('Error adding note:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── DELETE /mails/:id/notes/:noteId ───────────────────────────────────
app.delete('/mails/:id/notes/:noteId', async (c) => {
  try {
    const id = c.req.param('id');
    const noteId = c.req.param('noteId');

    const mail = await pb.getRecord('hub_mails', id);
    const notes = (mail.notes || []).filter((n: any) => n.id !== noteId);

    await pb.updateRecord('hub_mails', id, { notes });
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting note:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST /mails/:id/reply (queue a reply for the bridge to send) ────
app.post('/mails/:id/reply', async (c) => {
  try {
    const id = c.req.param('id');
    const { to, subject, body, cc } = await c.req.json();
    if (!to?.length || !subject || !body) return c.json({ error: 'Missing fields' }, 400);

    const original = await pb.getRecord('hub_mails', id);

    await pb.createRecord('hub_mails', {
      from: '',
      to: Array.isArray(to) ? to.join('; ') : to,
      cc: cc || [],
      subject,
      body,
      sentAt: new Date().toISOString(),
      direction: 'pending_send',
      hubTab: original.hubTab || 'interne_externe',
      traitementStatus: 'a_traiter',
      clientId: original.clientId || '',
      clientName: original.clientName || '',
      read: true,
    });

    return c.json(toHubMail(original));
  } catch (err: any) {
    console.error('Error queuing reply:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST /mails/search ────────────────────────────────────────────────
app.post('/mails/search', async (c) => {
  try {
    const { query, tab, limit } = await c.req.json();
    if (!query || !query.trim()) return c.json([]);

    const safeQuery = query.replace(/"/g, '\\"');
    let filter = `(subject ~ "${safeQuery}" || body ~ "${safeQuery}" || from ~ "${safeQuery}")`;
    if (tab === 'archive') filter += ' && traitementStatus = "termine"';
    else if (tab === 'conversation_client') filter += ' && hubTab = "conversation_client"';
    else if (tab === 'interne_externe') filter += ' && hubTab = "interne_externe"';

    const result = await pb.listRecords('hub_mails', { filter, perPage: 500 });
    const mails = result.items
      .map(toHubMail)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, limit || 50);
    return c.json(mails);
  } catch (err: any) {
    console.error('Error searching mails:', err.message);
    return c.json([], 500);
  }
});

// ─── GET /stats ─────────────────────────────────────────────────────────
app.get('/stats', async (c) => {
  try {
    return c.json(await computeStats());
  } catch (err: any) {
    console.error('Error computing stats:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── CALLS (Appels à traiter) ───────────────────────────────────────────
app.get('/calls', async (c) => {
  try {
    const status = c.req.query('status');
    const filter = status ? `status = "${status}"` : '';
    const result = await pb.listRecords('hub_calls', { filter, sort: '-dueDate', perPage: 100 });
    return c.json({ calls: result.items, total: result.total });
  } catch (err: any) {
    console.error('Error fetching calls:', err.message);
    return c.json({ calls: [], total: 0, error: err.message }, 500);
  }
});

app.post('/calls', async (c) => {
  try {
    const body = await c.req.json();
    const call = await pb.createRecord('hub_calls', { ...body, status: body.status || 'pending' });
    return c.json(call, 201);
  } catch (err: any) {
    console.error('Error creating call:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

app.put('/calls/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const call = await pb.updateRecord('hub_calls', id, updates);
    return c.json(call);
  } catch (err: any) {
    console.error('Error updating call:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

app.post('/calls/:id/complete', async (c) => {
  try {
    const id = c.req.param('id');
    const call = await pb.updateRecord('hub_calls', id, { status: 'completed' });
    return c.json(call);
  } catch (err: any) {
    console.error('Error completing call:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── DELETE mail ──────────────────────────────────────────────────────
app.delete('/mails/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await pb.deleteRecord('hub_mails', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting mail:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
