/**
 * Types pour le module Revenus et Imposition
 */

export interface RevenuItem {
  id: string;
  type: string;
  source: string;
  montantAnnuel: number;
  montantMensuel?: number;
  dateDebut?: string;
  beneficiaire?: string;
  periodicite?: string;
  notes?: string;
}

export interface ImpositionData {
  nombreParts: number;
  traitementsSalairesPensions: number;
  revenusTNS: number;
  revenusFonciers: number;
  locationsMeublesNonPro: number;
  reveusValeursCapitauxMobiliers: number;
  plusValueMobiliere: number;
  impotRevenu: number;
  tmi: string;
  trancheMarginaleTMI: number;
  ifi: number;
  patrimoineImposableIFI: number;
  traitementsSalairesPensionsModifieeManuellement?: boolean;
  justificationTraitementsSalairesPensions?: string;
  revenusTNSModifieeManuellement?: boolean;
  justificationRevenusTNS?: string;
  locationsMeublesModifieeManuellement?: boolean;
  justificationLocationsMeubles?: string;
}

export interface CalculIRResult {
  impotFinal: number;
  revenuImposable: number;
  quotientFamilial: number;
  TMI: number;
  tauxMoyenImposition: number;
  details: {
    tranche: string;
    montant: number;
    taux: number;
    impot: number;
  }[];
}

export interface CalculPSResult {
  prelevementsSociauxTotal: number;
  total: number;
  detailsRevenusFonciers: {
    revenusFonciers: number;
    taux: number;
    montant: number;
  };
  detailsRevenusCapitaux: {
    revenus: number;
    taux: number;
    montant: number;
  };
  detailsPlusValuesMobilieres: {
    plusValue: number;
    taux: number;
    montant: number;
  };
}

export interface CalculIFIResult {
  ifiFinal: number;
  patrimoineImposable: number;
  details: {
    tranche: string;
    montant: number;
    taux: number;
    impot: number;
  }[];
}
