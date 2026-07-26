import type { Hono } from "npm:hono";
import * as collecteurJuridique from "./collecteur_juridique.tsx";
import * as reglesFiscalesDb from "./regles_fiscales_db.tsx";
import * as generateurMontages from "./generateur_montages.tsx";
import { MONTAGES_60_PROFESSIONNELS } from "./montages_60_patrimoniaux.tsx";

export function setupCollecteurJuridiqueRoutes(app: Hono) {
  app.post("/make-server-cac859af/collecte-juridique/run", async (c) => {
    console.log('🚀 Lancement manuel de la collecte juridique...');
    try {
      const result = await collecteurJuridique.runCollecte();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur lors de la collecte:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/collecte-juridique/documents", async (c) => {
    console.log('📚 Récupération des documents juridiques...');
    try {
      const source = c.req.query('source');
      const documents = await collecteurJuridique.searchDocuments(undefined, source);
      return c.json({ success: true, count: documents.length, documents });
    } catch (error) {
      console.error('❌ Erreur récupération documents:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/collecte-juridique/search", async (c) => {
    console.log('🔍 Recherche de documents juridiques...');
    try {
      const query = c.req.query('q') || '';
      const source = c.req.query('source');
      const documents = await collecteurJuridique.searchDocuments(query, source);
      return c.json({ success: true, count: documents.length, query, source, documents });
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/collecte-juridique/stats", async (c) => {
    console.log('📊 Récupération des stats de collecte...');
    try {
      const stats = await collecteurJuridique.getCollecteStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/collecte-juridique/regles", async (c) => {
    console.log('📋 Récupération des règles collectées...');
    try {
      const regles = await collecteurJuridique.getReglesCollectees();
      return c.json({ success: true, regles, total: regles.length });
    } catch (error) {
      console.error('❌ Erreur récupération règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/regles/toutes", async (c) => {
    console.log('📋 Récupération de TOUTES les règles (statiques + collectées)...');
    try {
      const reglesStatiques = await reglesFiscalesDb.getToutesRegles();
      const reglesCollectees = await collecteurJuridique.getReglesCollectees();
      const toutesRegles = [
        ...reglesStatiques.map(r => ({ ...r, type_source: 'statique' })),
        ...reglesCollectees.map(r => ({ ...r, type_source: 'collectée' }))
      ];
      return c.json({
        success: true, regles: toutesRegles, total: toutesRegles.length,
        statiques: reglesStatiques.length, collectees: reglesCollectees.length,
        debug_premiere_regle: reglesStatiques[0]
      });
    } catch (error) {
      console.error('❌ Erreur récupération toutes les règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/regles/initialiser", async (c) => {
    console.log('🚀 Initialisation des 110 règles fiscales...');
    try {
      const result = await reglesFiscalesDb.initialiserReglesFiscales();
      return c.json({ success: true, message: `${result.count} règles fiscales initialisées avec succès`, count: result.count });
    } catch (error) {
      console.error('❌ Erreur initialisation règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error', details: error instanceof Error ? error.stack : String(error) }, 500);
    }
  });

  app.post("/make-server-cac859af/montages/generer", async (c) => {
    console.log('🏗️ Génération automatique des montages patrimoniaux...');
    try {
      const result = await generateurMontages.genererMontagesAutomatiques();
      return c.json({ success: result.success, montages_generes: result.montages_generes, montages: result.montages, errors: result.errors });
    } catch (error) {
      console.error('❌ Erreur génération montages:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/montages/collectes", async (c) => {
    console.log('📋 Récupération des montages collectés...');
    try {
      const montages = await generateurMontages.getMontagesCollectes();
      return c.json({ success: true, montages, total: montages.length });
    } catch (error) {
      console.error('❌ Erreur récupération montages collectés:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/montages/tous", async (c) => {
    console.log('📋 Récupération de TOUS les montages (statiques + collectés)...');
    try {
      const montagesStatiques = MONTAGES_60_PROFESSIONNELS || [];
      const montagesCollectes = await generateurMontages.getMontagesCollectes();
      const tousMontages = [
        ...montagesStatiques.map((m, index) => ({ ...m, id: m.nom_montage || `static_${index}`, type_source: 'statique', date_creation: new Date().toISOString(), date_modification: new Date().toISOString() })),
        ...montagesCollectes.map(m => ({ ...m, type_source: 'collecté' }))
      ];
      return c.json({ success: true, montages: tousMontages, total: tousMontages.length, statiques: montagesStatiques.length, collectes: montagesCollectes.length });
    } catch (error) {
      console.error('❌ Erreur récupération tous les montages:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/montages/stats", async (c) => {
    console.log('📊 Récupération des stats de génération...');
    try {
      const stats = await generateurMontages.getStatsGeneration();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur récupération stats génération:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
