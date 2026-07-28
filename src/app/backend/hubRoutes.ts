import { Hono } from 'hono';
import { hubMailService } from '../services/hubMailService';
import { hubCallsService } from '../services/hubCallsService';
import type { HubTab, MailTraitementStatus } from '../types/mail';

const app = new Hono();

// ============= MAILS ROUTES =============

/**
 * GET /api/hub/mails?tab=conversation_client&limit=50&skip=0
 * Charger les mails d'un onglet
 */
app.get('/mails', async (c) => {
  try {
    const tab = (c.req.query('tab') as HubTab) || 'conversation_client';
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const skip = parseInt(c.req.query('skip') || '0', 10);

    const result = await hubMailService.getMailsByTab(tab, limit, skip);
    return c.json(result, 200);
  } catch (error: any) {
    console.error('GET /mails error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * GET /api/hub/mails/:id
 * Charger un mail spécifique
 */
app.get('/mails/:id', async (c) => {
  try {
    const mailId = c.req.param('id');
    const mail = await hubMailService.getMailById(mailId);
    return c.json(mail, 200);
  } catch (error: any) {
    console.error('GET /mails/:id error:', error);
    return c.json({ error: error.message }, 404);
  }
});

/**
 * PUT /api/hub/mails/:id
 * Mettre à jour un mail (statut, notes, client)
 */
app.put('/mails/:id', async (c) => {
  try {
    const mailId = c.req.param('id');
    const body = await c.req.json();

    const mail = await hubMailService.updateMail(mailId, {
      traitementStatus: body.traitementStatus as MailTraitementStatus,
      processingNotes: body.processingNotes,
      clientId: body.clientId,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
    });

    return c.json(mail, 200);
  } catch (error: any) {
    console.error('PUT /mails/:id error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * POST /api/hub/mails/:id/notes
 * Ajouter une note
 */
app.post('/mails/:id/notes', async (c) => {
  try {
    const mailId = c.req.param('id');
    const { content, createdBy, createdByName } = await c.req.json();

    const note = await hubMailService.addNote(mailId, content, createdBy, createdByName);
    return c.json(note, 201);
  } catch (error: any) {
    console.error('POST /mails/:id/notes error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * DELETE /api/hub/mails/:id/notes/:noteId
 * Supprimer une note
 */
app.delete('/mails/:id/notes/:noteId', async (c) => {
  try {
    const mailId = c.req.param('id');
    const noteId = c.req.param('noteId');

    const result = await hubMailService.deleteNote(mailId, noteId);
    return c.json(result, 200);
  } catch (error: any) {
    console.error('DELETE /mails/:id/notes/:noteId error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * POST /api/hub/mails/:id/reply
 * Envoyer une réponse
 */
app.post('/mails/:id/reply', async (c) => {
  try {
    const mailId = c.req.param('id');
    const { to, subject, body, cc } = await c.req.json();

    const reply = await hubMailService.sendReply(mailId, to, subject, body, cc);
    return c.json(reply, 201);
  } catch (error: any) {
    console.error('POST /mails/:id/reply error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * POST /api/hub/mails/search
 * Rechercher des mails
 */
app.post('/mails/search', async (c) => {
  try {
    const { query, tab, limit } = await c.req.json();

    const results = await hubMailService.searchMails(query, tab as HubTab, limit || 50);
    return c.json(results, 200);
  } catch (error: any) {
    console.error('POST /mails/search error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * GET /api/hub/stats
 * Récupérer les statistiques
 */
app.get('/stats', async (c) => {
  try {
    const stats = await hubMailService.getStats();
    return c.json(stats, 200);
  } catch (error: any) {
    console.error('GET /stats error:', error);
    return c.json({ error: error.message }, 400);
  }
});

// ============= CALLS ROUTES =============

/**
 * GET /api/hub/calls?status=pending&limit=50
 * Charger les appels à traiter
 */
app.get('/calls', async (c) => {
  try {
    const status = c.req.query('status') as 'pending' | 'in_progress' | 'completed' | undefined;
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const skip = parseInt(c.req.query('skip') || '0', 10);

    const result = await hubCallsService.getCallsToHandle(status, limit, skip);
    return c.json(result, 200);
  } catch (error: any) {
    console.error('GET /calls error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * GET /api/hub/calls/:id
 * Charger un appel spécifique
 */
app.get('/calls/:id', async (c) => {
  try {
    const callId = c.req.param('id');
    const call = await hubCallsService.getCallById(callId);
    return c.json(call, 200);
  } catch (error: any) {
    console.error('GET /calls/:id error:', error);
    return c.json({ error: error.message }, 404);
  }
});

/**
 * POST /api/hub/calls
 * Créer un nouvel appel
 */
app.post('/calls', async (c) => {
  try {
    const callData = await c.req.json();

    const newCall = await hubCallsService.createCall(callData);
    return c.json(newCall, 201);
  } catch (error: any) {
    console.error('POST /calls error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * PUT /api/hub/calls/:id
 * Mettre à jour un appel
 */
app.put('/calls/:id', async (c) => {
  try {
    const callId = c.req.param('id');
    const updates = await c.req.json();

    const updatedCall = await hubCallsService.updateCall(callId, updates);
    return c.json(updatedCall, 200);
  } catch (error: any) {
    console.error('PUT /calls/:id error:', error);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * POST /api/hub/calls/:id/complete
 * Marquer un appel comme complété
 */
app.post('/calls/:id/complete', async (c) => {
  try {
    const callId = c.req.param('id');
    const call = await hubCallsService.completeCall(callId);
    return c.json(call, 200);
  } catch (error: any) {
    console.error('POST /calls/:id/complete error:', error);
    return c.json({ error: error.message }, 400);
  }
});

export default app;
