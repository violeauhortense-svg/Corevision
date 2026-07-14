import type { Hono } from "npm:hono";
import * as reglesFiscalesDB from "./regles_fiscales_db.tsx";

export function setupReglesFiscalesRoutes(app: Hono) {
  app.post("/make-server-cac859af/regles-fiscales/initialiser", async (c) => {
    try {
      const result = await reglesFiscalesDB.initialiserReglesFiscales();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur initialisation règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/regles-fiscales", async (c) => {
    try {
      const regles = await reglesFiscalesDB.getToutesRegles();
      return c.json({ success: true, count: regles.length, regles });
    } catch (error) {
      console.error('❌ Erreur récupération règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/regles-fiscales/domaine/:domaine", async (c) => {
    try {
      const domaine = c.req.param('domaine');
      const regles = await reglesFiscalesDB.getReglesParDomaine(domaine as any);
      return c.json({ success: true, domaine, count: regles.length, regles });
    } catch (error) {
      console.error('❌ Erreur récupération règles par domaine:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/regles-fiscales/recherche/:query", async (c) => {
    try {
      const query = c.req.param('query');
      const regles = await reglesFiscalesDB.rechercherRegles(query);
      return c.json({ success: true, query, count: regles.length, regles });
    } catch (error) {
      console.error('❌ Erreur recherche règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/regles-fiscales/:id", async (c) => {
    try {
      const id = c.req.param('id');
      const regle = await reglesFiscalesDB.getRegleFiscale(id);
      if (!regle) return c.json({ success: false, error: 'Règle non trouvée' }, 404);
      return c.json({ success: true, regle });
    } catch (error) {
      console.error('❌ Erreur récupération règle:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/regles-fiscales", async (c) => {
    try {
      const body = await c.req.json();
      const regle = await reglesFiscalesDB.creerRegleFiscale(body);
      return c.json({ success: true, regle });
    } catch (error) {
      console.error('❌ Erreur création règle:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.put("/make-server-cac859af/regles-fiscales/:id", async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const regle = await reglesFiscalesDB.modifierRegleFiscale(id, body);
      if (!regle) return c.json({ success: false, error: 'Règle non trouvée' }, 404);
      return c.json({ success: true, regle });
    } catch (error) {
      console.error('❌ Erreur modification règle:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.delete("/make-server-cac859af/regles-fiscales/:id", async (c) => {
    try {
      const id = c.req.param('id');
      const success = await reglesFiscalesDB.supprimerRegleFiscale(id);
      if (!success) return c.json({ success: false, error: 'Règle non trouvée' }, 404);
      return c.json({ success: true, message: 'Règle supprimée avec succès' });
    } catch (error) {
      console.error('❌ Erreur suppression règle:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/regles-fiscales-stats", async (c) => {
    try {
      const stats = await reglesFiscalesDB.getStatistiquesRegles();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
