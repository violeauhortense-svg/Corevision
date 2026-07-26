// ============================================
// COMMUNICATIONS ROUTES (HUB) - Gestion des mails
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuth } from "./auth.tsx";

export function setupCommunicationsRoutes(app: Hono) {

  // ============================================
  // WEBHOOK: Recevoir les mails depuis Outlook via Make
  // ============================================
  app.post("/make-server-cac859af/communications/receive", async (c) => {
    console.log('📧 [COMMUNICATION] Mail reçu via webhook');

    try {
      const body = await c.req.json();
      const { from, to, subject, body: mailBody, attachments } = body;

      const commId = crypto.randomUUID();
      const communication = {
        id: commId,
        source: 'outlook' as const,
        category: 'en_attente' as const,
        status: 'à_traiter' as const,
        from,
        to,
        subject,
        body: mailBody,
        receivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: attachments || [],
        tags: []
      };

      const key = `communication:${commId}`;
      await kv.set(key, communication);
      console.log(`✅ [COMMUNICATION] Mail sauvegardé: ${commId}`);

      return c.json({ success: true, communicationId: commId });
    } catch (err) {
      console.error('❌ [COMMUNICATION] Erreur réception:', err);
      return c.json({ error: 'Erreur réception mail' }, 500);
    }
  });

  // ============================================
  // GET: Récupérer le Hub (groupé par catégorie)
  // ============================================
  app.get("/make-server-cac859af/communications/hub", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const allComms = await kv.getByPrefix('communication:');

      const hub = {
        conversation_client: allComms.filter(c => c.category === 'conversation_client'),
        interne: allComms.filter(c => c.category === 'interne'),
        archive: allComms.filter(c => c.category === 'archive'),
        en_attente: allComms.filter(c => c.category === 'en_attente'),
        stats: {
          totalReceived: allComms.length,
          unread: allComms.filter(c => c.status === 'à_traiter').length,
          toProcess: allComms.filter(c => c.status === 'à_traiter').length,
          processed: allComms.filter(c => c.status === 'traité').length,
          archived: allComms.filter(c => c.category === 'archive').length
        }
      };

      console.log(`✅ [COMMUNICATION] Hub chargé: ${allComms.length} mails`);
      return c.json({ hub });
    } catch (err) {
      console.error('❌ [COMMUNICATION] Erreur hub:', err);
      return c.json({ error: 'Erreur chargement hub' }, 500);
    }
  });

  // ============================================
  // PATCH: Assigner mail à un client (Interaction 1)
  // ============================================
  app.patch("/make-server-cac859af/communications/:commId/assign", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const commId = c.req.param('commId');
      const { clientId, clientName } = await c.req.json();

      const key = `communication:${commId}`;
      const comm = await kv.get(key);
      if (!comm) return c.json({ error: 'Communication introuvable' }, 404);

      // Assigner au client
      comm.clientId = clientId;
      comm.clientName = clientName;
      comm.category = 'conversation_client';
      comm.status = 'traité';
      comm.updatedAt = new Date().toISOString();

      await kv.set(key, comm);
      console.log(`✅ [COMMUNICATION] Mail assigné au client: ${clientName}`);

      return c.json({ success: true, communication: comm });
    } catch (err) {
      console.error('❌ [COMMUNICATION] Erreur assignation:', err);
      return c.json({ error: 'Erreur assignation' }, 500);
    }
  });

  // ============================================
  // PATCH: Archiver mail et l'ajouter à l'historique client (Interaction 2)
  // ============================================
  app.patch("/make-server-cac859af/communications/:commId/archive", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const commId = c.req.param('commId');
      const { clientId } = await c.req.json();

      const key = `communication:${commId}`;
      const comm = await kv.get(key);
      if (!comm) return c.json({ error: 'Communication introuvable' }, 404);

      // Archiver le mail
      comm.category = 'archive';
      comm.status = 'terminé';
      comm.archivedAt = new Date().toISOString();
      comm.archivedInClientHistoryAt = new Date().toISOString();
      comm.updatedAt = new Date().toISOString();

      await kv.set(key, comm);

      // Ajouter à l'historique du client
      if (clientId) {
        const clientKey = `client:${user.id}:${clientId}`;
        const client = await kv.get(clientKey);
        if (client) {
          if (!client.historique) client.historique = {};
          if (!client.historique.mails) client.historique.mails = [];

          client.historique.mails.push({
            id: comm.id,
            from: comm.from,
            subject: comm.subject,
            archivedAt: comm.archivedInClientHistoryAt
          });

          await kv.set(clientKey, client);
          console.log(`✅ [COMMUNICATION] Mail archivé et ajouté à l'historique client`);
        }
      }

      return c.json({ success: true, communication: comm });
    } catch (err) {
      console.error('❌ [COMMUNICATION] Erreur archivage:', err);
      return c.json({ error: 'Erreur archivage' }, 500);
    }
  });

  // ============================================
  // PATCH: Marquer comme terminé
  // ============================================
  app.patch("/make-server-cac859af/communications/:commId/complete", async (c) => {
    const { user, error } = await verifyAuth(c.req);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const commId = c.req.param('commId');
      const key = `communication:${commId}`;
      const comm = await kv.get(key);

      if (!comm) return c.json({ error: 'Communication introuvable' }, 404);

      comm.status = 'terminé';
      comm.completedAt = new Date().toISOString();
      comm.updatedAt = new Date().toISOString();

      await kv.set(key, comm);
      console.log(`✅ [COMMUNICATION] Mail marqué comme terminé`);

      return c.json({ success: true, communication: comm });
    } catch (err) {
      console.error('❌ [COMMUNICATION] Erreur completion:', err);
      return c.json({ error: 'Erreur completion' }, 500);
    }
  });

  // ============================================
  // BRIDGE ENDPOINTS
  // ============================================

  // GET: Récupérer les mails en attente d'envoi (pour Outlook Bridge)
  app.get("/make-server-cac859af/communications/pending-send", async (c) => {
    // Note: Bridge n'utilise pas d'auth, trusted local endpoint
    try {
      const allComms = await kv.getByPrefix('communication:');
      const pending = allComms.filter(c => c.status === 'à_traiter' && c.category === 'interne' && c.source === 'manual');

      console.log(`📧 [BRIDGE] ${pending.length} mails en attente d'envoi`);
      return c.json({ communications: pending });
    } catch (err) {
      console.error('❌ [BRIDGE] Erreur pending-send:', err);
      return c.json({ error: 'Erreur' }, 500);
    }
  });

  // PATCH: Marquer un mail comme envoyé (appelé par Outlook Bridge)
  app.patch("/make-server-cac859af/communications/:commId/sent", async (c) => {
    try {
      const commId = c.req.param('commId');
      const key = `communication:${commId}`;
      const comm = await kv.get(key);

      if (!comm) return c.json({ error: 'Communication introuvable' }, 404);

      comm.status = 'traité';
      comm.updatedAt = new Date().toISOString();

      await kv.set(key, comm);
      console.log(`✅ [BRIDGE] Mail marqué comme envoyé`);

      return c.json({ success: true, communication: comm });
    } catch (err) {
      console.error('❌ [BRIDGE] Erreur sent:', err);
      return c.json({ error: 'Erreur' }, 500);
    }
  });

}
