// Agenda Events Routes - PocketBase
// Backend side of the Outlook bridge (bridge/outlook_bridge_v3.py):
// receives synced calendar events and lets the bridge poll for
// CRM-initiated meeting responses (accept/decline/tentative).

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// ─── GET / (list events, e.g. for a given month) ─────────────────────
app.get('/', async (c) => {
  try {
    const result = await pb.listRecords('agenda_events', { perPage: 500, sort: '-startDate' });
    return c.json({ success: true, data: result.items, error: null }, 200);
  } catch (err: any) {
    console.error('Error listing agenda events:', err.message);
    return c.json({ success: false, data: [], error: err.message }, 500);
  }
});

// ─── POST / (bridge -> CRM: a synced Outlook calendar event) ─────────
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // De-dupe on outlookEventId so re-syncing the same meeting updates
    // it in place instead of creating a new row every 30s.
    if (body.outlookEventId) {
      try {
        const existing = await pb.listRecords('agenda_events', {
          filter: `outlookEventId = "${body.outlookEventId}"`,
          perPage: 1,
        });
        if (existing.total > 0) {
          const updated = await pb.updateRecord('agenda_events', existing.items[0].id, {
            title: body.title,
            startDate: body.startDate,
            endDate: body.endDate || '',
            status: body.status || 'not_responded',
            attendees: body.attendees || [],
          });
          return c.json({ success: true, data: updated, error: null }, 200);
        }
      } catch {
        // Fall through and create a new record if the lookup itself fails.
      }
    }

    const event = await pb.createRecord('agenda_events', {
      title: body.title || '',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      outlookEventId: body.outlookEventId || '',
      status: body.status || 'not_responded',
      attendees: body.attendees || [],
      source: body.source || 'outlook',
      deviceId: body.device_id || body.deviceId || '',
      clientId: body.clientId || '',
      pendingResponse: '',
    });

    return c.json({ success: true, data: event, error: null }, 201);
  } catch (err: any) {
    console.error('Error creating agenda event:', err.message);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// ─── GET /pending-response (bridge polls: meetings to respond to) ───
app.get('/pending-response', async (c) => {
  try {
    const result = await pb.listRecords('agenda_events', {
      filter: `pendingResponse != ""`,
      perPage: 100,
    });

    return c.json({
      events: result.items.map((e: any) => ({
        id: e.id,
        title: e.title,
        outlookEventId: e.outlookEventId,
        pending_response: e.pendingResponse,
      })),
    }, 200);
  } catch (err: any) {
    console.error('Error fetching pending-response:', err.message);
    return c.json({ events: [] }, 200);
  }
});

// ─── PATCH /:id/responded (bridge -> CRM: response was sent) ────────
app.patch('/:id/responded', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    await pb.updateRecord('agenda_events', id, {
      pendingResponse: '',
      status: body.response === 'accept' ? 'accepted' : body.response === 'decline' ? 'declined' : 'tentative',
    });
    return c.json({ success: true }, 200);
  } catch (err: any) {
    console.error('Error marking event responded:', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
