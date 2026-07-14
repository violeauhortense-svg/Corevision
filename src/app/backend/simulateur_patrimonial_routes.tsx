import type { Hono } from "npm:hono";
import * as simulateurPatrimonial from "./simulateur_patrimonial.tsx";
import * as montagesPatrimoniaux from "./montages_patrimoniaux.tsx";

export function setupSimulateurPatrimonialRoutes(app: Hono) {
  app.post("/make-server-cac859af/simulateur-patrimonial/simuler", async (c) => {
    try {
      const body = await c.req.json();
      const { parametres, sauvegarder, clientId } = body;
      if (!parametres) return c.json({ success: false, error: 'Paramètres de simulation requis' }, 400);
      const simulation = await simulateurPatrimonial.simulerMontage(parametres);
      if (sauvegarder && clientId) {
        await simulateurPatrimonial.sauvegarderSimulation(clientId, simulation);
      }
      return c.json({ success: true, simulation });
    } catch (error) {
      console.error('❌ Erreur simulation:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/simulateur-patrimonial/comparer", async (c) => {
    try {
      const body = await c.req.json();
      const { scenarios } = body;
      if (!scenarios || !Array.isArray(scenarios)) {
        return c.json({ success: false, error: 'Scenarios requis (array de paramètres)' }, 400);
      }
      const comparaison = await simulateurPatrimonial.comparerScenarios(scenarios);
      return c.json({ success: true, comparaison });
    } catch (error) {
      console.error('❌ Erreur comparaison:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/simulateur-patrimonial/parametres-defaut/:montageId", async (c) => {
    try {
      const montageId = c.req.param('montageId');
      const capital = parseInt(c.req.query('capital') || '100000');
      const duree = parseInt(c.req.query('duree') || '10');
      const tranche = parseInt(c.req.query('tranche') || '30');
      const montage = await montagesPatrimoniaux.getMontage(montageId);
      if (!montage) return c.json({ success: false, error: 'Montage non trouvé' }, 404);
      const parametres = simulateurPatrimonial.genererParametresDefaut(montage, capital, duree, tranche);
      return c.json({ success: true, parametres });
    } catch (error) {
      console.error('❌ Erreur génération paramètres:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/simulateur-patrimonial/simulations/:clientId", async (c) => {
    try {
      const clientId = c.req.param('clientId');
      const simulations = await simulateurPatrimonial.getSimulationsClient(clientId);
      return c.json({ success: true, count: simulations.length, simulations });
    } catch (error) {
      console.error('❌ Erreur récupération simulations:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/simulateur-patrimonial/stats", async (c) => {
    try {
      const stats = await simulateurPatrimonial.getSimulateurStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats simulateur:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
