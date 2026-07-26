/**
 * 🧮 ROUTES API - CALCULS PATRIMONIAUX
 * 
 * Expose les calculs patrimoniaux via API REST
 */

import { Hono } from 'npm:hono';
import * as calculs from './calculs_patrimoniaux.tsx';

export function setupCalculRoutes(app: Hono) {
  const calculRoutes = new Hono();

  /**
   * POST /calculate/patrimoine
   * Calcule tous les indicateurs patrimoniaux
   */
  calculRoutes.post('/patrimoine', async (c) => {
    try {
      const body = await c.req.json();

      console.log('📊 Calcul patrimoine complet...');

      const input: calculs.CalculsPatrimoniauxInput = {
        actifsFinanciers: body.actifsFinanciers || [],
        actifsImmobiliers: body.actifsImmobiliers || [],
        passifs: body.passifs || [],
        revenus: body.revenus || [],
        imposition: body.imposition || { impotRevenu: 0, ifi: 0, tmi: 30 },
      };

      const resultats = calculs.calculerPatrimoineComplet(input);

      console.log('✅ Calculs effectués:', {
        patrimoineNet: resultats.patrimoineNet,
        scoreGlobal: resultats.scores.global,
      });

      return c.json({
        success: true,
        calculs: resultats,
      });
    } catch (error: any) {
      console.error('❌ Erreur calcul patrimoine:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors du calcul',
        },
        500
      );
    }
  });

  /**
   * POST /calculate/simulation
   * Simule l'évolution du patrimoine
   */
  calculRoutes.post('/simulation', async (c) => {
    try {
      const body = await c.req.json();

      console.log('📈 Simulation patrimoine...');

      const input: calculs.SimulationInput = {
        patrimoineInitial: body.patrimoineInitial || 0,
        revenusAnnuels: body.revenusAnnuels || 0,
        chargesAnnuelles: body.chargesAnnuelles || 0,
        tauxEpargne: body.tauxEpargne || 10,
        tauxRendement: body.tauxRendement || 3,
        dureeAnnees: body.dureeAnnees || 10,
      };

      const simulation = calculs.simulerPatrimoine(input);

      console.log('✅ Simulation effectuée:', {
        duree: input.dureeAnnees,
        patrimoneFinal: simulation.patrimoneFinal,
      });

      return c.json({
        success: true,
        simulation,
      });
    } catch (error: any) {
      console.error('❌ Erreur simulation:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors de la simulation',
        },
        500
      );
    }
  });

  /**
   * POST /calculate/problemes
   * Détecte les problèmes patrimoniaux
   */
  calculRoutes.post('/problemes', async (c) => {
    try {
      const body = await c.req.json();

      console.log('🔍 Détection problèmes...');

      // D'abord calculer le patrimoine complet
      const input: calculs.CalculsPatrimoniauxInput = {
        actifsFinanciers: body.actifsFinanciers || [],
        actifsImmobiliers: body.actifsImmobiliers || [],
        passifs: body.passifs || [],
        revenus: body.revenus || [],
        imposition: body.imposition || { impotRevenu: 0, ifi: 0, tmi: 30 },
      };

      const resultats = calculs.calculerPatrimoineComplet(input);
      const problemes = calculs.detecterProblemes(resultats);

      console.log(`✅ ${problemes.length} problème(s) détecté(s)`);

      return c.json({
        success: true,
        problemes,
        calculs: resultats, // Inclure aussi les calculs pour contexte
      });
    } catch (error: any) {
      console.error('❌ Erreur détection problèmes:', error);
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
   * POST /calculate/emprunt/crd
   * Calcule le capital restant dû d'un emprunt
   */
  calculRoutes.post('/emprunt/crd', async (c) => {
    try {
      const body = await c.req.json();

      const { capitalInitial, tauxAnnuel, nombreEcheances, dateDebut } = body;

      if (!capitalInitial || !tauxAnnuel || !nombreEcheances || !dateDebut) {
        return c.json(
          {
            success: false,
            error: 'Paramètres manquants',
          },
          400
        );
      }

      const crd = calculs.calculerCapitalRestantDu(
        capitalInitial,
        tauxAnnuel,
        nombreEcheances,
        dateDebut
      );

      return c.json({
        success: true,
        capitalRestantDu: crd,
      });
    } catch (error: any) {
      console.error('❌ Erreur calcul CRD:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors du calcul',
        },
        500
      );
    }
  });

  /**
   * POST /calculate/emprunt/mensualite
   * Calcule la mensualité d'un emprunt
   */
  calculRoutes.post('/emprunt/mensualite', async (c) => {
    try {
      const body = await c.req.json();

      const { capitalInitial, tauxAnnuel, nombreEcheances } = body;

      if (!capitalInitial || tauxAnnuel === undefined || !nombreEcheances) {
        return c.json(
          {
            success: false,
            error: 'Paramètres manquants',
          },
          400
        );
      }

      const mensualite = calculs.calculerMensualite(
        capitalInitial,
        tauxAnnuel,
        nombreEcheances
      );

      return c.json({
        success: true,
        mensualite,
      });
    } catch (error: any) {
      console.error('❌ Erreur calcul mensualité:', error);
      return c.json(
        {
          success: false,
          error: error.message || 'Erreur lors du calcul',
        },
        500
      );
    }
  });

  app.route('/calculate', calculRoutes);
}
