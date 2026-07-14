/**
 * ============================================
 * EXTRACTEUR RÈGLES SOCIALES
 * ============================================
 * 
 * Module d'extraction automatique des règles de cotisations sociales
 */

import * as kv from './kv_store.tsx';
import { SectionSociale } from './parser_social.tsx';

export interface RegleSociale {
  id: string;
  domaine: string;
  regle: string;
  condition: string;
  base_calcul: string;
  taux: string;
  plafond: string;
  consequence: string;
  source: string;
  reference: string;
  date_mise_a_jour: string;
  statut_validation: 'validé' | 'en_attente' | 'à_vérifier';
}

/**
 * Extraire les règles sociales depuis les sections parsées
 */
export async function extraireReglesSociales(): Promise<{
  success: boolean;
  regles: RegleSociale[];
  stats: {
    sections_analysees: number;
    regles_extraites: number;
    erreurs: string[];
  };
}> {
  
  const regles: RegleSociale[] = [];
  const errors: string[] = [];
  let sectionsAnalysees = 0;

  try {
    // Récupérer toutes les sections parsées
    const sections = await kv.getByPrefix('sections_sociales:') as SectionSociale[];

    for (const section of sections) {
      try {
        // Analyser la section pour extraire les règles
        const reglesExtraites = analyserSection(section);
        
        for (const regle of reglesExtraites) {
          await kv.set(`regles_sociales:${regle.id}`, regle);
          regles.push(regle);
        }

        sectionsAnalysees++;
      } catch (error) {
        console.error(`❌ Erreur analyse section ${section.id}:`, error);
        errors.push(`Section ${section.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }


    return {
      success: true,
      regles,
      stats: {
        sections_analysees: sectionsAnalysees,
        regles_extraites: regles.length,
        erreurs: errors
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error);
    return {
      success: false,
      regles,
      stats: {
        sections_analysees: sectionsAnalysees,
        regles_extraites: regles.length,
        erreurs: [...errors, error instanceof Error ? error.message : 'Erreur inconnue']
      }
    };
  }
}

/**
 * Analyser une section pour en extraire les règles
 */
function analyserSection(section: SectionSociale): RegleSociale[] {
  const regles: RegleSociale[] = [];
  const contenu = section.contenu;
  const dateMAJ = new Date().toISOString();

  // Pattern 1 : Détecter les taux de cotisation
  const patternTaux = /(\d+(?:,\d+)?)\s*%/g;
  const tauxTrouves = contenu.match(patternTaux);

  // Pattern 2 : Détecter les plafonds (PSS, SMIC, etc.)
  const patternPlafond = /(PSS|SMIC|plafond)/i;
  const plafondTrouve = contenu.match(patternPlafond);

  // Pattern 3 : Détecter la base de calcul
  const patternBase = /(salaire brut|totalité du salaire|masse salariale|rémunération)/i;
  const baseTrouvee = contenu.match(patternBase);

  // Si on détecte un taux, créer une règle
  if (tauxTrouves && tauxTrouves.length > 0) {
    const regle: RegleSociale = {
      id: `regle_${section.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      domaine: section.titre,
      regle: contenu,
      condition: detecterCondition(contenu),
      base_calcul: baseTrouvee ? baseTrouvee[1] : 'Salaire brut',
      taux: tauxTrouves[0],
      plafond: plafondTrouve ? plafondTrouve[1] : 'Aucun',
      consequence: `Application du taux de ${tauxTrouves[0]}`,
      source: 'URSSAF',
      reference: `https://www.urssaf.fr - ${section.titre}`,
      date_mise_a_jour: dateMAJ,
      statut_validation: 'validé'
    };

    regles.push(regle);
  }

  return regles;
}

/**
 * Détecter les conditions d'application dans un texte
 */
function detecterCondition(texte: string): string {
  const conditions = [
    { pattern: /entreprise(?:s)? de (\d+) salarié(?:s)?/i, template: 'Entreprise de $1 salariés' },
    { pattern: /(\d+(?:,\d+)?)\s*(?:fois le)?\s*SMIC/i, template: 'Salaire $1 SMIC' },
    { pattern: /(\d+(?:,\d+)?)\s*(?:fois le)?\s*PSS/i, template: 'Salaire $1 PSS' },
    { pattern: /salaire(?:s)? inférieur(?:s)? à/i, template: 'Salaire inférieur au seuil' },
    { pattern: /salaire(?:s)? supérieur(?:s)? à/i, template: 'Salaire supérieur au seuil' },
  ];

  for (const cond of conditions) {
    const match = texte.match(cond.pattern);
    if (match) {
      return match[1] ? cond.template.replace('$1', match[1]) : cond.template;
    }
  }

  return 'Applicable à tous les salariés';
}

/**
 * Récupérer toutes les règles sociales
 */
export async function getToutesLesReglesSociales(): Promise<RegleSociale[]> {
  try {
    const regles = await kv.getByPrefix('regles_sociales:');
    return regles as RegleSociale[];
  } catch (error) {
    console.error('❌ Erreur récupération règles sociales:', error);
    return [];
  }
}

/**
 * Initialiser les règles sociales statiques (base de démarrage)
 */
export async function initialiserReglesSocialesStatiques(): Promise<{
  success: boolean;
  count: number;
  regles: RegleSociale[];
}> {
  
  const reglesStatiques: Omit<RegleSociale, 'id'>[] = [
    {
      domaine: 'Cotisations maladie',
      regle: 'Cotisation maladie employeur',
      condition: 'Tous salariés',
      base_calcul: 'Totalité du salaire brut',
      taux: '13%',
      plafond: 'Aucun',
      consequence: 'Cotisation due par l\'employeur',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Cotisations vieillesse',
      regle: 'Cotisation vieillesse plafonnée - Part employeur',
      condition: 'Tous salariés',
      base_calcul: 'Salaire limité au PSS',
      taux: '8,55%',
      plafond: '1 PSS',
      consequence: 'Cotisation employeur sur tranche 1',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Cotisations vieillesse',
      regle: 'Cotisation vieillesse plafonnée - Part salarié',
      condition: 'Tous salariés',
      base_calcul: 'Salaire limité au PSS',
      taux: '6,90%',
      plafond: '1 PSS',
      consequence: 'Cotisation salariale sur tranche 1',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Allocations familiales',
      regle: 'Cotisation allocations familiales - Taux normal',
      condition: 'Salaire > 3,5 SMIC',
      base_calcul: 'Totalité du salaire brut',
      taux: '5,25%',
      plafond: 'Aucun',
      consequence: 'Taux normal allocations familiales',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Allocations familiales',
      regle: 'Cotisation allocations familiales - Taux réduit',
      condition: 'Salaire ≤ 3,5 SMIC',
      base_calcul: 'Totalité du salaire brut',
      taux: '3,45%',
      plafond: 'Aucun',
      consequence: 'Taux réduit pour bas salaires',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Assurance chômage',
      regle: 'Cotisation chômage employeur',
      condition: 'Tous salariés',
      base_calcul: 'Salaire limité à 4 PSS',
      taux: '4,05%',
      plafond: '4 PSS',
      consequence: 'Cotisation Pôle Emploi',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Formation professionnelle',
      regle: 'Contribution formation < 11 salariés',
      condition: 'Entreprise < 11 salariés',
      base_calcul: 'Masse salariale brute',
      taux: '0,55%',
      plafond: 'Aucun',
      consequence: 'Contribution formation professionnelle',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Formation professionnelle',
      regle: 'Contribution formation ≥ 11 salariés',
      condition: 'Entreprise ≥ 11 salariés',
      base_calcul: 'Masse salariale brute',
      taux: '1%',
      plafond: 'Aucun',
      consequence: 'Contribution formation professionnelle',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'CSG-CRDS',
      regle: 'CSG déductible',
      condition: 'Tous salariés',
      base_calcul: '98,25% du salaire brut',
      taux: '6,80%',
      plafond: 'Aucun',
      consequence: 'CSG déductible de l\'impôt',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'CSG-CRDS',
      regle: 'CSG non déductible',
      condition: 'Tous salariés',
      base_calcul: '98,25% du salaire brut',
      taux: '2,40%',
      plafond: 'Aucun',
      consequence: 'CSG non déductible',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'CSG-CRDS',
      regle: 'CRDS',
      condition: 'Tous salariés',
      base_calcul: '98,25% du salaire brut',
      taux: '0,50%',
      plafond: 'Aucun',
      consequence: 'Remboursement dette sociale',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Retraite complémentaire',
      regle: 'AGIRC-ARRCO Tranche 1',
      condition: 'Salaire ≤ PSS',
      base_calcul: 'Salaire tranche 1',
      taux: '7,87%',
      plafond: '1 PSS',
      consequence: 'Retraite complémentaire T1 (60% employeur, 40% salarié)',
      source: 'AGIRC-ARRCO',
      reference: 'https://www.agirc-arrco.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Retraite complémentaire',
      regle: 'AGIRC-ARRCO Tranche 2',
      condition: 'Salaire entre 1 et 8 PSS',
      base_calcul: 'Salaire tranche 2',
      taux: '21,59%',
      plafond: '8 PSS',
      consequence: 'Retraite complémentaire T2 (60% employeur, 40% salarié)',
      source: 'AGIRC-ARRCO',
      reference: 'https://www.agirc-arrco.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Accidents du travail',
      regle: 'Cotisation AT/MP',
      condition: 'Tous salariés',
      base_calcul: 'Totalité du salaire brut',
      taux: 'Variable selon secteur (moy. 2,30%)',
      plafond: 'Aucun',
      consequence: 'Taux variable selon sinistralité',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    },
    {
      domaine: 'Taxe d\'apprentissage',
      regle: 'Taxe d\'apprentissage',
      condition: 'Toutes entreprises',
      base_calcul: 'Masse salariale brute',
      taux: '0,68%',
      plafond: 'Aucun',
      consequence: 'Financement apprentissage (0,59% + 0,09%)',
      source: 'URSSAF',
      reference: 'https://www.urssaf.fr',
      date_mise_a_jour: new Date().toISOString(),
      statut_validation: 'validé'
    }
  ];

  const regles: RegleSociale[] = [];

  for (const regleData of reglesStatiques) {
    const regle: RegleSociale = {
      ...regleData,
      id: `regle_sociale_static_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };

    await kv.set(`regles_sociales:${regle.id}`, regle);
    regles.push(regle);
  }


  return {
    success: true,
    count: regles.length,
    regles
  };
}
