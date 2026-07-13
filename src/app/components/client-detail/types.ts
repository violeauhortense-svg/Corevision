import type { PipelineStage, Task } from '../../types/client';

export type TabType = 'foyer' | 'revenus' | 'patrimoine' | 'documents' | 'taches' | 'audit' | 'objectifs' | 'historique' | 'contacts';

export interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
  onDelete?: () => void;
}

export interface Objectif {
  id: string;
  category: string;
  description: string;
  included: boolean;
  mandatory: boolean;
  comment?: string;
  nombreSocietes?: number;
  // 🆕 Nouveaux champs pour la roadmap stratégique
  status?: 'À planifier' | 'En cours' | 'Terminé' | 'En pause';
  priority?: 'high' | 'medium' | 'low';
  startDate?: string;
  endDate?: string;
  progress?: number; // 0-100
  milestones?: Array<{
    id: string;
    label: string;
    completed: boolean;
    completedDate?: string;
  }>;
  dependencies?: string[]; // IDs des objectifs dépendants
  responsable?: string;
  budget?: number;
  notes?: string;
  
  // 🧠 SOCLE UNIVERSEL - TEMPORALITÉ
  horizon?: 'court' | 'moyen' | 'long'; // Court: <3 ans, Moyen: 3-10 ans, Long: >10 ans
  dateCible?: string;
  flexibilite?: 'rigide' | 'modulable' | 'flexible';
  
  // 🧠 SOCLE UNIVERSEL - INTENSITÉ
  montantCible?: number;
  effortEpargne?: number; // Montant mensuel
  prioriteNumerique?: number; // 1 à 5
  
  // 🧠 SOCLE UNIVERSEL - RISQUE
  profilRisque?: 'prudent' | 'equilibre' | 'dynamique';
  acceptationPerte?: number; // Pourcentage max de perte acceptable
  sensibiliteVolatilite?: 'faible' | 'moyenne' | 'forte';
  
  // 🧠 SOCLE UNIVERSEL - CONTRAINTES
  liquidite?: 'immediate' | 'courte' | 'longue' | 'illiquide';
  contraintesFiscales?: string;
  contraintesPersonnelles?: string;
  
  // 🎯 CHAMPS SPÉCIFIQUES PAR OBJECTIF
  specificData?: {
    // RETRAITE
    ageDepart?: number;
    revenusSouhaites?: number;
    revenuActuel?: number;
    trimestresValidés?: number;
    projetRetraite?: string[];
    
    // TRANSMISSION
    beneficiaires?: Array<{
      nom: string;
      lien: string;
      pourcentage: number;
    }>;
    modalite?: 'donation' | 'succession' | 'assurance-vie';
    anticipation?: boolean;
    
    // IMMOBILIER
    typeAcquisition?: 'residence-principale' | 'investissement-locatif' | 'residence-secondaire';
    zoneCible?: string;
    financement?: 'comptant' | 'credit' | 'mixte';
    apportPersonnel?: number;
    
    // ÉPARGNE
    objectifEpargne?: 'precaution' | 'projet' | 'transmission';
    enveloppePrivilegiee?: 'AV' | 'PEA' | 'CTO' | 'PER';
    
    // OPTIMISATION FISCALE
    leviersFiscaux?: string[];
    economiesCiblees?: number;
    
    // DIRIGEANT
    formeJuridique?: string;
    remunerationActuelle?: number;
    dividendesActuels?: number;
    optimisationCible?: string[];
    
    // PROTECTION SOCIALE
    besoins?: string[];
    garantiesActuelles?: string[];
    
    // AUTRE PROJET (cas spécial)
    nomProjet?: string;
    categorieDominante?: string;
    finalite?: string;
    natureBesoin?: 'capital' | 'rente' | 'mixte';
    niveauStructuration?: 'simple' | 'modere' | 'complexe';
    dependance?: string[];
  };
  
  // 🔗 OBJECTIFS COMBINÉS
  linkedObjectifs?: string[]; // IDs des objectifs liés
  
  // 📊 SCORE DE COMPLÉTUDE (calculé automatiquement)
  completudeScore?: number; // 0-100
  
  // 📅 TRAÇABILITÉ
  dateCreation?: string; // 🆕 Date de création
  dateModification?: string; // 🆕 Date de dernière modification
  dateSaisie?: string; // Date de saisie de la donnée (legacy, sera progressivement remplacé par dateCreation/dateModification)
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size?: string;
  uploadDate?: string;
  category: 'general' | 'regulatory' | 'signed';
  linkedToRegulatoryId?: string;
  signatureDate?: string;
  content?: string;
}

export interface RegulatoryDocument {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'required' | 'signed' | 'validated'; // ✅ Ajouté 'validated' pour rétrocompatibilité
  requiredForStage: PipelineStage;
  uploadedFile?: Document;
  completedDate?: string;
  signedAt?: string;
  signedBy?: string;
  documentType?: string;
  validatedAt?: string;
  content?: string;
  date?: string;
  alertStatus?: string;
  data?: any;
}

export interface PatrimoineItem {
  id: string;
  name: string;
  value: number;
  category?: string;
  note?: string;
  regimeLocation?: 'micro' | 'reel'; // Pour l'immobilier locatif
  loyerAnnuel?: number; // Pour l'immobilier locatif
  locataire?: string; // 🆕 Nom du locataire ou 'Non loué' pour l'immobilier
  actifLie?: boolean; // Pour les passifs (indiquer si lié à un actif immobilier)
  detentionPercent?: number; // 🆕 Pour les sociétés (% de détention)
  societyType?: string; // 🆕 Type de société (SARL, SAS, etc.)
  annualRevenue?: number; // 🆕 CA annuel de la société
  
  // 📅 TRAÇABILITÉ
  dateCreation?: string; // 🆕 Date de création
  dateModification?: string; // 🆕 Date de dernière modification
  dateSaisie?: string; // Date de saisie de la donnée (legacy, sera progressivement remplacé par dateCreation/dateModification)
  
  // 🏠 PATRIMOINE IMMOBILIER - RÉGIME FISCAL
  regimeFiscal?: string; // Régime fiscal applicable (Pinel, Malraux, etc.)
  
  // 👩‍❤️‍👨 DÉTENTION DES BIENS (pour patrimoine immobilier et financier)
  proprietaire?: 'client' | 'conjoint' | 'indivision'; // Pour régime séparatiste
  dateAcquisition?: string; // Date d'acquisition du bien
  natureAcquisition?: 'achat' | 'donation' | 'succession'; // Pour régime communautaire après mariage
  beneficiaire?: 'client' | 'conjoint'; // Bénéficiaire de la donation/succession
}

// 🆕 Type spécifique pour le patrimoine professionnel
export interface PatrimoineProfessionnel {
  societes: PatrimoineItem[]; // Sociétés détenues
  comptesCourants: PatrimoineItem[]; // Comptes courants d'associés
  dividendesAPercevoir: number; // Dividendes à percevoir
  tresoreriePro: number; // Trésorerie professionnelle
}

export interface AuditRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  completed?: boolean;
  source?: 'corevision' | 'manual'; // 🔥 Nouveau : Indiquer la source de la recommandation
  validatedByCGP?: boolean; // 🔥 Nouveau : Pour les recommandations CoreVision
  // 🆕 Nouveaux champs pour la refonte stratégique
  status?: 'À analyser' | 'Proposée' | 'Validée' | 'En cours' | 'Mise en place' | 'Abandonnée';
  responsable?: string; // Responsable de la recommandation
  createdDate?: string; // Date de création
  // 🆕 Fiche détaillée
  contexteClient?: string; // Contexte client
  problematique?: string; // Problématique identifiée
  solution?: string; // Solution recommandée
  avantages?: string; // Avantages
  risques?: string; // Risques et points de vigilance
  actions?: string[]; // Actions associées
  // 🆕 Workflow de mise en place
  workflowSteps?: Array<{
    id: string;
    label: string;
    completed: boolean;
    completedDate?: string;
  }>;
  // 🆕 Workflow de mise en place détaillé (6 étapes standards)
  implementationSteps?: {
    simulation?: 'pending' | 'in-progress' | 'completed' | 'blocked';
    simulationDate?: string;
    simulationNotes?: string;
    dossier?: 'pending' | 'in-progress' | 'completed' | 'blocked';
    dossierDate?: string;
    dossierNotes?: string;
    signature?: 'pending' | 'in-progress' | 'completed' | 'blocked';
    signatureDate?: string;
    signatureNotes?: string;
    transmission?: 'pending' | 'in-progress' | 'completed' | 'blocked';
    transmissionDate?: string;
    transmissionNotes?: string;
    active?: 'pending' | 'in-progress' | 'completed' | 'blocked';
    activeDate?: string;
    activeNotes?: string;
  };
  validatedDate?: string; // Date de validation de la recommandation
}

export interface RevenuItem {
  id: string;
  categorie: 'salarie_non_cadre' | 'salarie_cadre' | 'gerant_sarl_majoritaire' | 'gerant_sarl_minoritaire' | 'president_sas' | 'auto_entrepreneur' | 'fonctionnaire_cat_a' | 'fonctionnaire_autre' | 'fonctionnaire_collectivite' | 'retraite' | 'interimaire' | 'cdd' | 'intermittent' | 'dividende';
  beneficiaire: 'client' | 'conjoint' | 'enfant';
  beneficiaireNom: string;
  montantAnnuel: number;
  montantMensuel: number;
  
  // 📅 TRAÇABILITÉ
  dateCreation?: string; // 🆕 Date de création
  dateModification?: string; // 🆕 Date de dernière modification
  dateSaisie?: string; // Date de saisie de la donnée (legacy, sera progressivement remplacé par dateCreation/dateModification)
}

export interface ImpositionData {
  traitementsSalairesPensions: number;
  revenusTNS: number;
  locationsMeublesNonPro: number;
  locationsMeublesNonProType: 'micro' | 'reel';
  reveusValeursCapitauxMobiliers: number;
  plusValueMobiliere: number;
  revenusFonciers: number;
  nombreParts: number;
  tmi: '0' | '11' | '30' | '41' | '45';
  impotRevenu: number;
  prelevementsSociaux?: number; // 🔥 NOUVEAU - PS calculés
  ifi: number;
  revenusFonciersModifiedManually?: boolean;
  revenusFonciersJustification?: string;
  locationsMeublesNonProModifiedManually?: boolean;
  locationsMeublesNonProJustification?: string;
  
  // 📅 TRAÇABILITÉ
  dateCreation?: string; // 🆕 Date de création
  dateModification?: string; // 🆕 Date de dernière modification
  dateSaisie?: string; // Date de saisie de la donnée (legacy, sera progressivement remplacé par dateCreation/dateModification)
}

export interface FamilyInfo {
  maritalStatus: string;
  regimeMatrimonial: string;
  dateMarriage?: string; // 👩‍❤️‍👨 Date de mariage (pour déterminer avant/après)
  spouse: {
    firstName: string;
    lastName: string;
    birthDate: string;
    profession: string;
    email: string;
    majorationPartFiscale: boolean;
  };
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    dependent: boolean;
    isChargeFiscale?: boolean;
    isChildOfClient?: boolean;
    isChildOfSpouse?: boolean;
    majorationPartFiscale?: boolean;
  }>;
  
  // 📅 TRAÇABILITÉ
  dateCreation?: string; // 🆕 Date de création
  dateModification?: string; // 🆕 Date de dernière modification
  dateSaisie?: string; // Date de saisie de la donnée (legacy, sera progressivement remplacé par dateCreation/dateModification)
}

// 📇 CONTACTS PROFESSIONNELS
export interface ContactProfessionnel {
  id: string;
  nom: string;
  prenom: string;
  fonction: 'expert-comptable' | 'notaire' | 'avocat' | 'conseil-social' | 'autre';
  fonctionAutre?: string; // Si fonction = 'autre'
  structure: string; // Nom du cabinet/structure
  email: string;
  telephone: string;
  notes?: string;
  
  // Liens optionnels
  linkedObjectifIds?: string[]; // Objectifs liés
  linkedActifIds?: string[]; // Actifs liés
  linkedDocumentIds?: string[]; // Documents liés
  
  // 📅 TRAÇABILITÉ
  dateCreation?: string; // 🆕 Date de création
  dateModification?: string; // 🆕 Date de dernière modification
  dateSaisie?: string; // Date de saisie
}

export interface ClientData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  status: PipelineStage;
  patrimoine: number; // ✅ Changé de string à number
  majorationPartFiscale: boolean;
  auditCoreVision?: string; // Texte de l'audit CoreVision
  presentationCoreVision?: string; // 🔥 Nouveau : Présentation client CoreVision
  preconisationsCoreVision?: any[]; // 🔥 Nouveau : Préconisations brutes CoreVision
  // 🆕 Nouveaux champs pour la refonte stratégique
  mainCompany?: string; // Société principale
  lastMeetingDate?: string; // Date du dernier rendez-vous
  nextMeetingDate?: string; // Date du prochain rendez-vous
}

export { type PipelineStage, type Task };
