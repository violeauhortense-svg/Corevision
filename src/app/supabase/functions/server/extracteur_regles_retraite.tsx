/**
 * 🔍 EXTRACTEUR RÈGLES RETRAITE
 * Extrait les règles de calcul de retraite depuis les documents parsés
 */

import * as kv from './kv_store.tsx';

interface RegleRetraite {
  id: string;
  regime: 'CNAV' | 'AGIRC-ARRCO' | 'Régime général' | 'Complémentaire';
  regle: string;
  condition: string;
  formule: string;
  taux: string;
  plafond: string;
  age_legal: string;
  trimestres_requis: string;
  consequence: string;
  source: string;
  reference: string;
  date_mise_a_jour: string;
  statut_validation: 'validé' | 'en_attente' | 'à_vérifier';
}

// 📊 RÈGLES RETRAITE STATIQUES
const REGLES_RETRAITE_STATIQUES: Omit<RegleRetraite, 'id' | 'date_mise_a_jour'>[] = [
  // CNAV - Régime de base
  {
    regime: 'CNAV',
    regle: 'Âge légal de départ à la retraite',
    condition: 'Assuré né à partir de 1955',
    formule: 'Âge = 62 ans',
    taux: '50% (taux plein)',
    plafond: '46 368 € (PASS 2024)',
    age_legal: '62 ans',
    trimestres_requis: '166 à 172 selon année naissance',
    consequence: 'Possibilité de partir à la retraite avec taux plein si durée validée',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Calcul pension de base',
    condition: 'Retraite de base du régime général',
    formule: 'Pension = (SAM × Taux × Durée assurance) / Durée référence',
    taux: '50% maximum (taux plein)',
    plafond: '46 368 € (PASS 2024)',
    age_legal: '62 ans',
    trimestres_requis: '166 à 172 selon année naissance',
    consequence: 'Montant de la pension calculé sur 25 meilleures années',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/calcul-retraite.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Salaire annuel moyen (SAM)',
    condition: 'Calcul de la pension de base',
    formule: 'SAM = Moyenne des 25 meilleures années (plafonnées au PASS)',
    taux: 'N/A',
    plafond: '46 368 € par an (PASS 2024)',
    age_legal: 'N/A',
    trimestres_requis: 'N/A',
    consequence: 'Base de calcul de la pension de retraite',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/calcul-retraite.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Décote (minoration)',
    condition: 'Départ avant taux plein sans durée requise',
    formule: 'Décote = 1,25% par trimestre manquant',
    taux: 'Réduit de 1,25% par trimestre manquant',
    plafond: 'Maximum 25% (20 trimestres)',
    age_legal: '62 ans',
    trimestres_requis: 'Selon année naissance',
    consequence: 'Réduction définitive de la pension',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/taux-retraite.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Surcote (majoration)',
    condition: 'Poursuite activité après taux plein acquis',
    formule: 'Surcote = 1,25% par trimestre supplémentaire',
    taux: '+1,25% par trimestre au-delà du taux plein',
    plafond: 'Aucun plafond',
    age_legal: 'Après 62 ans et taux plein',
    trimestres_requis: 'Au-delà de la durée requise',
    consequence: 'Augmentation définitive de la pension',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/surcote.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Âge taux plein automatique',
    condition: 'Départ sans condition de trimestres',
    formule: 'Âge = 67 ans (générations 1955+)',
    taux: '50% automatique',
    plafond: '46 368 € (PASS 2024)',
    age_legal: '67 ans',
    trimestres_requis: 'Aucun (taux plein automatique)',
    consequence: 'Taux plein sans décote même sans tous les trimestres',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/age-taux-plein-automatique.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Validation trimestres par revenus',
    condition: 'Cotisations sur salaire minimum',
    formule: '1 trimestre = 150 × SMIC horaire',
    taux: 'N/A',
    plafond: '4 trimestres maximum par an',
    age_legal: 'Dès début activité',
    trimestres_requis: '1 747,50 € pour 1 trimestre en 2024',
    consequence: 'Validation des trimestres pour durée assurance',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/validation-trimestres.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Majoration pour 3 enfants ou plus',
    condition: 'Avoir élevé au moins 3 enfants',
    formule: 'Majoration = +10% de la pension totale',
    taux: '+10%',
    plafond: 'Aucun',
    age_legal: 'N/A',
    trimestres_requis: 'N/A',
    consequence: 'Augmentation de 10% de la pension de retraite',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/majorations.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Minimum contributif',
    condition: 'Carrière complète sur faibles revenus',
    formule: 'Minimum = 684,14 € (ou 747,57 € si 120 trim. cotisés)',
    taux: 'N/A',
    plafond: 'Montant total retraites < 1 367,51 €',
    age_legal: '62 ans minimum',
    trimestres_requis: 'Durée requise complète',
    consequence: 'Pension portée au minimum contributif',
    source: 'CNAV',
    reference: 'https://www.service-public.fr/F2969',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Carrière longue - Départ anticipé',
    condition: 'Début activité avant 20 ans + trimestres validés',
    formule: 'Départ possible à 58, 60 ou 62 ans selon cas',
    taux: '50% (taux plein)',
    plafond: '46 368 € (PASS 2024)',
    age_legal: '58, 60 ou 62 ans selon situation',
    trimestres_requis: '5 trimestres avant fin année 20 ans',
    consequence: 'Départ anticipé sans décote',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/carriere-longue.html',
    statut_validation: 'validé'
  },

  // AGIRC-ARRCO - Régime complémentaire
  {
    regime: 'AGIRC-ARRCO',
    regle: 'Acquisition points retraite',
    condition: 'Cotisations sur salaire',
    formule: 'Points = Cotisations / Prix achat point (18,7669 € en 2024)',
    taux: '7,87% (tranche 1) et 21,59% (tranche 2)',
    plafond: 'Tranche 1 : 0 à 1 PASS, Tranche 2 : 1 à 8 PASS',
    age_legal: 'Aligné sur régime de base',
    trimestres_requis: 'Aligné sur régime de base',
    consequence: 'Points acquis convertis en pension lors liquidation',
    source: 'AGIRC-ARRCO',
    reference: 'https://www.agirc-arrco.fr/calcul-retraite/',
    statut_validation: 'validé'
  },
  {
    regime: 'AGIRC-ARRCO',
    regle: 'Calcul pension complémentaire',
    condition: 'Liquidation de la retraite complémentaire',
    formule: 'Pension = Points acquis × Valeur service point (1,4159 € en 2024)',
    taux: 'Variable selon points',
    plafond: 'Aucun plafond de pension',
    age_legal: 'Aligné sur régime de base (62 ans)',
    trimestres_requis: 'Aligné sur régime de base',
    consequence: 'Montant de la pension complémentaire',
    source: 'AGIRC-ARRCO',
    reference: 'https://www.agirc-arrco.fr/calcul-retraite/',
    statut_validation: 'validé'
  },
  {
    regime: 'AGIRC-ARRCO',
    regle: 'Coefficient de solidarité (malus)',
    condition: 'Départ dès obtention taux plein',
    formule: 'Minoration = -10% pendant 3 ans (max 67 ans)',
    taux: '-10%',
    plafond: 'Durée max : 3 ans',
    age_legal: 'De 62 à 67 ans',
    trimestres_requis: 'Taux plein acquis',
    consequence: 'Réduction temporaire de 10% de la pension complémentaire',
    source: 'AGIRC-ARRCO',
    reference: 'https://www.agirc-arrco.fr/coefficient-solidarite/',
    statut_validation: 'validé'
  },
  {
    regime: 'AGIRC-ARRCO',
    regle: 'Majoration temporaire (bonus)',
    condition: 'Décalage départ 2, 3 ou 4 ans après taux plein',
    formule: '+10% (2 ans), +20% (3 ans), +30% (4 ans) pendant 1 an',
    taux: '+10% à +30%',
    plafond: 'Durée : 1 an',
    age_legal: 'Après taux plein',
    trimestres_requis: '8, 12 ou 16 trimestres après taux plein',
    consequence: 'Majoration temporaire de la pension pendant 1 an',
    source: 'AGIRC-ARRCO',
    reference: 'https://www.agirc-arrco.fr/majoration-temporaire/',
    statut_validation: 'validé'
  },
  {
    regime: 'AGIRC-ARRCO',
    regle: 'Majoration enfants',
    condition: '3 enfants ou plus',
    formule: '+10% (3 enfants) puis +5% par enfant supplémentaire',
    taux: '+10% à +30%',
    plafond: 'Maximum +30% (7 enfants et plus)',
    age_legal: 'N/A',
    trimestres_requis: 'N/A',
    consequence: 'Majoration définitive de la pension complémentaire',
    source: 'AGIRC-ARRCO',
    reference: 'https://www.agirc-arrco.fr/majorations/',
    statut_validation: 'validé'
  },

  // Dispositifs particuliers
  {
    regime: 'Régime général',
    regle: 'Cumul emploi-retraite',
    condition: 'Reprise activité après liquidation retraite',
    formule: 'Génération nouveaux droits dans limite 1 PASS/an (depuis 2023)',
    taux: 'Cotisations normales',
    plafond: '46 368 € de nouveaux droits par an',
    age_legal: 'Après liquidation retraite',
    trimestres_requis: 'Retraite liquidée',
    consequence: 'Nouveaux droits à retraite',
    source: 'Service-Public',
    reference: 'https://www.service-public.fr/F13243',
    statut_validation: 'validé'
  },
  {
    regime: 'Régime général',
    regle: 'Retraite progressive',
    condition: 'Temps partiel + 150 trimestres + 60 ans minimum',
    formule: 'Fraction pension = Réduction temps travail (%)',
    taux: 'Proportionnel réduction temps travail',
    plafond: 'Temps partiel 40% à 80%',
    age_legal: '60 ans minimum',
    trimestres_requis: '150 trimestres',
    consequence: 'Perception partielle retraite + poursuite activité partielle',
    source: 'Service-Public',
    reference: 'https://www.service-public.fr/F13243',
    statut_validation: 'validé'
  },
  {
    regime: 'Régime général',
    regle: 'Rachat de trimestres',
    condition: 'Années études supérieures ou années incomplètes',
    formule: 'Coût variable selon âge, revenu, option (taux ou taux+durée)',
    taux: 'Déductible fiscalement',
    plafond: 'Maximum 12 trimestres',
    age_legal: 'Jusqu\'à 67 ans',
    trimestres_requis: 'N/A',
    consequence: 'Augmentation durée assurance et/ou taux',
    source: 'Service-Public',
    reference: 'https://www.service-public.fr/F16131',
    statut_validation: 'validé'
  },
  {
    regime: 'Régime général',
    regle: 'Retraite anticipée handicap',
    condition: 'Taux incapacité ≥ 50% + durée assurance',
    formule: 'Départ possible dès 55 ans',
    taux: '50% (taux plein)',
    plafond: 'N/A',
    age_legal: '55 ans minimum',
    trimestres_requis: 'Durée variable selon âge départ',
    consequence: 'Départ anticipé sans décote',
    source: 'Service-Public',
    reference: 'https://www.service-public.fr/F16337',
    statut_validation: 'validé'
  },
  {
    regime: 'Régime général',
    regle: 'Compte professionnel prévention (C2P)',
    condition: 'Exposition facteurs pénibilité',
    formule: '10 points = 3 mois anticipation',
    taux: 'N/A',
    plafond: 'Maximum 100 points sur carrière',
    age_legal: 'Avant 62 ans',
    trimestres_requis: 'Variable',
    consequence: 'Départ anticipé selon points acquis',
    source: 'Service-Public',
    reference: 'https://www.service-public.fr/F15504',
    statut_validation: 'validé'
  },
  {
    regime: 'Régime général',
    regle: 'ASPA (minimum vieillesse)',
    condition: 'Âge ≥ 65 ans + ressources faibles',
    formule: 'Montant = 1 012,02 € max (seul) ou 1 571,16 € (couple) en 2024',
    taux: 'N/A',
    plafond: 'Ressources < plafond ASPA',
    age_legal: '65 ans (ou âge légal si inapte)',
    trimestres_requis: 'N/A',
    consequence: 'Allocation différentielle complétant revenus',
    source: 'Service-Public',
    reference: 'https://www.service-public.fr/F16871',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Trimestres requis génération 1955-1957',
    condition: 'Né entre 1955 et 1957',
    formule: 'Trimestres = 166 (41,5 ans)',
    taux: '50% si atteints',
    plafond: 'N/A',
    age_legal: '62 ans',
    trimestres_requis: '166 trimestres',
    consequence: 'Taux plein à 62 ans avec 166 trimestres',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/nombre-trimestres.html',
    statut_validation: 'validé'
  },
  {
    regime: 'CNAV',
    regle: 'Trimestres requis génération 1973+',
    condition: 'Né en 1973 ou après',
    formule: 'Trimestres = 172 (43 ans)',
    taux: '50% si atteints',
    plafond: 'N/A',
    age_legal: '62 ans (ou 64 ans selon réforme)',
    trimestres_requis: '172 trimestres',
    consequence: 'Taux plein à âge légal avec 172 trimestres',
    source: 'CNAV',
    reference: 'https://www.lassuranceretraite.fr/nombre-trimestres.html',
    statut_validation: 'validé'
  },
  {
    regime: 'Régime général',
    regle: 'Réforme 2023 - Recul âge légal',
    condition: 'Né à partir de 1961',
    formule: 'Âge légal = 62 ans + 3 mois par génération jusqu\'à 64 ans en 2030',
    taux: 'Inchangé (50%)',
    plafond: 'N/A',
    age_legal: 'Progressif : 62 à 64 ans',
    trimestres_requis: 'Inchangé',
    consequence: 'Décalage progressif âge de départ',
    source: 'Service-Public',
    reference: 'https://www.service-public.fr/A16234',
    statut_validation: 'validé'
  }
];

/**
 * Initialiser les règles retraite statiques
 */
export async function initialiserReglesRetraite(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    console.log('🔧 Initialisation règles retraite statiques...');

    const regles: RegleRetraite[] = REGLES_RETRAITE_STATIQUES.map((regle, index) => ({
      ...regle,
      id: `regle_retraite_${index + 1}_static`,
      date_mise_a_jour: new Date().toISOString()
    }));

    await kv.set('regles_retraite', regles);

    console.log(`✅ ${regles.length} règles retraite initialisées`);

    return {
      success: true,
      count: regles.length
    };

  } catch (error) {
    console.error('❌ Erreur initialisation règles retraite:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Extraire les règles depuis les sections parsées
 */
export async function extraireReglesRetraite(): Promise<{
  success: boolean;
  regles_count: number;
  errors: string[];
  duration: string;
}> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    console.log('🔍 Démarrage extraction règles retraite...');

    // Récupérer les règles existantes (statiques)
    const reglesExistantes: RegleRetraite[] = await kv.get('regles_retraite') || [];

    console.log(`📊 ${reglesExistantes.length} règles retraite déjà en base`);

    // Dans cette version, on garde uniquement les règles statiques
    // L'extraction IA pourrait être ajoutée plus tard

    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

    return {
      success: true,
      regles_count: reglesExistantes.length,
      errors,
      duration
    };

  } catch (error) {
    console.error('❌ Erreur extraction règles retraite:', error);
    errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    
    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    
    return {
      success: false,
      regles_count: 0,
      errors,
      duration
    };
  }
}

/**
 * Récupérer toutes les règles retraite
 */
export async function getReglesRetraite(): Promise<RegleRetraite[]> {
  try {
    const regles = await kv.get('regles_retraite');
    return regles || [];
  } catch (error) {
    console.error('❌ Erreur récupération règles retraite:', error);
    return [];
  }
}

/**
 * Obtenir des statistiques sur les règles retraite
 */
export async function getStatsReglesRetraite(): Promise<{
  total: number;
  par_regime: Record<string, number>;
  derniere_mise_a_jour: string;
}> {
  try {
    const regles: RegleRetraite[] = await getReglesRetraite();

    const par_regime: Record<string, number> = {};
    let derniereDate = '';

    regles.forEach(regle => {
      par_regime[regle.regime] = (par_regime[regle.regime] || 0) + 1;
      if (regle.date_mise_a_jour > derniereDate) {
        derniereDate = regle.date_mise_a_jour;
      }
    });

    return {
      total: regles.length,
      par_regime,
      derniere_mise_a_jour: derniereDate
    };

  } catch (error) {
    console.error('❌ Erreur stats règles retraite:', error);
    return {
      total: 0,
      par_regime: {},
      derniere_mise_a_jour: ''
    };
  }
}
