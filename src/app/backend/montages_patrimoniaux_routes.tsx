import type { Hono } from "npm:hono";
import * as montagesPatrimoniaux from "./montages_patrimoniaux.tsx";

export function setupMontagesPatrimoniauxRoutes(app: Hono) {
  app.post("/make-server-cac859af/montages-patrimoniaux", async (c) => {
    try {
      const body = await c.req.json();
      const result = await montagesPatrimoniaux.creerMontage(body);
      if (!result.success) return c.json(result, 400);
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur création montage:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/montages-patrimoniaux", async (c) => {
    try {
      const query = c.req.query('q');
      const objectif = c.req.query('objectif');
      const complexite = c.req.query('complexite');
      const statut = c.req.query('statut');
      const tagsParam = c.req.query('tags');
      const tags = tagsParam ? tagsParam.split(',') : undefined;
      const montages = await montagesPatrimoniaux.searchMontages(query, objectif, complexite, statut, tags);
      return c.json({ success: true, count: montages.length, filters: { query, objectif, complexite, statut, tags }, montages });
    } catch (error) {
      console.error('❌ Erreur recherche montages:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/montages-patrimoniaux/:montageId", async (c) => {
    try {
      const montageId = c.req.param('montageId');
      const montage = await montagesPatrimoniaux.getMontage(montageId);
      if (!montage) return c.json({ success: false, error: 'Montage non trouvé' }, 404);
      return c.json({ success: true, montage });
    } catch (error) {
      console.error('❌ Erreur récupération montage:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.put("/make-server-cac859af/montages-patrimoniaux/:montageId", async (c) => {
    try {
      const montageId = c.req.param('montageId');
      const body = await c.req.json();
      const result = await montagesPatrimoniaux.updateMontage(montageId, body);
      if (!result.success) return c.json(result, 400);
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur mise à jour montage:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.delete("/make-server-cac859af/montages-patrimoniaux/:montageId", async (c) => {
    try {
      const montageId = c.req.param('montageId');
      const result = await montagesPatrimoniaux.deleteMontage(montageId);
      if (!result.success) return c.json(result, 404);
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur suppression montage:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/montages-patrimoniaux-stats", async (c) => {
    try {
      const stats = await montagesPatrimoniaux.getMontagesStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats montages:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/montages-patrimoniaux-tags", async (c) => {
    try {
      const tags = await montagesPatrimoniaux.getAllTags();
      return c.json({ success: true, count: tags.length, tags });
    } catch (error) {
      console.error('❌ Erreur récupération tags:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/montages-patrimoniaux-import-exemple", async (c) => {
    try {
      const result = await montagesPatrimoniaux.importerMontages(montagesPatrimoniaux.MONTAGES_EXEMPLE);
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur import montages:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/montages-patrimoniaux-import", async (c) => {
    try {
      const body = await c.req.json();
      const { montages } = body;
      if (!montages || !Array.isArray(montages)) {
        return c.json({ success: false, error: 'Format invalide: attendu { montages: [...] }' }, 400);
      }
      const result = await montagesPatrimoniaux.importerMontages(montages);
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur import montages:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.delete("/make-server-cac859af/montages-patrimoniaux-all", async (c) => {
    try {
      const result = await montagesPatrimoniaux.deleteAllMontages();
      return c.json({ success: true, deleted: result.deleted });
    } catch (error) {
      console.error('❌ Erreur suppression montages:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
