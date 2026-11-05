// Bridge Status Routes - PocketBase
// Le bridge Outlook (bridge/outlook_bridge_v3.py) envoie une pulsation à
// chaque cycle de synchro - ça permet au CRM de savoir s'il tourne
// encore, depuis n'importe où (pas seulement depuis le poste qui héberge
// le bridge, contrairement à un appel direct à http://127.0.0.1:5001).

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// Au-delà de ce délai sans pulsation, on considère le bridge hors ligne -
// un cycle complet (4 étapes + les pauses de 5s entre chacune) prend
// normalement une poignée de secondes, donc 2 minutes laisse large sans
// pour autant mettre des heures à détecter un arrêt réel.
const STALE_AFTER_MS = 2 * 60 * 1000;

async function findHeartbeat(deviceId: string) {
  const { items } = await pb.listRecords('bridge_heartbeats', {
    filter: `deviceId = "${deviceId}"`,
    perPage: 1,
  });
  return items[0] || null;
}

// ─── POST /heartbeat (bridge -> CRM, à chaque cycle) ──────────────────
app.post('/heartbeat', async (c) => {
  try {
    const body = await c.req.json();
    const deviceId = body.device_id || 'default-device';
    const now = new Date().toISOString();

    const existing = await findHeartbeat(deviceId);
    const fields = {
      deviceId,
      lastSeenAt: now,
      lastMailsSynced: body.mails_synced ?? 0,
      lastDuplicates: body.duplicates ?? 0,
      lastFiltered: body.filtered ?? 0,
    };

    if (existing) {
      await pb.updateRecord('bridge_heartbeats', existing.id, fields);
    } else {
      await pb.createRecord('bridge_heartbeats', fields);
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Error recording bridge heartbeat:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET /status/:deviceId ──────────────────────────────────────────
app.get('/status/:deviceId', async (c) => {
  try {
    const deviceId = c.req.param('deviceId');
    const record = await findHeartbeat(deviceId);

    if (!record || !record.lastSeenAt) {
      return c.json({ status: 'ok', bridge_running: false, device_id: deviceId, last_sync: null });
    }

    const ageMs = Date.now() - new Date(record.lastSeenAt as string).getTime();
    const bridge_running = ageMs < STALE_AFTER_MS;

    return c.json({
      status: 'ok',
      bridge_running,
      device_id: deviceId,
      last_sync: record.lastSeenAt,
      last_mails_synced: record.lastMailsSynced,
      last_duplicates: record.lastDuplicates,
      last_filtered: record.lastFiltered,
    });
  } catch (err: any) {
    console.error('Error reading bridge status:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
