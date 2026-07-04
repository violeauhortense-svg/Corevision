// Types pour le système d'optimisation de rémunération

export interface RegleFiscale {
  id: string;
  statutJuridique: string;
  typeDirigeant: string;
  cotisationsSociales: number; // en %
  plafondDividendesTNS?: string;
  pfuApplicable: boolean;
  tauxPFU: number;
  regimeIS: boolean;
  tauxIS15: number;
  tauxIS25: number;
  notes?: string;
}

export interface DonneesEntreprise {
  resultatAvantRemuneration: number;
  capital?: number;
  compteCourant?: number;
  primes?: number;
  statutJuridique: string;
  typeDirigeant: string;
  regimeFiscal: 'IS' | 'IR';
}

export interface DonneesFoyer {
  autresRevenus: number;
  nbParts: number;
  trancheMarginale?: number; // TMI actuel du foyer
}

export interface ScenarioOptimisation {
  remuneration: number;
  dividendes: number;
  chargesSociales: number;
  is: number;
  pfu: number;
  cotisationsTNSDividendes: number;
  revenuNetFoyer: number;
  tauxPrelevementGlobal: number;
  details: string[];
}

export interface ResultatOptimisation {
  scenarioOptimal: ScenarioOptimisation;
  scenariosCompares: ScenarioOptimisation[];
  recommandations: string[];
}
