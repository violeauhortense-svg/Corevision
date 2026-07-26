import type { Hono } from "npm:hono";
import * as auditPatrimonial from "./audit_patrimonial.tsx";
import * as kv from "./kv_store.tsx";

export function setupAuditPatrimonialRoutes(app: Hono) {
  app.post("/make-server-cac859af/audit-patrimonial/generer/:clientId", async (c) => {
    console.log('🎯 Génération d\'un audit patrimonial complet...');
    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json().catch(() => ({}));
      const { commandeId, clientData } = body;
      const audit = await auditPatrimonial.genererAuditComplet(clientId, commandeId, clientData);
      if (!audit) {
        return c.json({ success: false, error: 'Impossible de générer l\'audit', details: 'Le client n\'a pas été trouvé ou les données sont insuffisantes.' }, 400);
      }
      return c.json({ success: true, audit });
    } catch (error) {
      console.error('❌ Erreur génération audit:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined }, 500);
    }
  });

  app.get("/make-server-cac859af/audit-patrimonial/client/:clientId", async (c) => {
    console.log('📚 Récupération des audits d\'un client...');
    try {
      const clientId = c.req.param('clientId');
      const audits = await auditPatrimonial.getAuditsClient(clientId);
      return c.json({ success: true, count: audits.length, audits });
    } catch (error) {
      console.error('❌ Erreur récupération audits:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/audit-patrimonial/client/:clientId/rapport-live", async (c) => {
    console.log('📄 Génération rapport LIVE avec données actuelles...');
    try {
      const clientId = c.req.param('clientId');
      const allClients = await kv.getByPrefix('client:');
      const clientData = allClients.find((c: any) => c && c.id === clientId);
      if (!clientData) {
        return c.json({ success: false, error: 'Client non trouvé', debug: { searchedId: clientId, availableIds: allClients.slice(0, 10).map((c: any) => c?.id), totalClients: allClients.length } }, 404);
      }
      const rapport = await auditPatrimonial.genererRapportLive(clientId, clientData);
      if (!rapport) return c.json({ success: false, error: 'Impossible de générer le rapport' }, 500);
      return c.json({ success: true, rapport, clientName: clientData.nom || 'Client', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Erreur génération rapport live:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/audit-patrimonial/:auditId", async (c) => {
    console.log('🔍 Récupération d\'un audit patrimonial...');
    try {
      const auditId = c.req.param('auditId');
      const audit = await auditPatrimonial.getAudit(auditId);
      if (!audit) return c.json({ success: false, error: 'Audit non trouvé' }, 404);
      return c.json({ success: true, audit });
    } catch (error) {
      console.error('❌ Erreur récupération audit:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/audit-patrimonial/:auditId/valider", async (c) => {
    console.log('✅ Validation d\'un audit patrimonial...');
    try {
      const auditId = c.req.param('auditId');
      const success = await auditPatrimonial.validerAudit(auditId);
      if (!success) return c.json({ success: false, error: 'Audit non trouvé' }, 404);
      return c.json({ success: true, message: 'Audit validé avec succès' });
    } catch (error) {
      console.error('❌ Erreur validation audit:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.put("/make-server-cac859af/audit-patrimonial/:auditId", async (c) => {
    console.log('✏️ Modification d\'un audit patrimonial...');
    try {
      const auditId = c.req.param('auditId');
      const body = await c.req.json();
      const success = await auditPatrimonial.modifierAudit(auditId, body);
      if (!success) return c.json({ success: false, error: 'Audit non trouvé' }, 404);
      return c.json({ success: true, message: 'Audit modifié avec succès' });
    } catch (error) {
      console.error('❌ Erreur modification audit:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/rapport-patrimonial/:clientId", async (c) => {
    console.log('📊 Génération rapport PATRIMONIAL avec analyse avancée...');
    try {
      const clientId = c.req.param('clientId');
      const allClients = await kv.getByPrefix('client:');
      const clientData = allClients.find((c: any) => c && c.id === clientId);
      if (!clientData) {
        return c.json({ success: false, error: 'Client non trouvé', debug: { searchedId: clientId, availableIds: allClients.slice(0, 10).map((c: any) => c?.id), totalClients: allClients.length } }, 404);
      }
      const rapport = await auditPatrimonial.genererRapportLive(clientId, clientData);
      if (!rapport) return c.json({ success: false, error: 'Impossible de générer le rapport' }, 500);
      return c.json({ ...rapport, clientName: clientData.nom || 'Client', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Erreur génération rapport patrimonial:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error', details: error instanceof Error ? error.stack : undefined }, 500);
    }
  });

  app.post("/make-server-cac859af/rapport-patrimonial", async (c) => {
    console.log('📊 Génération rapport PATRIMONIAL (POST avec données client)...');
    try {
      const body = await c.req.json();
      const { clientId, clientData } = body;
      if (!clientId || !clientData) {
        return c.json({ success: false, error: 'clientId et clientData sont requis' }, 400);
      }
      const rapport = await auditPatrimonial.genererRapportLive(clientId, clientData);
      if (!rapport) return c.json({ success: false, error: 'Impossible de générer le rapport' }, 500);
      return c.json({ ...rapport, clientName: `${clientData.prenom || ''} ${clientData.nom || ''}`.trim(), timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Erreur génération rapport patrimonial:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error', details: error instanceof Error ? error.stack : String(error) }, 500);
    }
  });

  app.get("/make-server-cac859af/debug/clients", async (c) => {
    try {
      const allClients = await kv.getByPrefix('client:');
      return c.json({ success: true, totalClients: allClients.length, clients: allClients.map((client: any) => ({ id: client?.id, nom: client?.nom, prenom: client?.prenom, email: client?.email })) });
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  });
}
