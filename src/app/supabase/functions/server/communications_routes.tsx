// ============================================
// COMMUNICATIONS ROUTES (HUB) - Gestion des mails
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { verifyAuth } from "./auth.tsx";
import { Client } from "npm:pg";

// Initialize PostgreSQL client
const databaseUrl = Deno.env.get('DATABASE_URL');
let postgres: Client | null = null;
let dbConnected = false;

async function ensureDbConnected() {
  if (!dbConnected && databaseUrl) {
    try {
      postgres = new Client(databaseUrl);
      await postgres.connect();
      dbConnected = true;
      console.log('✅ PostgreSQL connected for Hub Communication');
    } catch (err) {
      console.error('❌ PostgreSQL connection failed:', err);
      postgres = null;
    }
  }
}

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

  // ============================================
  // MIGRATION ENDPOINT - Import old KV mails to PostgreSQL
  // ============================================

  app.post("/api/hub/migrate", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      console.log('🔄 Starting migration from KV store to PostgreSQL...');

      // Get all mails from KV store
      const allComms = await kv.getByPrefix('communication:');
      console.log(`📧 Found ${allComms.length} mails in KV store`);

      let migratedCount = 0;
      let errors = 0;

      // Convert and insert each mail
      for (const comm of allComms) {
        try {
          // Convert KV communication to HubMail format
          const hubMail = {
            id: comm.id || `mail-${Date.now()}-${Math.random()}`,
            messageId: comm.id,
            threadId: null,
            from: comm.from || 'unknown@unknown.com',
            fromName: comm.from?.split('@')[0] || 'Unknown',
            to: Array.isArray(comm.to) ? comm.to : [comm.to || 'unknown@unknown.com'],
            subject: comm.subject || '(No subject)',
            body: comm.body || '',
            isHtml: false,
            bodyPreview: (comm.body || '').substring(0, 100),
            sentAt: comm.receivedAt || new Date().toISOString(),
            direction: 'received' as const,
            read: comm.status !== 'à_traiter',
            clientId: comm.clientId || null,
            clientName: comm.clientName || null,
            clientEmail: comm.clientEmail || comm.from || null,
            hubTab: comm.category === 'conversation_client' ? 'conversation_client' :
                   comm.category === 'archive' ? 'archive' :
                   'interne_externe',
            traitementStatus: comm.status === 'à_traiter' ? 'a_traiter' :
                            comm.status === 'traité' ? 'termine' :
                            'a_traiter',
            attachments: comm.attachments || [],
            notes: comm.notes ?
              [{ id: `note-${Date.now()}`, content: comm.notes, createdBy: 'system', createdByName: 'System', createdAt: new Date().toISOString() }]
              : [],
            createdAt: comm.receivedAt || new Date().toISOString(),
            updatedAt: comm.updatedAt || new Date().toISOString(),
            importedFrom: 'outlook'
          };

          // Check if mail already exists
          const existing = await postgres.queryObject(
            `SELECT id FROM hub_mails WHERE id = $1`,
            [hubMail.id]
          );

          if (existing.rows?.length === 0) {
            // Insert mail
            await postgres.queryObject(
              `INSERT INTO hub_mails (id, "messageId", "threadId", "from", "fromName", "to", subject, body, "isHtml", "bodyPreview", "sentAt", direction, read, "clientId", "clientName", "clientEmail", "hubTab", "traitementStatus", attachments, notes, "createdAt", "updatedAt", "importedFrom")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
              [
                hubMail.id, hubMail.messageId, hubMail.threadId, hubMail.from, hubMail.fromName,
                hubMail.to, hubMail.subject, hubMail.body, hubMail.isHtml, hubMail.bodyPreview,
                hubMail.sentAt, hubMail.direction, hubMail.read, hubMail.clientId, hubMail.clientName,
                hubMail.clientEmail, hubMail.hubTab, hubMail.traitementStatus,
                JSON.stringify(hubMail.attachments), JSON.stringify(hubMail.notes),
                hubMail.createdAt, hubMail.updatedAt, hubMail.importedFrom
              ]
            );
            migratedCount++;
          }
        } catch (err) {
          console.error(`❌ Error migrating mail ${comm.id}:`, err);
          errors++;
        }
      }

      console.log(`✅ Migration complete: ${migratedCount} mails imported, ${errors} errors`);

      return c.json({
        success: true,
        migratedCount,
        errors,
        message: `Migrated ${migratedCount} mails from KV store to PostgreSQL`
      });
    } catch (err: any) {
      console.error('❌ Migration error:', err);
      return c.json({ error: err.message }, 500);
    }
  });

  // ============================================
  // HUB MAIL ROUTES (PostgreSQL-based)
  // ============================================

  // GET /api/hub/mails - Load mails for a tab
  app.get("/api/hub/mails", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const tab = c.req.query('tab') || 'conversation_client';
      const limit = parseInt(c.req.query('limit') || '50', 10);
      const skip = parseInt(c.req.query('skip') || '0', 10);

      // Get mails for tab
      const mailsResult = await postgres.queryObject(
        `SELECT * FROM hub_mails WHERE "hubTab" = $1 ORDER BY "sentAt" DESC LIMIT $2 OFFSET $3`,
        [tab, limit, skip]
      );

      // Get total count
      const countResult = await postgres.queryObject(
        `SELECT COUNT(*) as count FROM hub_mails WHERE "hubTab" = $1`,
        [tab]
      );

      // Get stats
      const statsResult = await postgres.queryObject(
        `SELECT "hubTab", "traitementStatus", read FROM hub_mails`
      );

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

      if (statsResult.rows) {
        statsResult.rows.forEach((m: any) => {
          if (m.hubTab === 'conversation_client') stats.conversation_client++;
          if (m.hubTab === 'interne_externe') stats.interne_externe++;
          if (m.hubTab === 'archive') stats.archive++;
          if (m.traitementStatus === 'a_traiter') stats.a_traiter++;
          if (m.traitementStatus === 'en_cours') stats.en_cours++;
          if (m.traitementStatus === 'a_valider_gl') stats.a_valider_gl++;
          if (m.traitementStatus === 'valide_gl') stats.valide_gl++;
          if (!m.read) stats.unread++;
        });
      }

      const total = (countResult.rows?.[0] as any)?.count || 0;

      return c.json({ mails: mailsResult.rows, total, stats });
    } catch (err: any) {
      console.error('❌ GET /api/hub/mails error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // GET /api/hub/mails/:id - Get specific mail
  app.get("/api/hub/mails/:id", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const mailId = c.req.param('id');
      const result = await postgres.queryObject(
        `SELECT * FROM hub_mails WHERE id = $1`,
        [mailId]
      );

      const mail = result.rows?.[0];
      if (!mail) return c.json({ error: 'Mail not found' }, 404);

      return c.json(mail);
    } catch (err: any) {
      console.error('❌ GET /api/hub/mails/:id error:', err);
      return c.json({ error: err.message }, 404);
    }
  });

  // PUT /api/hub/mails/:id - Update mail
  app.put("/api/hub/mails/:id", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const mailId = c.req.param('id');
      const body = await c.req.json();

      const setClauses: string[] = ['"updatedAt" = NOW()'];
      const params: any[] = [];
      let paramCount = 1;

      if (body.traitementStatus) {
        setClauses.push(`"traitementStatus" = $${paramCount++}`);
        params.push(body.traitementStatus);
      }
      if (body.processingNotes !== undefined) {
        setClauses.push(`"processingNotes" = $${paramCount++}`);
        params.push(body.processingNotes);
      }
      if (body.clientId !== undefined) {
        setClauses.push(`"clientId" = $${paramCount++}`);
        params.push(body.clientId || null);
      }
      if (body.clientName !== undefined) {
        setClauses.push(`"clientName" = $${paramCount++}`);
        params.push(body.clientName || null);
      }
      if (body.clientEmail !== undefined) {
        setClauses.push(`"clientEmail" = $${paramCount++}`);
        params.push(body.clientEmail || null);
      }

      params.push(mailId);

      const query = `UPDATE hub_mails SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await postgres.queryObject(query, params);
      const mail = result.rows?.[0];

      if (!mail) return c.json({ error: 'Mail not found' }, 404);
      return c.json(mail);
    } catch (err: any) {
      console.error('❌ PUT /api/hub/mails/:id error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // POST /api/hub/mails/:id/notes - Add note
  app.post("/api/hub/mails/:id/notes", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const mailId = c.req.param('id');
      const { content, createdBy, createdByName } = await c.req.json();

      const newNote = {
        id: `note-${Date.now()}`,
        content,
        createdBy,
        createdByName,
        createdAt: new Date().toISOString(),
      };

      // Get existing notes
      const getResult = await postgres.queryObject(
        `SELECT notes FROM hub_mails WHERE id = $1`,
        [mailId]
      );

      const existingNotes = getResult.rows?.[0]?.notes || [];
      const updatedNotes = [...existingNotes, newNote];

      await postgres.queryObject(
        `UPDATE hub_mails SET notes = $1, "updatedAt" = NOW() WHERE id = $2`,
        [JSON.stringify(updatedNotes), mailId]
      );

      return c.json(newNote, 201);
    } catch (err: any) {
      console.error('❌ POST /api/hub/mails/:id/notes error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // DELETE /api/hub/mails/:id/notes/:noteId - Delete note
  app.delete("/api/hub/mails/:id/notes/:noteId", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const mailId = c.req.param('id');
      const noteId = c.req.param('noteId');

      const getResult = await postgres.queryObject(
        `SELECT notes FROM hub_mails WHERE id = $1`,
        [mailId]
      );

      const notes = getResult.rows?.[0]?.notes || [];
      const updatedNotes = notes.filter((n: any) => n.id !== noteId);

      await postgres.queryObject(
        `UPDATE hub_mails SET notes = $1, "updatedAt" = NOW() WHERE id = $2`,
        [JSON.stringify(updatedNotes), mailId]
      );

      return c.json({ success: true });
    } catch (err: any) {
      console.error('❌ DELETE /api/hub/mails/:id/notes/:noteId error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // POST /api/hub/mails/:id/reply - Send reply
  app.post("/api/hub/mails/:id/reply", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const mailId = c.req.param('id');
      const { to, subject, body, cc } = await c.req.json();

      // Update original mail status
      await postgres.queryObject(
        `UPDATE hub_mails SET "traitementStatus" = 'en_cours', "updatedAt" = NOW() WHERE id = $1`,
        [mailId]
      );

      // Create reply mail
      const replyId = `mail-${Date.now()}`;
      const now = new Date().toISOString();

      await postgres.queryObject(
        `INSERT INTO hub_mails (id, "from", "to", subject, body, "sentAt", direction, read, "hubTab", "traitementStatus", attachments, notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [replyId, 'contact@prudentia.fr', to, subject, body, now, 'sent', true, 'conversation_client', 'termine', '[]', '[]', now, now]
      );

      // Return updated original mail
      const result = await postgres.queryObject(
        `SELECT * FROM hub_mails WHERE id = $1`,
        [mailId]
      );

      return c.json(result.rows?.[0], 201);
    } catch (err: any) {
      console.error('❌ POST /api/hub/mails/:id/reply error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // POST /api/hub/mails/search - Search mails
  app.post("/api/hub/mails/search", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const { query, tab, limit } = await c.req.json();
      const searchLimit = limit || 50;
      const searchQuery = `%${query}%`;

      let sql = `SELECT * FROM hub_mails WHERE (subject ILIKE $1 OR body ILIKE $2 OR "from" ILIKE $3 OR "clientName" ILIKE $4)`;
      const params: any[] = [searchQuery, searchQuery, searchQuery, searchQuery];

      if (tab) {
        sql += ` AND "hubTab" = $5`;
        params.push(tab);
      }

      sql += ` LIMIT $${params.length + 1}`;
      params.push(searchLimit);

      const result = await postgres.queryObject(sql, params);
      return c.json(result.rows);
    } catch (err: any) {
      console.error('❌ POST /api/hub/mails/search error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // GET /api/hub/stats - Get statistics
  app.get("/api/hub/stats", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const result = await postgres.queryObject(
        `SELECT "hubTab", "traitementStatus", read FROM hub_mails`
      );

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

      result.rows?.forEach((m: any) => {
        if (m.hubTab === 'conversation_client') stats.conversation_client++;
        if (m.hubTab === 'interne_externe') stats.interne_externe++;
        if (m.hubTab === 'archive') stats.archive++;
        if (m.traitementStatus === 'a_traiter') stats.a_traiter++;
        if (m.traitementStatus === 'en_cours') stats.en_cours++;
        if (m.traitementStatus === 'a_valider_gl') stats.a_valider_gl++;
        if (m.traitementStatus === 'valide_gl') stats.valide_gl++;
        if (!m.read) stats.unread++;
      });

      return c.json(stats);
    } catch (err: any) {
      console.error('❌ GET /api/hub/stats error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // HUB CALLS ROUTES
  // GET /api/hub/calls - Get calls to handle
  app.get("/api/hub/calls", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const status = c.req.query('status');
      const limit = parseInt(c.req.query('limit') || '50', 10);
      const skip = parseInt(c.req.query('skip') || '0', 10);

      let sql = `SELECT * FROM hub_calls`;
      const params: any[] = [];

      if (status) {
        sql += ` WHERE status = $1`;
        params.push(status);
      } else {
        sql += ` WHERE status IN ('pending', 'in_progress')`;
      }

      // Get count
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
      const countResult = await postgres.queryObject(countSql, params);
      const total = (countResult.rows?.[0] as any)?.count || 0;

      // Get paginated results
      sql += ` ORDER BY "dueDate" ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, skip);

      const result = await postgres.queryObject(sql, params);
      return c.json({ calls: result.rows, total });
    } catch (err: any) {
      console.error('❌ GET /api/hub/calls error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // GET /api/hub/calls/:id - Get specific call
  app.get("/api/hub/calls/:id", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const callId = c.req.param('id');
      const result = await postgres.queryObject(
        `SELECT * FROM hub_calls WHERE id = $1`,
        [callId]
      );

      const call = result.rows?.[0];
      if (!call) return c.json({ error: 'Call not found' }, 404);

      return c.json(call);
    } catch (err: any) {
      console.error('❌ GET /api/hub/calls/:id error:', err);
      return c.json({ error: err.message }, 404);
    }
  });

  // POST /api/hub/calls - Create new call
  app.post("/api/hub/calls", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const body = await c.req.json();
      const callId = `call-${Date.now()}`;
      const now = new Date().toISOString();

      await postgres.queryObject(
        `INSERT INTO hub_calls (id, "clientId", "clientName", "clientPhone", "clientEmail", subject, reason, "dueDate", priority, status, "linkedMailId", notes, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [callId, body.clientId, body.clientName, body.clientPhone, body.clientEmail, body.subject, body.reason, body.dueDate, body.priority || 'normal', body.status || 'pending', body.linkedMailId, body.notes, now]
      );

      const result = await postgres.queryObject(
        `SELECT * FROM hub_calls WHERE id = $1`,
        [callId]
      );

      return c.json(result.rows?.[0], 201);
    } catch (err: any) {
      console.error('❌ POST /api/hub/calls error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // PUT /api/hub/calls/:id - Update call
  app.put("/api/hub/calls/:id", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const callId = c.req.param('id');
      const updates = await c.req.json();

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        setClauses.push(`"${key}" = $${paramCount++}`);
        params.push(value);
      });

      params.push(callId);

      const query = `UPDATE hub_calls SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await postgres.queryObject(query, params);

      return c.json(result.rows?.[0]);
    } catch (err: any) {
      console.error('❌ PUT /api/hub/calls/:id error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

  // POST /api/hub/calls/:id/complete - Mark call as completed
  app.post("/api/hub/calls/:id/complete", async (c) => {
    await ensureDbConnected();
    if (!dbConnected) return c.json({ error: 'Database not configured' }, 500);

    try {
      const callId = c.req.param('id');
      const now = new Date().toISOString();

      await postgres.queryObject(
        `UPDATE hub_calls SET status = 'completed', "completedAt" = $1 WHERE id = $2`,
        [now, callId]
      );

      const result = await postgres.queryObject(
        `SELECT * FROM hub_calls WHERE id = $1`,
        [callId]
      );

      return c.json(result.rows?.[0]);
    } catch (err: any) {
      console.error('❌ POST /api/hub/calls/:id/complete error:', err);
      return c.json({ error: err.message }, 400);
    }
  });

}
