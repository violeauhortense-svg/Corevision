/**
 * ?? SERVICE DE CALCUL FISCAL DYNAMIQUE
 * 
 * Charge les barèmes depuis Supabase pour permettre
 * une mise à jour sans redéploiement de code
 * 
 * Calculs automatiques :
 * - Impôt sur le revenu (barème progressif)
 * - Prélèvements sociaux (CSG, CRDS, etc.)
 * - TMI (Tranche Marginale d'Imposition)
 * - IFI (Impôt sur la Fortune Immobilière)
 */

import { apiBaseUrl, publicAnonKey } from '../utils/api/info';

// ============================================
// INTERFACES
// ============================================

export interface BaremeIR {
  min: number;
  max: number | null;
  taux: number;
  label: string;
}

export interface BaremeIFI {
  min: number;
  max: number | null;
  taux: number;
  label: string;
}

export interface PrelevementsSociaux {
  CSG: number;
  CRDS: number;
  PRELEVEMENT_SOLIDARITE: number;
  TOTAL: number;
}

export interface Abattements {
  abattement10PourcentPlafond: number;
  abattement10PourcentPlancher: number;
  decoteCelibatairePlafond: number;
  decoteCouplePlafond: number;
  decoteCelibataireMax: number;
  decoteCoupleMax: number;
  microFoncierPlafond: number;
  microFoncierAbattement: number;
}

export interface BaremesFiscaux {
  annee: string;
  baremeIR: BaremeIR[];
  baremeIFI: BaremeIFI[];
  prelevementsSociaux: PrelevementsSociaux;
  abattements: Abattements;
}

export interface RevenuFiscal {
  traitementsSalairesPensions: number;
  revenusTNS: number;
  locationsMeublesNonPro: number;
  revenusFonciers: number;
  reveusValeursCapitauxMobiliers: number;
  plusValueMobiliere: number;
}

export interface DetailCalculIR {
  revenuBrut: number;
  abattement10: number;
  revenuNet: number;
  revenuImposable: number;
  quotientFamilial: number;
  nombreParts: number;
  tranchesDetail: {
    tranche: number;
    min: number;
    max: number | null;
    taux: number;
    montantTranche: number;
    impotTranche: number;
  }[];
  impotAvantDecote: number;
  decote: number;
  impotApreDecote: number;
  plafonnementQF: number;
  impotFinal: number;
  TMI: number;
  tauxMoyen: number;
}

export interface DetailCalculPS {
  assiette: number;
  CSG: { taux: number; montant: number };
  CRDS: { taux: number; montant: number };
  prelevementSolidarite: { taux: number; montant: number };
  total: number;
}

export interface DetailCalculIFI {
  patrimoineNetTaxable: number;
  abattement: number;
  assiette: number;
  tranchesDetail: {
    tranche: number;
    min: number;
    max: number | null;
    taux: number;
    montantTranche: number;
    ifiTranche: number;
  }[];
  ifiFinal: number;
}

// ============================================
// CACHE DES BARÈMES
// ============================================

let baremesCached: BaremesFiscaux | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Charge les barèmes fiscaux depuis Supabase
 */
export async function loadBaremes(annee: string = '2026'): Promise<BaremesFiscaux> {
  // Utiliser le cache si disponible et récent
  if (baremesCached && Date.now() - lastFetch < CACHE_DURATION) {
    return baremesCached;
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/baremes/${annee}`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    baremesCached = {
      annee: data.annee,
      baremeIR: data.baremeIR,
      baremeIFI: data.baremeIFI,
      prelevementsSociaux: data.prelevementsSociaux,
      abattements: data.abattements,
    };

    lastFetch = Date.now();

    console.log(`? Barèmes ${annee} chargés depuis Supabase`);
    return baremesCached;
  } catch (error) {
    console.error('? Erreur chargement barèmes:', error);
    
    // Fallback sur les barèmes par défaut
    return getDefaultBaremes();
  }
}

/**
 * Barèmes par défaut (fallback)
 * Source officielle : service-public.fr - Barème 2025
 * https://www.service-public.fr/particuliers/vosdroits/F1419
 */
function getDefaultBaremes(): BaremesFiscaux {
  return {
    annee: '2026',
    baremeIR: [
      { min: 0, max: 11600, taux: 0, label: 'Tranche 1 : 0%' },
      { min: 11600, max: 29579, taux: 0.11, label: 'Tranche 2 : 11%' },
      { min: 29579, max: 84577, taux: 0.30, label: 'Tranche 3 : 30%' },
      { min: 84577, max: 181917, taux: 0.41, label: 'Tranche 4 : 41%' },
      { min: 181917, max: null, taux: 0.45, label: 'Tranche 5 : 45%' },
    ],
    baremeIFI: [
      { min: 0, max: 800000, taux: 0, label: 'Exonération' },
      { min: 800000, max: 1300000, taux: 0.005, label: '0,5%' },
      { min: 1300000, max: 2570000, taux: 0.007, label: '0,7%' },
      { min: 2570000, max: 5000000, taux: 0.01, label: '1%' },
      { min: 5000000, max: 10000000, taux: 0.0125, label: '1,25%' },
      { min: 10000000, max: null, taux: 0.015, label: '1,5%' },
    ],
    prelevementsSociaux: {
      CSG: 0.092,
      CRDS: 0.005,
      PRELEVEMENT_SOLIDARITE: 0.075,
      TOTAL: 0.172,
    },
    abattements: {
      abattement10PourcentPlafond: 13522,
      abattement10PourcentPlancher: 472,
      decoteCelibatairePlafond: 1929,
      decoteCouplePlafond: 3191,
      decoteCelibataireMax: 873,
      decoteCoupleMax: 1444,
      microFoncierPlafond: 15000,
      microFoncierAbattement: 0.30,
    },
  };
}

// ============================================
// FONCTIONS DE CALCUL
// ============================================

/**
 * Calcule l'impôt sur le revenu avec détails
 */
export async function calculerImpotRevenu(
  revenus: RevenuFiscal,
  nombreParts: number
): Promise<DetailCalculIR> {
  const baremes = await loadBaremes();

  // 1. Revenus bruts (salaires et pensions pour l'abattement)
  const revenuBrutSalairesPensions =
    revenus.traitementsSalairesPensions +
    revenus.revenusTNS;

  // 2. Abattement de 10% sur salaires (plafonné)
  const abattement10Brut = revenuBrutSalairesPensions * 0.10;
  const abattement10 = Math.max(
    Math.min(abattement10Brut, baremes.abattements.abattement10PourcentPlafond),
    baremes.abattements.abattement10PourcentPlancher
  );

  // 3. Revenu net après abattement
  const revenuNetSalaires = revenuBrutSalairesPensions - abattement10;
  
  // 4. Total des revenus bruts (incluant TOUS les revenus)
  const revenuBrut =
    revenuBrutSalairesPensions +
    revenus.locationsMeublesNonPro +
    revenus.revenusFonciers +
    revenus.reveusValeursCapitauxMobiliers +
    revenus.plusValueMobiliere;

  // 5. Revenu net imposable total (salaires après abattement + autres revenus)
  const autresRevenus = 
    revenus.locationsMeublesNonPro +
    revenus.revenusFonciers +
    revenus.reveusValeursCapitauxMobiliers +
    revenus.plusValueMobiliere;
    
  const revenuNet = revenuNetSalaires + autresRevenus;
  const revenuImposable = Math.max(0, revenuNet);

  // 6. Quotient familial
  const quotientFamilial = revenuImposable / nombreParts;

  // 7. Calcul par tranches sur le quotient familial
  const tranchesDetail: DetailCalculIR['tranchesDetail'] = [];
  let impotQuotient = 0;

  for (let i = 0; i < baremes.baremeIR.length; i++) {
    const tranche = baremes.baremeIR[i];
    const min = tranche.min;
    const max = tranche.max === null ? quotientFamilial : tranche.max;

    if (quotientFamilial <= min) break;

    const montantTranche = Math.max(0, Math.min(quotientFamilial, max) - min);
    const impotTranche = montantTranche * tranche.taux;

    impotQuotient += impotTranche;

    tranchesDetail.push({
      tranche: i + 1,
      min,
      max: tranche.max,
      taux: tranche.taux,
      montantTranche,
      impotTranche,
    });
  }

  // 8. Multiplication par le nombre de parts
  const impotAvantDecote = impotQuotient * nombreParts;

  // 9. Décote (pour les revenus modestes)
  let decote = 0;
  const plafondDecote = nombreParts > 1 
    ? baremes.abattements.decoteCouplePlafond 
    : baremes.abattements.decoteCelibatairePlafond;
  const decoteMax = nombreParts > 1 
    ? baremes.abattements.decoteCoupleMax 
    : baremes.abattements.decoteCelibataireMax;

  if (impotAvantDecote < plafondDecote) {
    decote = decoteMax - (impotAvantDecote * 0.45);
    decote = Math.max(0, decote);
  }

  const impotApreDecote = Math.max(0, impotAvantDecote - decote);

  // 10. Plafonnement du quotient familial (simplifié)
  const plafonnementQF = 0;

  // 11. Impôt final
  const impotFinal = Math.round(impotApreDecote + plafonnementQF);

  // 12. TMI (Tranche Marginale d'Imposition)
  let TMI = 0;
  for (const tranche of baremes.baremeIR) {
    if (quotientFamilial > tranche.min) {
      TMI = tranche.taux * 100; // Convertir en pourcentage
    }
  }

  // 13. Taux moyen
  const tauxMoyen = revenuImposable > 0 ? (impotFinal / revenuImposable) * 100 : 0; // Convertir en pourcentage

  return {
    revenuBrut,
    abattement10,
    revenuNet,
    revenuImposable,
    quotientFamilial,
    nombreParts,
    tranchesDetail,
    impotAvantDecote,
    decote,
    impotApreDecote,
    plafonnementQF,
    impotFinal,
    TMI,
    tauxMoyen,
  };
}

/**
 * Calcule les prélèvements sociaux
 */
export async function calculerPrelevementsSociaux(
  assiette: number
): Promise<DetailCalculPS> {
  const baremes = await loadBaremes();

  const CSG = assiette * baremes.prelevementsSociaux.CSG;
  const CRDS = assiette * baremes.prelevementsSociaux.CRDS;
  const prelevementSolidarite = assiette * baremes.prelevementsSociaux.PRELEVEMENT_SOLIDARITE;

  return {
    assiette,
    CSG: { taux: baremes.prelevementsSociaux.CSG, montant: CSG },
    CRDS: { taux: baremes.prelevementsSociaux.CRDS, montant: CRDS },
    prelevementSolidarite: {
      taux: baremes.prelevementsSociaux.PRELEVEMENT_SOLIDARITE,
      montant: prelevementSolidarite,
    },
    total: CSG + CRDS + prelevementSolidarite,
  };
}

/**
 * Calcule l'IFI
 */
export async function calculerIFI(
  patrimoineNetTaxable: number
): Promise<DetailCalculIFI> {
  const baremes = await loadBaremes();

  // Seuil d'imposition : 1 300 000 € avec abattement de 30% sur la résidence principale
  const abattement = 0; // À personnaliser selon la situation
  const assiette = Math.max(0, patrimoineNetTaxable - abattement);

  const tranchesDetail: DetailCalculIFI['tranchesDetail'] = [];
  let ifiFinal = 0;

  for (let i = 0; i < baremes.baremeIFI.length; i++) {
    const tranche = baremes.baremeIFI[i];
    const min = tranche.min;
    const max = tranche.max === null ? assiette : tranche.max;

    if (assiette <= min) break;

    const montantTranche = Math.max(0, Math.min(assiette, max) - min);
    const ifiTranche = montantTranche * tranche.taux;

    ifiFinal += ifiTranche;

    tranchesDetail.push({
      tranche: i + 1,
      min,
      max: tranche.max,
      taux: tranche.taux,
      montantTranche,
      ifiTranche,
    });
  }

  return {
    patrimoineNetTaxable,
    abattement,
    assiette,
    tranchesDetail,
    ifiFinal: Math.round(ifiFinal),
  };
}

/**
 * Invalide le cache (à appeler après mise à jour des barèmes)
 */
export function invalidateCache() {
  baremesCached = null;
  lastFetch = 0;
  console.log('??? Cache des barèmes invalidé');
}
