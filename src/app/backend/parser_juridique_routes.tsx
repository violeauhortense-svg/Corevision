import type { Hono } from "npm:hono";
import * as parserJuridique from "./parser_juridique.tsx";

export function setupParserJuridiqueRoutes(app: Hono) {
  app.post("/make-server-cac859af/parser-juridique/run", async (c) => {
    try {
      const result = await parserJuridique.parserTousLesDocuments();
      return c.json(result);
    } catch (error) {
      console.error('❌ Erreur lors du parsing:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/parser-juridique/chunks", async (c) => {
    try {
      const query = c.req.query('q');
      const sujet = c.req.query('sujet');
      const source = c.req.query('source');
      const chunks = await parserJuridique.searchChunks(query, sujet, source);
      return c.json({ success: true, count: chunks.length, query, sujet, source, chunks });
    } catch (error) {
      console.error('❌ Erreur recherche chunks:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/parser-juridique/stats", async (c) => {
    try {
      const stats = await parserJuridique.getParsingStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('❌ Erreur stats parsing:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.get("/make-server-cac859af/parser-juridique/sujets", async (c) => {
    try {
      const sujets = await parserJuridique.getSujetsUniques();
      return c.json({ success: true, sujets });
    } catch (error) {
      console.error('❌ Erreur récupération sujets:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });

  app.delete("/make-server-cac859af/parser-juridique/chunks", async (c) => {
    try {
      const result = await parserJuridique.deleteAllChunks();
      return c.json({ success: true, deleted: result.deleted });
    } catch (error) {
      console.error('❌ Erreur suppression chunks:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });
}
