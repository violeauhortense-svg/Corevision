/**
 * 🧮 CALCULATEUR FISCAL SYNCHRONE (FALLBACK)
 * 
 * Version synchrone pour affichage immédiat des calculs fiscaux
 * Utilise des barèmes en dur en attendant le chargement des barèmes dynamiques
 */

import type { RevenuFiscal, DetailCalculIR, DetailCalculPS, DetailCalculIFI } from './fiscalCalculatorDynamic';

// ⚠️ BARÈME IR 2025 OFFICIEL (source : service-public.fr)
const BAREME_IR_2025 = [
  { min: 0, max: 11600, taux: 0 },
  { min: 11600, max: 29579, taux: 0.11 },
  { min: 29579, max: 84577, taux: 0.30 },
  { min: 84577, max: 181917, taux: 0.41 },
  { min: 181917, max: Infinity, taux: 0.45 },
];

// Barème IFI 2025
const BAREME_IFI_2025 = [
  { min: 0, max: 800000, taux: 0 },
  { min: 800000, max: 1300000, taux: 0.005 },
  { min: 1300000, max: 2570000, taux: 0.007 },
  { min: 2570000, max: 5000000, taux: 0.01 },
  { min: 5000000, max: 10000000, taux: 0.0125 },
  { min: 10000000, max: Infinity, taux: 0.015 },
];

// Prélèvements sociaux 2025
const PRELEVEMENTS_SOCIAUX = {
  CSG: 0.092,
  CRDS: 0.005,
  PRELEVEMENT_SOLIDARITE: 0.075,
  TOTAL: 0.172,
};

/**
 * Calcule l'impôt sur le revenu (version synchrone)
 */
export function calculerImpotRevenuSync(
  revenus: RevenuFiscal,
  nombreParts: number
): DetailCalculIR {
  // 1. Calcul du revenu brut total
  const revenuBrutSalairesPensions = 
    revenus.traitementsSalairesPensions +
    revenus.revenusTNS;
  
  const autresRevenus = 
    revenus.locationsMeublesNonPro +
    revenus.revenusFonciers +
    revenus.reveusValeursCapitauxMobiliers +
    revenus.plusValueMobiliere;

  // 2. Abattement de 10% sur salaires et pensions (plafonné)
  const abattement10Brut = revenuBrutSalairesPensions * 0.10;
  const abattement10 = Math.max(
    Math.min(abattement10Brut, 13522), // Plafond 2026
    472 // Plancher 2026
  );

  // 3. Revenu net imposable = salaires après abattement + autres revenus
  const revenuNetSalaires = revenuBrutSalairesPensions - abattement10;
  const revenuImposable = Math.max(0, revenuNetSalaires + autresRevenus);

  // 4. Quotient familial
  const quotientFamilial = revenuImposable / nombreParts;

  // 5. Calcul de l'impôt par tranche sur le quotient familial
  let impotParTranche: { tranche: number; baseImposable: number; taux: number; impot: number }[] = [];
  let impotTotal = 0;
  let TMI = 0;

  for (let i = 0; i < BAREME_IR_2025.length; i++) {
    const tranche = BAREME_IR_2025[i];
    const min = tranche.min;
    const max = tranche.max;

    if (quotientFamilial > min) {
      const baseImposable = Math.min(quotientFamilial, max) - min;
      const impot = baseImposable * tranche.taux;

      impotParTranche.push({
        tranche: i + 1,
        baseImposable,
        taux: tranche.taux * 100,
        impot,
      });

      impotTotal += impot;
      TMI = tranche.taux * 100;

      if (quotientFamilial <= max) break;
    }
  }

  // 6. Multiplication par le nombre de parts
  const impotBrut = impotTotal * nombreParts;
  
  // 7. Décote pour les revenus modestes
  let decote = 0;
  const plafondDecote = nombreParts > 1 ? 3191 : 1929; // Plafonds 2026
  const decoteMax = nombreParts > 1 ? 1444 : 873; // Maximum 2026
  
  if (impotBrut < plafondDecote) {
    decote = decoteMax - (impotBrut * 0.45);
    decote = Math.max(0, decote);
  }

  // 8. Impôt final
  const impotFinal = Math.max(0, Math.round(impotBrut - decote));

  return {
    revenuImposable,
    quotientFamilial,
    impotParTranche,
    impotBrut,
    decote,
    impotFinal,
    TMI,
    tauxMoyenImposition: revenuImposable > 0 ? (impotFinal / revenuImposable) * 100 : 0,
  };
}

/**
 * Calcule les prélèvements sociaux (version synchrone)
 */
export function calculerPrelevementsSociauxSync(revenus: RevenuFiscal): DetailCalculPS {
  const revenusSoumisPS =
    revenus.reveusValeursCapitauxMobiliers +
    revenus.plusValueMobiliere +
    revenus.revenusFonciers;

  const detailPS = {
    CSG: revenusSoumisPS * PRELEVEMENTS_SOCIAUX.CSG,
    CRDS: revenusSoumisPS * PRELEVEMENTS_SOCIAUX.CRDS,
    prelevementSolidarite: revenusSoumisPS * PRELEVEMENTS_SOCIAUX.PRELEVEMENT_SOLIDARITE,
  };

  const prelevementsSociauxTotal = detailPS.CSG + detailPS.CRDS + detailPS.prelevementSolidarite;

  return {
    revenusSoumisPS,
    detailPS,
    prelevementsSociauxTotal,
  };
}

/**
 * Calcule l'IFI (version synchrone)
 */
export function calculerIFISync(
  patrimoineImmobilierBrut: number,
  dettesDeductibles: number
): DetailCalculIFI {
  const patrimoineImmobilierNet = patrimoineImmobilierBrut - dettesDeductibles;

  if (patrimoineImmobilierNet <= 800000) {
    return {
      patrimoineImmobilierBrut,
      dettesDeductibles,
      patrimoineImmobilierNet,
      ifiParTranche: [],
      ifiFinal: 0,
    };
  }

  let ifiParTranche: { tranche: number; baseImposable: number; taux: number; ifi: number }[] = [];
  let ifiTotal = 0;

  for (let i = 0; i < BAREME_IFI_2025.length; i++) {
    const tranche = BAREME_IFI_2025[i];
    const min = tranche.min;
    const max = tranche.max;

    if (patrimoineImmobilierNet > min) {
      const baseImposable = Math.min(patrimoineImmobilierNet, max) - min;
      const ifi = baseImposable * tranche.taux;

      ifiParTranche.push({
        tranche: i + 1,
        baseImposable,
        taux: tranche.taux * 100,
        ifi,
      });

      ifiTotal += ifi;

      if (patrimoineImmobilierNet <= max) break;
    }
  }

  const ifiFinal = Math.round(ifiTotal);

  return {
    patrimoineImmobilierBrut,
    dettesDeductibles,
    patrimoineImmobilierNet,
    ifiParTranche,
    ifiFinal,
  };
}

/**
 * Calcule le nombre de parts fiscales du foyer
 * Règles fiscales françaises (quotient familial)
 */
export function calculerNombreParts(familyInfo: {
  maritalStatus?: string;
  children?: Array<{ age?: number; handicap?: boolean }>;
  handicap?: boolean;
}): number {
  let parts = 1; // Célibataire par défaut

  const statut = familyInfo.maritalStatus?.toLowerCase() || '';

  // Situation matrimoniale
  if (statut.includes('marié') || statut.includes('marie') || statut.includes('pacsé') || statut.includes('pacse')) {
    parts = 2;
  } else if (statut.includes('veuf') || statut.includes('veuve')) {
    parts = 1; // 1 part comme célibataire (sauf enfant à charge → voir ci-dessous)
  }

  // Enfants à charge
  const enfants = familyInfo.children || [];
  for (let i = 0; i < enfants.length; i++) {
    const enfant = enfants[i];
    if (i < 2) {
      parts += 0.5; // 0.5 part pour les 2 premiers enfants
    } else {
      parts += 1; // 1 part à partir du 3ème
    }
    if (enfant.handicap) {
      parts += 0.5; // Majoration handicap
    }
  }

  // Majoration parent isolé (veuf avec enfant)
  if ((statut.includes('veuf') || statut.includes('veuve')) && enfants.length > 0) {
    parts += 0.5;
  }

  // Contribuable seul handicapé
  if (familyInfo.handicap) {
    parts += 0.5;
  }

  return Math.round(parts * 2) / 2; // Arrondi au demi-point
}
