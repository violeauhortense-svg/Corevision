import type { PatrimoineItem, RevenuItem, ImpositionData } from '../types';

export interface PreAnalyseTabProps {
  clientId: string;
  clientName: string;
  actifsFinanciers: PatrimoineItem[];
  immobilier: PatrimoineItem[];
  passifs: PatrimoineItem[];
  revenus: RevenuItem[];
  impositionData: ImpositionData;
  onUpdate?: (data: any) => void;
}

export interface Profil {
  fiscal: string;
  patrimonial: string;
  risque: string;
}

export interface ScorePonderation {
  label: string;
  value: number;
  weight: number;
}

export interface ScoreDetail {
  value: number;
  sousIndicateurs: ScorePonderation[];
  explication: string;
  niveau: 'faible' | 'moyen' | 'élevé';
}

export interface Score {
  diversification: number;
  risque: number;
  fiscalite: number;
  liquidite: number;
  retraite: number;
  protection: number;
  transmission: number;
}

export interface ScorePonderations {
  diversification: {
    immobilier: number;
    actionsConcentrees: number;
    alternatifs: number;
  };
  risque: {
    endettement: number;
    concentration: number;
    volatilite: number;
  };
  fiscalite: {
    ir: number;
    ifi: number;
    plusValues: number;
    instrumentsFiscaux: number;
  };
  liquidite: {
    ratioLiquidite: number;
  };
  retraite: {
    ratioRevenus: number;
  };
  protection: {
    couvertureBesoins: number;
  };
  transmission: {
    fiscalSuccession: number;
    risqueConflits: number;
  };
}

export interface Probleme {
  id: string;
  titre: string;
  description: string;
  severite: 'high' | 'medium' | 'low';
  impact: string;
}

export interface CalculsPatrimoniauxData {
  patrimoineNet: number;
  patrimoineTotal: number;
  totalActifsFinanciers: number;
  totalImmobilier: number;
  totalPassifs: number;
  totalRevenus: number;
  chargesAnnuelles: number;
  tauxEndettement: number;
  partImmobilier: number;
  partFinancier: number;
  liquidite: number;
  impotTotal: number;
  prelevementsSociaux: number;
  pressionFiscale: number;
  rendementGlobal: number;
}

export interface SimulationParams {
  inflation: number;
  rendementImmobilier: number;
  rendementFinancier: number;
  croissanceRevenus: number;
  tauxImposition: number;
}

export interface Simulation {
  annees: number;
  retraite: {
    capital: number;
    rente: number;
  };
  succession: {
    patrimoine: number;
    droits: number;
    netTransmis: number;
  };
  fiscalite: {
    impotAnnuel: number;
    impotCumule: number;
  };
  performance: {
    patrimoineAvecRendement: number;
    gainBrut: number;
    gainNet: number;
    rendementMoyen: number;
  };
}
