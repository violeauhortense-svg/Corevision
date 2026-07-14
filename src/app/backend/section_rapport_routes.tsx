/**
 * ============================================
 * ROUTES - GÉNÉRATION PROGRESSIVE DES SECTIONS
 * ============================================
 * 
 * Permet de générer section par section au lieu d'un rapport complet
 * Résout les problèmes de timeout et donne plus de contrôle
 */

export function setupSectionRapportRoutes(app: any) {
  
  // Générer une section individuelle du rapport
  app.post("/make-server-cac859af/generer-section-rapport", async (c: any) => {
    console.log('📊 Génération section individuelle du rapport...');
    
    try {
      const body = await c.req.json();
      const { clientId, clientData, sectionKey, prompt, donneesContexte } = body;
      
      if (!clientId || !sectionKey || !prompt) {
        return c.json({ 
          success: false, 
          error: 'clientId, sectionKey et prompt sont requis' 
        }, 400);
      }
      
      console.log(`🎯 Section à générer: ${sectionKey}`);
      console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
      
      // Préparer le contexte pour l'IA
      const contexteComplet = `
DONNÉES CLIENT:
- Nom: ${clientData?.nom || 'N/A'} ${clientData?.prenom || ''}
- Situation familiale: ${donneesContexte?.foyer?.situationFamiliale || 'N/A'}
- Régime matrimonial: ${donneesContexte?.foyer?.regimeMatrimonial || 'N/A'}
- Nombre d'enfants: ${donneesContexte?.foyer?.nombreEnfants || 0}
- Revenus annuels: ${donneesContexte?.revenus?.total || 'N/A'}€
- Patrimoine total: ${donneesContexte?.patrimoine?.total || 'N/A'}€

OBJECTIFS:
${donneesContexte?.objectifs?.liste?.join('\n- ') || 'Non renseignés'}

INSTRUCTION:
${prompt}
      `.trim();
      
      // Appel à Mistral AI pour générer la section
      const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
      
      if (!mistralApiKey) {
        throw new Error('MISTRAL_API_KEY non configurée');
      }
      
      const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-small-latest', // Modèle léger et rapide
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en gestion de patrimoine. Tu rédiges des analyses patrimoniales professionnelles, précises et actionnables. Sois concis et factuel.'
            },
            {
              role: 'user',
              content: contexteComplet
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });
      
      if (!mistralResponse.ok) {
        const errorText = await mistralResponse.text();
        console.error('❌ Erreur Mistral API:', errorText);
        throw new Error(`Erreur Mistral: ${mistralResponse.status} - ${errorText}`);
      }
      
      const mistralData = await mistralResponse.json();
      const contenu = mistralData.choices[0]?.message?.content || '';
      
      console.log(`✅ Section ${sectionKey} générée (${contenu.length} caractères)`);
      
      return c.json({
        success: true,
        contenu,
        sectionKey,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erreur génération section:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la génération',
        details: error instanceof Error ? error.stack : String(error)
      }, 500);
    }
  });
  
}
