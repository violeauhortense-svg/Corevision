// ============================================
// TASK DEFINITIONS - 8 STATUTS × 25 TÂCHES
// ============================================

export type TaskButtonType = 'origine' | 'rdv' | 'mailComptable' | 'o2s' | 'conformite' | 'bilanSuivi' | 'noteRdv' | 'verifications' | 'noteRapport' | 'recommandation' | 'documents' | 'treso' | 'mailComptableArb';

export interface TaskDef {
  id: string;
  title: string;
  description: string;
  button?: TaskButtonType;
}

const COLOR_MAP: Record<string, string> = {
  'Prospect': '#667eea',
  'Découverte': '#1e40af',
  'Simulation': '#f59e0b',
  'Lettre Mission': '#9f7aea',
  'Rapport/Audit': '#f6ad55',
  'Suivi MEP': '#4299e1',
  'Suivi CSP': '#48bb78',
  'Arbitrage': '#a855f7',
};

export function getStatusColor(status: string): string {
  return COLOR_MAP[status] || '#6b7280';
}

export const TASK_DEFINITIONS: Record<string, TaskDef[]> = {
  'Prospect': [
    {
      id: 'p1',
      title: 'Origine du prospect',
      description: 'Tracer d\'où vient le prospect (recommandation, pub, appel froid...)',
      button: 'origine',
    },
    {
      id: 'p2',
      title: 'Contacter le client pour convenir d\'un RDV',
      description: 'Premier contact et prise de RDV',
      button: 'rdv',
    },
    {
      id: 'p3',
      title: 'Demande d\'informations au comptable',
      description: 'Contacter le comptable du prospect',
      button: 'mailComptable',
    },
    {
      id: 'p4',
      title: 'Interne',
      description: 'Tâche interne (O2S + Excel)',
      button: 'o2s',
    },
  ],

  'Découverte': [
    {
      id: 'd1',
      title: 'Collecte des documents',
      description: 'Récupérer tous les docs du client',
    },
    {
      id: 'd2',
      title: 'Conformité 1',
      description: 'Vérification première conformité',
      button: 'conformite',
    },
    {
      id: 'd3',
      title: 'Remplissage des informations dans bilan',
      description: 'Alimenter le bilan avec infos client',
      button: 'bilanSuivi',
    },
    {
      id: 'd4',
      title: 'RDV découverte (validation infos et objectifs)',
      description: 'RDV clé pour valider objectifs',
      button: 'noteRdv',
    },
  ],

  'Simulation': [
    {
      id: 's1',
      title: 'Simulation chiffrée (réalisation)',
      description: 'Créer la simulation des scénarios',
      button: 'verifications',
    },
    {
      id: 's2',
      title: 'Validation GL de la simulation',
      description: 'Gérant/Leader valide la simulation',
    },
    {
      id: 's3',
      title: 'RDV Présentation simulation chiffré',
      description: 'Présenter les résultats au client',
    },
    {
      id: 's4',
      title: 'Confirmation client pour poursuivre',
      description: 'Client accepte de continuer',
    },
    {
      id: 's5',
      title: 'Conformité 2',
      description: 'Deuxième vérification conformité',
      button: 'conformite',
    },
  ],

  'Lettre Mission': [
    {
      id: 'lm1',
      title: 'Réception des documents de vigilance',
      description: 'Pièces de vérification client',
    },
    {
      id: 'lm2',
      title: 'Envoi lettre de mission pour signature',
      description: 'Envoyer le contrat au client',
    },
    {
      id: 'lm3',
      title: 'Acceptation LM des clients (LM signé)',
      description: 'Client retourne LM signée',
    },
    {
      id: 'lm4',
      title: 'Écriture du rapport/audit',
      description: 'Commencer la rédaction du rapport',
      button: 'noteRapport',
    },
  ],

  'Rapport/Audit': [
    {
      id: 'ra1',
      title: 'Validation du rapport par GL',
      description: 'Gérant/Leader valide le rapport',
    },
    {
      id: 'ra2',
      title: 'Incorporation des recommandations',
      description: 'Ajouter les recommandations dans le rapport',
      button: 'recommandation',
    },
    {
      id: 'ra3',
      title: 'Envoi du rapport au client pour signature',
      description: 'Transmission au client',
    },
  ],

  'Suivi MEP': [
    {
      id: 'mep1',
      title: 'Confirmation des recommandations à mettre en place',
      description: 'Client confirme quelles recommandations il va appliquer',
    },
    {
      id: 'mep2',
      title: 'Envoi au service juridique pour DPJ',
      description: 'Transmettre infos au service juridique',
    },
  ],

  'Suivi CSP': [
    {
      id: 'csp1',
      title: 'Prendre contact avec le client (annuel)',
      description: 'RDV/appel annuel de suivi',
      button: 'rdv',
    },
    {
      id: 'csp2',
      title: 'Nouvelles recommandations',
      description: 'Ajouter recommandations si nécessaire',
      button: 'recommandation',
    },
    {
      id: 'csp3',
      title: 'Compte rendu par mail + O2S',
      description: 'Envoyer résumé au client',
    },
  ],

  'Arbitrage': [
    {
      id: 'arb1',
      title: 'Pièces comptables reçues',
      description: 'Checker les docs comptables reçus',
      button: 'documents',
    },
    {
      id: 'arb2',
      title: 'Demander besoin trésorerie année en cours',
      description: 'Envoyer mail au client pour besoin tréso',
      button: 'treso',
    },
    {
      id: 'arb3',
      title: 'Remplir fichier excel (IR, cotisations sociales)',
      description: 'Calculs IR et sociales dans Excel',
    },
    {
      id: 'arb4',
      title: 'Prévenir comptable',
      description: 'Notifier le comptable des arbitrages',
      button: 'mailComptableArb',
    },
    {
      id: 'arb5',
      title: 'Note O2S',
      description: 'Documenter dans O2S',
    },
  ],
};

export function getTaskDefs(status: string): TaskDef[] {
  return TASK_DEFINITIONS[status] || [];
}
