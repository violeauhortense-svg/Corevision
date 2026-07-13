import * as cheerio from 'npm:cheerio@1.0.0';
import * as kv from './kv_store.tsx';
import * as parserJuridique from './parser_juridique.tsx';
import * as extracteurRegles from './extracteur_regles.tsx';
import * as indexIA from './index_ia.tsx';
import * as generateurMontages from './generateur_montages.tsx';

// Types
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

// Configuration des sources
const SOURCES_CONFIG = {
  bofip: {
    base_url: 'https://bofip.impots.gouv.fr',
    categories: [
      '/bofip/1-PGP', // Impôts sur le revenu
      '/bofip/2-PGP', // IS
      '/bofip/3751-PGP', // TVA
    ]
  },
  legifrance: {
    base_url: 'https://www.legifrance.gouv.fr',
    codes: [
      '/codes/id/LEGITEXT000006069577/', // Code général des impôts
      '/codes/id/LEGITEXT000006072050/', // Code monétaire et financier
    ]
  }
};

/**
 * Scraper BOFiP
 * Récupère les bulletins officiels des finances publiques
 */
async function scrapeBOFiP(): Promise<DocumentJuridique[]> {
  console.log('🔍 Début du scraping BOFiP...');
  const documents: DocumentJuridique[] = [];

  try {
    // Pour chaque catégorie du BOFiP
    for (const categoryPath of SOURCES_CONFIG.bofip.categories) {
      const url = `${SOURCES_CONFIG.bofip.base_url}${categoryPath}`;
      console.log(`📄 Scraping: ${url}`);

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          console.warn(`⚠️ Erreur HTTP ${response.status} pour ${url}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extraire les articles (adapter les sélecteurs selon la structure réelle)
        const articles = $('article, .content, .texte').slice(0, 5); // Limiter à 5 par catégorie pour le prototype

        articles.each((index, element) => {
          const titre = $(element).find('h1, h2, .titre').first().text().trim() || 
                       `Document BOFiP ${categoryPath} - ${index + 1}`;
          
          const section = $(element).find('.section, .chapitre').first().text().trim() || 
                         categoryPath.split('/').pop() || 'Section inconnue';
          
          const texte = $(element).find('p, .paragraphe, .content-text').text().trim() || 
                       $(element).text().trim().substring(0, 500);

          // Extraire la date (chercher des patterns de date)
          const dateMatch = html.match(/(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
          const date_publication = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

          if (texte.length > 50) { // Ne garder que les documents avec du contenu
            const doc: DocumentJuridique = {
              id: `bofip_${Date.now()}_${index}`,
              source: 'BOFiP',
              titre,
              section,
              texte: texte.substring(0, 2000), // Limiter la taille
              date_publication,
              date_collecte: new Date().toISOString(),
              metadata: {
                url,
                categorie: categoryPath.includes('PGP') ? 'fiscal' : 'general',
                mots_cles: extractKeywords(titre + ' ' + texte)
              }
            };

            documents.push(doc);
            console.log(`✅ Document BOFiP extrait: ${titre.substring(0, 50)}...`);
          }
        });

        // Délai pour éviter de surcharger le serveur
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Erreur scraping ${url}:`, error);
      }
    }

    console.log(`✅ BOFiP: ${documents.length} documents récupérés`);
    return documents;

  } catch (error) {
    console.error('❌ Erreur globale scraping BOFiP:', error);
    return documents;
  }
}

/**
 * Scraper Legifrance
 * Récupère les articles du Code général des impôts
 */
async function scrapeLegifrance(): Promise<DocumentJuridique[]> {
  console.log('🔍 Début du scraping Legifrance...');
  const documents: DocumentJuridique[] = [];

  try {
    for (const codePath of SOURCES_CONFIG.legifrance.codes) {
      const url = `${SOURCES_CONFIG.legifrance.base_url}${codePath}`;
      console.log(`📄 Scraping: ${url}`);

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          console.warn(`⚠️ Erreur HTTP ${response.status} pour ${url}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extraire les articles de loi (adapter les sélecteurs)
        const articles = $('article, .article, .code-article').slice(0, 5);

        articles.each((index, element) => {
          const titre = $(element).find('.article-title, h2, h3').first().text().trim() || 
                       `Article Legifrance - ${index + 1}`;
          
          const section = $(element).find('.section-title, .livre').first().text().trim() || 
                         codePath.includes('LEGITEXT000006069577') ? 'Code général des impôts' : 
                         codePath.includes('LEGITEXT000006072050') ? 'Code monétaire et financier' : 
                         'Code inconnu';
          
          const texte = $(element).find('.article-content, p').text().trim() || 
                       $(element).text().trim();

          // Chercher la date de modification/publication
          const dateMatch = html.match(/Modifié par.*?(\d{4}-\d{2}-\d{2})|Version en vigueur.*?(\d{2}\/\d{2}\/\d{4})/);
          const date_publication = dateMatch ? (dateMatch[1] || dateMatch[2]) : new Date().toISOString().split('T')[0];

          if (texte.length > 50) {
            const doc: DocumentJuridique = {
              id: `legifrance_${Date.now()}_${index}`,
              source: 'Legifrance',
              titre,
              section,
              texte: texte.substring(0, 2000),
              date_publication,
              date_collecte: new Date().toISOString(),
              metadata: {
                url,
                categorie: codePath.includes('impôts') || codePath.includes('069577') ? 'fiscal' : 
                          codePath.includes('financier') || codePath.includes('072050') ? 'financier' : 
                          'general',
                mots_cles: extractKeywords(titre + ' ' + texte)
              }
            };

            documents.push(doc);
            console.log(`✅ Document Legifrance extrait: ${titre.substring(0, 50)}...`);
          }
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Erreur scraping ${url}:`, error);
      }
    }

    console.log(`✅ Legifrance: ${documents.length} documents récupérés`);
    return documents;

  } catch (error) {
    console.error('❌ Erreur globale scraping Legifrance:', error);
    return documents;
  }
}

/**
 * Extraire des mots-clés simples du texte
 */
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  const words = text.toLowerCase().match(/\b[a-zàâäéèêëïîôùûü]{4,}\b/g) || [];
  
  // Mots-clés fiscaux/patrimoniaux courants
  const importantWords = [
    'fiscal', 'impôt', 'tva', 'revenus', 'patrimoine', 'donation',
    'succession', 'holding', 'société', 'assurance', 'épargne',
    'placement', 'pfu', 'prélèvement', 'abattement', 'exonération',
    'taux', 'barème', 'déclaration', 'plus-value', 'dividende'
  ];

  for (const word of words) {
    if (importantWords.includes(word)) {
      keywords.add(word);
    }
  }

  return Array.from(keywords).slice(0, 10);
}

/**
 * Lancer la collecte complète
 */
export async function runCollecte(): Promise<{
  success: boolean;
  bofip_count: number;
  legifrance_count: number;
  total: number;
  duration: string;
  errors: string[];
  regles_extraites?: number;
  regles_ajoutees?: number;
}> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log('🚀 Lancement de la collecte juridique automatique...');

  try {
    // ÉTAPE 1 : Scraper BOFiP
    let bofipDocs: DocumentJuridique[] = [];
    try {
      console.log('📥 [1/5] Collecte BOFiP...');
      bofipDocs = await scrapeBOFiP();
    } catch (error) {
      const errorMsg = `Erreur BOFiP: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    // ÉTAPE 2 : Scraper Legifrance
    let legifranceDocs: DocumentJuridique[] = [];
    try {
      console.log('📥 [2/5] Collecte Legifrance...');
      legifranceDocs = await scrapeLegifrance();
    } catch (error) {
      const errorMsg = `Erreur Legifrance: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    // Stocker tous les documents dans le KV store
    const allDocs = [...bofipDocs, ...legifranceDocs];

    for (const doc of allDocs) {
      const key = `juridique:${doc.source.toLowerCase()}:${doc.id}`;
      try {
        await kv.set(key, doc);
      } catch (error) {
        const errorMsg = `Erreur stockage ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // ÉTAPE 3 : Parser les documents collectés
    console.log('📝 [3/5] Parsing des documents...');
    let documentsParsed = [];
    try {
      for (const doc of allDocs) {
        const parsed = await parserJuridique.parseDocument(doc.texte, doc.source);
        if (parsed) {
          documentsParsed.push({
            ...doc,
            parsed_data: parsed
          });
        }
      }
      console.log(`✅ ${documentsParsed.length} documents parsés`);
    } catch (error) {
      const errorMsg = `Erreur parsing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    // ÉTAPE 4 : Extraire les règles fiscales
    console.log('🔍 [4/5] Extraction des règles fiscales...');
    let reglesExtraites: any[] = [];
    let reglesAjoutees = 0;
    try {
      for (const doc of documentsParsed) {
        const regles = await extracteurRegles.extractReglesFromDocument(doc.texte, doc.titre);
        if (regles && regles.length > 0) {
          reglesExtraites.push(...regles);
          
          // Sauvegarder chaque règle dans le KV store avec un préfixe spécial
          for (const regle of regles) {
            const regleKey = `regle_collectee:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await kv.set(regleKey, {
              ...regle,
              source_document: doc.id,
              date_extraction: new Date().toISOString()
            });
            reglesAjoutees++;
          }
        }
      }
      console.log(`✅ ${reglesExtraites.length} règles fiscales extraites et ${reglesAjoutees} sauvegardées`);
    } catch (error) {
      const errorMsg = `Erreur extraction règles: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    // ÉTAPE 5 : Réindexer avec l'IA
    console.log('🤖 [5/6] Réindexation IA...');
    try {
      // Note: L'indexation IA peut être lancée en arrière-plan car elle est longue
      // On ne bloque pas la réponse sur cette étape
      setTimeout(() => {
        indexIA.indexerToutesLesRegles().then(() => {
          console.log('✅ Réindexation IA terminée');
        }).catch((error) => {
          console.error('❌ Erreur réindexation IA:', error);
        });
      }, 1000);
      console.log('✅ Réindexation IA lancée en arrière-plan');
    } catch (error) {
      const errorMsg = `Erreur réindexation: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    // ÉTAPE 6 : Générer les montages patrimoniaux automatiquement
    console.log('🏗️ [6/6] Génération automatique des montages patrimoniaux...');
    let montagesGeneres = 0;
    try {
      setTimeout(async () => {
        const result = await generateurMontages.genererMontagesAutomatiques();
        if (result.success) {
          console.log(`✅ Génération montages terminée: ${result.montages_generes} montages créés`);
        } else {
          console.error('❌ Erreur génération montages:', result.errors);
        }
      }, 2000);
      console.log('✅ Génération de montages lancée en arrière-plan');
    } catch (error) {
      const errorMsg = `Erreur génération montages: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    // Stocker les métadonnées de collecte
    const collecteInfo = {
      date: new Date().toISOString(),
      bofip_count: bofipDocs.length,
      legifrance_count: legifranceDocs.length,
      total: allDocs.length,
      regles_extraites: reglesExtraites.length,
      regles_ajoutees: reglesAjoutees,
      errors
    };

    await kv.set('juridique:last_collecte', collecteInfo);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

    console.log(`✅ Collecte complète terminée en ${duration}`);
    console.log(`   - BOFiP: ${bofipDocs.length} documents`);
    console.log(`   - Legifrance: ${legifranceDocs.length} documents`);
    console.log(`   - Total: ${allDocs.length} documents`);
    console.log(`   - Règles extraites: ${reglesExtraites.length}`);
    console.log(`   - Règles ajoutées: ${reglesAjoutees}`);

    return {
      success: true,
      bofip_count: bofipDocs.length,
      legifrance_count: legifranceDocs.length,
      total: allDocs.length,
      duration,
      errors,
      regles_extraites: reglesExtraites.length,
      regles_ajoutees: reglesAjoutees
    };

  } catch (error) {
    console.error('❌ Erreur fatale lors de la collecte:', error);
    return {
      success: false,
      bofip_count: 0,
      legifrance_count: 0,
      total: 0,
      duration: ((Date.now() - startTime) / 1000).toFixed(1) + 's',
      errors: [...errors, error instanceof Error ? error.message : 'Erreur inconnue']
    };
  }
}

/**
 * Rechercher des documents juridiques
 */
export async function searchDocuments(query?: string, source?: string): Promise<DocumentJuridique[]> {
  console.log(`🔍 Recherche de documents juridiques: query="${query}", source="${source}"`);

  try {
    // Récupérer tous les documents juridiques
    const prefix = source ? `juridique:${source.toLowerCase()}:` : 'juridique:';
    const keys = await kv.getByPrefix(prefix);

    let documents: DocumentJuridique[] = keys
      .filter(item => item.key !== 'juridique:last_collecte')
      .map(item => item.value as DocumentJuridique);

    // Filtrer par query si fournie
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      documents = documents.filter(doc => 
        doc.titre.toLowerCase().includes(queryLower) ||
        doc.texte.toLowerCase().includes(queryLower) ||
        doc.section.toLowerCase().includes(queryLower) ||
        doc.metadata.mots_cles.some(kw => kw.includes(queryLower))
      );
    }

    // Trier par date de publication (plus récent d'abord)
    documents.sort((a, b) => {
      const dateA = new Date(a.date_publication).getTime();
      const dateB = new Date(b.date_publication).getTime();
      return dateB - dateA;
    });

    console.log(`✅ ${documents.length} documents trouvés`);
    return documents;

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
    return [];
  }
}

/**
 * Obtenir les stats de collecte
 */
export async function getCollecteStats() {
  try {
    const lastCollecte = await kv.get('juridique:last_collecte');
    const allDocs = await searchDocuments();
    const reglesCollectees = await kv.getByPrefix('regle_collectee:');

    return {
      last_collecte: lastCollecte || null,
      total_documents: allDocs.length,
      total_regles_collectees: reglesCollectees.length,
      by_source: {
        bofip: allDocs.filter(d => d && d.source === 'BOFiP').length,
        legifrance: allDocs.filter(d => d && d.source === 'Legifrance').length
      }
    };
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return {
      last_collecte: null,
      total_documents: 0,
      total_regles_collectees: 0,
      by_source: { bofip: 0, legifrance: 0 }
    };
  }
}

/**
 * Récupérer toutes les règles collectées automatiquement
 */
export async function getReglesCollectees(): Promise<any[]> {
  try {
    const regles = await kv.getByPrefix('regle_collectee:');
    return regles.map(item => item.value).sort((a: any, b: any) => {
      const dateA = new Date(a.date_extraction || 0).getTime();
      const dateB = new Date(b.date_extraction || 0).getTime();
      return dateB - dateA; // Plus récent d'abord
    });
  } catch (error) {
    console.error('❌ Erreur récupération règles collectées:', error);
    return [];
  }
}

/**
 * Scheduler pour collecte automatique hebdomadaire
 * À appeler via un cron job ou au démarrage du serveur
 */
export async function scheduleWeeklyCollecte() {
  console.log('⏰ Initialisation du scheduler hebdomadaire...');

  // Vérifier la dernière collecte
  const stats = await getCollecteStats();
  const lastCollecte = stats.last_collecte as any;

  if (lastCollecte && lastCollecte.date) {
    const lastDate = new Date(lastCollecte.date);
    const now = new Date();
    const daysSinceLastCollecte = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    console.log(`   Dernière collecte: ${lastDate.toISOString()}`);
    console.log(`   Jours depuis dernière collecte: ${daysSinceLastCollecte.toFixed(1)}`);

    if (daysSinceLastCollecte < 7) {
      console.log('   ⏭️  Collecte déjà effectuée cette semaine, passage à la prochaine');
      return;
    }
  }

  console.log('   ▶️  Lancement de la collecte hebdomadaire...');
  await runCollecte();
}

// Lancer la collecte hebdomadaire au démarrage du serveur
// (en production, utiliser un vrai cron job externe)
setTimeout(() => {
  scheduleWeeklyCollecte().catch(console.error);
}, 5000); // Attendre 5 secondes après le démarrage

// Ensuite, vérifier toutes les 24 heures
setInterval(() => {
  scheduleWeeklyCollecte().catch(console.error);
}, 24 * 60 * 60 * 1000);
