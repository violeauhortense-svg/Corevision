import type { Hono } from "npm:hono";
import * as indexIA from "./index_ia.tsx";

export function setupIndexIARoutes(app: Hono) {
  app.get("/make-server-cac859af/index-ia/test-config", async (c) => {
    try {
      const result = await indexIA.testerConfigurationOpenAI();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur test config:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/index-ia/run", async (c) => {
    try {
      const result = await indexIA.indexerToutesLesRegles();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur lors de l\'indexation:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/index-ia/search", async (c) => {
    try {
      const body = await c.req.json();
      const { query, limit, seuil } = body;
      if (!query) return c.json({ success: false, error: 'Query requise' }, 400);
      const resultats = await indexIA.rechercherRegles(query, limit || 10, seuil || 0.5);
      return c.json({ success: true, count: resultats.length, query, resultats });
    } catch (error) {
      console.error('❌ Erreur recherche sémantique:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/index-ia/assistant", async (c) => {
    try {
      const body = await c.req.json();
      const { question, contexte, limit } = body;
      if (!question) return c.json({ success: false, error: 'Question requise' }, 400);
      const resultats = await indexIA.rechercherPourAssistant(question, contexte, limit || 5);
      return c.json({ success: true, ...resultats });
    } catch (error) {
      console.error('❌ Erreur recherche assistant:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/index-ia/similaires/:regleId", async (c) => {
    try {
      const regleId = c.req.param('regleId');
      const limit = parseInt(c.req.query('limit') || '5');
      const resultats = await indexIA.trouverReglesSimilaires(regleId, limit);
      return c.json({ success: true, count: resultats.length, regle_id: regleId, resultats });
    } catch (error) {
      console.error('❌ Erreur recherche similaires:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/index-ia/stats", async (c) => {
    try {
      const stats = await indexIA.getIndexationStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats indexation:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.delete("/make-server-cac859af/index-ia/vecteurs", async (c) => {
    try {
      const result = await indexIA.deleteAllVecteurs();
      return c.json({ success: true, deleted: result.deleted });
    } catch (error) {
      console.error('❌ Erreur suppression vecteurs:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
