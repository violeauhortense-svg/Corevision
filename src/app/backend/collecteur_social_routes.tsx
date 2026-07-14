import type { Hono } from "npm:hono";
import * as collecteurSocial from "./collecteur_social.tsx";
import * as parserSocial from "./parser_social.tsx";
import * as extracteurReglesSociales from "./extracteur_regles_sociales.tsx";

export function setupCollecteurSocialRoutes(app: Hono) {
  app.post("/make-server-cac859af/collecteur-social/run", async (c) => {
    try {
      const result = await collecteurSocial.collecterDocumentsURSSAF();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur collecte URSSAF:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/collecteur-social/documents", async (c) => {
    try {
      const documents = await collecteurSocial.getTousLesDocumentsSociaux();
      return c.json({ success: true, count: documents.length, documents });
    } catch (error) {
      console.error('❌ Erreur récupération documents:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/collecteur-social/stats", async (c) => {
    try {
      const stats = await collecteurSocial.getStatsCollecteSociale();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats collecte:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/parser-social/run", async (c) => {
    try {
      const result = await parserSocial.parserTousLesDocumentsSociaux();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur parsing social:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/parser-social/sections", async (c) => {
    try {
      const sections = await parserSocial.getToutesLesSectionsSociales();
      return c.json({ success: true, count: sections.length, sections });
    } catch (error) {
      console.error('❌ Erreur récupération sections:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/extracteur-regles-sociales/run", async (c) => {
    try {
      const result = await extracteurReglesSociales.extraireReglesSociales();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur extraction règles sociales:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/extracteur-regles-sociales/regles", async (c) => {
    try {
      const regles = await extracteurReglesSociales.getToutesLesReglesSociales();
      return c.json({ success: true, count: regles.length, regles });
    } catch (error) {
      console.error('❌ Erreur récupération règles sociales:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.post("/make-server-cac859af/extracteur-regles-sociales/initialiser", async (c) => {
    try {
      const result = await extracteurReglesSociales.initialiserReglesSocialesStatiques();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur initialisation règles sociales:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
