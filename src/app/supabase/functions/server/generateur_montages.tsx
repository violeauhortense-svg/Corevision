import * as kv from './kv_store.tsx';

/**
 * GÉNÉRATEUR AUTOMATIQUE DE MONTAGES PATRIMONIAUX
 * 
 * Analyse les règles fiscales collectées et génère automatiquement
 * des montages patrimoniaux en combinant intelligemment les règles.
 */

// Types
interface RegleFiscale {
  id: string;
  titre: string;
  categorie: string;
  description: string;
  conditions?: string[];
  avantages?: string;
  limites?: string;
  source?: string;
}

interface MontageGenere {
  id: string;
  nom: string;
  description: string;
  objectif: string;
  categorie: string;
  regles_utilisees: string[];
  etapes: string[];
  avantages: string[];
  risques: string[];
  conditions: string[];
  economie_estimee: string;
  complexite: 'Simple' | 'Moyenne' | 'Élevée';
  profils_cibles: string[];
  date_generation: string;
  score_confiance: number;
}

// Catégories de montages possibles
const CATEGORIES_MONTAGES = {
  transmission: 'Transmission du patrimoine',
  fiscalite: 'Optimisation fiscale',
  immobilier: 'Ingénierie immobilière',
  holding: 'Structuration holding',
  succession: 'Préparation succession',
  retraite: 'Optimisation retraite',
  assurance: 'Stratégie assurance-vie'
};

// Mots-clés pour identifier les types de règles
const KEYWORDS_CATEGORIES = {
  transmission: ['donation', 'transmission', 'pacte dutreil', 'démembrement', 'usufruit', 'nu-propriété'],
  fiscalite: ['pfu', 'flat tax', 'ir', 'impôt', 'taux', 'barème', 'réduction', 'crédit impôt', 'déduction'],
  immobilier: ['sci', 'scpi', 'lmnp', 'loueur meublé', 'immobilier', 'déficit foncier', 'pinel'],
  holding: ['holding', 'société', 'dividende', 'plus-value', 'cession', 'apport-cession', 'is'],
  succession: ['succession', 'héritage', 'testament', 'legs', 'abattement succession'],
  retraite: ['retraite', 'per', 'madelin', 'article 83', 'épargne retraite'],
  assurance: ['assurance vie', 'assurance-vie', 'clause bénéficiaire', 'rachat', 'versement']
};

/**
 * Identifier la catégorie d'une règle fiscale
 */
function identifierCategorie(regle: RegleFiscale): string[] {
  const categories: string[] = [];
  const texteComplet = `${regle.titre} ${regle.description}`.toLowerCase();
  
  for (const [categorie, keywords] of Object.entries(KEYWORDS_CATEGORIES)) {
    for (const keyword of keywords) {
      if (texteComplet.includes(keyword.toLowerCase())) {
        categories.push(categorie);
        break;
      }
    }
  }
  
  return categories.length > 0 ? categories : ['fiscalite'];
}

/**
 * Calculer un score de compatibilité entre deux règles
 */
function calculerCompatibilite(regle1: RegleFiscale, regle2: RegleFiscale): number {
  let score = 0;
  
  // Même catégorie = +30 points
  const cat1 = identifierCategorie(regle1);
  const cat2 = identifierCategorie(regle2);
  const categoriesCommunes = cat1.filter(c => cat2.includes(c));
  score += categoriesCommunes.length * 30;
  
  // Mots-clés communs = +10 points par mot
  const mots1 = new Set(regle1.titre.toLowerCase().split(' ').filter(m => m.length > 4));
  const mots2 = new Set(regle2.titre.toLowerCase().split(' ').filter(m => m.length > 4));
  const motsCommuns = [...mots1].filter(m => mots2.has(m));
  score += motsCommuns.length * 10;
  
  // Complémentarité (donation + holding, sci + démembrement, etc.)
  const complementarites = [
    { keywords1: ['donation', 'transmission'], keywords2: ['holding', 'société'] },
    { keywords1: ['démembrement', 'usufruit'], keywords2: ['sci', 'immobilier'] },
    { keywords1: ['assurance vie'], keywords2: ['succession', 'transmission'] },
    { keywords1: ['holding'], keywords2: ['dividende', 'plus-value'] },
    { keywords1: ['pfu', 'flat tax'], keywords2: ['dividende', 'intérêt'] }
  ];
  
  const texte1 = `${regle1.titre} ${regle1.description}`.toLowerCase();
  const texte2 = `${regle2.titre} ${regle2.description}`.toLowerCase();
  
  for (const comp of complementarites) {
    const match1 = comp.keywords1.some(k => texte1.includes(k)) && comp.keywords2.some(k => texte2.includes(k));
    const match2 = comp.keywords1.some(k => texte2.includes(k)) && comp.keywords2.some(k => texte1.includes(k));
    if (match1 || match2) {
      score += 40;
    }
  }
  
  return score;
}

/**
 * Générer un montage à partir d'un groupe de règles compatibles
 */
function genererMontageDepuisRegles(regles: RegleFiscale[]): MontageGenere | null {
  if (regles.length < 2) return null;
  
  // Identifier la catégorie principale
  const toutesCategories = regles.flatMap(r => identifierCategorie(r));
  const categoriesCounts = toutesCategories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const categoriePrincipale = Object.entries(categoriesCounts)
    .sort(([, a], [, b]) => b - a)[0][0];
  
  // Générer le nom du montage
  const nom = genererNomMontage(regles, categoriePrincipale);
  
  // Générer la description
  const description = `Montage combinant ${regles.length} règles fiscales pour optimiser ${CATEGORIES_MONTAGES[categoriePrincipale as keyof typeof CATEGORIES_MONTAGES] || 'la situation patrimoniale'}.`;
  
  // Extraire les avantages
  const avantages: string[] = [];
  for (const regle of regles) {
    if (regle.avantages) {
      avantages.push(regle.avantages);
    }
  }
  
  // Générer les étapes
  const etapes = genererEtapesMontage(regles, categoriePrincipale);
  
  // Générer les risques
  const risques = genererRisques(regles, categoriePrincipale);
  
  // Générer les conditions
  const conditions = regles.flatMap(r => r.conditions || []).slice(0, 5);
  
  // Déterminer la complexité
  const complexite = regles.length <= 2 ? 'Simple' : regles.length <= 4 ? 'Moyenne' : 'Élevée';
  
  // Score de confiance basé sur le nombre de règles et leur compatibilité
  let scoreConfiance = 50;
  if (regles.length >= 3) scoreConfiance += 20;
  if (avantages.length >= 2) scoreConfiance += 15;
  if (conditions.length > 0) scoreConfiance += 15;
  
  const montage: MontageGenere = {
    id: `montage_auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nom,
    description,
    objectif: genererObjectif(categoriePrincipale),
    categorie: CATEGORIES_MONTAGES[categoriePrincipale as keyof typeof CATEGORIES_MONTAGES] || 'Optimisation patrimoniale',
    regles_utilisees: regles.map(r => r.id),
    etapes,
    avantages: avantages.length > 0 ? avantages : [`Optimisation de ${categoriePrincipale}`],
    risques,
    conditions: conditions.length > 0 ? conditions : ['Situation patrimoniale adaptée'],
    economie_estimee: estimerEconomie(regles, categoriePrincipale),
    complexite,
    profils_cibles: genererProfilsCibles(categoriePrincipale),
    date_generation: new Date().toISOString(),
    score_confiance: Math.min(scoreConfiance, 95)
  };
  
  return montage;
}

/**
 * Générer le nom du montage
 */
function genererNomMontage(regles: RegleFiscale[], categorie: string): string {
  const templates: Record<string, string[]> = {
    transmission: [
      'Transmission optimisée avec %s',
      'Stratégie de transmission via %s',
      'Donation structurée avec %s'
    ],
    holding: [
      'Structuration holding avec %s',
      'Optimisation holding via %s',
      'Holding patrimoniale avec %s'
    ],
    immobilier: [
      'Ingénierie immobilière avec %s',
      'Optimisation immobilière via %s',
      'Structuration immobilière avec %s'
    ],
    succession: [
      'Préparation succession avec %s',
      'Optimisation succession via %s',
      'Stratégie successorale avec %s'
    ],
    fiscalite: [
      'Optimisation fiscale avec %s',
      'Réduction fiscale via %s',
      'Stratégie fiscale avec %s'
    ],
    retraite: [
      'Optimisation retraite avec %s',
      'Stratégie retraite via %s',
      'Préparation retraite avec %s'
    ],
    assurance: [
      'Optimisation assurance-vie avec %s',
      'Stratégie assurance avec %s',
      'Structuration assurance-vie via %s'
    ]
  };
  
  const templatesList = templates[categorie] || templates.fiscalite;
  const template = templatesList[Math.floor(Math.random() * templatesList.length)];
  
  // Extraire un mot-clé principal de la première règle
  const motsCles = regles[0].titre.split(' ').filter(m => m.length > 5);
  const motCle = motsCles[0] || 'règles fiscales';
  
  return template.replace('%s', motCle.toLowerCase());
}

/**
 * Générer l'objectif du montage
 */
function genererObjectif(categorie: string): string {
  const objectifs: Record<string, string> = {
    transmission: 'Transmettre le patrimoine en optimisant la fiscalité',
    holding: 'Structurer une holding pour optimiser la gestion patrimoniale',
    immobilier: 'Optimiser la fiscalité et la gestion du patrimoine immobilier',
    succession: 'Préparer et optimiser la succession',
    fiscalite: 'Réduire la charge fiscale globale',
    retraite: 'Optimiser les revenus à la retraite',
    assurance: 'Utiliser l\'assurance-vie comme outil d\'optimisation'
  };
  
  return objectifs[categorie] || 'Optimiser la situation patrimoniale globale';
}

/**
 * Générer les étapes du montage
 */
function genererEtapesMontage(regles: RegleFiscale[], categorie: string): string[] {
  const etapesBase = [
    'Analyse approfondie de la situation patrimoniale',
    'Vérification de l\'éligibilité aux dispositifs fiscaux',
    'Mise en place de la structure optimale',
    'Suivi et ajustements réguliers'
  ];
  
  const etapesSpecifiques: Record<string, string[]> = {
    transmission: [
      'Évaluation du patrimoine à transmettre',
      'Choix entre donation simple, donation-partage ou démembrement',
      'Rédaction de l\'acte notarié',
      'Déclaration fiscale et paiement des droits éventuels'
    ],
    holding: [
      'Constitution de la holding patrimoniale',
      'Apport des titres à la holding',
      'Optimisation des flux de dividendes',
      'Gestion des réinvestissements'
    ],
    immobilier: [
      'Analyse du patrimoine immobilier existant',
      'Choix de la structure (SCI, LMNP, etc.)',
      'Optimisation du financement',
      'Mise en location et gestion locative'
    ],
    succession: [
      'Bilan patrimonial et prévisionnel successoral',
      'Rédaction du testament et donations anticipées',
      'Optimisation via assurance-vie et démembrement',
      'Suivi et mise à jour régulière'
    ]
  };
  
  return etapesSpecifiques[categorie] || etapesBase;
}

/**
 * Générer les risques
 */
function genererRisques(regles: RegleFiscale[], categorie: string): string[] {
  const risquesCommuns = [
    'Risque de changement de législation fiscale',
    'Nécessité de respecter strictement les conditions d\'éligibilité',
    'Coûts de mise en place et de gestion'
  ];
  
  const risquesSpecifiques: Record<string, string[]> = {
    transmission: ['Risque de rappel fiscal en cas de décès dans les 15 ans'],
    holding: ['Risque de requalification fiscale', 'Complexité administrative accrue'],
    immobilier: ['Risque locatif', 'Fluctuation du marché immobilier'],
    succession: ['Contestation possible des héritiers', 'Rigidité des donations'],
    fiscalite: ['Contrôle fiscal possible', 'Évolution des taux d\'imposition']
  };
  
  return [...risquesCommuns, ...(risquesSpecifiques[categorie] || [])].slice(0, 4);
}

/**
 * Estimer l'économie potentielle
 */
function estimerEconomie(regles: RegleFiscale[], categorie: string): string {
  const economies: Record<string, string> = {
    transmission: '5 000€ - 50 000€ selon le patrimoine transmis',
    holding: '10 000€ - 100 000€ selon les dividendes',
    immobilier: '3 000€ - 30 000€ par an selon le patrimoine',
    succession: '20 000€ - 200 000€ selon la masse successorale',
    fiscalite: '2 000€ - 20 000€ par an',
    retraite: '5 000€ - 50 000€ sur la durée',
    assurance: '3 000€ - 30 000€ selon les versements'
  };
  
  return economies[categorie] || '5 000€ - 50 000€ selon la situation';
}

/**
 * Générer les profils cibles
 */
function genererProfilsCibles(categorie: string): string[] {
  const profils: Record<string, string[]> = {
    transmission: ['Chef d\'entreprise', 'Patrimoine familial important', 'Senior avec enfants'],
    holding: ['Entrepreneur', 'Investisseur', 'Patrimoine financier significatif'],
    immobilier: ['Investisseur immobilier', 'Patrimoine immobilier diversifié', 'Loueur'],
    succession: ['Senior', 'Patrimoine familial', 'Situation familiale complexe'],
    fiscalite: ['Hauts revenus', 'TMI élevée', 'Revenus du capital importants'],
    retraite: ['45-60 ans', 'Préparation retraite', 'TNS'],
    assurance: ['Tous profils', 'Transmission programmée', 'Optimisation fiscale']
  };
  
  return profils[categorie] || ['Tous profils avec patrimoine'];
}

/**
 * Trouver des groupes de règles compatibles
 */
function trouverGroupesCompatibles(regles: RegleFiscale[]): RegleFiscale[][] {
  const groupes: RegleFiscale[][] = [];
  const dejaTrait = new Set<string>();
  
  // Pour chaque règle, chercher les règles compatibles
  for (let i = 0; i < regles.length; i++) {
    if (dejaTrait.has(regles[i].id)) continue;
    
    const groupe: RegleFiscale[] = [regles[i]];
    dejaTrait.add(regles[i].id);
    
    // Chercher les règles compatibles
    for (let j = i + 1; j < regles.length; j++) {
      if (dejaTrait.has(regles[j].id)) continue;
      
      // Calculer la compatibilité avec toutes les règles du groupe
      let compatibiliteTotal = 0;
      for (const regleGroupe of groupe) {
        compatibiliteTotal += calculerCompatibilite(regleGroupe, regles[j]);
      }
      
      const compatibiliteMoyenne = compatibiliteTotal / groupe.length;
      
      // Si très compatible (score > 40), ajouter au groupe
      if (compatibiliteMoyenne > 40 && groupe.length < 5) {
        groupe.push(regles[j]);
        dejaTrait.add(regles[j].id);
      }
    }
    
    // Ne garder que les groupes de 2 règles minimum
    if (groupe.length >= 2) {
      groupes.push(groupe);
    }
  }
  
  return groupes;
}

/**
 * Générer automatiquement des montages à partir des règles collectées
 */
export async function genererMontagesAutomatiques(): Promise<{
  success: boolean;
  montages_generes: number;
  montages: MontageGenere[];
  errors: string[];
}> {
  console.log('🤖 Génération automatique de montages patrimoniaux...');
  
  const errors: string[] = [];
  const montagesGeneres: MontageGenere[] = [];
  
  try {
    // 1. Récupérer toutes les règles collectées
    const reglesCollectees = await kv.getByPrefix('regle_collectee:');
    
    if (reglesCollectees.length === 0) {
      console.log('⚠️ Aucune règle collectée trouvée');
      return {
        success: true,
        montages_generes: 0,
        montages: [],
        errors: ['Aucune règle collectée disponible']
      };
    }
    
    const regles: RegleFiscale[] = reglesCollectees.map(item => item.value);
    console.log(`📊 ${regles.length} règles collectées trouvées`);
    
    // 2. Trouver les groupes de règles compatibles
    const groupesCompatibles = trouverGroupesCompatibles(regles);
    console.log(`🔍 ${groupesCompatibles.length} groupes compatibles identifiés`);
    
    // 3. Générer un montage pour chaque groupe
    for (const groupe of groupesCompatibles) {
      try {
        const montage = genererMontageDepuisRegles(groupe);
        
        if (montage && montage.score_confiance >= 60) {
          // Sauvegarder le montage
          const key = `montage_collecte:${montage.id}`;
          await kv.set(key, montage);
          
          montagesGeneres.push(montage);
          console.log(`✅ Montage généré: ${montage.nom} (score: ${montage.score_confiance})`);
        }
      } catch (error) {
        const errorMsg = `Erreur génération montage: ${error instanceof Error ? error.message : 'Unknown'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // 4. Sauvegarder les métadonnées
    await kv.set('montages:last_generation', {
      date: new Date().toISOString(),
      regles_analysees: regles.length,
      groupes_identifies: groupesCompatibles.length,
      montages_generes: montagesGeneres.length,
      errors
    });
    
    console.log(`✅ Génération terminée: ${montagesGeneres.length} montages créés`);
    
    return {
      success: true,
      montages_generes: montagesGeneres.length,
      montages: montagesGeneres,
      errors
    };
    
  } catch (error) {
    console.error('❌ Erreur fatale génération montages:', error);
    return {
      success: false,
      montages_generes: 0,
      montages: [],
      errors: [error instanceof Error ? error.message : 'Erreur inconnue']
    };
  }
}

/**
 * Récupérer tous les montages collectés
 */
export async function getMontagesCollectes(): Promise<MontageGenere[]> {
  try {
    const montages = await kv.getByPrefix('montage_collecte:');
    return montages.map(item => item.value).sort((a: any, b: any) => {
      const dateA = new Date(a.date_generation || 0).getTime();
      const dateB = new Date(b.date_generation || 0).getTime();
      return dateB - dateA; // Plus récent d'abord
    });
  } catch (error) {
    console.error('❌ Erreur récupération montages collectés:', error);
    return [];
  }
}

/**
 * Récupérer les stats de génération
 */
export async function getStatsGeneration() {
  try {
    const lastGeneration = await kv.get('montages:last_generation');
    const montagesCollectes = await getMontagesCollectes();
    
    return {
      last_generation: lastGeneration || null,
      total_montages_collectes: montagesCollectes.length,
      by_categorie: montagesCollectes.reduce((acc: any, m: any) => {
        acc[m.categorie] = (acc[m.categorie] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('❌ Erreur récupération stats génération:', error);
    return {
      last_generation: null,
      total_montages_collectes: 0,
      by_categorie: {}
    };
  }
}
