import * as kv from './kv_store.tsx';
import * as parserJuridique from './parser_juridique.tsx';

// Types
interface RegleFiscale {
  id: string;
  regle: string;
  condition: string;
  exception: string;
  consequence: string;
  source: string;
  date: string;
  statut_validation: 'validé' | 'en_attente' | 'à_réviser';
}

interface ChunkJuridique {
  id: string;
  texte: string;
  sujet: string;
  source: string;
  reference: string;
  date: string;
}

/**
 * Identifier une règle fiscale dans le texte
 */
function identifierRegle(texte: string, sujet: string): string | null {
  const texteLower = texte.toLowerCase();

  // Patterns indiquant une règle
  const reglesPatterns = [
    // Impôts et taux
    /(?:est|sont)\s+(?:imposé|imposée|imposés|soumis|soumise|taxé|taxée)\s+(?:à|au taux de)\s+(\d+(?:,\d+)?%)/i,
    /(?:le|la|les)\s+(\w+)\s+(?:bénéficie|bénéficient)\s+(?:d'un|d'une)\s+(\w+)/i,
    /(?:taux|barème)\s+(?:de|d')\s*(\d+(?:,\d+)?%)/i,
    
    // Abattements et exonérations
    /abattement\s+(?:de|d')\s*(\d+(?:,\d+)?%|\d+\s*(?:€|euros))/i,
    /exonération\s+(?:de|totale|partielle)/i,
    
    // Obligations
    /(?:doit|doivent|est tenu|sont tenus)\s+(?:de|d')\s*(\w+)/i,
    
    // Droits
    /(?:peut|peuvent|a le droit|ont le droit)\s+(?:de|d')\s*(\w+)/i,
  ];

  for (const pattern of reglesPatterns) {
    const match = texte.match(pattern);
    if (match) {
      // Nettoyer et retourner la règle
      let regle = match[0];
      
      // Si trop court, prendre plus de contexte
      if (regle.length < 30) {
        const index = texte.indexOf(match[0]);
        const start = Math.max(0, index - 20);
        const end = Math.min(texte.length, index + match[0].length + 50);
        regle = texte.substring(start, end).trim();
      }
      
      return regle.substring(0, 500); // Limiter la taille
    }
  }

  // Si aucun pattern détecté, vérifier si le texte contient des mots-clés fiscaux importants
  const motsClesFiscaux = [
    'impôt', 'taxe', 'prélèvement', 'cotisation',
    'abattement', 'exonération', 'déduction',
    'barème', 'taux', 'assiette',
    'déclaration', 'obligation'
  ];

  const containsKeywords = motsClesFiscaux.some(mot => texteLower.includes(mot));
  
  if (containsKeywords) {
    // Prendre la première phrase significative
    const phrases = texte.split(/[.;]\s+/);
    for (const phrase of phrases) {
      if (phrase.length > 40 && phrase.length < 300) {
        return phrase.trim();
      }
    }
  }

  return null;
}

/**
 * Identifier les conditions dans le texte
 */
function identifierConditions(texte: string): string {
  const texteLower = texte.toLowerCase();

  // Patterns de conditions
  const conditionsPatterns = [
    /(?:si|lorsque|quand|dans le cas où|à condition que)\s+([^.;]+)/i,
    /(?:sous réserve|sous condition)\s+(?:que|de|d')\s*([^.;]+)/i,
    /(?:pour|applicable aux)\s+([^.;]+?)(?:,|\.|\s+est|\s+sont)/i,
    /(?:revenus|personnes|contribuables|sociétés)\s+(?:dont|qui|ayant)\s+([^.;]+)/i,
  ];

  const conditions: string[] = [];

  for (const pattern of conditionsPatterns) {
    const matches = texte.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        const condition = match[1].trim();
        if (condition.length > 10 && condition.length < 200) {
          conditions.push(condition);
        }
      }
    }
  }

  // Détecter les montants ou seuils
  const seuilsPattern = /(?:supérieur|inférieur|égal|au-delà|en-deçà)\s+(?:à|de)\s+(\d+(?:\s*\d+)*(?:,\d+)?\s*(?:€|euros|%)?)/gi;
  const seuils = texte.matchAll(seuilsPattern);
  for (const match of seuils) {
    conditions.push(match[0].trim());
  }

  if (conditions.length === 0) {
    return 'Conditions générales';
  }

  // Limiter à 3 conditions et joindre
  return conditions.slice(0, 3).join(' ; ').substring(0, 500);
}

/**
 * Identifier les exceptions dans le texte
 */
function identifierExceptions(texte: string): string {
  const texteLower = texte.toLowerCase();

  // Patterns d'exceptions
  const exceptionsPatterns = [
    /(?:sauf|excepté|à l'exception de|hormis|toutefois|néanmoins)\s+([^.;]+)/i,
    /(?:ne sont pas|n'est pas)\s+(?:concerné|concernée|concernés|applicable|soumis)\s+([^.;]+)/i,
    /(?:exclusion|exception)\s+(?:faite|pour)\s+([^.;]+)/i,
  ];

  const exceptions: string[] = [];

  for (const pattern of exceptionsPatterns) {
    const matches = texte.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        const exception = match[1].trim();
        if (exception.length > 10 && exception.length < 200) {
          exceptions.push(exception);
        }
      }
    }
  }

  if (exceptions.length === 0) {
    return 'Aucune exception';
  }

  return exceptions.slice(0, 2).join(' ; ').substring(0, 500);
}

/**
 * Identifier les conséquences fiscales dans le texte
 */
function identifierConsequences(texte: string, regle: string): string {
  const texteLower = texte.toLowerCase();

  // Patterns de conséquences
  const consequencesPatterns = [
    /(?:entraîne|implique|donne lieu à|résulte en)\s+([^.;]+)/i,
    /(?:sera|seront|est|sont)\s+(?:imposé|taxé|exonéré|soumis)\s+([^.;]+)/i,
    /(?:montant|total|somme)\s+(?:de|d')\s+(\d+(?:\s*\d+)*(?:,\d+)?\s*(?:€|euros|%))/i,
    /(?:taux effectif|imposition)\s+(?:de|d')\s*(\d+(?:,\d+)?%)/i,
  ];

  const consequences: string[] = [];

  for (const pattern of consequencesPatterns) {
    const matches = texte.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      if (match[0]) {
        const consequence = match[0].trim();
        if (consequence.length > 10 && consequence.length < 200) {
          consequences.push(consequence);
        }
      }
    }
  }

  // Chercher des taux ou montants spécifiques
  const tauxPattern = /\d+(?:,\d+)?%/g;
  const taux = texte.match(tauxPattern);
  if (taux && taux.length > 0) {
    consequences.push(`Taux applicable: ${taux.join(', ')}`);
  }

  if (consequences.length === 0) {
    // Par défaut, extraire la fin de la règle si elle contient des informations
    if (regle.length > 50) {
      return regle.substring(Math.max(0, regle.length - 100));
    }
    return 'Application de la règle fiscale';
  }

  return consequences.slice(0, 3).join(' ; ').substring(0, 500);
}

/**
 * Valider la qualité d'une règle extraite
 */
function validerRegle(regle: RegleFiscale): 'validé' | 'en_attente' | 'à_réviser' {
  // Critères de validation
  let score = 0;

  // La règle contient-elle des informations spécifiques ?
  if (regle.regle.length > 40) score++;
  if (regle.condition && regle.condition !== 'Conditions générales') score++;
  if (regle.exception && regle.exception !== 'Aucune exception') score++;
  if (regle.consequence && regle.consequence !== 'Application de la règle fiscale') score++;

  // Contient des chiffres/taux ?
  if (/\d+(?:,\d+)?%/.test(regle.regle + regle.consequence)) score += 2;

  // Contient des mots-clés fiscaux importants ?
  const motsClesImportants = ['impôt', 'taxe', 'taux', 'abattement', 'exonération', 'prélèvement'];
  const texteComplet = (regle.regle + regle.condition + regle.consequence).toLowerCase();
  if (motsClesImportants.some(mot => texteComplet.includes(mot))) score++;

  // Décision
  if (score >= 5) return 'validé';
  if (score >= 3) return 'en_attente';
  return 'à_réviser';
}

/**
 * Extraire une règle fiscale depuis un chunk
 */
export async function extraireRegleDepuisChunk(chunk: ChunkJuridique): Promise<RegleFiscale | null> {
  console.log(`📄 Extraction règle depuis chunk: ${chunk.id.substring(0, 50)}...`);

  try {
    // Identifier la règle principale
    const regle = identifierRegle(chunk.texte, chunk.sujet);
    
    if (!regle) {
      console.log('   ⏭️  Aucune règle identifiable');
      return null;
    }

    // Identifier les composants
    const condition = identifierConditions(chunk.texte);
    const exception = identifierExceptions(chunk.texte);
    const consequence = identifierConsequences(chunk.texte, regle);

    // Créer la règle fiscale
    const regleFiscale: RegleFiscale = {
      id: `regle_${chunk.id}`,
      regle,
      condition,
      exception,
      consequence,
      source: `${chunk.source} - ${chunk.reference}`,
      date: chunk.date,
      statut_validation: 'en_attente' // Sera validé après
    };

    // Valider la règle
    regleFiscale.statut_validation = validerRegle(regleFiscale);

    console.log(`   ✅ Règle extraite (${regleFiscale.statut_validation}): ${regle.substring(0, 60)}...`);

    return regleFiscale;

  } catch (error) {
    console.error(`   ❌ Erreur extraction règle depuis chunk ${chunk.id}:`, error);
    return null;
  }
}

/**
 * Extraire toutes les règles fiscales depuis tous les chunks
 */
export async function extraireToutesLesRegles(): Promise<{
  success: boolean;
  chunks_analyses: number;
  regles_extraites: number;
  regles_validees: number;
  regles_en_attente: number;
  regles_a_reviser: number;
  duration: string;
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log('🚀 Début de l\'extraction de toutes les règles fiscales...');

  try {
    // Récupérer tous les chunks
    const chunks = await parserJuridique.searchChunks();

    console.log(`   📚 ${chunks.length} chunks à analyser`);

    let reglesExtraites = 0;
    let reglesValidees = 0;
    let reglesEnAttente = 0;
    let reglesAReviser = 0;

    // Extraire une règle pour chaque chunk
    for (const chunk of chunks) {
      try {
        const regle = await extraireRegleDepuisChunk(chunk as any);

        if (regle) {
          // Stocker la règle dans le KV store
          const key = `regles_fiscales:${regle.id}`;
          await kv.set(key, regle);

          reglesExtraites++;

          // Compter par statut
          if (regle.statut_validation === 'validé') reglesValidees++;
          else if (regle.statut_validation === 'en_attente') reglesEnAttente++;
          else reglesAReviser++;
        }

      } catch (error) {
        const errorMsg = `Erreur extraction chunk ${chunk.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`   ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Stocker les métadonnées d'extraction
    const extractionInfo = {
      date: new Date().toISOString(),
      chunks_analyses: chunks.length,
      regles_extraites: reglesExtraites,
      regles_validees: reglesValidees,
      regles_en_attente: reglesEnAttente,
      regles_a_reviser: reglesAReviser,
      errors
    };

    await kv.set('regles_fiscales:last_extraction', extractionInfo);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

    console.log(`✅ Extraction terminée en ${duration}`);
    console.log(`   - Chunks analysés: ${chunks.length}`);
    console.log(`   - Règles extraites: ${reglesExtraites}`);
    console.log(`   - Validées: ${reglesValidees}`);
    console.log(`   - En attente: ${reglesEnAttente}`);
    console.log(`   - À réviser: ${reglesAReviser}`);

    return {
      success: true,
      chunks_analyses: chunks.length,
      regles_extraites: reglesExtraites,
      regles_validees: reglesValidees,
      regles_en_attente: reglesEnAttente,
      regles_a_reviser: reglesAReviser,
      duration,
      errors
    };

  } catch (error) {
    console.error('❌ Erreur fatale lors de l\'extraction:', error);
    return {
      success: false,
      chunks_analyses: 0,
      regles_extraites: 0,
      regles_validees: 0,
      regles_en_attente: 0,
      regles_a_reviser: 0,
      duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's',
      errors: [...errors, error instanceof Error ? error.message : 'Erreur inconnue']
    };
  }
}

/**
 * Rechercher des règles fiscales
 */
export async function searchRegles(
  query?: string, 
  statut?: string, 
  source?: string
): Promise<RegleFiscale[]> {
  console.log(`🔍 Recherche de règles fiscales: query="${query}", statut="${statut}", source="${source}"`);

  try {
    // Récupérer toutes les règles
    const allItems = await kv.getByPrefix('regles_fiscales:');

    let regles: RegleFiscale[] = allItems
      .filter(item => item.key !== 'regles_fiscales:last_extraction')
      .map(item => item.value as RegleFiscale);

    // Filtrer par statut
    if (statut) {
      regles = regles.filter(r => r.statut_validation === statut);
    }

    // Filtrer par source
    if (source) {
      const sourceLower = source.toLowerCase();
      regles = regles.filter(r => r.source.toLowerCase().includes(sourceLower));
    }

    // Filtrer par query
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      regles = regles.filter(r =>
        r.regle.toLowerCase().includes(queryLower) ||
        r.condition.toLowerCase().includes(queryLower) ||
        r.exception.toLowerCase().includes(queryLower) ||
        r.consequence.toLowerCase().includes(queryLower)
      );
    }

    // Trier par date (plus récent d'abord)
    regles.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    console.log(`✅ ${regles.length} règles trouvées`);
    return regles;

  } catch (error) {
    console.error('❌ Erreur lors de la recherche de règles:', error);
    return [];
  }
}

/**
 * Obtenir les statistiques d'extraction
 */
export async function getExtractionStats() {
  try {
    const lastExtraction = await kv.get('regles_fiscales:last_extraction');
    const allRegles = await searchRegles();

    // Compter par statut
    const byStatut = {
      validé: allRegles.filter(r => r.statut_validation === 'validé').length,
      en_attente: allRegles.filter(r => r.statut_validation === 'en_attente').length,
      à_réviser: allRegles.filter(r => r.statut_validation === 'à_réviser').length
    };

    // Compter par source
    const sourcesCount: Record<string, number> = {};
    for (const regle of allRegles) {
      const sourceKey = regle.source.split(' - ')[0]; // Prendre uniquement BOFiP ou Legifrance
      sourcesCount[sourceKey] = (sourcesCount[sourceKey] || 0) + 1;
    }

    return {
      last_extraction: lastExtraction || null,
      total_regles: allRegles.length,
      by_statut: byStatut,
      by_source: sourcesCount
    };

  } catch (error) {
    console.error('❌ Erreur récupération stats extraction:', error);
    return {
      last_extraction: null,
      total_regles: 0,
      by_statut: { validé: 0, en_attente: 0, à_réviser: 0 },
      by_source: {}
    };
  }
}

/**
 * Mettre à jour le statut de validation d'une règle
 */
export async function updateStatutValidation(
  regleId: string, 
  nouveauStatut: 'validé' | 'en_attente' | 'à_réviser'
): Promise<{ success: boolean; message: string }> {
  try {
    const key = `regles_fiscales:${regleId}`;
    const regle = await kv.get(key) as RegleFiscale | null;

    if (!regle) {
      return { success: false, message: 'Règle non trouvée' };
    }

    regle.statut_validation = nouveauStatut;
    await kv.set(key, regle);

    console.log(`✅ Statut de ${regleId} mis à jour: ${nouveauStatut}`);
    return { success: true, message: 'Statut mis à jour' };

  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Supprimer toutes les règles (utile pour réinitialiser)
 */
export async function deleteAllRegles(): Promise<{ deleted: number }> {
  console.log('🗑️  Suppression de toutes les règles fiscales...');

  try {
    const allItems = await kv.getByPrefix('regles_fiscales:');
    
    for (const item of allItems) {
      await kv.del(item.key);
    }

    console.log(`✅ ${allItems.length} règles supprimées`);
    return { deleted: allItems.length };

  } catch (error) {
    console.error('❌ Erreur suppression règles:', error);
    return { deleted: 0 };
  }
}
