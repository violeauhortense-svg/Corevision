import type { Hono } from "npm:hono";
import * as moteurPatrimonialIA from "./moteur_patrimonial_ia.tsx";

export function setupMoteurPatrimonialIARoutes(app: Hono) {
  app.post("/make-server-cac859af/moteur-patrimonial-ia/analyser", async (c) => {
    console.log('🤖 Analyse patrimoniale IA...');
    try {
      const body = await c.req.json();
      const { profil, sauvegarder, clientId } = body;
      if (!profil) return c.json({ success: false, error: 'Profil client requis' }, 400);
      const analyse = await moteurPatrimonialIA.analyserProfilClient(profil);
      if (sauvegarder && clientId) {
        await moteurPatrimonialIA.sauvegarderAnalyse(clientId, analyse);
      }
      return c.json({ success: true, analyse });
    } catch (error) {
      console.error('❌ Erreur analyse patrimoniale:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/moteur-patrimonial-ia/analyses/:clientId", async (c) => {
    console.log('📚 Récupération des analyses d\'un client...');
    try {
      const clientId = c.req.param('clientId');
      const analyses = await moteurPatrimonialIA.getAnalysesClient(clientId);
      return c.json({ success: true, count: analyses.length, analyses });
    } catch (error) {
      console.error('❌ Erreur récupération analyses:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/moteur-patrimonial-ia/stats", async (c) => {
    console.log('📊 Récupération des stats du moteur...');
    try {
      const stats = await moteurPatrimonialIA.getMoteurStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats moteur:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
