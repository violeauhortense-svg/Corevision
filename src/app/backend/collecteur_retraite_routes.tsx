import type { Hono } from "npm:hono";
import * as collecteurRetraite from "./collecteur_retraite.tsx";
import * as parserRetraite from "./parser_retraite.tsx";
import * as extracteurReglesRetraite from "./extracteur_regles_retraite.tsx";

export function setupCollecteurRetraiteRoutes(app: Hono) {
  app.post("/make-server-cac859af/collecteur-retraite/run", async (c) => {
    try {
      const result = await collecteurRetraite.collecterDocumentsRetraite();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur collecte retraite:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/collecteur-retraite/documents", async (c) => {
    try {
      const documents = await collecteurRetraite.getDocumentsRetraite();
      return c.json({ success: true, count: documents.length, documents });
    } catch (error) {
      console.error('❌ Erreur récupération documents:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/parser-retraite/run", async (c) => {
    try {
      const result = await parserRetraite.parserDocumentsRetraite();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur parsing retraite:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/parser-retraite/sections", async (c) => {
    try {
      const sections = await parserRetraite.getSectionsRetraite();
      return c.json({ success: true, count: sections.length, sections });
    } catch (error) {
      console.error('❌ Erreur récupération sections:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/extracteur-regles-retraite/run", async (c) => {
    try {
      const result = await extracteurReglesRetraite.extraireReglesRetraite();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur extraction règles retraite:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/extracteur-regles-retraite/regles", async (c) => {
    try {
      const regles = await extracteurReglesRetraite.getReglesRetraite();
      return c.json({ success: true, count: regles.length, regles });
    } catch (error) {
      console.error('❌ Erreur récupération règles:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/extracteur-regles-retraite/initialiser", async (c) => {
    try {
      const result = await extracteurReglesRetraite.initialiserReglesRetraite();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur initialisation règles retraite:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/extracteur-regles-retraite/stats", async (c) => {
    try {
      const stats = await extracteurReglesRetraite.getStatsReglesRetraite();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats règles retraite:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
