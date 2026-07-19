/**
 * 🎯 ROUTES API - RECOMMANDATIONS INTELLIGENTES
 */

import { Hono } from 'npm:hono';
import * as recommandations from './recommandations.tsx';
import * as kv from './kv_store.tsx';
import { clientsStore } from './clients_store.tsx';

export function setupRecommandationsRoutes(app: Hono) {
  const recommandationsRoutes = new Hono();

  /**
   * POST /recommandations/generer/:clientId
   * Génère les recommandations pour un client
   */
  recommandationsRoutes.post('/generer/:clientId', async (c) => {
    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json().catch(() => ({}));
      
      
      // Récupérer les données client
      let clientData = body.clientData;
      
      if (!clientData) {
        // Chercher dans KV store
        clientData = await clientsStore.getClient(clientId);
        
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
      
      const rapport = recommandations.genererRecommandations(clientData);
      
      // Sauvegarder le rapport
      await kv.set(`recommandations:${clientId}:latest`, rapport);
      
      
      return c.json({
        success: true,
        rapport,
      });
    } catch (error: any) {
      console.error('❌ Erreur génération recommandations:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors de la génération',
        },
        500
      );
    }
  });

  /**
   * GET /recommandations/:clientId
   * Récupère le rapport de recommandations pour un client
   */
  recommandationsRoutes.get('/:clientId', async (c) => {
    try {
      const clientId = c.req.param('clientId');
      
      const rapport = await kv.get(`recommandations:${clientId}:latest`);
      
      if (!rapport) {
        return c.json(
          {
            success: false,
            error: 'Aucun rapport de recommandations trouvé',
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

  app.route('/make-server-cac859af/recommandations', recommandationsRoutes);
}
