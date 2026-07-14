/**
 * Route de test simplifiée pour le rapport patrimonial
 * Permet de tester étape par étape sans bloquer sur les erreurs
 */

export function setupRapportPatrimonialTestRoutes(app: any, auditPatrimonial: any) {
  
  // Route de test : Vérifier que les données arrivent correctement
  app.post("/make-server-cac859af/rapport-patrimonial-test-data", async (c: any) => {
    
    try {
      const body = await c.req.json();
      const { clientId, clientData } = body;
      
        hasClientId: !!clientId,
        clientId: clientId,
        hasClientData: !!clientData,
        clientDataKeys: clientData ? Object.keys(clientData) : [],
        clientData: JSON.stringify(clientData, null, 2)
      });
      
      return c.json({
        success: true,
        message: 'Données reçues avec succès',
        received: {
          clientId,
          clientData
        }
      });
    } catch (error) {
      console.error('❌ Erreur test données:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });
  
  // Route de test : Tester uniquement la collecte de données
  app.post("/make-server-cac859af/rapport-patrimonial-test-collecte", async (c: any) => {
    
    try {
      const body = await c.req.json();
      const { clientId, clientData } = body;
      
      const donnees = await auditPatrimonial.collecterDonneesClient(clientId, clientData);
      
      if (!donnees) {
        return c.json({
          success: false,
          error: 'collecterDonneesClient a retourné null'
        }, 500);
      }
      
      return c.json({
        success: true,
        message: 'Collecte réussie',
        donnees
      });
    } catch (error) {
      console.error('❌ Erreur test collecte:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  });
  
  // Route de test : Génération rapport minimal sans IA
  app.post("/make-server-cac859af/rapport-patrimonial-test-minimal", async (c: any) => {
    
    try {
      const body = await c.req.json();
      const { clientId, clientData } = body;
      
      // Rapport minimal de test
      const rapportMinimal = {
        success: true,
        client_id: clientId,
        client_name: `${clientData.prenom || ''} ${clientData.nom || ''}`.trim(),
        date_generation: new Date().toISOString(),
        situation_actuelle: {
          synthese: 'Rapport de test généré avec succès',
          donnees_cles: [
            { label: 'Test', valeur: 'OK', icon: 'Check' }
          ],
          graphiques: []
        },
        analyse_patrimoniale: {
          problemes_detectes: [],
          points_forts: ['Génération de rapport fonctionnelle'],
          recommendations_prioritaires: []
        },
        analyse_civile: {
          synthese: 'Test',
          points_cles: []
        },
        analyse_fiscale: {
          synthese: 'Test',
          points_cles: [],
          optimisations: []
        },
        analyse_sociale: {
          synthese: 'Test',
          points_cles: []
        },
        strategies: [],
        plan_action: {
          actions_immediates: [],
          actions_court_terme: [],
          actions_moyen_terme: []
        },
        preconisations: ['Test réussi'],
        score_global: 10
      };
      
      return c.json(rapportMinimal);
    } catch (error) {
      console.error('❌ Erreur test minimal:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });
}
