/**
 * 🔍 ROUTES API - GESTION DES INCOHÉRENCES
 */

import { Hono } from 'npm:hono';
import * as incoherences from './incoherences.tsx';
import * as kv from './kv_store.tsx';

export function setupIncoherencesRoutes(app: Hono) {
  const incoherencesRoutes = new Hono();

  /**
   * POST /incoherences/detecter/:clientId
   * Détecte toutes les incohérences pour un client
   */
  incoherencesRoutes.post('/detecter/:clientId', async (c) => {
    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json().catch(() => ({}));
      
      console.log(`🔍 Détection incohérences client ${clientId}`);
      
      // Récupérer les données client
      let clientData = body.clientData;
      
      if (!clientData) {
        // Chercher dans KV store
        const allClients = await kv.getByPrefix('client:');
        clientData = allClients.find((c: any) => c.id === clientId);
        
        if (!clientData) {
          return c.json(
            {
              success: false,
              error: 'Client non trouvé',
            },
            404
          );
        }
      }
      
      const rapport = incoherences.detecterIncoherences(clientData);
      
      // Sauvegarder le rapport
      await kv.set(`incoherences:${clientId}:latest`, rapport);
      
      console.log(`✅ ${rapport.totalIncoherences} incohérence(s) détectée(s)`);
      
      return c.json({
        success: true,
        rapport,
      });
    } catch (error: any) {
      console.error('❌ Erreur détection incohérences:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors de la détection',
        },
        500
      );
    }
  });

  /**
   * GET /incoherences/:clientId
   * Récupère le rapport d'incohérences pour un client
   */
  incoherencesRoutes.get('/:clientId', async (c) => {
    try {
      const clientId = c.req.param('clientId');
      
      const rapport = await kv.get(`incoherences:${clientId}:latest`);
      
      if (!rapport) {
        return c.json(
          {
            success: false,
            error: 'Aucun rapport d\'incohérences trouvé',
          },
          404
        );
      }
      
      return c.json({
        success: true,
        rapport,
      });
    } catch (error: any) {
      console.error('❌ Erreur récupération rapport:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors de la récupération',
        },
        500
      );
    }
  });

  /**
   * PUT /incoherences/:clientId/:incoherenceId/valider
   * Valide une incohérence
   */
  incoherencesRoutes.put('/:clientId/:incoherenceId/valider', async (c) => {
    try {
      const clientId = c.req.param('clientId');
      const incoherenceId = c.req.param('incoherenceId');
      const body = await c.req.json();
      
      const { utilisateur, commentaire } = body;
      
      // Récupérer le rapport
      let rapport = await kv.get(`incoherences:${clientId}:latest`);
      
      if (!rapport) {
        return c.json(
          {
            success: false,
            error: 'Rapport non trouvé',
          },
          404
        );
      }
      
      // Valider l'incohérence
      rapport = incoherences.validerIncoherence(
        rapport,
        incoherenceId,
        utilisateur,
        commentaire
      );
      
      // Sauvegarder
      await kv.set(`incoherences:${clientId}:latest`, rapport);
      
      console.log(`✅ Incohérence ${incoherenceId} validée`);
      
      return c.json({
        success: true,
        rapport,
      });
    } catch (error: any) {
      console.error('❌ Erreur validation:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors de la validation',
        },
        500
      );
    }
  });

  /**
   * PUT /incoherences/:clientId/:incoherenceId/ignorer
   * Ignore une incohérence
   */
  incoherencesRoutes.put('/:clientId/:incoherenceId/ignorer', async (c) => {
    try {
      const clientId = c.req.param('clientId');
      const incoherenceId = c.req.param('incoherenceId');
      const body = await c.req.json();
      
      const { utilisateur, raison } = body;
      
      if (!raison) {
        return c.json(
          {
            success: false,
            error: 'La raison est obligatoire',
          },
          400
        );
      }
      
      // Récupérer le rapport
      let rapport = await kv.get(`incoherences:${clientId}:latest`);
      
      if (!rapport) {
        return c.json(
          {
            success: false,
            error: 'Rapport non trouvé',
          },
          404
        );
      }
      
      // Ignorer l'incohérence
      rapport = incoherences.ignorerIncoherence(
        rapport,
        incoherenceId,
        utilisateur,
        raison
      );
      
      // Sauvegarder
      await kv.set(`incoherences:${clientId}:latest`, rapport);
      
      console.log(`⏭️ Incohérence ${incoherenceId} ignorée`);
      
      return c.json({
        success: true,
        rapport,
      });
    } catch (error: any) {
      console.error('❌ Erreur ignorer:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors de l\'ignore',
        },
        500
      );
    }
  });

  /**
   * PUT /incoherences/:clientId/:incoherenceId/corriger
   * Marque une incohérence comme corrigée
   */
  incoherencesRoutes.put('/:clientId/:incoherenceId/corriger', async (c) => {
    try {
      const clientId = c.req.param('clientId');
      const incoherenceId = c.req.param('incoherenceId');
      const body = await c.req.json();
      
      const { utilisateur, commentaire } = body;
      
      // Récupérer le rapport
      let rapport = await kv.get(`incoherences:${clientId}:latest`);
      
      if (!rapport) {
        return c.json(
          {
            success: false,
            error: 'Rapport non trouvé',
          },
          404
        );
      }
      
      // Marquer comme corrigée
      rapport = incoherences.marquerCorrigee(
        rapport,
        incoherenceId,
        utilisateur,
        commentaire
      );
      
      // Sauvegarder
      await kv.set(`incoherences:${clientId}:latest`, rapport);
      
      console.log(`🔧 Incohérence ${incoherenceId} corrigée`);
      
      return c.json({
        success: true,
        rapport,
      });
    } catch (error: any) {
      console.error('❌ Erreur correction:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors de la correction',
        },
        500
      );
    }
  });

  app.route('/make-server-cac859af/incoherences', incoherencesRoutes);
}
