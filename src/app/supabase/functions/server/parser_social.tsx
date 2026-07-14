/**
 * ============================================
 * PARSER SOCIAL
 * ============================================
 * 
 * Module de parsing des documents URSSAF en sections exploitables
 */

import * as kv from './kv_store.tsx';
import { DocumentSocial } from './collecteur_social.tsx';

export interface SectionSociale {
  id: string;
  document_source_id: string;
  titre: string;
  contenu: string;
  mots_cles: string[];
  date_parsing: string;
}

/**
 * Parser tous les documents sociaux en sections
 */
export async function parserTousLesDocumentsSociaux(): Promise<{
  success: boolean;
  sections: SectionSociale[];
  stats: {
    documents_traites: number;
    sections_creees: number;
    erreurs: string[];
  };
}> {
  console.log('🔵 PARSER SOCIAL : Démarrage...');
  
  const sections: SectionSociale[] = [];
  const errors: string[] = [];
  let documentsTraites = 0;

  try {
    // Récupérer tous les documents sociaux
    const documents = await kv.getByPrefix('documents_sociaux:') as DocumentSocial[];
    console.log(`📄 ${documents.length} documents à parser`);

    for (const doc of documents) {
      try {
        // Découper le texte en sections logiques
        const lignes = doc.texte.split('. ');
        
        for (let i = 0; i < lignes.length; i++) {
          const ligne = lignes[i].trim();
          if (ligne.length < 20) continue; // Ignorer les lignes trop courtes

          // Extraire les mots-clés
          const motsCles = extraireMotsCles(ligne);

          const section: SectionSociale = {
            id: `section_${doc.id}_${i}`,
            document_source_id: doc.id,
            titre: doc.section,
            contenu: ligne,
            mots_cles: motsCles,
            date_parsing: new Date().toISOString()
          };

          await kv.set(`sections_sociales:${section.id}`, section);
          sections.push(section);
        }

        documentsTraites++;
      } catch (error) {
        console.error(`❌ Erreur parsing document ${doc.id}:`, error);
        errors.push(`Document ${doc.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    console.log(`✅ ${sections.length} sections créées depuis ${documentsTraites} documents`);

    return {
      success: true,
      sections,
      stats: {
        documents_traites: documentsTraites,
        sections_creees: sections.length,
        erreurs: errors
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors du parsing:', error);
    return {
      success: false,
      sections,
      stats: {
        documents_traites: documentsTraites,
        sections_creees: sections.length,
        erreurs: [...errors, error instanceof Error ? error.message : 'Erreur inconnue']
      }
    };
  }
}

/**
 * Extraire les mots-clés pertinents d'un texte
 */
function extraireMotsCles(texte: string): string[] {
  const motsClesImportants = [
    'cotisation', 'taux', 'plafond', 'salaire', 'employeur', 'salarié',
    'SMIC', 'PSS', 'exonération', 'réduction', 'contribution', 'base',
    'calcul', 'assiette', 'maladie', 'vieillesse', 'chômage', 'retraite',
    'famille', 'formation', 'apprentissage', 'CSG', 'CRDS', 'forfait'
  ];

  const motsTrouves: string[] = [];
  const texteMin = texte.toLowerCase();

  for (const mot of motsClesImportants) {
    if (texteMin.includes(mot.toLowerCase())) {
      motsTrouves.push(mot);
    }
  }

  return motsTrouves;
}

/**
 * Récupérer toutes les sections parsées
 */
export async function getToutesLesSectionsSociales(): Promise<SectionSociale[]> {
  try {
    const sections = await kv.getByPrefix('sections_sociales:');
    return sections as SectionSociale[];
  } catch (error) {
    console.error('❌ Erreur récupération sections:', error);
    return [];
  }
}
