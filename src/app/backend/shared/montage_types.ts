// Shared montage types used across JURIDIQUE and PATRIMOINE domains

export interface MontageTemplate {
  id: string;
  name: string;
  description: string;
  structureType: 'SCI' | 'EIRL' | 'SARL' | 'MICRO';
  requirements: string[];
}

export interface MontageResult {
  template: MontageTemplate;
  economie: number;
  compatibilite: number;
  etapes: string[];
}

export interface MontagePatrimonial {
  id: string;
  nom_montage: string;
  objectif: string;
  conditions: string;
  avantages: string;
  risques: string;
  etapes_juridiques: string;
  fiscalite: string;
  source: string;
  date_creation: string;
  date_modification: string;
  tags?: string[];
  complexite?: 'simple' | 'moyen' | 'complexe';
  statut?: 'actif' | 'obsolète' | 'à_vérifier';
}
