// ============================================
// GÉNÉRATION RAPPORT PATRIMONIAL STRUCTURÉ
// ============================================

import * as iaAnalyseAvancee from './ia_analyse_avancee.tsx';

export interface RapportStructure {
  // 🔥 NOUVEAU : Ajout de l'analyse avancée en 7 étapes
  analyse_avancee?: iaAnalyseAvancee.AnalyseAvanceeComplete;
  
  // 🔥 NOUVEAU : Ajout des sections textuelles complètes
  section1_synthese: {
    contexte: string;
    points_cles: string[];
  };
  section2_situation_actuelle: {
    situation_familiale: string;
    situation_professionnelle: string;
    patrimoine: string;
    revenus: string;
  };
  section3_analyses: {
    analyse_civile: string;
    analyse_fiscale: string;
    analyse_sociale: string;
    analyse_patrimoniale: string;
  };
  section4_problematiques: {
    titre: string;
    description: string;
    gravite: 'haute' | 'moyenne' | 'faible';
    icon: string;
  }[];
  section5_objectifs: {
    objectifs_declares: string[];
    objectifs_deduits: string[];
  };
  section6_recommandations: {
    strategies: any[];
    synthese: string;
  };
  section7_plan_action: {
    actions_immediates: string[];
    actions_court_terme: string[];
    actions_moyen_terme: string[];
  };
  
  // Format original pour la compatibilité
  situation_actuelle: {
    synthese: string;
    donnees_cles: {
      label: string;
      valeur: string;
      icon: string;
    }[];
    graphiques: {
      type: 'pie' | 'bar' | 'line';
      titre: string;
      donnees: any[];
    }[];
  };
  analyse_patrimoniale: {
    synthese: string;
    analyses_detaillees: {
      titre: string;
      score: number;
      couleur: string;
      points_forts: string[];
      points_attention: string[];
    }[];
    graphiques: {
      type: 'pie' | 'bar' | 'line';
      titre: string;
      donnees: any[];
    }[];
  };
  problematiques_identifiees: {
    problemes: {
      titre: string;
      description: string;
      gravite: 'haute' | 'moyenne' | 'faible';
      impact_financier?: number;
      icon: string;
    }[];
  };
  objectifs: {
    objectifs_declares: string[];
    objectifs_deduits: {
      titre: string;
      description: string;
      priorite: 'haute' | 'moyenne' | 'faible';
    }[];
  };
  recommandations_strategiques: {
    strategies: any[];
    synthese: string;
  };
  simulations: {
    scenarios: {
      nom: string;
      description: string;
      graphique: any;
      resultats: {
        label: string;
        valeur: string;
        variation?: string;
      }[];
    }[];
  };
  plan_action: {
    actions_immediates: {
      titre: string;
      description: string;
      priorite: number;
      delai: string;
    }[];
    actions_court_terme: {
      titre: string;
      description: string;
      delai: string;
    }[];
    actions_moyen_terme: {
      titre: string;
      description: string;
      delai: string;
    }[];
  };
  preconisations: string[];
}

export async function genererRapportStructure(
  donnees: any,
  analyse_civile: any,
  analyse_fiscale: any,
  analyse_sociale: any,
  analyse_patrimoniale: any,
  strategies: any[],
  score_global: number
): Promise<RapportStructure> {
  console.log('📋 Génération du rapport structuré...');
  
  // 🔥 CORRECTION : Calcul du patrimoine BRUT (tous les actifs)
  const patrimoine_brut = 
    (donnees.immobilier_pp || 0) +
    (donnees.immobilier_locatif || 0) +
    (donnees.immobilier_secondaire || 0) +
    (donnees.sci || 0) +
    (donnees.scpi || 0) +
    (donnees.liquidites || 0) +
    (donnees.assurance_vie || 0) +
    (donnees.per || 0) +
    (donnees.titres_societe || 0) +
    (donnees.portefeuille_financier || 0);
  
  // 🔥 CORRECTION : Soustraire les passifs pour obtenir le patrimoine NET
  const passifs_total = donnees.passifs || 0;
  const patrimoine_total = donnees.patrimoine_net || (patrimoine_brut - passifs_total);
  
  console.log(`💰 Patrimoine calculé: Brut ${patrimoine_brut.toLocaleString('fr-FR')}€ - Passifs ${passifs_total.toLocaleString('fr-FR')}€ = Net ${patrimoine_total.toLocaleString('fr-FR')}€`);
  
  const revenus_totaux = 
    (donnees.revenus_salaires || 0) +
    (donnees.revenus_dividendes || 0) +
    (donnees.revenus_fonciers || 0) +
    (donnees.revenus_autres || 0);
  
  // 1️⃣ SITUATION ACTUELLE
  const situation_actuelle = {
    synthese: `Vous êtes ${donnees.situation_familiale || 'célibataire'} sous le régime ${donnees.regime_matrimonial || 'de la communauté réduite aux acquêts'}, ${donnees.nombre_enfants > 0 ? `avec ${donnees.nombre_enfants} enfant${donnees.nombre_enfants > 1 ? 's' : ''}` : 'sans enfant'}. Votre patrimoine net s'élève à ${patrimoine_total.toLocaleString('fr-FR')} € et vous percevez ${revenus_totaux.toLocaleString('fr-FR')} € de revenus annuels. Votre TMI est de ${donnees.tmi}%.`,
    donnees_cles: [
      { label: 'Patrimoine total', valeur: `${patrimoine_total.toLocaleString('fr-FR')} €`, icon: 'TrendingUp' },
      { label: 'Revenus annuels', valeur: `${revenus_totaux.toLocaleString('fr-FR')} €`, icon: 'Euro' },
      { label: 'TMI', valeur: `${donnees.tmi}%`, icon: 'PieChart' },
      { label: 'Âge', valeur: `${donnees.age_client} ans`, icon: 'User' },
      { label: 'Enfants', valeur: `${donnees.nombre_enfants}`, icon: 'Users' },
      { label: 'Régime matrimonial', valeur: donnees.regime_matrimonial || 'N/A', icon: 'Heart' }
    ],
    graphiques: [
      {
        type: 'pie' as const,
        titre: 'Répartition du patrimoine',
        donnees: [
          { name: 'Immobilier principal', value: donnees.immobilier_pp || 0, color: '#3b82f6' },
          { name: 'Immobilier locatif', value: donnees.immobilier_locatif || 0, color: '#10b981' },
          { name: 'Immobilier secondaire', value: donnees.immobilier_secondaire || 0, color: '#ec4899' },
          { name: 'SCI', value: donnees.sci || 0, color: '#ef4444' },
          { name: 'SCPI', value: donnees.scpi || 0, color: '#8b5cf6' },
          { name: 'Liquidités', value: donnees.liquidites || 0, color: '#f59e0b' },
          { name: 'Assurance-vie', value: donnees.assurance_vie || 0, color: '#8b5cf6' },
          { name: 'PER', value: donnees.per || 0, color: '#ec4899' },
          { name: 'Titres société', value: donnees.titres_societe || 0, color: '#ef4444' },
          { name: 'Portefeuille financier', value: donnees.portefeuille_financier || 0, color: '#ec4899' }
        ].filter(d => d.value > 0)
      },
      {
        type: 'bar' as const,
        titre: 'Répartition des revenus',
        donnees: [
          { name: 'Salaires/TNS', value: donnees.revenus_salaires || 0 },
          { name: 'Dividendes', value: donnees.revenus_dividendes || 0 },
          { name: 'Fonciers', value: donnees.revenus_fonciers || 0 },
          { name: 'Autres', value: donnees.revenus_autres || 0 }
        ].filter(d => d.value > 0)
      }
    ]
  };
  
  // 2️⃣ ANALYSE PATRIMONIALE
  // 🔥 CORRECTION : Extraire les vrais problèmes et points forts depuis les analyses
  
  // CIVILE
  const problemes_civile = [
    ...(analyse_civile.risques_indivision || []).map(r => ({ 
      description: r, 
      gravite: 'moyenne' as const,
      impact_financier: 5000 
    })),
    ...(analyse_civile.organisation_successorale?.risques || []).map(r => ({ 
      description: r, 
      gravite: 'haute' as const,
      impact_financier: 10000 
    }))
  ];
  
  const points_forts_civile = [
    analyse_civile.regime_matrimonial_analyse,
    ...((analyse_civile.protection_conjoint?.niveau === 'fort' || analyse_civile.protection_conjoint?.niveau === 'moyen') 
      ? [`Protection du conjoint : ${analyse_civile.protection_conjoint.niveau}`] 
      : [])
  ].filter(Boolean);
  
  const points_attention_civile = [
    ...(analyse_civile.protection_conjoint?.recommandations || []),
    ...(analyse_civile.organisation_successorale?.optimisations || [])
  ];
  
  // FISCALE
  const problemes_fiscale = analyse_fiscale.risques_fiscaux?.map(r => ({ 
    description: r, 
    gravite: 'haute' as const,
    impact_financier: 15000 
  })) || [];
  
  const points_forts_fiscale = [
    ...(analyse_fiscale.fiscalite_revenus?.taux_global < 40 
      ? [`Taux d'imposition global maîtrisé : ${analyse_fiscale.fiscalite_revenus.taux_global.toFixed(1)}%`] 
      : []),
    ...(!analyse_fiscale.fiscalite_patrimoine?.assujetti 
      ? ['Non assujetti à l\'IFI'] 
      : [])
  ];
  
  const points_attention_fiscale = [
    ...(analyse_fiscale.fiscalite_revenus?.taux_global > 45 
      ? [`Taux d'imposition élevé : ${analyse_fiscale.fiscalite_revenus.taux_global.toFixed(1)}%`] 
      : []),
    ...(analyse_fiscale.fiscalite_patrimoine?.assujetti 
      ? [`Assujetti à l'IFI : ${analyse_fiscale.fiscalite_patrimoine.ifi_estime.toLocaleString('fr-FR')}€`] 
      : []),
    ...(analyse_fiscale.optimisations_possibles?.slice(0, 3).map(o => o.description) || [])
  ];
  
  // SOCIALE
  const problemes_sociale: any[] = [];
  
  const points_forts_sociale = [
    ...(analyse_sociale.protection_sociale?.niveau === 'fort' 
      ? ['Protection sociale complète (régime général)'] 
      : []),
    ...(analyse_sociale.optimisation_remuneration && analyse_sociale.optimisation_remuneration.gain_annuel > 5000
      ? [`Potentiel d'optimisation rémunération : ${analyse_sociale.optimisation_remuneration.gain_annuel.toLocaleString('fr-FR')}€/an`]
      : [])
  ];
  
  const points_attention_sociale = [
    ...(analyse_sociale.protection_sociale?.niveau === 'faible' 
      ? ['Protection sociale limitée - Envisager des compléments'] 
      : []),
    ...(analyse_sociale.cotisations_estimees > (donnees.revenus_salaires || 0) * 0.50
      ? [`Cotisations sociales élevées : ${analyse_sociale.cotisations_estimees.toLocaleString('fr-FR')}€`]
      : [])
  ];
  
  // PATRIMONIALE
  const problemes_patrimoniale: any[] = [];
  
  const points_forts_patrimoniale = [
    ...(analyse_patrimoniale.diversification?.score >= 7 
      ? ['Patrimoine bien diversifié'] 
      : []),
    ...(analyse_patrimoniale.liquidite?.ratio >= 10 && analyse_patrimoniale.liquidite?.ratio <= 30
      ? ['Niveau de liquidité adapté']
      : [])
  ];
  
  const points_attention_patrimoniale = [
    ...(analyse_patrimoniale.diversification?.recommandations || []),
    ...(analyse_patrimoniale.liquidite?.ratio < 10
      ? [analyse_patrimoniale.liquidite.analyse]
      : [])
  ];
  
  const nbProblemes = 
    problemes_civile.length + 
    problemes_fiscale.length + 
    problemes_sociale.length + 
    problemes_patrimoniale.length;
  
  const analyse_patrimoniale_section = {
    synthese: `Après analyse approfondie de votre situation, nous avons identifié ${nbProblemes} problématiques nécessitant une attention particulière. Votre score patrimonial global est de ${score_global.toFixed(1)}/10.`,
    analyses_detaillees: [
      {
        titre: 'Analyse Civile & Familiale',
        score: analyse_civile.score || 0,
        couleur: (analyse_civile.score || 0) >= 7 ? '#10b981' : (analyse_civile.score || 0) >= 5 ? '#f59e0b' : '#ef4444',
        points_forts: points_forts_civile,
        points_attention: points_attention_civile
      },
      {
        titre: 'Analyse Fiscale',
        score: analyse_fiscale.score || 0,
        couleur: (analyse_fiscale.score || 0) >= 7 ? '#10b981' : (analyse_fiscale.score || 0) >= 5 ? '#f59e0b' : '#ef4444',
        points_forts: points_forts_fiscale,
        points_attention: points_attention_fiscale
      },
      {
        titre: 'Analyse Sociale',
        score: analyse_sociale.score || 0,
        couleur: (analyse_sociale.score || 0) >= 7 ? '#10b981' : (analyse_sociale.score || 0) >= 5 ? '#f59e0b' : '#ef4444',
        points_forts: points_forts_sociale,
        points_attention: points_attention_sociale
      },
      {
        titre: 'Analyse Patrimoniale',
        score: analyse_patrimoniale.score || 0,
        couleur: (analyse_patrimoniale.score || 0) >= 7 ? '#10b981' : (analyse_patrimoniale.score || 0) >= 5 ? '#f59e0b' : '#ef4444',
        points_forts: points_forts_patrimoniale,
        points_attention: points_attention_patrimoniale
      }
    ],
    graphiques: [
      {
        type: 'bar' as const,
        titre: 'Scores par domaine d\'analyse',
        donnees: [
          { name: 'Civil', score: analyse_civile.score },
          { name: 'Fiscal', score: analyse_fiscale.score },
          { name: 'Social', score: analyse_sociale.score },
          { name: 'Patrimonial', score: analyse_patrimoniale.score }
        ]
      }
    ]
  };
  
  // 3️⃣ PROBLÉMATIQUES IDENTIFIÉES
  const tous_problemes = [
    ...problemes_civile.map((p: any) => ({ ...p, domaine: 'Civil', icon: 'Users' })),
    ...problemes_fiscale.map((p: any) => ({ ...p, domaine: 'Fiscal', icon: 'Calculator' })),
    ...problemes_sociale.map((p: any) => ({ ...p, domaine: 'Social', icon: 'Shield' })),
    ...problemes_patrimoniale.map((p: any) => ({ ...p, domaine: 'Patrimoine', icon: 'TrendingUp' }))
  ];
  
  const problematiques_identifiees = {
    problemes: tous_problemes.map((p: any) => ({
      titre: `[${p.domaine}] ${p.titre || p.description?.substring(0, 50) || 'Problème détecté'}`,
      description: p.description || '',
      gravite: p.gravite || (p.impact_financier && p.impact_financier > 10000 ? 'haute' : 'moyenne') as 'haute' | 'moyenne' | 'faible',
      impact_financier: p.impact_financier,
      icon: p.icon
    }))
  };
  
  // 4️⃣ OBJECTIFS
  // 🔥 CORRECTION : Dédupliquer les objectifs déclarés
  const objectifs_declares_raw = donnees.objectifs || [];
  const objectifs_declares = [...new Set(objectifs_declares_raw)]; // Supprimer les doublons
  const objectifs_deduits: any[] = [];
  
  // Déduire des objectifs selon la situation
  if (donnees.age_client >= 50 && donnees.age_client < 60) {
    objectifs_deduits.push({
      titre: 'Préparation de la retraite',
      description: 'À votre âge, il est crucial de préparer activement votre retraite',
      priorite: 'haute' as const
    });
  }
  
  if (donnees.nombre_enfants > 0) {
    objectifs_deduits.push({
      titre: 'Transmission patrimoniale',
      description: `Optimiser la transmission de votre patrimoine à vos ${donnees.nombre_enfants} enfant${donnees.nombre_enfants > 1 ? 's' : ''}`,
      priorite: 'haute' as const
    });
  }
  
  if (donnees.tmi >= 41) {
    objectifs_deduits.push({
      titre: 'Optimisation fiscale',
      description: 'Votre TMI élevée justifie une optimisation fiscale prioritaire',
      priorite: 'haute' as const
    });
  }
  
  if (donnees.titres_societe && donnees.titres_societe > 100000) {
    objectifs_deduits.push({
      titre: 'Optimisation dirigeant',
      description: 'Optimiser votre rémunération et la valorisation de votre entreprise',
      priorite: 'haute' as const
    });
  }
  
  // 5️⃣ RECOMMANDATIONS STRATÉGIQUES
  const recommandations_strategiques = {
    strategies: strategies.slice(0, 10), // Top 10
    synthese: `Nous avons identifié ${strategies.length} stratégies patrimoniales adaptées à votre situation. Les ${Math.min(10, strategies.length)} recommandations prioritaires sont présentées ci-dessous, classées par pertinence et impact potentiel.`
  };
  
  // 6️⃣ SIMULATIONS
  const simulations = {
    scenarios: strategies.slice(0, 3).map((strat: any, index: number) => ({
      nom: `Scénario ${index + 1}: ${strat.strategie}`,
      description: strat.description,
      graphique: {
        type: 'line' as const,
        donnees: [
          { annee: 0, valeur: 0 },
          { annee: 5, valeur: strat.simulation?.gain_sur_10ans ? strat.simulation.gain_sur_10ans / 2 : 0 },
          { annee: 10, valeur: strat.simulation?.gain_sur_10ans || 0 }
        ]
      },
      resultats: [
        { label: 'Gain fiscal annuel', valeur: `${strat.simulation?.gain_fiscal_annuel?.toLocaleString('fr-FR') || 0} €` },
        { label: 'Coût de mise en place', valeur: `${strat.simulation?.cout_mise_en_place?.toLocaleString('fr-FR') || 0} €` },
        { label: 'Gain sur 10 ans', valeur: `${strat.simulation?.gain_sur_10ans?.toLocaleString('fr-FR') || 0} €`, variation: '+' }
      ]
    }))
  };
  
  // 7️⃣ PLAN D'ACTION
  const actions_immediates: any[] = [];
  const actions_court_terme: any[] = [];
  const actions_moyen_terme: any[] = [];
  
  // Classer les stratégies par priorité
  strategies.forEach((strat: any, index: number) => {
    if (index < 3) {
      actions_immediates.push({
        titre: strat.strategie,
        description: strat.description,
        priorite: index + 1,
        delai: '1-3 mois'
      });
    } else if (index < 6) {
      actions_court_terme.push({
        titre: strat.strategie,
        description: strat.description,
        delai: '3-6 mois'
      });
    } else if (index < 10) {
      actions_moyen_terme.push({
        titre: strat.strategie,
        description: strat.description,
        delai: '6-12 mois'
      });
    }
  });
  
  // Préconisations globales
  const preconisations: string[] = [];
  
  if (analyse_civile.score < 6) {
    preconisations.push("⚠️ PRIORITÉ HAUTE : Mettre en place une protection du conjoint survivant");
  }
  if (analyse_fiscale.score < 6) {
    preconisations.push("⚠️ PRIORITÉ HAUTE : Optimiser la fiscalité des revenus et du patrimoine");
  }
  if (analyse_patrimoniale.score < 6) {
    preconisations.push("⚠️ PRIORITÉ HAUTE : Diversifier le patrimoine pour réduire les risques");
  }
  
  if (strategies.length > 0) {
    preconisations.push(`✅ ${strategies.length} stratégies patrimoniales identifiées et simulées`);
  }
  
  const rapport: RapportStructure = {
    // 🔥 ANALYSE AVANCÉE 7 ÉTAPES - DÉSACTIVÉE (trop gourmande en ressources)
    // Cause des erreurs 503 overflow de Mistral AI
    // Pour réactiver : décommenter le code ci-dessous et augmenter les limites serveur
    /*
    analyse_avancee: await iaAnalyseAvancee.analyseAvancee7Etapes(
      donnees,
      {
        analyse_civile,
        analyse_fiscale,
        analyse_sociale,
        analyse_patrimoniale
      },
      strategies
    ),
    */
    analyse_avancee: null, // Désactivé temporairement pour éviter les timeouts
    
    // 🔥 NOUVEAU : Ajout des sections textuelles complètes
    section1_synthese: {
      contexte: `Votre situation patrimoniale est complexe et nécessite une analyse approfondie pour identifier les opportunités et les risques. Nous avons examiné vos revenus, votre patrimoine et vos objectifs pour vous proposer une stratégie adaptée.`,
      points_cles: [
        `Votre patrimoine total s'élève à ${patrimoine_total.toLocaleString('fr-FR')} €.`,
        `Vous percevez ${revenus_totaux.toLocaleString('fr-FR')} € de revenus annuels.`,
        `Votre TMI est de ${donnees.tmi}%, ce qui peut avoir un impact sur votre fiscalité.`,
        `Nous avons identifié ${nbProblemes} problématiques nécessitant une attention particulière.`,
        `Votre score patrimonial global est de ${score_global.toFixed(1)}/10.`
      ]
    },
    section2_situation_actuelle: {
      situation_familiale: `Vous êtes ${donnees.situation_familiale || 'célibataire'} sous le régime ${donnees.regime_matrimonial || 'de la communauté réduite aux acquêts'}, ${donnees.nombre_enfants > 0 ? `avec ${donnees.nombre_enfants} enfant${donnees.nombre_enfants > 1 ? 's' : ''}` : 'sans enfant'}.`,
      situation_professionnelle: `Vous avez ${revenus_totaux.toLocaleString('fr-FR')}  de revenus annuels, dont ${donnees.revenus_salaires || 0} € de salaires/TNS, ${donnees.revenus_dividendes || 0} € de dividendes, ${donnees.revenus_fonciers || 0} € de revenus fonciers et ${donnees.revenus_autres || 0} € d'autres revenus.`,
      patrimoine: `Votre patrimoine net s'élève à ${patrimoine_total.toLocaleString('fr-FR')} €, réparti entre ${donnees.immobilier_pp || 0} € d'immobilier principal, ${donnees.immobilier_locatif || 0} € d'immobilier locatif, ${donnees.immobilier_secondaire || 0} € d'immobilier secondaire, ${donnees.sci || 0} € de SCI, ${donnees.scpi || 0} € de SCPI, ${donnees.liquidites || 0} € de liquidités, ${donnees.assurance_vie || 0} € d'assurance-vie, ${donnees.per || 0} € de PER, ${donnees.titres_societe || 0} € de titres société et ${donnees.portefeuille_financier || 0} € de portefeuille financier.`,
      revenus: `Vous percevez ${revenus_totaux.toLocaleString('fr-FR')} € de revenus annuels, dont ${donnees.revenus_salaires || 0} € de salaires/TNS, ${donnees.revenus_dividendes || 0} € de dividendes, ${donnees.revenus_fonciers || 0} € de revenus fonciers et ${donnees.revenus_autres || 0} € d'autres revenus.`
    },
    section3_analyses: {
      analyse_civile: `L'analyse civile et familiale a identifié ${problemes_civile.length} problématique(s), avec un score de ${analyse_civile.score || 0}/10. Les points forts sont : ${points_forts_civile.join(', ') || 'Aucun point fort identifié'}. Les points d'attention sont : ${points_attention_civile.join(', ') || 'Aucun point d\'attention identifié'}.`,
      analyse_fiscale: `L'analyse fiscale a identifié ${problemes_fiscale.length} problématique(s), avec un score de ${analyse_fiscale.score || 0}/10. Les points forts sont : ${points_forts_fiscale.join(', ') || 'Aucun point fort identifié'}. Les points d'attention sont : ${points_attention_fiscale.join(', ') || 'Aucun point d\'attention identifié'}.`,
      analyse_sociale: `L'analyse sociale a identifié ${problemes_sociale.length} problématique(s), avec un score de ${analyse_sociale.score || 0}/10. Les points forts sont : ${points_forts_sociale.join(', ') || 'Aucun point fort identifié'}. Les points d'attention sont : ${points_attention_sociale.join(', ') || 'Aucun point d\'attention identifié'}.`,
      analyse_patrimoniale: `L'analyse patrimoniale a identifié ${problemes_patrimoniale.length} problématique(s), avec un score de ${analyse_patrimoniale.score || 0}/10. Les points forts sont : ${points_forts_patrimoniale.join(', ') || 'Aucun point fort identifié'}. Les points d'attention sont : ${points_attention_patrimoniale.join(', ') || 'Aucun point d\'attention identifié'}.`
    },
    section4_problematiques: tous_problemes.map((p: any) => ({
      titre: `[${p.domaine}] ${p.titre || p.description?.substring(0, 50) || 'Problème détecté'}`,
      description: p.description || '',
      gravite: p.gravite || (p.impact_financier && p.impact_financier > 10000 ? 'haute' : 'moyenne') as 'haute' | 'moyenne' | 'faible',
      icon: p.icon
    })),
    section5_objectifs: {
      objectifs_declares: objectifs_declares,
      objectifs_deduits: objectifs_deduits.map((o: any) => `${o.titre} : ${o.description} (priorité : ${o.priorite})`)
    },
    section6_recommandations: {
      strategies: strategies.slice(0, 10), // Top 10
      synthese: `Nous avons identifié ${strategies.length} stratégies patrimoniales adaptées à votre situation. Les ${Math.min(10, strategies.length)} recommandations prioritaires sont présentées ci-dessous, classées par pertinence et impact potentiel.`
    },
    section7_plan_action: {
      actions_immediates: actions_immediates.map((a: any) => `${a.titre} : ${a.description} (priorité : ${a.priorite}, délai : ${a.delai})`),
      actions_court_terme: actions_court_terme.map((a: any) => `${a.titre} : ${a.description} (délai : ${a.delai})`),
      actions_moyen_terme: actions_moyen_terme.map((a: any) => `${a.titre} : ${a.description} (délai : ${a.delai})`)
    },
    
    // Format original pour la compatibilité
    situation_actuelle,
    analyse_patrimoniale: analyse_patrimoniale_section,
    problematiques_identifiees,
    objectifs: {
      objectifs_declares,
      objectifs_deduits
    },
    recommandations_strategiques,
    simulations,
    plan_action: {
      actions_immediates,
      actions_court_terme,
      actions_moyen_terme
    },
    preconisations
  };
  
  console.log('✅ Rapport structuré généré');
  return rapport;
}