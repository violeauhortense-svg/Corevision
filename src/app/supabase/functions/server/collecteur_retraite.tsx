/**
 * 🏛️ COLLECTEUR RETRAITE
 * Collecte les documents officiels sur les règles de retraite
 * Sources : CNAV, AGIRC ARRCO, Service-Public.fr
 */

import * as kv from './kv_store.tsx';

// Types
interface DocumentRetraite {
  id: string;
  source: 'CNAV' | 'AGIRC-ARRCO' | 'Service-Public';
  titre: string;
  section: string;
  texte: string;
  url: string;
  date_collecte: string;
}

// 📚 DOCUMENTS RETRAITE STATIQUES
// Sources : CNAV, AGIRC ARRCO, Service-Public.fr
const DOCUMENTS_RETRAITE_STATIQUES: Omit<DocumentRetraite, 'id' | 'date_collecte'>[] = [
  // CNAV - Conditions d'âge
  {
    source: 'CNAV',
    titre: 'Âge légal de départ à la retraite',
    section: 'Conditions générales',
    texte: 'L\'âge légal de départ à la retraite est fixé à 62 ans pour les assurés nés à partir de 1955. Pour bénéficier d\'une retraite à taux plein, il faut avoir validé entre 166 et 172 trimestres selon l\'année de naissance.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/depart-retraite.html'
  },
  {
    source: 'CNAV',
    titre: 'Retraite anticipée pour carrière longue',
    section: 'Départs anticipés',
    texte: 'Il est possible de partir à la retraite avant 62 ans si vous avez commencé à travailler avant 20 ans et validé un nombre suffisant de trimestres. Le départ est possible dès 58, 60 ou 62 ans selon les situations.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/depart-anticipe/carriere-longue.html'
  },
  {
    source: 'CNAV',
    titre: 'Calcul de la pension de base',
    section: 'Montant de la retraite',
    texte: 'La pension de retraite de base est calculée selon la formule : (Salaire annuel moyen × Taux × Durée d\'assurance) / Durée de référence. Le salaire annuel moyen est calculé sur les 25 meilleures années.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/calcul-retraite.html'
  },
  {
    source: 'CNAV',
    titre: 'Taux de liquidation - Taux plein',
    section: 'Montant de la retraite',
    texte: 'Le taux plein de 50% est applicable si vous avez le nombre de trimestres requis ou si vous avez atteint l\'âge du taux plein automatique (67 ans pour les générations nées à partir de 1955). Sinon, une décote de 1,25% par trimestre manquant est appliquée.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/calcul-retraite/taux-retraite.html'
  },
  {
    source: 'CNAV',
    titre: 'Trimestres requis selon année de naissance',
    section: 'Durée d\'assurance',
    texte: 'Le nombre de trimestres requis pour une retraite à taux plein varie selon l\'année de naissance : 166 trimestres (41,5 ans) pour les personnes nées entre 1955 et 1957, 167 trimestres pour 1958-1960, 168 pour 1961-1963, 169 pour 1964-1966, 170 pour 1967-1969, 171 pour 1970-1972, 172 pour 1973 et après.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/depart-retraite/nombre-trimestres.html'
  },
  {
    source: 'CNAV',
    titre: 'Validation de trimestres',
    section: 'Durée d\'assurance',
    texte: 'Un trimestre est validé pour un montant de revenus cotisés égal à 150 fois le SMIC horaire brut. En 2024, il faut gagner 1 747,50 € pour valider un trimestre. On peut valider au maximum 4 trimestres par an, quel que soit le moment où les revenus ont été perçus.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/duree-assurance/validation-trimestres.html'
  },
  {
    source: 'CNAV',
    titre: 'Majoration pour enfants',
    section: 'Majorations',
    texte: 'Une majoration de 10% de la pension est accordée aux assurés ayant eu ou élevé au moins 3 enfants. Cette majoration s\'applique sur le montant total de la retraite de base.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/calcul-retraite/majorations.html'
  },
  {
    source: 'CNAV',
    titre: 'Plafond de la Sécurité sociale',
    section: 'Cotisations',
    texte: 'Les cotisations retraite de base sont calculées dans la limite du Plafond de la Sécurité sociale (PASS). En 2024, le PASS annuel est de 46 368 €. Les revenus au-delà du PASS ne génèrent pas de droits à la retraite de base.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/parcours-professionnel/cotisations-retraite.html'
  },

  // AGIRC-ARRCO - Retraite complémentaire
  {
    source: 'AGIRC-ARRCO',
    titre: 'Acquisition des points retraite',
    section: 'Points retraite',
    texte: 'Le régime AGIRC-ARRCO fonctionne par points. Les cotisations versées sont converties en points selon le prix d\'achat du point. En 2024, le prix d\'achat est de 18,7669 €. Les points acquis sont multipliés par la valeur de service du point (1,4159 € en 2024) lors de la liquidation.',
    url: 'https://www.agirc-arrco.fr/particuliers/comprendre-retraite-complementaire/calcul-retraite/'
  },
  {
    source: 'AGIRC-ARRCO',
    titre: 'Taux de cotisation AGIRC-ARRCO',
    section: 'Cotisations',
    texte: 'Le taux de cotisation AGIRC-ARRCO est de 7,87% (part salariale et patronale) sur la tranche 1 (salaires jusqu\'au PASS) et de 21,59% sur la tranche 2 (salaires entre 1 et 8 PASS). La répartition est de 60% employeur et 40% salarié.',
    url: 'https://www.agirc-arrco.fr/particuliers/comprendre-retraite-complementaire/cotisations/'
  },
  {
    source: 'AGIRC-ARRCO',
    titre: 'Calcul de la pension complémentaire',
    section: 'Montant de la retraite',
    texte: 'Le montant de la retraite complémentaire = Nombre de points acquis × Valeur de service du point. Des coefficients de minoration ou majoration peuvent s\'appliquer selon l\'âge de départ et la durée de cotisation.',
    url: 'https://www.agirc-arrco.fr/particuliers/comprendre-retraite-complementaire/calcul-retraite/'
  },
  {
    source: 'AGIRC-ARRCO',
    titre: 'Coefficient de solidarité (malus temporaire)',
    section: 'Coefficients',
    texte: 'Un coefficient de solidarité de 10% est appliqué pendant 3 ans (dans la limite de l\'âge de 67 ans) si vous partez dès l\'obtention du taux plein. Pour éviter ce malus, vous pouvez décaler votre départ d\'un an après le taux plein.',
    url: 'https://www.agirc-arrco.fr/particuliers/comprendre-retraite-complementaire/age-et-montant-retraite/coefficient-solidarite/'
  },
  {
    source: 'AGIRC-ARRCO',
    titre: 'Majoration temporaire (bonus)',
    section: 'Coefficients',
    texte: 'Si vous décalez votre départ de 2 ans après l\'obtention du taux plein, vous bénéficiez d\'une majoration de 10% pendant 1 an. Pour 3 ans de décalage : 20% pendant 1 an. Pour 4 ans : 30% pendant 1 an.',
    url: 'https://www.agirc-arrco.fr/particuliers/comprendre-retraite-complementaire/age-et-montant-retraite/majoration-temporaire/'
  },
  {
    source: 'AGIRC-ARRCO',
    titre: 'Revalorisation annuelle des pensions',
    section: 'Évolutions',
    texte: 'Les pensions AGIRC-ARRCO sont revalorisées chaque année le 1er novembre. La revalorisation dépend de l\'inflation et des décisions des partenaires sociaux. En 2023, la revalorisation a été de 5,12%.',
    url: 'https://www.agirc-arrco.fr/particuliers/comprendre-retraite-complementaire/revalorisation/'
  },

  // Service-Public.fr - Réforme et dispositifs
  {
    source: 'Service-Public',
    titre: 'Réforme des retraites 2023',
    section: 'Réformes',
    texte: 'La réforme des retraites de 2023 prévoit un recul progressif de l\'âge légal de 62 à 64 ans d\'ici 2030, à raison de 3 mois par an à partir de la génération 1961. La durée de cotisation pour le taux plein passe également de 172 à 172 trimestres pour les générations 1973 et suivantes.',
    url: 'https://www.service-public.fr/particuliers/actualites/A16234'
  },
  {
    source: 'Service-Public',
    titre: 'Cumul emploi-retraite',
    section: 'Dispositifs particuliers',
    texte: 'Le cumul emploi-retraite permet de reprendre une activité professionnelle tout en percevant sa retraite. Depuis le 1er septembre 2023, cette reprise d\'activité génère de nouveaux droits à retraite dans la limite d\'un PASS par an.',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F13243'
  },
  {
    source: 'Service-Public',
    titre: 'Minimum contributif',
    section: 'Montants minimums',
    texte: 'Le minimum contributif garantit un montant minimum de retraite de base aux assurés ayant cotisé sur de faibles revenus mais disposant d\'une carrière complète. En 2024, le minimum contributif est de 684,14 € par mois (majoré à 747,57 € si au moins 120 trimestres cotisés).',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F2969'
  },
  {
    source: 'Service-Public',
    titre: 'Allocation de solidarité aux personnes âgées (ASPA)',
    section: 'Minimums sociaux',
    texte: 'L\'ASPA (ex-minimum vieillesse) garantit un revenu minimum aux personnes âgées de 65 ans ou plus (ou âge légal de départ si inapte au travail) ayant de faibles ressources. En 2024, le montant maximum est de 1 012,02 € par mois pour une personne seule.',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F16871'
  },
  {
    source: 'Service-Public',
    titre: 'Retraite progressive',
    section: 'Dispositifs particuliers',
    texte: 'La retraite progressive permet, à partir de 60 ans et sous conditions de durée d\'assurance (150 trimestres), de percevoir une fraction de sa retraite tout en travaillant à temps partiel. La pension versée est proportionnelle à la réduction du temps de travail.',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F13243'
  },
  {
    source: 'Service-Public',
    titre: 'Retraite anticipée pour handicap',
    section: 'Départs anticipés',
    texte: 'Les assurés en situation de handicap peuvent partir à la retraite dès 55 ans s\'ils justifient d\'un taux d\'incapacité permanente d\'au moins 50% et d\'une durée d\'assurance minimale, dont une partie cotisée, tout en étant handicapé.',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F16337'
  },
  {
    source: 'Service-Public',
    titre: 'Retraite anticipée pour pénibilité',
    section: 'Départs anticipés',
    texte: 'Le compte professionnel de prévention (C2P) permet aux salariés exposés à des facteurs de pénibilité d\'acquérir des points convertibles en trimestres pour un départ anticipé à la retraite. 10 points permettent de partir 3 mois plus tôt.',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F15504'
  },
  {
    source: 'Service-Public',
    titre: 'Rachat de trimestres',
    section: 'Options de rachat',
    texte: 'Il est possible de racheter jusqu\'à 12 trimestres au titre des années d\'études supérieures ou des années civiles incomplètes. Le coût varie selon l\'âge, le revenu et l\'option choisie (taux seul ou taux et durée). Ce rachat est déductible des revenus imposables.',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F16131'
  },
  {
    source: 'Service-Public',
    titre: 'Majoration de durée d\'assurance pour enfants',
    section: 'Majorations',
    texte: 'Les parents peuvent bénéficier de majorations de durée d\'assurance : 4 trimestres par enfant pour la mère (maternité) et jusqu\'à 4 trimestres pour chaque parent au titre de l\'éducation et de l\'adoption. Ces trimestres s\'ajoutent à ceux validés par les cotisations.',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F32127'
  },
  {
    source: 'CNAV',
    titre: 'Âge du taux plein automatique',
    section: 'Conditions générales',
    texte: 'L\'âge du taux plein automatique (sans décote) est de 67 ans pour les assurés nés à partir de 1955. À cet âge, le taux plein de 50% est appliqué même si la durée d\'assurance requise n\'est pas atteinte.',
    url: 'https://www.lassuranceretraite.fr/portail-info/home/salaries/age-et-montant-retraite/depart-retraite/age-taux-plein-automatique.html'
  }
];

/**
 * Collecter les documents retraite
 */
export async function collecterDocumentsRetraite(): Promise<{
  success: boolean;
  total: number;
  cnav_count: number;
  agirc_arrco_count: number;
  service_public_count: number;
  errors: string[];
  duration: string;
}> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    console.log('🏛️ Démarrage collecte documents retraite...');

    // Générer les documents avec IDs et date
    const documents: DocumentRetraite[] = DOCUMENTS_RETRAITE_STATIQUES.map((doc, index) => ({
      ...doc,
      id: `doc_retraite_${index + 1}_${Date.now()}`,
      date_collecte: new Date().toISOString()
    }));

    // Stocker dans la KV store
    const storeKey = 'documents_retraite';
    await kv.set(storeKey, documents);

    console.log(`✅ ${documents.length} documents retraite stockés`);

    // Compter par source
    const cnav_count = documents.filter(d => d.source === 'CNAV').length;
    const agirc_arrco_count = documents.filter(d => d.source === 'AGIRC-ARRCO').length;
    const service_public_count = documents.filter(d => d.source === 'Service-Public').length;

    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

    return {
      success: true,
      total: documents.length,
      cnav_count,
      agirc_arrco_count,
      service_public_count,
      errors,
      duration
    };

  } catch (error) {
    console.error('❌ Erreur collecte documents retraite:', error);
    errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    
    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    
    return {
      success: false,
      total: 0,
      cnav_count: 0,
      agirc_arrco_count: 0,
      service_public_count: 0,
      errors,
      duration
    };
  }
}

/**
 * Récupérer les documents retraite
 */
export async function getDocumentsRetraite(): Promise<DocumentRetraite[]> {
  try {
    const documents = await kv.get('documents_retraite');
    return documents || [];
  } catch (error) {
    console.error('❌ Erreur récupération documents retraite:', error);
    return [];
  }
}
