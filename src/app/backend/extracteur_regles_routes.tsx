import type { Hono } from "npm:hono";
import * as extracteurRegles from "./extracteur_regles.tsx";

export function setupExtracteurReglesRoutes(app: Hono) {
  app.post("/make-server-cac859af/extracteur-regles/run", async (c) => {
    try {
      const result = await extracteurRegles.extraireToutesLesRegles();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/extracteur-regles/regles", async (c) => {
    try {
      const query = c.req.query('q');
      const statut = c.req.query('statut');
      const source = c.req.query('source');
      const regles = await extracteurRegles.searchRegles(query, statut, source);
      return c.json({ success: true, count: regles.length, query, statut, source, regles });
    } catch (error) {
      console.error('❌ Erreur recherche règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/extracteur-regles/stats", async (c) => {
    try {
      const stats = await extracteurRegles.getExtractionStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats extraction:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.put("/make-server-cac859af/extracteur-regles/regles/:regleId/statut", async (c) => {
    try {
      const regleId = c.req.param('regleId');
      const body = await c.req.json();
      const { statut } = body;
      if (!statut || !['validé', 'en_attente', 'à_réviser'].includes(statut)) {
        return c.json({ success: false, error: 'Statut invalide' }, 400);
      }
      const result = await extracteurRegles.updateStatutValidation(regleId, statut);
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.delete("/make-server-cac859af/extracteur-regles/regles", async (c) => {
    try {
      const result = await extracteurRegles.deleteAllRegles();
      return c.json({ success: true, deleted: result.deleted });
    } catch (error) {
      console.error('❌ Erreur suppression règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
