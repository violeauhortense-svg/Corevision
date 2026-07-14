import * as kv from './kv_store.tsx';
import * as collecteurJuridique from './collecteur_juridique.tsx';

// Types
interface ChunkJuridique {
  id: string;
  texte: string;
  sujet: string;
  source: string;
  reference: string;
  date: string;
}

interface DocumentJuridique {
  id: string;
  source: 'BOFiP' | 'Legifrance';
  titre: string;
  section: string;
  texte: string;
  date_publication: string;
  date_collecte: string;
  metadata: {
    url: string;
    categorie: string;
    mots_cles: string[];
  };
}

/**
 * Extraire le sujet fiscal à partir du titre et du contenu
 */
function extraireSujetFiscal(titre: string, texte: string, section: string): string {
  const texteCombine = `${titre} ${section} ${texte}`.toLowerCase();

  // Cartographie des sujets fiscaux courants
  const sujets = [
    { keywords: ['pfu', 'flat tax', 'prélèvement forfaitaire'], sujet: 'PFU et prélèvement forfaitaire' },
    { keywords: ['dividende', 'distribution'], sujet: 'Dividendes' },
    { keywords: ['plus-value', 'plus value', 'cession'], sujet: 'Plus-values' },
    { keywords: ['ir', 'impôt sur le revenu', 'barème'], sujet: 'Impôt sur le revenu' },
    { keywords: ['is', 'impôt sur les sociétés', 'société'], sujet: 'Impôt sur les sociétés' },
    { keywords: ['tva', 'taxe sur la valeur'], sujet: 'TVA' },
    { keywords: ['donation', 'donner'], sujet: 'Donations' },
    { keywords: ['succession', 'héritage', 'héritier'], sujet: 'Successions' },
    { keywords: ['ifi', 'isf', 'fortune'], sujet: 'IFI' },
    { keywords: ['abattement'], sujet: 'Abattements fiscaux' },
    { keywords: ['exonération', 'exonéré'], sujet: 'Exonérations' },
    { keywords: ['assurance vie', 'assurance-vie'], sujet: 'Assurance-vie' },
    { keywords: ['pea', 'plan épargne actions'], sujet: 'PEA' },
    { keywords: ['pel', 'plan épargne logement'], sujet: 'PEL' },
    { keywords: ['scpi', 'sci', 'immobilier'], sujet: 'Immobilier et SCPI' },
    { keywords: ['holding'], sujet: 'Holdings patrimoniales' },
    { keywords: ['démembrement', 'usufruit', 'nue-propriété'], sujet: 'Démembrement de propriété' },
    { keywords: ['retraite', 'pension'], sujet: 'Retraite et pensions' },
    { keywords: ['rsi', 'tns', 'travailleur non salarié'], sujet: 'Travailleurs non salariés' },
  ];

  // Trouver le premier sujet correspondant
  for (const { keywords, sujet } of sujets) {
    if (keywords.some(kw => texteCombine.includes(kw))) {
      return sujet;
    }
  }

  // Si aucun sujet spécifique trouvé, utiliser la section ou le titre
  if (section && section.length > 5) {
    return section.substring(0, 100);
  }

  if (titre && titre.length > 5) {
    return titre.substring(0, 100);
  }

  return 'Droit fiscal général';
}

/**
 * Extraire la référence juridique du texte
 */
function extraireReference(texte: string, titre: string, source: string, url: string): string {
  const texteCombine = `${titre} ${texte}`;

  // Patterns de références juridiques
  const patterns = [
    // Code général des impôts
    /(?:CGI|Code général des impôts)\s*(?:art\.|article)?\s*(\d+(?:\s*[A-Z])?(?:\s*bis|ter|quater)?)/i,
    // BOFiP
    /BOI-[A-Z]+-\d+-\d+/i,
    // Articles de loi
    /(?:Article|Art\.)\s*(\d+(?:\s*[A-Z])?(?:\s*bis|ter|quater)?)/i,
    // Livre > Titre > Chapitre
    /Livre\s*([IVX]+).*?Titre\s*([IVX]+)/i,
  ];

  for (const pattern of patterns) {
    const match = texteCombine.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // Si aucune référence trouvée, utiliser la source + URL
  if (url) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.length > 5) {
      return `${source} - ${lastPart.substring(0, 50)}`;
    }
  }

  return `${source} - Document`;
}

/**
 * Découper un texte en paragraphes intelligents
 */
function decouperEnParagraphes(texte: string): string[] {
  // Nettoyer le texte
  const texteNettoye = texte
    .replace(/\s+/g, ' ')
    .trim();

  // Découper par points, points-virgules, sauts de ligne
  const segments = texteNettoye.split(/[.;]\s+|\n+/);

  const paragraphes: string[] = [];
  let buffer = '';

  for (const segment of segments) {
    const segmentTrim = segment.trim();
    if (!segmentTrim) continue;

    // Ajouter au buffer
    buffer += (buffer ? '. ' : '') + segmentTrim;

    // Si le buffer dépasse 300 caractères, créer un nouveau paragraphe
    if (buffer.length >= 300) {
      paragraphes.push(buffer);
      buffer = '';
    }
  }

  // Ajouter le reste
  if (buffer.length > 50) {
    paragraphes.push(buffer);
  }

  return paragraphes.filter(p => p.length > 50);
}

/**
 * Parser un document juridique en chunks
 */
export async function parserDocument(doc: DocumentJuridique): Promise<ChunkJuridique[]> {

  const chunks: ChunkJuridique[] = [];

  // Extraire le sujet
  const sujet = extraireSujetFiscal(doc.titre, doc.texte, doc.section);

  // Extraire la référence
  const reference = extraireReference(doc.texte, doc.titre, doc.source, doc.metadata.url);

  // Découper le texte en paragraphes
  const paragraphes = decouperEnParagraphes(doc.texte);


  // Créer un chunk pour chaque paragraphe
  for (let i = 0; i < paragraphes.length; i++) {
    const chunk: ChunkJuridique = {
      id: `chunk_${doc.id}_${i}`,
      texte: paragraphes[i],
      sujet,
      source: doc.source,
      reference: reference,
      date: doc.date_publication
    };

    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Parser tous les documents juridiques et créer les chunks
 */
export async function parserTousLesDocuments(): Promise<{
  success: boolean;
  documents_traites: number;
  chunks_crees: number;
  duration: string;
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];


  try {
    // Récupérer tous les documents juridiques
    const documents = await collecteurJuridique.searchDocuments();


    let totalChunks = 0;
    let documentsTraites = 0;

    // Parser chaque document
    for (const doc of documents) {
      try {
        const chunks = await parserDocument(doc as any);

        // Stocker chaque chunk dans le KV store
        for (const chunk of chunks) {
          const key = `chunks_juridiques:${chunk.id}`;
          await kv.set(key, chunk);
        }

        totalChunks += chunks.length;
        documentsTraites++;


      } catch (error) {
        const errorMsg = `Erreur parsing ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`   ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Stocker les métadonnées de parsing
    const parsingInfo = {
      date: new Date().toISOString(),
      documents_traites: documentsTraites,
      chunks_crees: totalChunks,
      errors
    };

    await kv.set('chunks_juridiques:last_parsing', parsingInfo);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

    console.log(`   - Documents traités: ${documentsTraites}`);
    console.log(`   - Chunks créés: ${totalChunks}`);
    console.log(`   - Erreurs: ${errors.length}`);

    return {
      success: true,
      documents_traites: documentsTraites,
      chunks_crees: totalChunks,
      duration,
      errors
    };

  } catch (error) {
    console.error('❌ Erreur fatale lors du parsing:', error);
    return {
      success: false,
      documents_traites: 0,
      chunks_crees: 0,
      duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's',
      errors: [...errors, error instanceof Error ? error.message : 'Erreur inconnue']
    };
  }
}

/**
 * Rechercher des chunks juridiques
 */
export async function searchChunks(query?: string, sujet?: string, source?: string): Promise<ChunkJuridique[]> {

  try {
    // Récupérer tous les chunks
    const allItems = await kv.getByPrefix('chunks_juridiques:');

    let chunks: ChunkJuridique[] = allItems
      .filter(item => item.key !== 'chunks_juridiques:last_parsing')
      .map(item => item.value as ChunkJuridique);

    // Filtrer par source
    if (source) {
      chunks = chunks.filter(c => c.source.toLowerCase() === source.toLowerCase());
    }

    // Filtrer par sujet
    if (sujet) {
      const sujetLower = sujet.toLowerCase();
      chunks = chunks.filter(c => c.sujet.toLowerCase().includes(sujetLower));
    }

    // Filtrer par query
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      chunks = chunks.filter(c =>
        c.texte.toLowerCase().includes(queryLower) ||
        c.sujet.toLowerCase().includes(queryLower) ||
        c.reference.toLowerCase().includes(queryLower)
      );
    }

    // Trier par date (plus récent d'abord)
    chunks.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return chunks;

  } catch (error) {
    console.error('❌ Erreur lors de la recherche de chunks:', error);
    return [];
  }
}

/**
 * Obtenir les statistiques de parsing
 */
export async function getParsingStats() {
  try {
    const lastParsing = await kv.get('chunks_juridiques:last_parsing');
    const allChunks = await searchChunks();

    // Compter par source
    const bySource = {
      BOFiP: allChunks.filter(c => c.source === 'BOFiP').length,
      Legifrance: allChunks.filter(c => c.source === 'Legifrance').length
    };

    // Compter par sujet (top 10)
    const sujetsCount: Record<string, number> = {};
    for (const chunk of allChunks) {
      sujetsCount[chunk.sujet] = (sujetsCount[chunk.sujet] || 0) + 1;
    }

    const topSujets = Object.entries(sujetsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sujet, count]) => ({ sujet, count }));

    return {
      last_parsing: lastParsing || null,
      total_chunks: allChunks.length,
      by_source: bySource,
      top_sujets: topSujets
    };

  } catch (error) {
    console.error('❌ Erreur récupération stats parsing:', error);
    return {
      last_parsing: null,
      total_chunks: 0,
      by_source: { BOFiP: 0, Legifrance: 0 },
      top_sujets: []
    };
  }
}

/**
 * Obtenir tous les sujets uniques
 */
export async function getSujetsUniques(): Promise<string[]> {
  try {
    const chunks = await searchChunks();
    const sujetsSet = new Set(chunks.map(c => c.sujet));
    return Array.from(sujetsSet).sort();
  } catch (error) {
    console.error('❌ Erreur récupération sujets:', error);
    return [];
  }
}

/**
 * Supprimer tous les chunks (utile pour réinitialiser)
 */
export async function deleteAllChunks(): Promise<{ deleted: number }> {

  try {
    const allItems = await kv.getByPrefix('chunks_juridiques:');
    
    for (const item of allItems) {
      await kv.del(item.key);
    }

    return { deleted: allItems.length };

  } catch (error) {
    console.error('❌ Erreur suppression chunks:', error);
    return { deleted: 0 };
  }
}
