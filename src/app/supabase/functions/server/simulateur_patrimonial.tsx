import * as kv from './kv_store.tsx';
import * as montagesPatrimoniaux from './montages_patrimoniaux.tsx';

// Types
interface ParametresSimulation {
  montage_id: string;
  
  // Capital de départ
  capital_initial: number;
  apport_annuel?: number;
  
  // Rendement
  taux_rendement_annuel: number; // %
  
  // Horizon
  duree_annees: number;
  
  // Fiscalité
  tranche_marginale_ir: number; // %
  taux_ps?: number; // Prélèvements sociaux (défaut 17.2%)
  
  // Profil client
  age_client?: number;
  nombre_enfants?: number;
  patrimoine_net?: number;
  
  // Options spécifiques au montage
  abattement_applicable?: number; // ex: 100 000 pour donation
  taux_reduction_impot?: number; // ex: Dutreil 75%
  exoneration_apres_annees?: number; // ex: PEA après 5 ans
  
  // Coûts
  frais_gestion_annuels?: number; // %
  frais_entree?: number; // % ou montant fixe
  frais_sortie?: number; // % ou montant fixe
}

interface FluxAnnuel {
  annee: number;
  capital_debut: number;
  apport: number;
  rendement_brut: number;
  frais_gestion: number;
  rendement_net_frais: number;
  fiscalite: number;
  rendement_net_final: number;
  capital_fin: number;
  capital_cumule: number;
}

interface ResultatSimulation {
  montage: any;
  parametres: ParametresSimulation;
  
  // Résultats globaux
  capital_final: number;
  total_investis: number;
  plus_value: number;
  rendement_global: number; // %
  taux_rendement_annuel_moyen: number; // %
  
  // Fiscalité
  total_fiscalite: number;
  economie_fiscale_vs_bareme?: number;
  
  // Flux annuels détaillés
  flux_annuels: FluxAnnuel[];
  
  // Métriques
  horizon_optimal: number; // Nombre d'années optimal
  seuil_rentabilite: number; // Année à partir de laquelle c'est rentable
  
  date_simulation: string;
}

interface ComparaisonScenarios {
  scenarios: ResultatSimulation[];
  meilleur_scenario_id: string;
  tableau_comparatif: {
    montage: string;
    capital_final: number;
    plus_value: number;
    rendement_annuel_moyen: number;
    total_fiscalite: number;
  }[];
}

/**
 * Calculer la fiscalité selon le type de montage et l'horizon
 */
function calculerFiscalite(
  montage: any,
  rendement: number,
  annee: number,
  params: ParametresSimulation
): number {
  const nomLower = montage.nom_montage.toLowerCase();
  const tauxPS = params.taux_ps || 17.2;
  
  // PEA - Exonération après 5 ans
  if (nomLower.includes('pea')) {
    if (annee >= (params.exoneration_apres_annees || 5)) {
      // Seulement prélèvements sociaux après 5 ans
      return rendement * (tauxPS / 100);
    } else {
      // IR + PS si retrait avant 5 ans
      return rendement * ((params.tranche_marginale_ir + tauxPS) / 100);
    }
  }
  
  // Assurance-vie - Fiscalité progressive
  if (nomLower.includes('assurance') && nomLower.includes('vie')) {
    if (annee >= 8) {
      // Après 8 ans: abattement + PFU réduit
      const abattement = params.nombre_enfants && params.nombre_enfants > 0 ? 9200 : 4600;
      const rendementImposable = Math.max(0, rendement - abattement);
      
      // PFU à 7.5% après 8 ans (au lieu de 12.8%)
      return rendementImposable * ((7.5 + tauxPS) / 100);
    } else {
      // Avant 8 ans: PFU 12.8% + PS 17.2%
      return rendement * ((12.8 + tauxPS) / 100);
    }
  }
  
  // Holding - IS
  if (nomLower.includes('holding')) {
    // IS à 25% (ou 15% jusqu'à 42.500€)
    const tauxIS = rendement <= 42500 ? 15 : 25;
    return rendement * (tauxIS / 100);
  }
  
  // Immobilier/SCI - LMNP
  if (nomLower.includes('lmnp')) {
    // Amortissement => fiscalité réduite
    // On estime une fiscalité réduite de 50% grâce à l'amortissement
    return rendement * (params.tranche_marginale_ir / 100) * 0.5;
  }
  
  // Donation - Fiscalité sur la transmission
  if (nomLower.includes('donation')) {
    if (params.abattement_applicable && params.nombre_enfants) {
      const montantParEnfant = params.capital_initial / params.nombre_enfants;
      const abattement = params.abattement_applicable || 100000;
      const montantImposable = Math.max(0, montantParEnfant - abattement);
      
      // Barème donation (simplifié)
      let droits = 0;
      if (montantImposable <= 8072) droits = montantImposable * 0.05;
      else if (montantImposable <= 12109) droits = 404 + (montantImposable - 8072) * 0.10;
      else if (montantImposable <= 15932) droits = 808 + (montantImposable - 12109) * 0.15;
      else if (montantImposable <= 552324) droits = 1682 + (montantImposable - 15932) * 0.20;
      else droits = 108992 + (montantImposable - 552324) * 0.45;
      
      return droits * params.nombre_enfants;
    }
    return 0;
  }
  
  // Pacte Dutreil - Réduction de 75%
  if (nomLower.includes('dutreil')) {
    if (params.taux_reduction_impot) {
      // Application de la réduction Dutreil
      const droitsNormaux = rendement * (params.tranche_marginale_ir / 100);
      return droitsNormaux * (1 - params.taux_reduction_impot / 100);
    }
  }
  
  // Par défaut: PFU (30% = 12.8% IR + 17.2% PS)
  return rendement * ((12.8 + tauxPS) / 100);
}

/**
 * Calculer les frais de gestion
 */
function calculerFraisGestion(capital: number, params: ParametresSimulation): number {
  if (!params.frais_gestion_annuels) return 0;
  return capital * (params.frais_gestion_annuels / 100);
}

/**
 * Simuler un montage patrimonial
 */
export async function simulerMontage(
  params: ParametresSimulation
): Promise<ResultatSimulation> {
  console.log(`📊 Simulation du montage ${params.montage_id}...`);
  
  try {
    // Récupérer le montage
    const montage = await montagesPatrimoniaux.getMontage(params.montage_id);
    
    if (!montage) {
      throw new Error(`Montage ${params.montage_id} non trouvé`);
    }
    
    // Initialisation
    const flux_annuels: FluxAnnuel[] = [];
    let capital = params.capital_initial;
    let total_investis = params.capital_initial;
    let total_fiscalite = 0;
    
    // Frais d'entrée
    const frais_entree = params.frais_entree 
      ? (params.frais_entree > 1 
          ? capital * (params.frais_entree / 100)
          : params.frais_entree)
      : 0;
    
    capital -= frais_entree;
    
    // Simulation année par année
    for (let annee = 1; annee <= params.duree_annees; annee++) {
      const capital_debut = capital;
      const apport = params.apport_annuel || 0;
      
      // Rendement brut
      const rendement_brut = (capital_debut + apport) * (params.taux_rendement_annuel / 100);
      
      // Frais de gestion
      const frais_gestion = calculerFraisGestion(capital_debut + apport, params);
      
      // Rendement net de frais
      const rendement_net_frais = rendement_brut - frais_gestion;
      
      // Fiscalité
      const fiscalite = calculerFiscalite(montage, rendement_net_frais, annee, params);
      total_fiscalite += fiscalite;
      
      // Rendement net final
      const rendement_net_final = rendement_net_frais - fiscalite;
      
      // Capital fin d'année
      capital = capital_debut + apport + rendement_net_final;
      total_investis += apport;
      
      flux_annuels.push({
        annee,
        capital_debut,
        apport,
        rendement_brut,
        frais_gestion,
        rendement_net_frais,
        fiscalite,
        rendement_net_final,
        capital_fin: capital,
        capital_cumule: total_investis
      });
    }
    
    // Frais de sortie
    const frais_sortie = params.frais_sortie
      ? (params.frais_sortie > 1
          ? capital * (params.frais_sortie / 100)
          : params.frais_sortie)
      : 0;
    
    const capital_final = capital - frais_sortie;
    total_fiscalite += frais_sortie;
    
    // Calculs finaux
    const plus_value = capital_final - total_investis;
    const rendement_global = (plus_value / total_investis) * 100;
    
    // TAEG (Taux Annuel Effectif Global)
    const taux_rendement_annuel_moyen = 
      (Math.pow(capital_final / params.capital_initial, 1 / params.duree_annees) - 1) * 100;
    
    // Seuil de rentabilité
    let seuil_rentabilite = params.duree_annees;
    for (let i = 0; i < flux_annuels.length; i++) {
      if (flux_annuels[i].capital_fin > flux_annuels[i].capital_cumule) {
        seuil_rentabilite = i + 1;
        break;
      }
    }
    
    // Horizon optimal (on considère que c'est mieux sur le long terme)
    let horizon_optimal = params.duree_annees;
    
    // Pour certains montages, horizon optimal différent
    const nomLower = montage.nom_montage.toLowerCase();
    if (nomLower.includes('pea')) {
      horizon_optimal = Math.max(5, params.duree_annees); // Min 5 ans pour PEA
    } else if (nomLower.includes('assurance') && nomLower.includes('vie')) {
      horizon_optimal = Math.max(8, params.duree_annees); // Min 8 ans pour AV
    }
    
    // Calcul de l'économie fiscale vs barème progressif
    let economie_fiscale_vs_bareme: number | undefined;
    if (!nomLower.includes('donation')) {
      const rendement_total = capital_final - total_investis;
      const fiscalite_bareme = rendement_total * ((params.tranche_marginale_ir + (params.taux_ps || 17.2)) / 100);
      economie_fiscale_vs_bareme = fiscalite_bareme - total_fiscalite;
    }
    
    console.log(`✅ Simulation terminée - Capital final: ${capital_final.toLocaleString('fr-FR')}€`);
    
    return {
      montage,
      parametres: params,
      capital_final,
      total_investis,
      plus_value,
      rendement_global,
      taux_rendement_annuel_moyen,
      total_fiscalite,
      economie_fiscale_vs_bareme,
      flux_annuels,
      horizon_optimal,
      seuil_rentabilite,
      date_simulation: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur simulation:', error);
    throw error;
  }
}

/**
 * Comparer plusieurs scénarios
 */
export async function comparerScenarios(
  scenarios_params: ParametresSimulation[]
): Promise<ComparaisonScenarios> {
  console.log(`📊 Comparaison de ${scenarios_params.length} scénarios...`);
  
  try {
    // Simuler tous les scénarios
    const scenarios: ResultatSimulation[] = [];
    
    for (const params of scenarios_params) {
      const resultat = await simulerMontage(params);
      scenarios.push(resultat);
    }
    
    // Trouver le meilleur scénario (capital final le plus élevé)
    let meilleur_scenario = scenarios[0];
    for (const scenario of scenarios) {
      if (scenario.capital_final > meilleur_scenario.capital_final) {
        meilleur_scenario = scenario;
      }
    }
    
    // Créer le tableau comparatif
    const tableau_comparatif = scenarios.map(s => ({
      montage: s.montage.nom_montage,
      capital_final: s.capital_final,
      plus_value: s.plus_value,
      rendement_annuel_moyen: s.taux_rendement_annuel_moyen,
      total_fiscalite: s.total_fiscalite
    }));
    
    console.log(`✅ Comparaison terminée - Meilleur: ${meilleur_scenario.montage.nom_montage}`);
    
    return {
      scenarios,
      meilleur_scenario_id: meilleur_scenario.montage.montage_id,
      tableau_comparatif
    };
    
  } catch (error) {
    console.error('❌ Erreur comparaison:', error);
    throw error;
  }
}

/**
 * Créer un scénario optimiste/pessimiste/réaliste
 */
export function creerScenariosMultiples(
  params_base: ParametresSimulation
): ParametresSimulation[] {
  return [
    {
      ...params_base,
      taux_rendement_annuel: params_base.taux_rendement_annuel * 0.5, // Pessimiste: -50%
    },
    {
      ...params_base, // Réaliste
    },
    {
      ...params_base,
      taux_rendement_annuel: params_base.taux_rendement_annuel * 1.5, // Optimiste: +50%
    }
  ];
}

/**
 * Sauvegarder une simulation
 */
export async function sauvegarderSimulation(
  clientId: string,
  simulation: ResultatSimulation
): Promise<{ success: boolean; simulationId?: string; error?: string }> {
  try {
    const simulationId = `simulation_${clientId}_${Date.now()}`;
    const key = `simulation_patrimoniale:${simulationId}`;
    
    await kv.set(key, {
      ...simulation,
      client_id: clientId,
      simulation_id: simulationId
    });
    
    console.log(`✅ Simulation sauvegardée: ${simulationId}`);
    
    return {
      success: true,
      simulationId
    };
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde simulation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupérer les simulations d'un client
 */
export async function getSimulationsClient(clientId: string): Promise<any[]> {
  try {
    const allItems = await kv.getByPrefix('simulation_patrimoniale:');
    
    const simulations = allItems
      .map(item => item.value)
      .filter((sim: any) => sim.client_id === clientId)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date_simulation).getTime();
        const dateB = new Date(b.date_simulation).getTime();
        return dateB - dateA;
      });
    
    return simulations;
    
  } catch (error) {
    console.error('❌ Erreur récupération simulations:', error);
    return [];
  }
}

/**
 * Obtenir les stats des simulations
 */
export async function getSimulateurStats() {
  try {
    const allItems = await kv.getByPrefix('simulation_patrimoniale:');
    
    const simulations = allItems.map(item => item.value);
    
    // Montage le plus simulé
    const montagesCount: Record<string, number> = {};
    let rendement_moyen_total = 0;
    
    for (const sim of simulations) {
      const nom = sim.montage.nom_montage;
      montagesCount[nom] = (montagesCount[nom] || 0) + 1;
      rendement_moyen_total += sim.taux_rendement_annuel_moyen;
    }
    
    const montage_plus_simule = Object.entries(montagesCount)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      total_simulations: simulations.length,
      montage_plus_simule: montage_plus_simule ? {
        nom: montage_plus_simule[0],
        count: montage_plus_simule[1]
      } : null,
      rendement_annuel_moyen: simulations.length > 0 
        ? rendement_moyen_total / simulations.length 
        : 0
    };
    
  } catch (error) {
    console.error('❌ Erreur stats simulateur:', error);
    return {
      total_simulations: 0,
      montage_plus_simule: null,
      rendement_annuel_moyen: 0
    };
  }
}

/**
 * Générer des paramètres de simulation par défaut pour un montage
 */
export function genererParametresDefaut(
  montage: any,
  capital_initial: number = 100000,
  duree_annees: number = 10,
  tranche_marginale_ir: number = 30
): ParametresSimulation {
  const nomLower = montage.nom_montage.toLowerCase();
  
  // Paramètres de base
  const params: ParametresSimulation = {
    montage_id: montage.montage_id,
    capital_initial,
    duree_annees,
    taux_rendement_annuel: 5, // Par défaut 5%
    tranche_marginale_ir,
    taux_ps: 17.2
  };
  
  // Paramètres spécifiques selon le type de montage
  if (nomLower.includes('pea')) {
    params.taux_rendement_annuel = 6;
    params.exoneration_apres_annees = 5;
    params.frais_gestion_annuels = 0.5;
  } else if (nomLower.includes('assurance') && nomLower.includes('vie')) {
    params.taux_rendement_annuel = 4;
    params.exoneration_apres_annees = 8;
    params.frais_gestion_annuels = 0.8;
    params.frais_entree = 2; // 2%
  } else if (nomLower.includes('holding')) {
    params.taux_rendement_annuel = 8;
    params.frais_gestion_annuels = 0;
  } else if (nomLower.includes('sci')) {
    params.taux_rendement_annuel = 4;
    params.frais_gestion_annuels = 1;
  } else if (nomLower.includes('lmnp')) {
    params.taux_rendement_annuel = 5;
    params.frais_gestion_annuels = 0;
  } else if (nomLower.includes('donation')) {
    params.abattement_applicable = 100000;
    params.taux_rendement_annuel = 0; // Pas de rendement pour donation
  } else if (nomLower.includes('dutreil')) {
    params.taux_reduction_impot = 75;
    params.taux_rendement_annuel = 0;
  }
  
  return params;
}
