import * as kv from './kv_store.tsx';
import * as indexIA from './index_ia.tsx';
import * as montagesPatrimoniaux from './montages_patrimoniaux.tsx';

// Types
interface ProfilClient {
  // Statut juridique
  statut_juridique: 'personne_physique' | 'entrepreneur_individuel' | 'gerant_sarl' | 'president_sas' | 'autre';
  
  // Régime fiscal
  regime_fiscal: 'bareme_progressif' | 'pfu' | 'is' | 'micro_entreprise' | 'reel';
  
  // Revenus
  remuneration_annuelle?: number;
  dividendes_annuels?: number;
  revenus_fonciers?: number;
  autres_revenus?: number;
  
  // Situation foyer
  situation_familiale: 'celibataire' | 'marie' | 'pacse' | 'divorce' | 'veuf';
  nombre_enfants: number;
  age_client: number;
  age_conjoint?: number;
  
  // Patrimoine
  patrimoine_immobilier?: number;
  patrimoine_financier?: number;
  patrimoine_professionnel?: number;
  
  // Objectifs patrimoniaux
  objectifs: string[]; // ex: ["transmission", "optimisation_fiscale", "revenus_complementaires", "retraite"]
  horizon_temps?: 'court_terme' | 'moyen_terme' | 'long_terme'; // <5 ans, 5-15 ans, >15 ans
  
  // Contraintes
  aversion_risque?: 'faible' | 'moderee' | 'elevee';
  liquidite_souhaitee?: 'faible' | 'moderee' | 'elevee';
}

interface RecommandationMontage {
  montage: any; // MontagePatrimonial
  score_pertinence: number; // 0-100
  explication: string;
  fiscalite_estimee: string;
  risques_identifies: string[];
  conditions_respectees: boolean;
  actions_requises: string[];
  economies_fiscales_estimees?: number;
}

interface AnalysePatrimoniale {
  profil_resume: string;
  situation_fiscale_actuelle: string;
  revenus_totaux: number;
  tranche_marginale_ir: string;
  montages_recommandes: RecommandationMontage[];
  regles_fiscales_applicables: any[];
  synthese_generale: string;
  date_analyse: string;
}

/**
 * Calculer les revenus totaux
 */
function calculerRevenusTotaux(profil: ProfilClient): number {
  return (
    (profil.remuneration_annuelle || 0) +
    (profil.dividendes_annuels || 0) +
    (profil.revenus_fonciers || 0) +
    (profil.autres_revenus || 0)
  );
}

/**
 * Déterminer la tranche marginale d'imposition
 */
function determinerTrancheMarginalIR(revenuImposable: number, nbParts: number): {
  tranche: string;
  taux: number;
} {
  const quotientFamilial = revenuImposable / nbParts;
  
  if (quotientFamilial <= 11294) {
    return { tranche: '0%', taux: 0 };
  } else if (quotientFamilial <= 28797) {
    return { tranche: '11%', taux: 11 };
  } else if (quotientFamilial <= 82341) {
    return { tranche: '30%', taux: 30 };
  } else if (quotientFamilial <= 177106) {
    return { tranche: '41%', taux: 41 };
  } else {
    return { tranche: '45%', taux: 45 };
  }
}

/**
 * Calculer le nombre de parts fiscales
 */
function calculerNbParts(profil: ProfilClient): number {
  let parts = 1;
  
  if (profil.situation_familiale === 'marie' || profil.situation_familiale === 'pacse') {
    parts = 2;
  }
  
  // Enfants
  if (profil.nombre_enfants === 1) parts += 0.5;
  else if (profil.nombre_enfants === 2) parts += 1;
  else if (profil.nombre_enfants >= 3) {
    parts += 1; // 2 premiers enfants
    parts += (profil.nombre_enfants - 2); // 1 part par enfant supplémentaire
  }
  
  return parts;
}

/**
 * Générer un résumé du profil
 */
function genererResumeProfil(profil: ProfilClient): string {
  const revenus = calculerRevenusTotaux(profil);
  const parts = calculerNbParts(profil);
  const tranche = determinerTrancheMarginalIR(revenus, parts);
  
  let resume = `Client ${profil.statut_juridique.replace(/_/g, ' ')} de ${profil.age_client} ans, `;
  
  if (profil.situation_familiale === 'marie' || profil.situation_familiale === 'pacse') {
    resume += `${profil.situation_familiale} `;
  } else {
    resume += `${profil.situation_familiale} `;
  }
  
  if (profil.nombre_enfants > 0) {
    resume += `avec ${profil.nombre_enfants} enfant${profil.nombre_enfants > 1 ? 's' : ''}. `;
  } else {
    resume += 'sans enfant. ';
  }
  
  resume += `Revenus annuels: ${revenus.toLocaleString('fr-FR')}€. `;
  resume += `Tranche marginale: ${tranche.tranche}. `;
  
  if (profil.objectifs && profil.objectifs.length > 0) {
    resume += `Objectifs: ${profil.objectifs.join(', ')}.`;
  }
  
  return resume;
}

/**
 * Construire une requête sémantique pour rechercher les règles fiscales
 */
function construireRequeteRegles(profil: ProfilClient): string {
  const elements: string[] = [];
  
  // Statut et régime
  elements.push(`Statut: ${profil.statut_juridique.replace(/_/g, ' ')}`);
  elements.push(`Régime fiscal: ${profil.regime_fiscal.replace(/_/g, ' ')}`);
  
  // Types de revenus
  if (profil.remuneration_annuelle && profil.remuneration_annuelle > 0) {
    elements.push('rémunération salaire');
  }
  if (profil.dividendes_annuels && profil.dividendes_annuels > 0) {
    elements.push('dividendes revenus capital');
  }
  if (profil.revenus_fonciers && profil.revenus_fonciers > 0) {
    elements.push('revenus fonciers immobilier');
  }
  
  // Situation familiale
  if (profil.nombre_enfants > 0) {
    elements.push(`famille ${profil.nombre_enfants} enfants transmission`);
  }
  
  // Objectifs
  if (profil.objectifs && profil.objectifs.length > 0) {
    elements.push(profil.objectifs.join(' '));
  }
  
  return elements.join(' ; ');
}

/**
 * Scorer la pertinence d'un montage pour un profil
 */
function scorerPertinenceMontage(
  montage: any,
  profil: ProfilClient,
  revenus: number
): number {
  let score = 0;
  
  // Score de base
  score += 20;
  
  // Objectifs du client matchent avec les tags du montage
  if (profil.objectifs && montage.tags) {
    const objectifsLower = profil.objectifs.map((o: string) => o.toLowerCase());
    const tagsLower = montage.tags.map((t: string) => t.toLowerCase());
    
    const matchCount = objectifsLower.filter((obj: string) => 
      tagsLower.some((tag: string) => tag.includes(obj) || obj.includes(tag))
    ).length;
    
    score += matchCount * 15; // +15 points par objectif matché
  }
  
  // Complexité adaptée au profil
  if (montage.complexite === 'simple') {
    score += 10;
  } else if (montage.complexite === 'moyen') {
    score += 5;
  }
  
  // Pertinence selon revenus
  if (revenus > 100000 && montage.nom_montage.toLowerCase().includes('holding')) {
    score += 20;
  }
  
  if (revenus > 150000 && montage.nom_montage.toLowerCase().includes('luxemb')) {
    score += 15;
  }
  
  if (profil.dividendes_annuels && profil.dividendes_annuels > 5000) {
    if (montage.nom_montage.toLowerCase().includes('pfu') || 
        montage.nom_montage.toLowerCase().includes('pea')) {
      score += 15;
    }
  }
  
  // Transmission
  if (profil.nombre_enfants > 0 && profil.age_client > 50) {
    if (montage.tags?.includes('transmission') || montage.tags?.includes('donation')) {
      score += 20;
    }
  }
  
  // Immobilier
  if (profil.patrimoine_immobilier && profil.patrimoine_immobilier > 200000) {
    if (montage.tags?.includes('immobilier') || montage.tags?.includes('SCI')) {
      score += 15;
    }
  }
  
  // Entreprise
  if (profil.statut_juridique.includes('gerant') || profil.statut_juridique.includes('president')) {
    if (montage.nom_montage.toLowerCase().includes('dutreil') ||
        montage.nom_montage.toLowerCase().includes('holding')) {
      score += 20;
    }
  }
  
  // Plafonner à 100
  return Math.min(100, score);
}

/**
 * Vérifier si les conditions du montage sont respectées
 */
function verifierConditions(montage: any, profil: ProfilClient): {
  respectees: boolean;
  details: string[];
} {
  const details: string[] = [];
  let respectees = true;
  
  const conditionsLower = montage.conditions.toLowerCase();
  
  // Vérifier patrimoine
  if (conditionsLower.includes('patrimoine')) {
    if (conditionsLower.includes('significatif') || conditionsLower.includes('conséquent')) {
      const patrimoineTotal = 
        (profil.patrimoine_immobilier || 0) +
        (profil.patrimoine_financier || 0) +
        (profil.patrimoine_professionnel || 0);
      
      if (patrimoineTotal < 200000) {
        respectees = false;
        details.push('⚠️ Patrimoine insuffisant (recommandé > 200k€)');
      } else {
        details.push('✅ Patrimoine suffisant');
      }
    }
  }
  
  // Vérifier enfants pour transmission
  if (conditionsLower.includes('enfants') || conditionsLower.includes('héritiers')) {
    if (profil.nombre_enfants === 0) {
      respectees = false;
      details.push('⚠️ Nécessite d\'avoir des héritiers');
    } else {
      details.push(`✅ ${profil.nombre_enfants} enfant(s)`);
    }
  }
  
  // Vérifier immobilier
  if (conditionsLower.includes('immobilier') || conditionsLower.includes('bien')) {
    if (!profil.patrimoine_immobilier || profil.patrimoine_immobilier < 100000) {
      respectees = false;
      details.push('⚠️ Nécessite un patrimoine immobilier significatif');
    } else {
      details.push('✅ Patrimoine immobilier présent');
    }
  }
  
  // Vérifier entreprise
  if (conditionsLower.includes('entreprise') || conditionsLower.includes('société')) {
    if (!profil.statut_juridique.includes('gerant') && 
        !profil.statut_juridique.includes('president') &&
        !profil.statut_juridique.includes('entrepreneur')) {
      respectees = false;
      details.push('⚠️ Nécessite d\'être chef d\'entreprise');
    } else {
      details.push('✅ Chef d\'entreprise');
    }
  }
  
  // Vérifier horizon de placement
  if (conditionsLower.includes('horizon') || conditionsLower.includes('ans')) {
    const match = conditionsLower.match(/(\d+)\s*ans/);
    if (match) {
      const annees = parseInt(match[1]);
      if (profil.horizon_temps === 'court_terme' && annees > 5) {
        respectees = false;
        details.push(`⚠️ Horizon trop court (${annees} ans requis)`);
      } else {
        details.push(`✅ Horizon adapté (${annees} ans)`);
      }
    }
  }
  
  if (details.length === 0) {
    details.push('✅ Conditions générales applicables');
  }
  
  return { respectees, details };
}

/**
 * Générer une explication personnalisée via OpenAI
 */
async function genererExplicationIA(
  montage: any,
  profil: ProfilClient,
  reglesFiscales: any[]
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    // Explication par défaut sans IA
    return `${montage.nom_montage}: ${montage.objectif}. ${montage.avantages}`;
  }
  
  try {
    const prompt = `Tu es un Conseiller en Gestion de Patrimoine expert.

PROFIL CLIENT:
${genererResumeProfil(profil)}

MONTAGE PATRIMONIAL:
Nom: ${montage.nom_montage}
Objectif: ${montage.objectif}
Avantages: ${montage.avantages}
Conditions: ${montage.conditions}

RÈGLES FISCALES APPLICABLES:
${reglesFiscales.slice(0, 3).map(r => `- ${r.regle}: ${r.consequence}`).join('\n')}

CONSIGNE:
Génère une explication personnalisée en 2-3 phrases pour expliquer pourquoi ce montage est pertinent pour CE client spécifique. Sois concret et chiffré si possible.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert CGP qui explique des montages patrimoniaux de manière claire et personnalisée.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('❌ Erreur génération explication IA:', error);
    return `${montage.nom_montage}: ${montage.objectif}. ${montage.avantages}`;
  }
}

/**
 * Estimer les économies fiscales
 */
function estimerEconomiesFiscales(
  montage: any,
  profil: ProfilClient,
  revenus: number,
  trancheMarginal: number
): number | undefined {
  const fiscaliteLower = montage.fiscalite.toLowerCase();
  
  // Extraction d'abattements
  const abattementMatch = fiscaliteLower.match(/abattement.*?(\d+)\s*(?:000|k)\s*€/);
  if (abattementMatch && profil.nombre_enfants > 0) {
    const abattement = parseInt(abattementMatch[1]) * 1000;
    // Économie = abattement * taux marginal * nombre d'enfants
    return Math.round(abattement * (trancheMarginal / 100) * profil.nombre_enfants);
  }
  
  // Réduction d'impôt
  const reductionMatch = fiscaliteLower.match(/réduction.*?(\d+)%/);
  if (reductionMatch) {
    const tauxReduction = parseInt(reductionMatch[1]);
    // Estimation conservative: 10k€ d'investissement
    return Math.round(10000 * (tauxReduction / 100));
  }
  
  // PFU vs barème
  if (montage.nom_montage.toLowerCase().includes('pea') && profil.dividendes_annuels) {
    // Économie PEA après 5 ans: exonération IR sur dividendes
    const economieAnnuelle = profil.dividendes_annuels * (trancheMarginal / 100);
    return Math.round(economieAnnuelle);
  }
  
  return undefined;
}

/**
 * Générer une synthèse générale via OpenAI
 */
async function genererSyntheseGenerale(
  profil: ProfilClient,
  recommandations: RecommandationMontage[]
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    return `${recommandations.length} montages patrimoniaux identifiés pour votre profil.`;
  }
  
  try {
    const topRecommandations = recommandations.slice(0, 3);
    
    const prompt = `Tu es un Conseiller en Gestion de Patrimoine expert.

PROFIL CLIENT:
${genererResumeProfil(profil)}

TOP MONTAGES RECOMMANDÉS:
${topRecommandations.map((r, i) => `${i + 1}. ${r.montage.nom_montage} (score: ${r.score_pertinence}/100)`).join('\n')}

CONSIGNE:
Génère une synthèse stratégique personnalisée en 3-4 phrases maximum. Explique la cohérence globale de ces recommandations par rapport aux objectifs du client. Sois concret et rassurant.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert CGP qui synthétise une stratégie patrimoniale de manière claire.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('❌ Erreur génération synthèse:', error);
    return `${recommandations.length} montages patrimoniaux identifiés correspondant à vos objectifs de ${profil.objectifs?.join(', ') || 'gestion patrimoniale'}.`;
  }
}

/**
 * MOTEUR PRINCIPAL: Analyser un profil et générer des recommandations
 */
export async function analyserProfilClient(profil: ProfilClient): Promise<AnalysePatrimoniale> {
  console.log('🤖 Démarrage de l\'analyse patrimoniale IA...');
  console.log('   👤 Client:', genererResumeProfil(profil));
  
  const startTime = Date.now();
  
  try {
    // 1. CALCULS DE BASE
    const revenus = calculerRevenusTotaux(profil);
    const nbParts = calculerNbParts(profil);
    const trancheMarginal = determinerTrancheMarginalIR(revenus, nbParts);
    
    console.log(`   💰 Revenus: ${revenus.toLocaleString('fr-FR')}€`);
    console.log(`   📊 Tranche marginale: ${trancheMarginal.tranche}`);
    
    // 2. RECHERCHE DES RÈGLES FISCALES PERTINENTES
    console.log('   🔍 Recherche de règles fiscales pertinentes...');
    const requeteRegles = construireRequeteRegles(profil);
    
    let reglesFiscales: any[] = [];
    try {
      const resultatsRegles = await indexIA.rechercherPourAssistant(requeteRegles, undefined, 10);
      reglesFiscales = resultatsRegles.resultats.map(r => ({
        regle: r.regle,
        condition: r.condition,
        consequence: r.consequence,
        source: r.source,
        pertinence: r.pertinence
      }));
      console.log(`   ✅ ${reglesFiscales.length} règles fiscales trouvées`);
    } catch (error) {
      console.warn('   ⚠️ Recherche de règles ignorée (index IA non disponible)');
    }
    
    // 3. RÉCUPÉRATION DE TOUS LES MONTAGES
    console.log('   📚 Récupération des montages patrimoniaux...');
    const tousMontages = await montagesPatrimoniaux.searchMontages(
      undefined, 
      undefined, 
      undefined, 
      'actif' // Seulement les montages actifs
    );
    console.log(`   ✅ ${tousMontages.length} montages disponibles`);
    
    // 4. SCORING ET FILTRAGE DES MONTAGES
    console.log('   🎯 Scoring des montages...');
    const recommandations: RecommandationMontage[] = [];
    
    for (const montage of tousMontages) {
      // Calculer le score de pertinence
      const score = scorerPertinenceMontage(montage, profil, revenus);
      
      // Seuil minimum de pertinence
      if (score < 30) {
        continue;
      }
      
      // Vérifier les conditions
      const { respectees, details } = verifierConditions(montage, profil);
      
      // Générer l'explication personnalisée
      const explication = await genererExplicationIA(montage, profil, reglesFiscales);
      
      // Estimer les économies fiscales
      const economiesFiscales = estimerEconomiesFiscales(montage, profil, revenus, trancheMarginal.taux);
      
      // Extraire les risques
      const risques = montage.risques
        .split(';')
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 0)
        .slice(0, 3);
      
      // Actions requises
      const actions = montage.etapes_juridiques
        .split('\n')
        .filter((e: string) => e.trim().length > 0)
        .slice(0, 3)
        .map((e: string) => e.replace(/^\d+\.\s*/, '').trim());
      
      recommandations.push({
        montage,
        score_pertinence: score,
        explication,
        fiscalite_estimee: montage.fiscalite,
        risques_identifies: risques,
        conditions_respectees: respectees,
        actions_requises: actions,
        economies_fiscales_estimees: economiesFiscales
      });
    }
    
    // Trier par score décroissant
    recommandations.sort((a, b) => b.score_pertinence - a.score_pertinence);
    
    // Limiter aux 10 meilleurs
    const topRecommandations = recommandations.slice(0, 10);
    
    console.log(`   ✅ ${topRecommandations.length} montages recommandés (score > 30)`);
    
    // 5. GÉNÉRER LA SYNTHÈSE GÉNÉRALE
    console.log('   📝 Génération de la synthèse...');
    const synthese = await genererSyntheseGenerale(profil, topRecommandations);
    
    // 6. CONSTRUIRE L'ANALYSE FINALE
    const analyse: AnalysePatrimoniale = {
      profil_resume: genererResumeProfil(profil),
      situation_fiscale_actuelle: `Revenus annuels: ${revenus.toLocaleString('fr-FR')}€ | Nombre de parts: ${nbParts} | Tranche marginale: ${trancheMarginal.tranche}`,
      revenus_totaux: revenus,
      tranche_marginale_ir: trancheMarginal.tranche,
      montages_recommandes: topRecommandations,
      regles_fiscales_applicables: reglesFiscales,
      synthese_generale: synthese,
      date_analyse: new Date().toISOString()
    };
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Analyse terminée en ${duration}s - ${topRecommandations.length} recommandations générées`);
    
    return analyse;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse patrimoniale:', error);
    throw error;
  }
}

/**
 * Sauvegarder une analyse pour un client
 */
export async function sauvegarderAnalyse(
  clientId: string,
  analyse: AnalysePatrimoniale
): Promise<{ success: boolean; analyseId?: string; error?: string }> {
  try {
    const analyseId = `analyse_${clientId}_${Date.now()}`;
    const key = `analyse_patrimoniale:${analyseId}`;
    
    await kv.set(key, {
      ...analyse,
      client_id: clientId,
      analyse_id: analyseId
    });
    
    console.log(`✅ Analyse sauvegardée: ${analyseId}`);
    
    return {
      success: true,
      analyseId
    };
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde analyse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupérer les analyses d'un client
 */
export async function getAnalysesClient(clientId: string): Promise<any[]> {
  try {
    const allItems = await kv.getByPrefix('analyse_patrimoniale:');
    
    const analyses = allItems
      .map(item => item.value)
      .filter((analyse: any) => analyse.client_id === clientId)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date_analyse).getTime();
        const dateB = new Date(b.date_analyse).getTime();
        return dateB - dateA;
      });
    
    return analyses;
    
  } catch (error) {
    console.error('❌ Erreur récupération analyses:', error);
    return [];
  }
}

/**
 * Obtenir les stats du moteur
 */
export async function getMoteurStats() {
  try {
    const allItems = await kv.getByPrefix('analyse_patrimoniale:');
    
    const analyses = allItems.map(item => item.value);
    
    // Compter les montages les plus recommandés
    const montagesCount: Record<string, number> = {};
    
    for (const analyse of analyses) {
      if (analyse.montages_recommandes) {
        for (const reco of analyse.montages_recommandes.slice(0, 3)) {
          const nom = reco.montage.nom_montage;
          montagesCount[nom] = (montagesCount[nom] || 0) + 1;
        }
      }
    }
    
    const topMontages = Object.entries(montagesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nom, count]) => ({ nom, count }));
    
    return {
      total_analyses: analyses.length,
      top_montages_recommandes: topMontages
    };
    
  } catch (error) {
    console.error('❌ Erreur stats moteur:', error);
    return {
      total_analyses: 0,
      top_montages_recommandes: []
    };
  }
}
