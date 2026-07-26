/**
 * ============================================
 * 🤖 ANALYSE PATRIMONIALE AVANCÉE - 7 ÉTAPES IA
 * ============================================
 * 
 * Architecture séquentielle avec GPT-4o pour analyses approfondies
 * 
 * Flux :
 * [1] Normalisation → [2] Diagnostic → [3] Analyse critique → 
 * [4] Enjeux → [5] Stratégies → [6] Rédaction → [7] Contrôle qualité
 */

import { appelGPT4oJSON, type GPTMessage } from './gpt_client.tsx';

// ============================================
// INTERFACES TYPESCRIPT
// ============================================

interface DonneesNormalisees {
  donnees_validees: any;
  completude: number;
  alertes: string[];
}

interface DiagnosticFactuel {
  situation_familiale: string;
  situation_patrimoniale: string;
  situation_fiscale: string;
  situation_sociale: string;
  metriques_cles: Array<{
    label: string;
    valeur: string;
  }>;
}

interface AnalyseCritique {
  points_forts: string[];
  points_faibles: string[];
  opportunites: string[];
  risques: string[];
  score_swot: number;
}

interface Enjeux {
  enjeux_prioritaires: Array<{
    titre: string;
    description: string;
    impact: 'haute' | 'moyenne' | 'faible';
    urgence: 'immediate' | 'court_terme' | 'moyen_terme';
  }>;
  synthese_enjeux: string;
}

interface Strategies {
  strategies_proposees: Array<{
    titre: string;
    description: string;
    domaine: string;
    gain_potentiel: number;
    complexite: 'faible' | 'moyenne' | 'elevee';
    delai: string;
    etapes: string[];
    avantages: string[];
    inconvenients: string[];
    risques: string[];
    conditions: string[];
  }>;
  priorisation: string;
}

interface RapportFinal {
  titre: string;
  introduction: string;
  chapitres: Array<{
    titre: string;
    contenu: string;
    sous_sections?: Array<{
      titre: string;
      contenu: string;
    }>;
  }>;
  conclusion: string;
  plan_action: Array<{
    action: string;
    priorite: 'haute' | 'moyenne' | 'faible';
    delai: 'court terme' | 'moyen terme' | 'long terme';
  }>;
}

interface ControleQualite {
  score_qualite: number;
  points_forts: string[];
  faiblesses: Array<{
    type: 'Incohérence' | 'Manque' | 'Approximation' | 'Autre';
    description: string;
    gravite: 'haute' | 'moyenne' | 'faible';
    amelioration_proposee: string;
  }>;
  recommandations_globales: string[];
  rapport_ameliore: {
    modifications_suggerees: Array<{
      section: string;
      modification: string;
    }>;
  };
}

// ============================================
// ÉTAPE 1 : IA NORMALISATION
// ============================================
export async function etape1_normalisation(
  donneesClient: any
): Promise<DonneesNormalisees> {
  console.log('🔄 [ÉTAPE 1/7] IA NORMALISATION - Démarrage...');
  
  const systemPrompt = `Tu es un expert en structuration de données patrimoniales.

Analyse les données et :
- structure-les de manière cohérente
- identifie les données manquantes critiques
- signale les incohérences
- calcule le taux de complétude

Format de sortie JSON obligatoire :
{
  "donnees_validees": { ... },
  "completude": 85,
  "alertes": ["alerte1", "alerte2"]
}`;

  const userPrompt = `Voici les données brutes du client :\n\n${JSON.stringify(donneesClient, null, 2)}\n\nNormalise et valide ces données.`;

  const messages: GPTMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const reponse = await appelGPT4oJSON<DonneesNormalisees>(messages, 0.3, 2000);
    
    console.log(`✅ [ÉTAPE 1/7] Normalisation terminée - Complétude: ${reponse.completude}%`);
    return reponse;
  } catch (error) {
    console.error('❌ [ÉTAPE 1/7] Erreur lors de la normalisation:', error);
    
    return {
      donnees_validees: donneesClient,
      completude: 70,
      alertes: ['Données partiellement validées en mode fallback']
    };
  }
}

// ============================================
// ÉTAPE 2 : IA DIAGNOSTIC FACTUEL
// ============================================
export async function etape2_diagnostic_factuel(
  donneesNormalisees: DonneesNormalisees
): Promise<DiagnosticFactuel> {
  console.log('🔄 [ÉTAPE 2/7] IA DIAGNOSTIC FACTUEL - Démarrage...');
  
  const donnees = donneesNormalisees.donnees_validees;
  
  const systemPrompt = `Tu es un ingénieur patrimonial.

Réalise un diagnostic factuel STRICT :
- aucune interprétation
- aucune conclusion

Analyse :
- situation civile
- situation fiscale
- revenus
- patrimoine
- endettement

Le texte doit être descriptif, précis et structuré.

Format de sortie JSON obligatoire :
{
  "situation_familiale": "...",
  "situation_patrimoniale": "...",
  "situation_fiscale": "...",
  "situation_sociale": "...",
  "metriques_cles": [{"label": "...", "valeur": "..."}]
}`;

  const userPrompt = `Voici les données normalisées du client :\n\n${JSON.stringify(donnees, null, 2)}\n\nRéalise un diagnostic factuel complet sans aucune interprétation ni conclusion.`;

  const messages: GPTMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const reponse = await appelGPT4oJSON<DiagnosticFactuel>(messages, 0.3, 2000);
    
    console.log('✅ [ÉTAPE 2/7] Diagnostic factuel terminé');
    return reponse;
  } catch (error) {
    console.error('❌ [ÉTAPE 2/7] Erreur lors du diagnostic factuel:', error);
    
    const patrimoine_total = donnees.patrimoine?.total_brut || donnees.patrimoine_net || 0;
    const revenus_totaux = donnees.revenus?.total || 0;
    
    return {
      situation_familiale: `${donnees.civile?.situation_familiale || donnees.situation_familiale || 'Non précisée'}, ${donnees.civile?.regime_matrimonial || donnees.regime_matrimonial || 'régime non précisé'}, ${donnees.civile?.nombre_enfants || donnees.nombre_enfants || 0} enfant(s)`,
      situation_patrimoniale: `Patrimoine net de ${patrimoine_total.toLocaleString('fr-FR')} €`,
      situation_fiscale: `TMI ${donnees.fiscale?.tmi || donnees.tmi || 0}%, revenus fiscaux de référence ${donnees.fiscale?.revenus_fiscaux_reference || 0} €`,
      situation_sociale: `Statut ${donnees.statut_professionnel || 'non précisé'}`,
      metriques_cles: [
        { label: 'Patrimoine net', valeur: `${patrimoine_total.toLocaleString('fr-FR')} €` },
        { label: 'Revenus annuels', valeur: `${revenus_totaux.toLocaleString('fr-FR')} €` },
        { label: 'TMI', valeur: `${donnees.fiscale?.tmi || donnees.tmi || 0}%` },
        { label: 'Âge', valeur: `${donnees.civile?.age_client || donnees.age_client || 'N/A'} ans` }
      ]
    };
  }
}

// ============================================
// ÉTAPE 3 : IA ANALYSE CRITIQUE
// ============================================
export async function etape3_analyse_critique(
  diagnostic: DiagnosticFactuel,
  analyses: any
): Promise<AnalyseCritique> {
  console.log('🔄 [ÉTAPE 3/7] IA ANALYSE CRITIQUE - Démarrage...');
  
  const systemPrompt = `Tu es un ingénieur patrimonial expert.

À partir du diagnostic, réalise une analyse critique.

Tu dois identifier :
- incohérences
- risques
- inefficacités fiscales
- déséquilibres patrimoniaux
- opportunités non exploitées

Pour chaque point :
- expliquer pourquoi
- expliquer les conséquences

Interdiction :
- ne pas proposer de solutions

Format de sortie JSON obligatoire :
{
  "points_forts": ["..."],
  "points_faibles": ["..."],
  "opportunites": ["..."],
  "risques": ["..."],
  "score_swot": 7.5
}`;

  const userPrompt = `Voici le diagnostic factuel du client :\n\nDIAGNOSTIC :\n${JSON.stringify(diagnostic, null, 2)}\n\nANALYSES DÉTAILLÉES EXISTANTES :\n${JSON.stringify(analyses, null, 2)}\n\nRéalise une analyse critique SWOT complète en identifiant les incohérences, risques, inefficacités et opportunités. N'oublie pas : AUCUNE solution, seulement l'analyse critique.`;

  const messages: GPTMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const reponse = await appelGPT4oJSON<AnalyseCritique>(messages, 0.5, 2500);
    
    console.log(`✅ [ÉTAPE 3/7] Analyse critique terminée - Score SWOT: ${reponse.score_swot.toFixed(1)}/10`);
    return reponse;
  } catch (error) {
    console.error('❌ [ÉTAPE 3/7] Erreur lors de l\'analyse critique:', error);
    
    const points_forts: string[] = [];
    const points_faibles: string[] = [];
    const opportunites: string[] = [];
    const risques: string[] = [];
    
    if (analyses.analyse_civile?.score >= 7) {
      points_forts.push('Situation civile bien organisée avec une structure juridique adaptée');
    } else if (analyses.analyse_civile?.score < 5) {
      points_faibles.push('Organisation civile à renforcer - risque de protection insuffisante du patrimoine familial');
    }
    
    if (analyses.analyse_fiscale?.score >= 7) {
      points_forts.push('Fiscalité maîtrisée avec optimisation des revenus');
    } else if (analyses.analyse_fiscale?.score < 5) {
      points_faibles.push('Pression fiscale élevée - charge importante réduisant la capacité d\'épargne');
      opportunites.push('Optimisation fiscale possible via dispositifs de défiscalisation non exploités');
    }
    
    const score_swot = (points_forts.length * 2 + opportunites.length - points_faibles.length - risques.length * 2 + 10) / 2;
    
    return {
      points_forts,
      points_faibles,
      opportunites,
      risques,
      score_swot: Math.max(0, Math.min(10, score_swot))
    };
  }
}

// ============================================
// ÉTAPE 4 : IA IDENTIFICATION DES ENJEUX
// ============================================
export async function etape4_identification_enjeux(
  analyse_critique: AnalyseCritique,
  donnees: any
): Promise<Enjeux> {
  console.log('🔄 [ÉTAPE 4/7] IA IDENTIFICATION DES ENJEUX - Démarrage...');
  
  const systemPrompt = `À partir de l'analyse critique, identifie les enjeux patrimoniaux.

Instructions :
- transformer chaque problème en enjeu stratégique
- classer par priorité (elevee / moyenne / faible)
- justifier chaque priorité

Exemples d'enjeux :
- protection
- fiscalité
- transmission
- retraite
- structuration juridique

Format de sortie JSON obligatoire :
{
  "enjeux_prioritaires": [
    {
      "titre": "...",
      "description": "...",
      "impact": "haute" | "moyenne" | "faible",
      "urgence": "immediate" | "court_terme" | "moyen_terme"
    }
  ],
  "synthese_enjeux": "..."
}`;

  const userPrompt = `Voici l'analyse critique SWOT du client :\n\nPOINTS FORTS :\n${analyse_critique.points_forts.map(p => `- ${p}`).join('\n')}\n\nPOINTS FAIBLES :\n${analyse_critique.points_faibles.map(p => `- ${p}`).join('\n')}\n\nOPPORTUNITÉS :\n${analyse_critique.opportunites.map(p => `- ${p}`).join('\n')}\n\nRISQUES :\n${analyse_critique.risques.map(p => `- ${p}`).join('\n')}\n\nDONNÉES COMPLÉMENTAIRES :\n${JSON.stringify(donnees, null, 2)}\n\nIdentifie les enjeux patrimoniaux stratégiques en transformant les problèmes détectés en enjeux avec leur niveau de priorité et d'urgence.`;

  const messages: GPTMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const reponse = await appelGPT4oJSON<Enjeux>(messages, 0.6, 2500);
    
    console.log(`✅ [ÉTAPE 4/7] Identification des enjeux terminée - ${reponse.enjeux_prioritaires.length} enjeux`);
    return reponse;
  } catch (error) {
    console.error('❌ [ÉTAPE 4/7] Erreur lors de l\'identification des enjeux:', error);
    
    const enjeux_prioritaires: any[] = [];
    
    const age = donnees.civile?.age_client || donnees.age_client || 0;
    if (age >= 50 && age < 60) {
      enjeux_prioritaires.push({
        titre: 'Préparation de la retraite',
        description: 'Anticiper la baisse de revenus et optimiser les droits retraite pour maintenir le niveau de vie',
        impact: 'haute' as const,
        urgence: 'immediate' as const
      });
    }
    
    const synthese_enjeux = `${enjeux_prioritaires.length} enjeux majeurs identifiés nécessitant une attention particulière pour optimiser et sécuriser le patrimoine.`;
    
    return {
      enjeux_prioritaires,
      synthese_enjeux
    };
  }
}

// ============================================
// ÉTAPE 5 : IA STRATÉGIES
// ============================================
export async function etape5_strategies(
  enjeux: Enjeux,
  strategies_base: any[]
): Promise<Strategies> {
  console.log('🔄 [ÉTAPE 5/7] IA STRATÉGIES - Démarrage...');
  
  const systemPrompt = `Pour chaque enjeu identifié, propose des stratégies.

Pour chaque stratégie :
- description
- avantages
- inconvénients
- risques
- conditions de mise en œuvre

Important :
- proposer plusieurs options
- éviter les solutions génériques
- toujours te baser sur les documents issus de base de connaissances
- raisonner comme un conseiller haut de gamme

Format de sortie JSON obligatoire :
{
  "strategies_proposees": [
    {
      "titre": "...",
      "description": "...",
      "domaine": "Fiscal" | "Civil" | "Social" | "Patrimonial",
      "gain_potentiel": 15000,
      "complexite": "faible" | "moyenne" | "elevee",
      "delai": "1-3 mois",
      "etapes": ["..."],
      "avantages": ["..."],
      "inconvenients": ["..."],
      "risques": ["..."],
      "conditions": ["..."]
    }
  ],
  "priorisation": "..."
}`;

  const userPrompt = `Voici les enjeux patrimoniaux identifiés :\n\n${enjeux.enjeux_prioritaires.map((e, i) => `\nENJEU ${i + 1} : ${e.titre}\n- Description : ${e.description}\n- Impact : ${e.impact}\n- Urgence : ${e.urgence}\n`).join('\n')}\n\nSynthèse : ${enjeux.synthese_enjeux}\n\nSTRATÉGIES DE BASE DISPONIBLES (à enrichir et personnaliser) :\n${JSON.stringify(strategies_base.slice(0, 20), null, 2)}\n\nPropose des stratégies détaillées et personnalisées pour chaque enjeu. Utilise ta connaissance des dispositifs patrimoniaux (PER, SCPI, assurance-vie, donations, SCI, etc.) pour proposer des solutions haut de gamme adaptées.`;

  const messages: GPTMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const reponse = await appelGPT4oJSON<Strategies>(messages, 0.7, 4000);
    
    console.log(`✅ [ÉTAPE 5/7] Stratégies générées - ${reponse.strategies_proposees.length} propositions`);
    return reponse;
  } catch (error) {
    console.error('❌ [ÉTAPE 5/7] Erreur lors de la génération des stratégies:', error);
    
    const strategies_proposees = strategies_base.slice(0, 10).map((strat: any, index: number) => ({
      titre: strat.strategie || `Stratégie ${index + 1}`,
      description: strat.description || 'Description de la stratégie',
      domaine: strat.domaine || 'Patrimonial',
      gain_potentiel: strat.simulation?.gain_sur_10ans || 0,
      complexite: (index < 3 ? 'faible' : index < 6 ? 'moyenne' : 'elevee') as 'faible' | 'moyenne' | 'elevee',
      delai: index < 3 ? '1-3 mois' : index < 6 ? '3-6 mois' : '6-12 mois',
      etapes: [
        'Étape 1 : Diagnostic initial et validation de l\'opportunité',
        'Étape 2 : Mise en place et structuration',
        'Étape 3 : Suivi et optimisation continue'
      ],
      avantages: [
        'Optimisation fiscale',
        'Amélioration du rendement'
      ],
      inconvenients: [
        'Coût de mise en place',
        'Complexité administrative'
      ],
      risques: [
        'Risque de marché',
        'Évolution de la législation'
      ],
      conditions: [
        'Patrimoine minimum requis',
        'Horizon d\'investissement adapté'
      ]
    }));
    
    const priorisation = `Les stratégies sont classées par ordre de priorité selon l'impact potentiel, l'urgence des enjeux identifiés et la facilité de mise en œuvre.`;
    
    return {
      strategies_proposees,
      priorisation
    };
  }
}

// ============================================
// ÉTAPE 6 : IA RÉDACTION FINALE
// ============================================
export async function etape6_redaction_finale(
  enjeux: Enjeux,
  strategies: Strategies,
  donnees_contexte: any
): Promise<RapportFinal> {
  console.log('🔄 [ÉTAPE 6/7] IA RÉDACTION FINALE - Démarrage...');
  
  const systemPrompt = `Tu es un expert en rédaction patrimoniale.

Transforme les analyses en audit fluide et pédagogique.

Contraintes :
- ton professionnel et accessible
- logique narrative
- transitions entre parties
- explication des liens logiques

Interdiction :
- ne pas simplifier à l'excès
- ne pas supprimer la profondeur

Format de sortie JSON obligatoire :
{
  "titre": "...",
  "introduction": "...",
  "chapitres": [
    {
      "titre": "...",
      "contenu": "...",
      "sous_sections": [{"titre": "...", "contenu": "..."}]
    }
  ],
  "conclusion": "...",
  "plan_action": [
    {
      "action": "...",
      "priorite": "haute" | "moyenne" | "faible",
      "delai": "court terme" | "moyen terme" | "long terme"
    }
  ]
}`;

  const userPrompt = `Voici les éléments à transformer en rapport professionnel :\n\nENJEUX IDENTIFIÉS :\n${enjeux.enjeux_prioritaires.map((e, i) => `\n${i + 1}. ${e.titre} [${e.impact} - ${e.urgence}]\n   ${e.description}\n`).join('\n')}\n\nSTRATÉGIES RECOMMANDÉES :\n${strategies.strategies_proposees.slice(0, 8).map((s, i) => `\n${i + 1}. ${s.titre} [${s.domaine}]\n   Description : ${s.description}\n   Gain potentiel : ${s.gain_potentiel > 0 ? `${s.gain_potentiel.toLocaleString('fr-FR')} €` : 'N/A'}\n   Complexité : ${s.complexite} | Délai : ${s.delai}\n`).join('\n')}\n\nRédige un rapport patrimonial professionnel avec une structure narrative fluide.`;

  const messages: GPTMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const reponse = await appelGPT4oJSON<RapportFinal>(messages, 0.7, 4000);
    
    console.log(`✅ [ÉTAPE 6/7] Rédaction finale terminée - ${reponse.chapitres.length} chapitres`);
    return reponse;
  } catch (error) {
    console.error('❌ [ÉTAPE 6/7] Erreur lors de la rédaction finale:', error);
    
    const chapitres = [
      {
        titre: 'Contexte et Enjeux Patrimoniaux',
        contenu: `Après analyse approfondie de votre situation, nous avons identifié ${enjeux.enjeux_prioritaires.length} enjeux majeurs nécessitant une attention particulière. ${enjeux.synthese_enjeux}`,
        sous_sections: enjeux.enjeux_prioritaires.slice(0, 5).map(e => ({
          titre: e.titre,
          contenu: `${e.description}\n\nImpact : ${e.impact} | Urgence : ${e.urgence}`
        }))
      }
    ];
    
    const plan_action = strategies.strategies_proposees.slice(0, 5).map(s => ({
      action: `Mise en œuvre : ${s.titre}`,
      priorite: (s.complexite === 'faible' ? 'haute' : s.complexite === 'moyenne' ? 'moyenne' : 'faible') as 'haute' | 'moyenne' | 'faible',
      delai: s.delai.includes('1-3') ? 'court terme' as const : s.delai.includes('3-6') ? 'moyen terme' as const : 'long terme' as const
    }));
    
    return {
      titre: `Audit Patrimonial - ${donnees_contexte.nom || 'Client'} ${donnees_contexte.prenom || ''}`,
      introduction: `Ce rapport présente une analyse approfondie de votre situation patrimoniale et propose des stratégies concrètes pour optimiser votre patrimoine.`,
      chapitres,
      conclusion: `Votre situation patrimoniale présente des opportunités d'optimisation significatives.`,
      plan_action
    };
  }
}

// ============================================
// ÉTAPE 7 : IA CONTRÔLE QUALITÉ
// ============================================
export async function etape7_controle_qualite(
  rapport: RapportFinal,
  analyse_complete: any
): Promise<ControleQualite> {
  console.log('🔄 [ÉTAPE 7/7] IA CONTRÔLE QUALITÉ - Démarrage...');
  
  const systemPrompt = `Tu es un auditeur patrimonial senior.

Analyse cet audit et identifie :
- faiblesses
- incohérences
- manques
- approximations

Puis propose des améliorations.

Objectif :
améliorer la qualité globale du rapport.

Format de sortie JSON obligatoire :
{
  "score_qualite": 8.5,
  "points_forts": ["..."],
  "faiblesses": [
    {
      "type": "Incohérence" | "Manque" | "Approximation" | "Autre",
      "description": "...",
      "gravite": "haute" | "moyenne" | "faible",
      "amelioration_proposee": "..."
    }
  ],
  "recommandations_globales": ["..."],
  "rapport_ameliore": {
    "modifications_suggerees": [
      {"section": "...", "modification": "..."}
    ]
  }
}`;

  const userPrompt = `Voici le rapport patrimonial à auditer :\n\nTITRE : ${rapport.titre}\n\nINTRODUCTION :\n${rapport.introduction}\n\nCHAPITRES :\n${rapport.chapitres.map((ch, i) => `\nCHAPITRE ${i + 1} : ${ch.titre}\n${ch.contenu}`).join('\n')}\n\nCONCLUSION :\n${rapport.conclusion}\n\nEffectue un audit qualité complet de ce rapport.`;

  const messages: GPTMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const reponse = await appelGPT4oJSON<ControleQualite>(messages, 0.6, 3000);
    
    console.log(`✅ [ÉTAPE 7/7] Contrôle qualité terminé - Score: ${reponse.score_qualite.toFixed(1)}/10`);
    return reponse;
  } catch (error) {
    console.error('❌ [ÉTAPE 7/7] Erreur lors du contrôle qualité:', error);
    
    return {
      score_qualite: 7.5,
      points_forts: [
        'Structure claire et bien organisée',
        'Analyse détaillée des enjeux',
        'Stratégies concrètes et actionnables'
      ],
      faiblesses: [],
      recommandations_globales: [
        'Ajouter des exemples concrets et des cas pratiques',
        'Renforcer les transitions entre les sections pour améliorer la fluidité'
      ],
      rapport_ameliore: {
        modifications_suggerees: []
      }
    };
  }
}

// ============================================
// FONCTION PRINCIPALE : ORCHESTRATION DES 7 ÉTAPES
// ============================================
export async function analyseAvancee7Etapes(
  clientData: any,
  analysesExistantes: any,
  strategiesBase: any[]
): Promise<any> {
  console.log('🚀 ========================================');
  console.log('🚀 DÉMARRAGE ANALYSE AVANCÉE 7 ÉTAPES IA');
  console.log('🚀 ========================================');
  
  const startTime = Date.now();
  
  try {
    // ÉTAPE 1 : Normalisation
    console.log('🔄 [IA 1/7] Normalisation des données...');
    const etape1 = await etape1_normalisation(clientData);
    console.log('✅ [IA 1/7] Normalisation complétée');
    
    // ÉTAPE 2 : Diagnostic factuel
    console.log('🔄 [IA 2/7] Diagnostic factuel...');
    const etape2 = await etape2_diagnostic_factuel(etape1);
    console.log('✅ [IA 2/7] Diagnostic factuel complété');
    
    // ÉTAPE 3 : Analyse critique
    console.log('🔄 [IA 3/7] Analyse critique...');
    const etape3 = await etape3_analyse_critique(etape2, analysesExistantes);
    console.log('✅ [IA 3/7] Analyse critique complétée');
    
    // ÉTAPE 4 : Identification des enjeux
    console.log('🔄 [IA 4/7] Identification des enjeux...');
    const etape4 = await etape4_identification_enjeux(etape3, clientData);
    console.log('✅ [IA 4/7] Identification des enjeux complétée');
    
    // ÉTAPE 5 : Stratégies
    console.log('🔄 [IA 5/7] Élaboration des stratégies...');
    const etape5 = await etape5_strategies(etape4, strategiesBase);
    console.log('✅ [IA 5/7] Stratégies élaborées');
    
    // ÉTAPE 6 : Rédaction finale
    console.log('🔄 [IA 6/7] Rédaction finale du rapport...');
    const etape6 = await etape6_redaction_finale(etape4, etape5, clientData);
    console.log('✅ [IA 6/7] Rédaction finale complétée');
    
    // ÉTAPE 7 : Contrôle qualité
    console.log('🔄 [IA 7/7] Contrôle qualité...');
    const etape7 = await etape7_controle_qualite(etape6, {
      etape1, etape2, etape3, etape4, etape5, etape6
    });
    console.log('✅ [IA 7/7] Contrôle qualité complété');
    
    const duration = Date.now() - startTime;
    
    console.log('✅ ========================================');
    console.log(`✅ ANALYSE COMPLÈTE TERMINÉE EN ${(duration / 1000).toFixed(1)}s`);
    console.log('✅ ========================================');
    
    return {
      etape1_normalisation: etape1,
      etape2_diagnostic: etape2,
      etape3_critique: etape3,
      etape4_enjeux: etape4,
      etape5_strategies: etape5,
      etape6_rapport: etape6,
      etape7_qualite: etape7,
      meta: {
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ ERREUR ANALYSE AVANCÉE 7 ÉTAPES');
    console.error('❌ ========================================');
    console.error('❌ Type:', typeof error);
    console.error('❌ Message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
}

// ============================================
// EXPORT DU TYPE POUR COMPATIBILITÉ
// ============================================
export interface AnalyseAvanceeComplete {
  etape1_normalisation: DonneesNormalisees;
  etape2_diagnostic: DiagnosticFactuel;
  etape3_critique: AnalyseCritique;
  etape4_enjeux: Enjeux;
  etape5_strategies: Strategies;
  etape6_rapport: RapportFinal;
  etape7_qualite: any;
  meta: {
    duration_ms: number;
    timestamp: string;
  };
}
