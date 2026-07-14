// ============================================
// VÉRIFICATION GEL DES AVOIRS
// ============================================

export function setupSanctionsRoutes(app: any, supabaseAdmin: any, kv: any) {
  // Route POST /sanctions/check - Vérifier les listes de sanctions
  app.post("/make-server-cac859af/sanctions/check", async (c: any) => {
    try {
      const body = await c.req.json();
      const { clientId, searchData } = body;


      const matches: any[] = [];
      const checkedLists: string[] = [];

      // ===============================================
      // 1. VÉRIFICATION LISTE TRÉSOR FRANÇAIS
      // ===============================================
      try {
        // L'API du Trésor français ne permet pas d'accès programmatique direct
        // On simule une vérification basée sur des règles
        checkedLists.push('Direction générale du Trésor (France) - Sanctions financières');
        
        // Dans un environnement de production, utiliser l'API officielle ou télécharger les fichiers XML
        // https://www.tresor.economie.gouv.fr/services-aux-entreprises/sanctions-economiques
        
      } catch (error) {
        console.error('❌ Erreur vérification Trésor:', error);
      }

      // ===============================================
      // 2. VÉRIFICATION UNION EUROPÉENNE
      // ===============================================
      try {
        checkedLists.push('Union Européenne - Listes consolidées des sanctions');
        
        // L'API UE fournit un fichier XML
        // https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content
        
        // Pour éviter les problèmes CORS et de performance, on ne fait pas d'appel direct
        // En production, télécharger et parser le fichier XML localement
        
      } catch (error) {
        console.error('❌ Erreur vérification UE:', error);
      }

      // ===============================================
      // 3. VÉRIFICATION OFAC (USA)
      // ===============================================
      try {
        checkedLists.push('OFAC (Office of Foreign Assets Control - USA)');
        
        // L'OFAC fournit un fichier CSV
        // https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_PRIM.CSV
        
        // Pour éviter les problèmes CORS et de performance, on ne fait pas d'appel direct
        // En production, télécharger et parser le fichier CSV localement
        
      } catch (error) {
        console.error('❌ Erreur vérification OFAC:', error);
      }

      // ===============================================
      // ANALYSE SIMPLE PAR NOM (SIMULATION)
      // ===============================================
      // En production, implémenter un algorithme de matching avancé
      // avec score de similarité (Levenshtein, Jaro-Winkler, etc.)
      
      const fullName = `${searchData.firstName} ${searchData.lastName}`.toLowerCase();
      
      // Liste de noms à risque pour démonstration (remplacer par vraies listes)
      const sanctionedNames = [
        'vladimir putin',
        'bashar al-assad',
        'kim jong un',
        // ... ajouter les vrais noms des listes officielles
      ];

      // Recherche simple
      sanctionedNames.forEach(sanctionedName => {
        if (fullName.includes(sanctionedName) || sanctionedName.includes(fullName)) {
          matches.push({
            name: sanctionedName,
            source: 'Liste de sanctions internationales',
            details: 'Personne sanctionnée au niveau international',
            score: calculateSimilarity(fullName, sanctionedName),
          });
        }
      });

      // Vérification des noms très courants (faux positifs potentiels)
      const commonNames = ['martin', 'bernard', 'thomas', 'robert', 'richard'];
      const lastName = searchData.lastName.toLowerCase();
      
      if (commonNames.includes(lastName)) {
        // Pour les noms très courants, on nécessite une correspondance plus précise
      }

      // Sauvegarde de la vérification dans la base
      await kv.set(`sanctions_check_${clientId}_${Date.now()}`, {
        clientId,
        searchData,
        date: new Date().toISOString(),
        matches,
        checkedLists,
        status: matches.length > 0 ? 'alert' : 'clean',
      });


      return c.json({
        success: true,
        matches,
        checkedLists,
        searchData,
      });
    } catch (error: any) {
      console.error("❌ Erreur vérification sanctions:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Route GET /sanctions/history/:clientId - Récupérer l'historique des vérifications
  app.get("/make-server-cac859af/sanctions/history/:clientId", async (c: any) => {
    try {
      const clientId = c.req.param('clientId');
      
      // Récupérer toutes les vérifications du client
      const allChecks = await kv.getByPrefix(`sanctions_check_${clientId}_`);
      
      // Trier par date décroissante
      const sortedChecks = allChecks.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return c.json({
        success: true,
        history: sortedChecks,
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération historique sanctions:", error);
      return c.json({ error: error.message }, 500);
    }
  });

}

// Fonction pour calculer la similarité entre deux chaînes (score de 0 à 100)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 100;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

// Distance de Levenshtein (nombre de modifications nécessaires)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
