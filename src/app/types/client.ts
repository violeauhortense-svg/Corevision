export type PipelineStage = 
  | 'R0 - Prospect' 
  | 'R0-R1 - Découverte' 
  | 'R1 - Audit patrimonial' 
  | 'R1-R2 - Stratégie définie' 
  | 'R2 - Recommandation proposée' 
  | 'Rsuivi - Suivi patrimonial';

export type TaskStatus = 'pending' | 'completed' | 'na';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: TaskStatus; // 'pending', 'completed', 'na'
  createdAt: string;
  deadline?: string;
  clientId?: string;
  clientName?: string;
  stage?: PipelineStage;
  linkedRecommendationId?: string;
  linkedObjectifId?: string;

  // 📅 TRAÇABILITÉ DES VALIDATIONS
  completedAt?: string; // Date et heure de validation
  completedBy?: string; // CGP qui a validé la tâche
  completionNotes?: string; // Notes de validation
}

// ============= PATRIMOINE =============

// Types pour Actifs Financiers
export type ActifFinancierType = 
  | 'Livret A'
  | 'LDDS'
  | 'LEP'
  | 'Livret jeune'
  | 'Compte courant'
  | 'Assurance-vie'
  | 'PER'
  | 'PERCO'
  | 'PEA'
  | 'Compte-titres'
  | 'Autre';

export type ClauseBeneficiaire = 
  | 'standard'
  | 'conjoint'
  | 'enfants'
  | 'personnalisée';

export interface ActifFinancier {
  id: string;
  name: string;
  value: number;
  color: string;
  type: ActifFinancierType;
  dateOuverture?: string;
  clauseBeneficiaire?: ClauseBeneficiaire;
  clausePersonnalisee?: string;
  
  // 📅 TRAÇABILITÉ
  dateSaisie?: string; // Date de saisie de la donnée
  
  // 👩‍❤️‍👨 DÉTENTION DES BIENS (pour patrimoine financier)
  proprietaire?: 'client' | 'conjoint' | 'indivision'; // Pour régime séparatiste
  natureAcquisition?: 'achat' | 'donation' | 'succession'; // Pour régime communautaire après mariage
  beneficiaire?: 'client' | 'conjoint'; // Bénéficiaire de la donation/succession
}

// Types pour Actifs Immobiliers
export type ActifImmobilierType = 
  | 'Résidence principale'
  | 'Résidence secondaire'
  | 'Locatif nu'
  | 'Locatif meublé'
  | 'LMNP'
  | 'SCI'
  | 'SCPI'
  | 'Terrain';

export interface ActifImmobilier {
  id: string;
  name: string;
  value: number;
  color: string;
  type: ActifImmobilierType;
  adresse?: string;
  surface?: number;
  dateAcquisition?: string;
  loyerMensuel?: number;
  
  // 📅 TRAÇABILITÉ
  dateSaisie?: string; // Date de saisie de la donnée
  
  // 🏠 PATRIMOINE IMMOBILIER - RÉGIME FISCAL
  regimeFiscal?: string; // Régime fiscal applicable (Pinel, Malraux, etc.)
  
  // 👩‍❤️‍👨 DÉTENTION DES BIENS (pour patrimoine immobilier)
  proprietaire?: 'client' | 'conjoint' | 'indivision'; // Pour régime séparatiste
  natureAcquisition?: 'achat' | 'donation' | 'succession'; // Pour régime communautaire après mariage
  beneficiaire?: 'client' | 'conjoint'; // Bénéficiaire de la donation/succession
}

// Types pour Passifs
export type PassifType = 'immobilier' | 'lld' | 'consommation';
export type TypeTaux = 'fixe' | 'variable';

export interface Passif {
  id: string;
  name: string;
  value: number; // Capital restant dû
  color: string;
  type: PassifType;
  linkedActifId?: string;
  linkedActifName?: string;
  
  // Nomenclature complète de l'emprunt
  capitalInitial: number;
  capitalRestantDu?: number;
  tauxEmprunt: number;
  typeTaux?: TypeTaux;
  dateDebut: string;
  dateFin?: string;
  nombreEcheances: number; // Nombre total de mensualités
  echeancesRestantes?: number; // Nombre de mensualités restantes
  mensualite?: number;
  dureeInitiale?: number; // Durée initiale en années
  dureeRestante?: number; // Durée restante en années
}
