// ============================================
// AGENDA ROUTES - Gestion des RDVs et événements
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuth } from "./auth.tsx";

export function setupAgendaRoutes(app: Hono) {

  // ============================================
  // POST: Créer un événement Agenda
  // ============================================
  app.post("/make-server-cac859af/agenda-events", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const body = await c.req.json();
      const { clientId, clientName, taskId, title, description, startDate, endDate, location, locationType, meetingType, source } = body;

      const eventId = crypto.randomUUID();
      const event = {
        id: eventId,
        source: source || 'manual',
        clientId,
        clientName,
        taskId,
        title,
        description,
        startDate,
        endDate,
        location,
        locationType,
        meetingType,
        status: 'scheduled',
        notes: '',
        attendees: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const key = `agenda_event:${user.id}:${eventId}`;
      await kv.set(key, event);

      // ✨ Interaction 3 : Si un clientId, mettre à jour client.dateNextRdv
      if (clientId) {
        const clientKey = `client:${user.id}:${clientId}`;
        const client = await kv.get(clientKey);
        if (client) {
          client.dateNextRdv = startDate;
          client.updatedAt = new Date().toISOString();
          await kv.set(clientKey, client);
          console.log(`✅ [AGENDA] client.dateNextRdv updated: ${clientName}`);
        }
      }

      console.log(`✅ [AGENDA] Événement créé: ${eventId}`);
      return c.json({ success: true, event });
    } catch (err) {
      console.error('❌ [AGENDA] Erreur création événement:', err);
      return c.json({ error: 'Erreur création événement' }, 500);
    }
  });

  // ============================================
  // GET: Récupérer les événements du mois (Interaction 4)
  // ============================================
  app.get("/make-server-cac859af/agenda/month/:year/:month", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const year = parseInt(c.req.param('year'));
      const month = parseInt(c.req.param('month'));

      const allEvents = await kv.getByPrefix(`agenda_event:${user.id}:`);

      // Filtrer les événements du mois
      const monthEvents = allEvents.filter((event: any) => {
        const date = new Date(event.startDate);
        return date.getFullYear() === year && (date.getMonth() + 1) === month;
      });

      // Grouper par source
      const rdvs = monthEvents.filter(e => e.source === 'outlook' || e.clientId);
      const taches = monthEvents.filter(e => e.source === 'tache' || e.taskId);
      const actions = monthEvents.filter(e => e.source === 'manual' && !e.clientId && !e.taskId);

      const monthData = {
        year,
        month,
        events: monthEvents,
        statistics: {
          totalEvents: monthEvents.length,
          rdvCount: rdvs.length,
          taskCount: taches.length,
          actionCount: actions.length
        }
      };

      console.log(`✅ [AGENDA] Mois chargé: ${monthEvents.length} événements`);
      return c.json({ month: monthData });
    } catch (err) {
      console.error('❌ [AGENDA] Erreur chargement mois:', err);
      return c.json({ error: 'Erreur chargement mois' }, 500);
    }
  });

  // ============================================
  // PATCH: Synchroniser avec Outlook (Interaction 4)
  // ============================================
  app.patch("/make-server-cac859af/agenda-events/:eventId/sync-outlook", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const eventId = c.req.param('eventId');
      const { outlookEventId } = await c.req.json();

      const key = `agenda_event:${user.id}:${eventId}`;
      const event = await kv.get(key);
      if (!event) return c.json({ error: 'Événement introuvable' }, 404);

      event.outlookEventId = outlookEventId;
      event.outlookSyncedAt = new Date().toISOString();
      event.updatedAt = new Date().toISOString();

      await kv.set(key, event);
      console.log(`✅ [AGENDA] Événement synced avec Outlook: ${eventId}`);

      return c.json({ success: true, event });
    } catch (err) {
      console.error('❌ [AGENDA] Erreur sync Outlook:', err);
      return c.json({ error: 'Erreur sync Outlook' }, 500);
    }
  });

  // ============================================
  // PATCH: Répondre à une invitation (Interaction 5)
  // ============================================
  app.patch("/make-server-cac859af/agenda-events/:eventId/respond", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const eventId = c.req.param('eventId');
      const { response } = await c.req.json(); // 'accepted' | 'declined' | 'tentative'

      const key = `agenda_event:${user.id}:${eventId}`;
      const event = await kv.get(key);
      if (!event) return c.json({ error: 'Événement introuvable' }, 404);

      // Mettre à jour le statut basé sur la réponse
      if (response === 'accepted') event.status = 'confirmed';
      if (response === 'declined') event.status = 'rejected';
      if (response === 'tentative') event.status = 'scheduled';

      // Ajouter aux attendees
      if (!event.attendees) event.attendees = [];
      event.attendees.push({
        email: user.email || 'unknown',
        status: response
      });

      event.updatedAt = new Date().toISOString();
      await kv.set(key, event);

      console.log(`✅ [AGENDA] Réponse enregistrée: ${response}`);
      // TODO: Envoyer la réponse à Outlook via Bridge

      return c.json({ success: true, event });
    } catch (err) {
      console.error('❌ [AGENDA] Erreur réponse:', err);
      return c.json({ error: 'Erreur réponse' }, 500);
    }
  });

  // ============================================
  // GET: Récupérer un événement
  // ============================================
  app.get("/make-server-cac859af/agenda-events/:eventId", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const eventId = c.req.param('eventId');
      const key = `agenda_event:${user.id}:${eventId}`;
      const event = await kv.get(key);

      if (!event) return c.json({ error: 'Événement introuvable' }, 404);
      return c.json({ event });
    } catch (err) {
      console.error('❌ [AGENDA] Erreur get:', err);
      return c.json({ error: 'Erreur get événement' }, 500);
    }
  });

}
