/**
 * ============================================
 * COLLECTEUR SOCIAL URSSAF
 * ============================================
 * 
 * Module de collecte automatique des documents URSSAF
 * Source : https://www.urssaf.fr/accueil/outils-documentation.html
 */

import * as kv from './kv_store.tsx';

// Types
export interface DocumentSocial {
  id: string;
  source: string;
  titre: string;
  section: string;
  texte: string;
  date_collecte: string;
}

export interface CollecteStats {
  documents_collectes: number;
  derniere_collecte: string;
  source: string;
  erreurs: string[];
}

/**
 * Collecter les documents URSSAF
 */
export async function collecterDocumentsURSSAF(): Promise<{
  success: boolean;
  documents: DocumentSocial[];
  stats: CollecteStats;
  errors: string[];
}> {
  
  const documents: DocumentSocial[] = [];
  const errors: string[] = [];
  const dateCollecte = new Date().toISOString();

  try {
    // Simuler la collecte de documents URSSAF (en production, scraper réel)
    const documentsURSSAF: Omit<DocumentSocial, 'id'>[] = [
      {
        source: 'URSSAF',
        titre: 'Cotisations sociales - Taux et assiettes 2024',
        section: 'Cotisations maladie',
        texte: 'La cotisation maladie est due par l\'employeur au taux de 13% sur la totalité du salaire brut. La cotisation complémentaire maladie solidarité s\'élève à 0,50% pour les salaires supérieurs à 2,5 SMIC.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Cotisations sociales - Taux et assiettes 2024',
        section: 'Cotisations vieillesse',
        texte: 'La cotisation vieillesse plafonnée est répartie entre l\'employeur (8,55%) et le salarié (6,90%) sur la part du salaire limitée au plafond de la sécurité sociale (PSS). La cotisation vieillesse déplafonnée est de 1,90% pour l\'employeur et 0,40% pour le salarié sur la totalité du salaire.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Cotisations sociales - Taux et assiettes 2024',
        section: 'Allocations familiales',
        texte: 'Le taux de la cotisation d\'allocations familiales est de 3,45% sur la totalité du salaire brut. Un taux réduit de 0,10% s\'applique aux salaires inférieurs à 3,5 SMIC.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Cotisations sociales - Taux et assiettes 2024',
        section: 'Contribution solidarité autonomie',
        texte: 'La contribution solidarité autonomie (CSA) est due par l\'employeur au taux de 0,30% sur la totalité du salaire brut.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Cotisations sociales - Taux et assiettes 2024',
        section: 'Accidents du travail',
        texte: 'Le taux de cotisation accidents du travail varie selon le secteur d\'activité et la sinistralité de l\'entreprise. Le taux moyen national est de 2,30% sur la totalité du salaire brut.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Cotisations sociales - Taux et assiettes 2024',
        section: 'Contribution au dialogue social',
        texte: 'La contribution au dialogue social est due par les entreprises de 11 salariés et plus au taux de 0,016% sur la totalité des salaires bruts.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Réduction générale des cotisations patronales',
        section: 'Réduction Fillon',
        texte: 'La réduction générale des cotisations patronales s\'applique aux salaires jusqu\'à 1,6 SMIC. Le coefficient de réduction est calculé selon la formule : (0,3214 / 0,6) × (1,6 × SMIC annuel / rémunération annuelle brute - 1).',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Plafond de la sécurité sociale 2024',
        section: 'PSS',
        texte: 'Le plafond de la sécurité sociale pour 2024 est fixé à 3 864 € par mois, soit 46 368 € par an. Ce plafond sert de base au calcul de certaines cotisations et prestations sociales.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Contributions formation professionnelle',
        section: 'Formation professionnelle',
        texte: 'Les entreprises de moins de 11 salariés doivent verser une contribution de 0,55% de la masse salariale. Les entreprises de 11 salariés et plus doivent verser 1% de la masse salariale.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Taxe d\'apprentissage',
        section: 'Apprentissage',
        texte: 'La taxe d\'apprentissage est due par toutes les entreprises au taux de 0,68% de la masse salariale brute. Elle se décompose en 0,59% pour la part principale et 0,09% pour le solde.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Contribution supplémentaire à l\'apprentissage',
        section: 'CSA apprentissage',
        texte: 'Les entreprises de 250 salariés et plus qui emploient moins de 5% d\'alternants doivent s\'acquitter d\'une contribution supplémentaire à l\'apprentissage dont le taux varie de 0,05% à 0,60% selon le taux d\'alternants.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Participation effort construction',
        section: 'PEEC',
        texte: 'Les entreprises de 50 salariés et plus doivent consacrer 0,45% de la masse salariale à la participation à l\'effort de construction (PEEC).',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Forfait social',
        section: 'Forfait social',
        texte: 'Le forfait social est une contribution patronale au taux de 20% applicable sur les sommes exonérées de cotisations sociales mais assujetties à la CSG : intéressement, participation, abondement PEE/PERCO, contributions patronales de prévoyance complémentaire.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Cotisations chômage',
        section: 'Assurance chômage',
        texte: 'La cotisation d\'assurance chômage est due par l\'employeur au taux de 4,05% sur la part du salaire limitée à 4 fois le plafond de la sécurité sociale.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'AGS - Garantie des salaires',
        section: 'AGS',
        texte: 'La cotisation AGS (Association pour la Gestion du régime de garantie des créances des Salariés) est due par l\'employeur au taux de 0,15% sur la part du salaire limitée à 4 fois le plafond de la sécurité sociale.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Retraite complémentaire AGIRC-ARRCO',
        section: 'Retraite complémentaire',
        texte: 'La cotisation de retraite complémentaire AGIRC-ARRCO est répartie entre l\'employeur (60%) et le salarié (40%). Tranche 1 (salaire ≤ PSS) : taux de 7,87%. Tranche 2 (salaire entre 1 et 8 PSS) : taux de 21,59%.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Contribution d\'équilibre général (CEG)',
        section: 'CEG',
        texte: 'La contribution d\'équilibre général est de 2,15% sur la tranche 1 (salaire ≤ PSS) et de 2,70% sur la tranche 2 (salaire entre 1 et 8 PSS), répartie entre employeur (60%) et salarié (40%).',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Contribution d\'équilibre technique (CET)',
        section: 'CET',
        texte: 'La contribution d\'équilibre technique s\'applique uniquement sur la tranche 2 (salaire entre 1 et 8 PSS) au taux de 0,35%, répartie entre employeur (60%) et salarié (40%).',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Prévoyance cadres',
        section: 'Prévoyance',
        texte: 'Les entreprises employant des cadres doivent souscrire une garantie décès au minimum égale à 1,50% de la tranche A du salaire (salaire ≤ PSS).',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Mutuelle d\'entreprise obligatoire',
        section: 'Complémentaire santé',
        texte: 'Depuis 2016, toutes les entreprises doivent proposer une complémentaire santé collective à leurs salariés. L\'employeur doit financer au minimum 50% de la cotisation.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'CSG-CRDS sur salaires',
        section: 'CSG-CRDS',
        texte: 'La CSG (Contribution Sociale Généralisée) est prélevée au taux global de 9,20% sur 98,25% du salaire brut (dont 6,80% déductible de l\'impôt sur le revenu). La CRDS (Contribution au Remboursement de la Dette Sociale) est de 0,50% sur 98,25% du salaire brut.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Exonérations heures supplémentaires',
        section: 'Heures supplémentaires',
        texte: 'Les heures supplémentaires et complémentaires sont exonérées de cotisations salariales d\'assurance vieillesse dans la limite de 11,31% du salaire. Elles bénéficient également d\'une réduction de cotisations patronales.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Réduction de cotisations allocations familiales',
        section: 'Réduction allocations familiales',
        texte: 'Les employeurs bénéficient d\'une réduction de cotisation d\'allocations familiales pour les salaires inférieurs à 3,5 SMIC. Le taux réduit est de 3,45% au lieu de 5,25%.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Contribution unique à la formation professionnelle et à l\'alternance',
        section: 'CUFPA',
        texte: 'La CUFPA regroupe la contribution à la formation professionnelle, la taxe d\'apprentissage et la contribution supplémentaire à l\'apprentissage. Elle est collectée par l\'URSSAF depuis 2022.',
        date_collecte: dateCollecte
      },
      {
        source: 'URSSAF',
        titre: 'Taux réduit allocations familiales',
        section: 'Taux réduit',
        texte: 'Un taux réduit de cotisation d\'allocations familiales de 3,45% (au lieu de 5,25%) s\'applique aux rémunérations n\'excédant pas 3,5 fois le SMIC calculé sur un an.',
        date_collecte: dateCollecte
      }
    ];

    // Stocker chaque document dans le KV store
    for (const doc of documentsURSSAF) {
      const docWithId: DocumentSocial = {
        ...doc,
        id: `doc_social_${Date.now()}_${Math.random().toString(36).substring(7)}`
      };
      
      await kv.set(`documents_sociaux:${docWithId.id}`, docWithId);
      documents.push(docWithId);
    }


    // Sauvegarder les stats de collecte
    const stats: CollecteStats = {
      documents_collectes: documents.length,
      derniere_collecte: dateCollecte,
      source: 'URSSAF',
      erreurs: errors
    };

    await kv.set('collecte_social_stats', stats);

    return {
      success: true,
      documents,
      stats,
      errors
    };

  } catch (error) {
    console.error('❌ Erreur lors de la collecte URSSAF:', error);
    errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    
    return {
      success: false,
      documents,
      stats: {
        documents_collectes: documents.length,
        derniere_collecte: dateCollecte,
        source: 'URSSAF',
        erreurs: errors
      },
      errors
    };
  }
}

/**
 * Récupérer tous les documents sociaux collectés
 */
export async function getTousLesDocumentsSociaux(): Promise<DocumentSocial[]> {
  try {
    const allDocs = await kv.getByPrefix('documents_sociaux:');
    return allDocs as DocumentSocial[];
  } catch (error) {
    console.error('❌ Erreur récupération documents sociaux:', error);
    return [];
  }
}

/**
 * Récupérer les stats de collecte
 */
export async function getStatsCollecteSociale(): Promise<CollecteStats | null> {
  try {
    const stats = await kv.get('collecte_social_stats');
    return stats as CollecteStats | null;
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return null;
  }
}
