import * as kv from './kv_store.tsx';
import * as extracteurRegles from './extracteur_regles.tsx';

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

interface VecteurRegle {
  id: string;
  texte_regle: string;
  condition: string;
  consequence: string;
  source: string;
  embedding: number[];
  regle_id: string;
  date_indexation: string;
}

interface RechercheResult {
  regle: VecteurRegle;
  score: number;
}

/**
 * Générer un embedding via l'API OpenAI
 */
async function genererEmbedding(texte: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY non configurée. Veuillez configurer la clé API OpenAI.');
  }

  try {

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // 1536 dimensions, performant et économique
        input: texte,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur API OpenAI: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    return embedding;

  } catch (error) {
    console.error('❌ Erreur génération embedding:', error);
    throw error;
  }
}

/**
 * Préparer le texte pour l'embedding
 * Combine règle, condition et conséquence de manière optimale
 */
function preparerTexteEmbedding(regle: RegleFiscale): string {
  const parts: string[] = [];

  // Règle principale
  parts.push(`Règle: ${regle.regle}`);

  // Condition (si différente de "Conditions générales")
  if (regle.condition && regle.condition !== 'Conditions générales') {
    parts.push(`Condition: ${regle.condition}`);
  }

  // Exception (si présente et différente de "Aucune exception")
  if (regle.exception && regle.exception !== 'Aucune exception') {
    parts.push(`Exception: ${regle.exception}`);
  }

  // Conséquence (si différente du placeholder)
  if (regle.consequence && regle.consequence !== 'Application de la règle fiscale') {
    parts.push(`Conséquence: ${regle.consequence}`);
  }

  // Source
  parts.push(`Source: ${regle.source}`);

  return parts.join(' | ');
}

/**
 * Indexer une règle fiscale (créer son embedding)
 */
export async function indexerRegle(regle: RegleFiscale): Promise<VecteurRegle | null> {

  try {
    // Préparer le texte pour l'embedding
    const texteComplet = preparerTexteEmbedding(regle);

    // Générer l'embedding
    const embedding = await genererEmbedding(texteComplet);

    // Créer l'objet vectoriel
    const vecteur: VecteurRegle = {
      id: `vecteur_${regle.id}`,
      texte_regle: regle.regle,
      condition: regle.condition,
      consequence: regle.consequence,
      source: regle.source,
      embedding,
      regle_id: regle.id,
      date_indexation: new Date().toISOString(),
    };

    return vecteur;

  } catch (error) {
    console.error(`❌ Erreur indexation règle ${regle.id}:`, error);
    return null;
  }
}

/**
 * Indexer toutes les règles validées
 */
export async function indexerToutesLesRegles(): Promise<{
  success: boolean;
  regles_indexees: number;
  regles_echouees: number;
  duration: string;
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];


  try {
    // Récupérer toutes les règles validées
    const reglesValidees = await extracteurRegles.searchRegles(undefined, 'validé');


    let reglesIndexees = 0;
    let reglesEchouees = 0;

    // Indexer chaque règle
    for (const regle of reglesValidees) {
      try {
        const vecteur = await indexerRegle(regle as any);

        if (vecteur) {
          // Stocker dans le KV store
          const key = `index_ia:${vecteur.id}`;
          await kv.set(key, vecteur);
          reglesIndexees++;

        } else {
          reglesEchouees++;
        }

        // Petite pause pour ne pas surcharger l'API OpenAI
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const errorMsg = `Erreur indexation ${regle.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`   ❌ ${errorMsg}`);
        errors.push(errorMsg);
        reglesEchouees++;
      }
    }

    // Stocker les métadonnées d'indexation
    const indexationInfo = {
      date: new Date().toISOString(),
      regles_indexees: reglesIndexees,
      regles_echouees: reglesEchouees,
      total_traite: reglesValidees.length,
      errors
    };

    await kv.set('index_ia:last_indexation', indexationInfo);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';


    return {
      success: true,
      regles_indexees: reglesIndexees,
      regles_echouees: reglesEchouees,
      duration,
      errors
    };

  } catch (error) {
    console.error('❌ Erreur fatale lors de l\'indexation:', error);
    return {
      success: false,
      regles_indexees: 0,
      regles_echouees: 0,
      duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's',
      errors: [...errors, error instanceof Error ? error.message : 'Erreur inconnue']
    };
  }
}

/**
 * Calculer la similarité cosinus entre deux vecteurs
 */
function similariteCosinus(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Les vecteurs doivent avoir la même dimension');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Rechercher des règles par similarité sémantique
 */
export async function rechercherRegles(
  query: string,
  limit: number = 10,
  seuilSimilarite: number = 0.5
): Promise<RechercheResult[]> {

  try {
    // Générer l'embedding de la query
    const queryEmbedding = await genererEmbedding(query);

    // Récupérer tous les vecteurs indexés
    const allItems = await kv.getByPrefix('index_ia:');

    const vecteurs: VecteurRegle[] = allItems
      .filter(item => item.key !== 'index_ia:last_indexation')
      .map(item => item.value as VecteurRegle);


    // Calculer la similarité pour chaque vecteur
    const resultats: RechercheResult[] = [];

    for (const vecteur of vecteurs) {
      try {
        const score = similariteCosinus(queryEmbedding, vecteur.embedding);

        if (score >= seuilSimilarite) {
          resultats.push({
            regle: vecteur,
            score
          });
        }
      } catch (error) {
        console.error(`Erreur calcul similarité pour ${vecteur.id}:`, error);
      }
    }

    // Trier par score décroissant
    resultats.sort((a, b) => b.score - a.score);

    // Limiter les résultats
    const resultatsFiltres = resultats.slice(0, limit);


    return resultatsFiltres;

  } catch (error) {
    console.error('❌ Erreur lors de la recherche sémantique:', error);
    throw error;
  }
}

/**
 * Rechercher avec texte enrichi (pour assistant IA)
 */
export async function rechercherPourAssistant(
  question: string,
  contexte?: string,
  limit: number = 5
): Promise<{
  question: string;
  regles_trouvees: number;
  resultats: Array<{
    regle: string;
    condition: string;
    consequence: string;
    source: string;
    pertinence: number;
  }>;
}> {

  // Enrichir la question avec le contexte
  let queryEnrichie = question;
  if (contexte) {
    queryEnrichie = `${question}\nContexte: ${contexte}`;
  }

  // Rechercher les règles
  const resultats = await rechercherRegles(queryEnrichie, limit, 0.6);

  // Formatter pour l'assistant
  const reglesFormatees = resultats.map(r => ({
    regle: r.regle.texte_regle,
    condition: r.regle.condition,
    consequence: r.regle.consequence,
    source: r.regle.source,
    pertinence: Math.round(r.score * 100) / 100
  }));


  return {
    question,
    regles_trouvees: reglesFormatees.length,
    resultats: reglesFormatees
  };
}

/**
 * Obtenir les statistiques d'indexation
 */
export async function getIndexationStats() {
  try {
    const lastIndexation = await kv.get('index_ia:last_indexation');
    const allVecteurs = await kv.getByPrefix('index_ia:');

    const vecteursCount = allVecteurs.filter(
      item => item.key !== 'index_ia:last_indexation'
    ).length;

    return {
      last_indexation: lastIndexation || null,
      total_vecteurs: vecteursCount,
      modele_embedding: 'text-embedding-3-small',
      dimensions: 1536
    };

  } catch (error) {
    console.error('❌ Erreur récupération stats indexation:', error);
    return {
      last_indexation: null,
      total_vecteurs: 0,
      modele_embedding: 'text-embedding-3-small',
      dimensions: 1536
    };
  }
}

/**
 * Supprimer tous les vecteurs (utile pour réindexer)
 */
export async function deleteAllVecteurs(): Promise<{ deleted: number }> {

  try {
    const allItems = await kv.getByPrefix('index_ia:');
    
    for (const item of allItems) {
      await kv.del(item.key);
    }

    return { deleted: allItems.length };

  } catch (error) {
    console.error('❌ Erreur suppression vecteurs:', error);
    return { deleted: 0 };
  }
}

/**
 * Obtenir des règles similaires à une règle donnée
 */
export async function trouverReglesSimilaires(
  regleId: string,
  limit: number = 5
): Promise<RechercheResult[]> {

  try {
    // Récupérer le vecteur de la règle source
    const vecteurSource = await kv.get(`index_ia:vecteur_${regleId}`) as VecteurRegle | null;

    if (!vecteurSource) {
      throw new Error(`Règle ${regleId} non indexée`);
    }

    // Récupérer tous les vecteurs
    const allItems = await kv.getByPrefix('index_ia:');

    const vecteurs: VecteurRegle[] = allItems
      .filter(item => 
        item.key !== 'index_ia:last_indexation' && 
        item.key !== `index_ia:vecteur_${regleId}` // Exclure la règle elle-même
      )
      .map(item => item.value as VecteurRegle);

    // Calculer la similarité
    const resultats: RechercheResult[] = [];

    for (const vecteur of vecteurs) {
      const score = similariteCosinus(vecteurSource.embedding, vecteur.embedding);
      resultats.push({ regle: vecteur, score });
    }

    // Trier et limiter
    resultats.sort((a, b) => b.score - a.score);


    return resultats.slice(0, limit);

  } catch (error) {
    console.error('❌ Erreur recherche règles similaires:', error);
    throw error;
  }
}

/**
 * Tester la configuration de l'API OpenAI
 */
export async function testerConfigurationOpenAI(): Promise<{
  success: boolean;
  message: string;
  modele?: string;
  dimensions?: number;
}> {
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      return {
        success: false,
        message: 'OPENAI_API_KEY non configurée. Veuillez ajouter votre clé API OpenAI.'
      };
    }

    // Tester avec un texte simple
    const embedding = await genererEmbedding('Test de configuration');

    return {
      success: true,
      message: 'API OpenAI configurée correctement',
      modele: 'text-embedding-3-small',
      dimensions: embedding.length
    };

  } catch (error) {
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
