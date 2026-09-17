// Communications Routes - PocketBase
// Backend side of the Outlook bridge (bridge/outlook_bridge_v3.py):
// receives synced mails and lets the bridge poll for CRM-initiated
// sends. Stored in the existing hub_mails collection.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

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
      // No clientId yet at receive time - the Hub Communication UI
      // reclassifies to 'conversation_client' once the mail is
      // associated to a client (see hub_mails_routes_pb.tsx PUT /mails/:id).
      hubTab: 'interne_externe',
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
