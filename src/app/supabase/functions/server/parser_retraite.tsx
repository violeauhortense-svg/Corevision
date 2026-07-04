/**
 * 📄 PARSER RETRAITE
 * Découpe les documents retraite en sections exploitables
 */

import * as kv from './kv_store.tsx';

interface DocumentRetraite {
  id: string;
  source: 'CNAV' | 'AGIRC-ARRCO' | 'Service-Public';
  titre: string;
  section: string;
  texte: string;
  url: string;
  date_collecte: string;
}

interface SectionRetraite {
  id: string;
  document_id: string;
  source: string;
  titre: string;
  section: string;
  contenu: string;
  url: string;
  date_parsing: string;
}

/**
 * Parser les documents retraite en sections
 */
export async function parserDocumentsRetraite(): Promise<{
  success: boolean;
  sections_count: number;
  errors: string[];
  duration: string;
}> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    console.log('📄 Démarrage parsing documents retraite...');

    // Récupérer les documents
    const documents: DocumentRetraite[] = await kv.get('documents_retraite') || [];

    if (documents.length === 0) {
      throw new Error('Aucun document retraite à parser');
    }

    console.log(`📚 ${documents.length} documents à parser`);

    // Parser chaque document
    const sections: SectionRetraite[] = documents.map((doc, index) => ({
      id: `section_retraite_${index + 1}_${Date.now()}`,
      document_id: doc.id,
      source: doc.source,
      titre: doc.titre,
      section: doc.section,
      contenu: doc.texte,
      url: doc.url,
      date_parsing: new Date().toISOString()
    }));

    // Stocker les sections
    await kv.set('sections_retraite', sections);

    console.log(`✅ ${sections.length} sections parsées et stockées`);

    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

    return {
      success: true,
      sections_count: sections.length,
      errors,
      duration
    };

  } catch (error) {
    console.error('❌ Erreur parsing documents retraite:', error);
    errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    
    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    
    return {
      success: false,
      sections_count: 0,
      errors,
      duration
    };
  }
}

/**
 * Récupérer les sections parsées
 */
export async function getSectionsRetraite(): Promise<SectionRetraite[]> {
  try {
    const sections = await kv.get('sections_retraite');
    return sections || [];
  } catch (error) {
    console.error('❌ Erreur récupération sections retraite:', error);
    return [];
  }
}
