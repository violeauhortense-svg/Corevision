// Communications Routes - PocketBase
// Backend side of the Outlook bridge (bridge/outlook_bridge_v3.py):
// receives synced mails and lets the bridge poll for CRM-initiated
// sends. Stored in the existing hub_mails collection.

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';
import { findMatchingClient } from './clientMatcher.tsx';

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

    // Identification automatique du client (email exact, puis nom complet
    // dans le sujet/corps) - si rien ne correspond, le mail reste dans
    // "Interne/Externe" pour une association manuelle, comme avant. Une
    // erreur ici (PocketBase temporairement indisponible, etc.) ne doit
    // jamais bloquer la réception du mail lui-même.
    const match = await findMatchingClient(body.from || '', body.subject || '', body.body || '').catch((err) => {
      console.error('Error matching client for incoming mail:', err.message);
      return null;
    });

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
      clientId: match?.id || '',
      clientName: match?.name || '',
      clientEmail: match?.email || '',
      // Identifié automatiquement -> classé directement en Conversation
      // Client ; sinon reste en Interne/Externe pour tri manuel (voir
      // hub_mails_routes_pb.tsx PUT /mails/:id pour l'association manuelle).
      hubTab: match ? 'conversation_client' : 'interne_externe',
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
        bodyHtml: m.bodyHtml || '',
        // Pas de champ 'isHtml' dans le schéma hub_mails - la présence
        // de bodyHtml suffit à signaler qu'il faut envoyer en HTML.
        isHtml: !!m.bodyHtml,
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
