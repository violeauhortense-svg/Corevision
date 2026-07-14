/**
 * 🧮 MODULE CENTRALISE - CALCULS PATRIMONIAUX
 * 
 * Tous les calculs métier patrimoniaux sont centralisés ici.
 * Le frontend ne fait QUE de l'affichage.
 * 
 * Architecture :
 * - Validation stricte des entrées
 * - Types TypeScript stricts
 * - Documentation complète
 * - Gestion d'erreurs robuste
 * - Tests unitaires possibles
 */

// ============================================
// TYPES
// ============================================

export interface ActifFinancier {
  id: string;
  type: string;
  nom: string;
  value: number;
  rendement?: number;
}

export interface ActifImmobilier {
  id: string;
  type: string;
  adresse: string;
  value: number;
  revenus?: number;
}

export interface Passif {
  id: string;
  type: string;
  nom: string;
  value: number;
  capitalInitial?: number;
  tauxAnnuel?: number;
  nombreEcheances?: number;
  dateDebut?: string;
  mensualite?: number;
}

export interface Revenu {
  id: string;
  type: string;
  montantAnnuel: number;
}

export interface ImpositionData {
  impotRevenu: number;
  ifi: number;
  tmi: string | number;
}

export interface CalculsPatrimoniauxInput {
  actifsFinanciers: ActifFinancier[];
  actifsImmobiliers: ActifImmobilier[];
  passifs: Passif[];
  revenus: Revenu[];
  imposition: ImpositionData;
}

export interface CalculsPatrimoniauxResult {
  // Totaux
  patrimoineNet: number;
  patrimoineTotal: number;
  totalActifsFinanciers: number;
  totalImmobilier: number;
  totalPassifs: number;
  totalRevenus: number;
  chargesAnnuelles: number;
  
  // Ratios
  tauxEndettement: number;
  partImmobilier: number;
  partFinancier: number;
  liquidite: number;
  
  // Fiscalité
  impotTotal: number;
  pressionFiscale: number;
  rendementGlobal: number;
  
  // Profils
  profils: {
    fiscal: string;
    patrimonial: string;
    risque: string;
  };
  
  // Scores
  scores: {
    diversification: number;
    risque: number;
    optimisationFiscale: number;
    liquidite: number;
    global: number;
  };
  
  // Indicateurs
  indicateurs: {
    tauxEndettement: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
    diversification: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
    pressionFiscale: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
    liquidite: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
  };
}

export interface SimulationInput {
  patrimoineInitial: number;
  revenusAnnuels: number;
  chargesAnnuelles: number;
  tauxEpargne: number; // en %
  tauxRendement: number; // en %
  dureeAnnees: number;
}

export interface SimulationResult {
  annees: number[];
  patrimoine: number[];
  revenusPassifs: number[];
  totalEpargne: number;
  patrimoneFinal: number;
}

// ============================================
// CALCULS DE BASE - EMPRUNTS
// ============================================

/**
 * Calcule la date de fin d'un emprunt
 */
export function calculerDateFin(dateDebut: string, nombreEcheances: number): string {
  const date = new Date(dateDebut);
  date.setMonth(date.getMonth() + nombreEcheances);
  return date.toISOString().split('T')[0];
}

/**
 * Calcule le capital restant dû d'un emprunt
 */
export function calculerCapitalRestantDu(
  capitalInitial: number,
  tauxAnnuel: number,
  nombreEcheances: number,
  dateDebut: string
): number {
  const debut = new Date(dateDebut);
  const maintenant = new Date();
  const moisEcoules = Math.max(
    0,
    (maintenant.getFullYear() - debut.getFullYear()) * 12 +
      (maintenant.getMonth() - debut.getMonth())
  );
  const echeancesPayees = Math.min(moisEcoules, nombreEcheances);

  if (echeancesPayees <= 0) return capitalInitial;
  if (echeancesPayees >= nombreEcheances) return 0;

  const tauxMensuel = tauxAnnuel / 12;

  if (tauxMensuel === 0) {
    return capitalInitial * (1 - echeancesPayees / nombreEcheances);
  }

  const facteur1 = Math.pow(1 + tauxMensuel, nombreEcheances);
  const facteur2 = Math.pow(1 + tauxMensuel, echeancesPayees);

  const crd = (capitalInitial * (facteur1 - facteur2)) / (facteur1 - 1);

  return Math.max(0, Math.round(crd * 100) / 100);
}

/**
 * Calcule la mensualité d'un emprunt
 */
export function calculerMensualite(
  capitalInitial: number,
  tauxAnnuel: number,
  nombreEcheances: number
): number {
  const tauxMensuel = tauxAnnuel / 12;

  if (tauxMensuel === 0) {
    return capitalInitial / nombreEcheances;
  }

  const facteur = Math.pow(1 + tauxMensuel, nombreEcheances);
  const mensualite = (capitalInitial * tauxMensuel * facteur) / (facteur - 1);

  return Math.round(mensualite * 100) / 100;
}

// ============================================
// CALCULS PATRIMONIAUX COMPLETS
// ============================================

/**
 * Calcule TOUS les indicateurs patrimoniaux d'un client
 * 
 * @param input - Données patrimoniales du client
 * @returns Résultats complets des calculs
 */
export function calculerPatrimoineComplet(
  input: CalculsPatrimoniauxInput
): CalculsPatrimoniauxResult {
  // Validation des entrées
  if (!input.actifsFinanciers) input.actifsFinanciers = [];
  if (!input.actifsImmobiliers) input.actifsImmobiliers = [];
  if (!input.passifs) input.passifs = [];
  if (!input.revenus) input.revenus = [];
  if (!input.imposition) {
    input.imposition = { impotRevenu: 0, ifi: 0, tmi: 30 };
  }

  // ===== CALCULS TOTAUX =====
  const totalActifsFinanciers = input.actifsFinanciers.reduce(
    (sum, a) => sum + (a.value || 0),
    0
  );

  const totalImmobilier = input.actifsImmobiliers.reduce(
    (sum, i) => sum + (i.value || 0),
    0
  );

  const totalPassifs = input.passifs.reduce(
    (sum, p) => sum + (p.value || 0),
    0
  );

  const patrimoineTotal = totalActifsFinanciers + totalImmobilier;
  const patrimoineNet = patrimoineTotal - totalPassifs;

  const totalRevenus = input.revenus.reduce(
    (sum, r) => sum + (r.montantAnnuel || 0),
    0
  );

  // Estimation charges annuelles (4% du passif)
  const chargesAnnuelles = totalPassifs * 0.04;

  // ===== CALCULS RATIOS =====
  const tauxEndettement =
    patrimoineTotal > 0 ? (totalPassifs / patrimoineTotal) * 100 : 0;

  const partImmobilier =
    patrimoineTotal > 0 ? (totalImmobilier / patrimoineTotal) * 100 : 0;

  const partFinancier =
    patrimoineTotal > 0 ? (totalActifsFinanciers / patrimoineTotal) * 100 : 0;

  const liquidite = totalActifsFinanciers;

  // ===== CALCULS FISCALITE =====
  const impotTotal = input.imposition.impotRevenu + input.imposition.ifi;

  const pressionFiscale =
    totalRevenus > 0 ? (impotTotal / totalRevenus) * 100 : 0;

  const rendementGlobal =
    patrimoineNet > 0 ? (totalRevenus / patrimoineNet) * 100 : 0;

  // ===== PROFILS =====
  let profilFiscal = 'Optimisé';
  if (pressionFiscale > 40) profilFiscal = 'Très lourdement fiscalisé';
  else if (pressionFiscale > 30) profilFiscal = 'Lourdement fiscalisé';
  else if (pressionFiscale > 20) profilFiscal = 'Moyennement fiscalisé';
  else if (pressionFiscale > 10) profilFiscal = 'Faiblement fiscalisé';

  let profilPatrimonial = 'Patrimoine moyen';
  if (patrimoineNet > 5000000) profilPatrimonial = 'Très haut patrimoine (>5M€)';
  else if (patrimoineNet > 2000000) profilPatrimonial = 'Haut patrimoine (2-5M€)';
  else if (patrimoineNet > 500000)
    profilPatrimonial = 'Patrimoine important (500k-2M€)';
  else if (patrimoineNet > 100000)
    profilPatrimonial = 'Patrimoine en développement';
  else profilPatrimonial = 'Patrimoine en construction';

  let profilRisque = 'Modéré';
  if (partImmobilier > 80) profilRisque = 'Concentré sur immobilier';
  else if (partImmobilier > 60) profilRisque = 'Orientation immobilière forte';
  else if (partImmobilier < 30) profilRisque = 'Orientation financière';

  // ===== SCORES =====
  // Diversification (0-100, plus c'est élevé mieux c'est)
  let scoreDiversification = 100;
  if (partImmobilier > 80 || partFinancier > 80) scoreDiversification = 30;
  else if (partImmobilier > 70 || partFinancier > 70) scoreDiversification = 50;
  else if (partImmobilier > 60 || partFinancier > 60) scoreDiversification = 70;
  else scoreDiversification = 90;

  // Risque (0-100, plus c'est bas mieux c'est)
  let scoreRisque = 100;
  if (tauxEndettement > 50) scoreRisque = 10;
  else if (tauxEndettement > 30) scoreRisque = 30;
  else if (tauxEndettement > 20) scoreRisque = 50;
  else if (tauxEndettement > 10) scoreRisque = 70;
  else scoreRisque = 90;

  // Optimisation fiscale (0-100, plus c'est élevé mieux c'est)
  let scoreOptimisationFiscale = 100;
  if (pressionFiscale > 40) scoreOptimisationFiscale = 20;
  else if (pressionFiscale > 30) scoreOptimisationFiscale = 40;
  else if (pressionFiscale > 20) scoreOptimisationFiscale = 60;
  else if (pressionFiscale > 10) scoreOptimisationFiscale = 80;
  else scoreOptimisationFiscale = 95;

  // Liquidité (0-100)
  const ratioLiquidite = patrimoineNet > 0 ? (liquidite / patrimoineNet) * 100 : 0;
  let scoreLiquidite = 100;
  if (ratioLiquidite < 10) scoreLiquidite = 30;
  else if (ratioLiquidite < 20) scoreLiquidite = 50;
  else if (ratioLiquidite < 30) scoreLiquidite = 70;
  else if (ratioLiquidite < 40) scoreLiquidite = 85;
  else scoreLiquidite = 95;

  // Score global (moyenne pondérée)
  const scoreGlobal = Math.round(
    (scoreDiversification * 0.3 +
      scoreRisque * 0.3 +
      scoreOptimisationFiscale * 0.25 +
      scoreLiquidite * 0.15)
  );

  // ===== INDICATEURS =====
  const indicateurs = {
    tauxEndettement: {
      value: tauxEndettement,
      status: (tauxEndettement < 30 ? 'bon' : tauxEndettement < 50 ? 'moyen' : 'alerte') as 'bon' | 'moyen' | 'alerte',
      message:
        tauxEndettement < 30
          ? 'Taux d\'endettement sain'
          : tauxEndettement < 50
          ? 'Taux d\'endettement élevé'
          : 'Taux d\'endettement très élevé',
    },
    diversification: {
      value: scoreDiversification,
      status: (scoreDiversification > 70 ? 'bon' : scoreDiversification > 50 ? 'moyen' : 'alerte') as 'bon' | 'moyen' | 'alerte',
      message:
        scoreDiversification > 70
          ? 'Patrimoine bien diversifié'
          : scoreDiversification > 50
          ? 'Diversification moyenne'
          : 'Patrimoine peu diversifié',
    },
    pressionFiscale: {
      value: pressionFiscale,
      status: (pressionFiscale < 20 ? 'bon' : pressionFiscale < 30 ? 'moyen' : 'alerte') as 'bon' | 'moyen' | 'alerte',
      message:
        pressionFiscale < 20
          ? 'Pression fiscale optimisée'
          : pressionFiscale < 30
          ? 'Pression fiscale moyenne'
          : 'Pression fiscale élevée',
    },
    liquidite: {
      value: ratioLiquidite,
      status: (ratioLiquidite > 30 ? 'bon' : ratioLiquidite > 20 ? 'moyen' : 'alerte') as 'bon' | 'moyen' | 'alerte',
      message:
        ratioLiquidite > 30
          ? 'Liquidité suffisante'
          : ratioLiquidite > 20
          ? 'Liquidité moyenne'
          : 'Liquidité faible',
    },
  };

  return {
    patrimoineNet,
    patrimoineTotal,
    totalActifsFinanciers,
    totalImmobilier,
    totalPassifs,
    totalRevenus,
    chargesAnnuelles,
    tauxEndettement,
    partImmobilier,
    partFinancier,
    liquidite,
    impotTotal,
    pressionFiscale,
    rendementGlobal,
    profils: {
      fiscal: profilFiscal,
      patrimonial: profilPatrimonial,
      risque: profilRisque,
    },
    scores: {
      diversification: scoreDiversification,
      risque: scoreRisque,
      optimisationFiscale: scoreOptimisationFiscale,
      liquidite: scoreLiquidite,
      global: scoreGlobal,
    },
    indicateurs,
  };
}

// ============================================
// SIMULATIONS
// ============================================

/**
 * Simule l'évolution du patrimoine sur N années
 * 
 * @param input - Paramètres de simulation
 * @returns Évolution année par année
 */
export function simulerPatrimoine(input: SimulationInput): SimulationResult {
  const annees: number[] = [];
  const patrimoine: number[] = [];
  const revenusPassifs: number[] = [];

  let patrimoineActuel = input.patrimoineInitial;
  const epargneAnnuelle =
    (input.revenusAnnuels - input.chargesAnnuelles) * (input.tauxEpargne / 100);

  for (let annee = 0; annee <= input.dureeAnnees; annee++) {
    annees.push(annee);
    patrimoine.push(Math.round(patrimoineActuel));

    const revenuPassif = patrimoineActuel * (input.tauxRendement / 100);
    revenusPassifs.push(Math.round(revenuPassif));

    // Année suivante
    if (annee < input.dureeAnnees) {
      patrimoineActuel += epargneAnnuelle + revenuPassif;
    }
  }

  return {
    annees,
    patrimoine,
    revenusPassifs,
    totalEpargne: Math.round(epargneAnnuelle * input.dureeAnnees),
    patrimoneFinal: patrimoine[patrimoine.length - 1],
  };
}

// ============================================
// DÉTECTION DE PROBLÈMES
// ============================================

export interface Probleme {
  id: string;
  categorie: 'fiscal' | 'risque' | 'liquidite' | 'diversification' | 'endettement';
  gravite: 'haute' | 'moyenne' | 'faible';
  titre: string;
  description: string;
  recommandations: string[];
}

/**
 * Détecte automatiquement les problèmes patrimoniaux
 * 
 * @param calculs - Résultats des calculs patrimoniaux
 * @returns Liste des problèmes détectés
 */
export function detecterProblemes(
  calculs: CalculsPatrimoniauxResult
): Probleme[] {
  const problemes: Probleme[] = [];

  // Problème fiscal
  if (calculs.pressionFiscale > 30) {
    problemes.push({
      id: 'fiscal-1',
      categorie: 'fiscal',
      gravite: calculs.pressionFiscale > 40 ? 'haute' : 'moyenne',
      titre: 'Pression fiscale élevée',
      description: `Votre pression fiscale est de ${calculs.pressionFiscale.toFixed(1)}%, ce qui est supérieur à la moyenne.`,
      recommandations: [
        'Analyser les possibilités de défiscalisation (PER, FCPI, FIP)',
        'Optimiser la répartition des revenus au sein du foyer',
        'Envisager un investissement Pinel ou Malraux',
      ],
    });
  }

  // Problème diversification
  if (calculs.scores.diversification < 50) {
    problemes.push({
      id: 'diversification-1',
      categorie: 'diversification',
      gravite: calculs.scores.diversification < 30 ? 'haute' : 'moyenne',
      titre: 'Patrimoine peu diversifié',
      description: `Votre patrimoine est concentré à ${calculs.partImmobilier.toFixed(0)}% sur l'immobilier ou ${calculs.partFinancier.toFixed(0)}% sur le financier.`,
      recommandations: [
        'Rééquilibrer entre immobilier et financier',
        'Diversifier les classes d\'actifs financiers',
        'Considérer l\'investissement dans des SCPI',
      ],
    });
  }

  // Problème liquidité
  if (calculs.indicateurs.liquidite.status === 'alerte') {
    problemes.push({
      id: 'liquidite-1',
      categorie: 'liquidite',
      gravite: 'moyenne',
      titre: 'Liquidité insuffisante',
      description: `Votre épargne de précaution représente seulement ${calculs.indicateurs.liquidite.value.toFixed(0)}% de votre patrimoine net.`,
      recommandations: [
        'Constituer une épargne de précaution (3-6 mois de revenus)',
        'Privilégier des placements liquides (livrets, fonds euro)',
        'Réduire la part d\'immobilier illiquide',
      ],
    });
  }

  // Problème endettement
  if (calculs.tauxEndettement > 30) {
    problemes.push({
      id: 'endettement-1',
      categorie: 'endettement',
      gravite: calculs.tauxEndettement > 50 ? 'haute' : 'moyenne',
      titre: 'Taux d\'endettement élevé',
      description: `Votre taux d\'endettement est de ${calculs.tauxEndettement.toFixed(0)}%, ce qui peut fragiliser votre situation.`,
      recommandations: [
        'Envisager un remboursement anticipé des crédits les plus coûteux',
        'Renégocier les taux d\'emprunt',
        'Éviter de nouveaux emprunts sauf investissement rentable',
      ],
    });
  }

  return problemes;
}
