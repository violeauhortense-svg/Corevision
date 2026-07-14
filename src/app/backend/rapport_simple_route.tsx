import { genererRapportSimple } from './rapport_simple.tsx';

/**
 * Route simplifiée pour générer un rapport patrimonial de base
 * Utilisée comme fallback ou pour le debugging
 */
export function setupRapportSimpleRoute(app: any) {
  
  // Route principale : Rapport simple
  app.post("/make-server-cac859af/rapport-patrimonial-simple", async (c: any) => {
    console.log('📊 Génération rapport PATRIMONIAL SIMPLIFIÉ...');
    
    try {
      const body = await c.req.json();
      const { clientId, clientData } = body;
      
      if (!clientId || !clientData) {
        console.error('❌ Données manquantes:', { hasClientId: !!clientId, hasClientData: !!clientData });
        return c.json({ 
          success: false, 
          error: 'clientId et clientData sont requis' 
        }, 400);
      }
      
      console.log(`✅ Données client reçues: ${clientData.nom || 'N/A'} ${clientData.prenom || ''}`);
      
      // Générer le rapport simplifié
      console.log('🔄 Appel de genererRapportSimple...');
      const rapport = await genererRapportSimple(clientId, clientData);
      
      if (!rapport) {
        console.error('❌ genererRapportSimple a retourné null');
        return c.json({ 
          success: false, 
          error: 'Impossible de générer le rapport simple' 
        }, 500);
      }
      
      console.log('✅ Rapport SIMPLE généré avec succès');
      
      return c.json({ 
        ...rapport,
        clientName: `${clientData.prenom || ''} ${clientData.nom || ''}`.trim(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur génération rapport simple - DÉTAILS:');
      console.error('  Type:', typeof error);
      console.error('  Message:', error instanceof Error ? error.message : String(error));
      console.error('  Stack:', error instanceof Error ? error.stack : 'No stack');
      
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la génération du rapport simple',
        details: error instanceof Error ? error.stack : String(error)
      }, 500);
    }
  });
  
  console.log('✅ Rapport simple route loaded');
}
