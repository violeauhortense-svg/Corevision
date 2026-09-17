// Communications Routes - PocketBase
// Backend side of the Outlook bridge (bridge/outlook_bridge_v3.py):
// receives synced mails and lets the bridge poll for CRM-initiated
// sends. Stored in the existing hub_mails collection.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// ─── GET /hub (frontend: grouped + stats view of hub_mails) ──────────
// CommunicationsHub.tsx expects { hub: { conversation_client, interne,
// archive, en_attente, stats } }, grouped by the hub_mails' hubTab field.
app.get('/hub', async (c) => {
  try {
    const result = await pb.listRecords('hub_mails', { perPage: 500, sort: '-receivedAt' });

    const statusMap: Record<string, string> = {
      a_traiter: 'à_traiter',
      traite: 'traité',
      termine: 'terminé',
    };

    const hub: Record<string, any[]> = {
      conversation_client: [],
      interne: [],
      archive: [],
      en_attente: [],
    };

    let unread = 0;
    let toProcess = 0;
    let processed = 0;
    let archived = 0;

    for (const m of result.items as any[]) {
      const category = hub[m.hubTab] ? m.hubTab : 'en_attente';
      const status = statusMap[m.traitementStatus] || m.traitementStatus || 'à_traiter';

      hub[category].push({
        id: m.id,
        source: m.direction || 'outlook',
        category,
        status,
        from: m.from || '',
        subject: m.subject || '',
        body: m.body || '',
        receivedAt: m.receivedAt || m.created,
        updatedAt: m.updated,
        attachments: m.attachments || [],
        tags: [],
      });

      if (!m.read) unread++;
      if (status === 'à_traiter') toProcess++;
      if (status === 'traité' || status === 'terminé') processed++;
      if (category === 'archive') archived++;
    }

    return c.json({
      hub: {
        ...hub,
        stats: {
          totalReceived: result.total,
          unread,
          toProcess,
          processed,
          archived,
        },
      },
    }, 200);
  } catch (err: any) {
    console.error('Error building hub:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── POST /receive (bridge -> CRM: a synced Outlook mail) ────────────
app.post('/receive', async (c) => {
  try {
    const body = await c.req.json();
    const duplicateKey = body.duplicate_key || body.duplicateKey;

    if (duplicateKey) {
      try {
        const existing = await pb.listRecords('hub_mails', {
          filter: `duplicateKey = "${duplicateKey}"`,
          perPage: 1,
        });
        if (existing.total > 0) {
          return c.json({ duplicate: true }, 200);
        }
      } catch {
        // If the duplicate lookup itself fails, fall through and create
        // the mail anyway rather than blocking the whole sync cycle.
      }
    }

    // "to" is a plain text field in PocketBase (predates the bridge and
    // can't be retyped to json in place - see init-pocketbase.tsx), so
    // join an array of recipients into a single string.
    const toStr = Array.isArray(body.to) ? body.to.join('; ') : (body.to || '');

    await pb.createRecord('hub_mails', {
      from: body.from || '',
      to: toStr,
      cc: body.cc || [],
      bcc: body.bcc || [],
      subject: body.subject || '(Sans sujet)',
      body: body.body || '',
      bodyHtml: body.bodyHtml || '',
      receivedAt: body.receivedAt || new Date().toISOString(),
      attachments: body.attachments || [],
      duplicateKey: duplicateKey || '',
      deviceId: body.device_id || body.deviceId || '',
      direction: 'received',
      hubTab: 'en_attente',
      traitementStatus: 'a_traiter',
      read: false,
    });

    return c.json({ duplicate: false }, 200);
  } catch (err: any) {
    console.error('Error receiving mail:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET /pending-send (bridge polls: mails the CRM wants sent) ──────
app.get('/pending-send', async (c) => {
  try {
    const result = await pb.listRecords('hub_mails', {
      filter: `direction = "pending_send"`,
      perPage: 100,
    });

    return c.json({
      communications: result.items.map((m: any) => ({
        id: m.id,
        to: typeof m.to === 'string' ? m.to.split(';').map((s: string) => s.trim()).filter(Boolean) : (m.to || []),
        cc: m.cc || [],
        bcc: m.bcc || [],
        subject: m.subject,
        body: m.body,
      })),
    }, 200);
  } catch (err: any) {
    console.error('Error fetching pending-send:', err.message);
    return c.json({ communications: [] }, 200);
  }
});

// ─── PATCH /:id/sent (bridge -> CRM: mail was sent via Outlook) ──────
app.patch('/:id/sent', async (c) => {
  try {
    const id = c.req.param('id');
    await pb.updateRecord('hub_mails', id, { direction: 'sent', sentAt: new Date().toISOString() });
    return c.json({ success: true }, 200);
  } catch (err: any) {
    console.error('Error marking mail sent:', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
