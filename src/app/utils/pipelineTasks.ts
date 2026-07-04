// Définition des tâches par étape de pipeline
export interface PipelineTask {
  id: string;
  titre: string;
  description: string;
  statut: string;
}

export const PIPELINE_TASKS: Record<string, PipelineTask[]> = {
  'R0 - Prospect': [
    {
      id: 'prospect-1',
      titre: 'Origine du prospect',
      description: 'Enregistrement du prospect avec origine et recommandateur',
      statut: 'R0 - Prospect'
    },
    {
      id: 'prospect-2',
      titre: 'Contacter le client / planifier le premier rendez-vous',
      description: 'Prise de contact pour comprendre les besoins',
      statut: 'R0 - Prospect'
    },
    {
      id: 'prospect-3',
      titre: 'Contacter le comptable pour obtenir les infos pro (si chez fiteco)',
      description: 'Collecte des informations professionnelles',
      statut: 'R0 - Prospect'
    },
  ],
  'R0-R1 - Découverte': [
    {
      id: 'decouverte-1',
      titre: 'Collecter documents et infos (perso + pro)',
      description: 'Collecte de tous les documents nécessaires',
      statut: 'R0-R1 - Découverte'
    },
    {
      id: 'decouverte-2',
      titre: 'RDV découverte – finalisation de remplissage des infos et objectifs clients',
      description: 'Rendez-vous de découverte approfondie',
      statut: 'R0-R1 - Découverte'
    },
    {
      id: 'decouverte-3',
      titre: 'Transmission du devis au client',
      description: 'Envoi du devis pour l\'étude patrimoniale',
      statut: 'R0-R1 - Découverte'
    },
    {
      id: 'decouverte-4',
      titre: 'Réception accord étude patrimoniale + date de restitution',
      description: 'Accord du client pour démarrer l\'audit',
      statut: 'R0-R1 - Découverte'
    },
  ],
  'R1 - Audit patrimonial': [
    {
      id: 'audit-1',
      titre: 'Rédaction de l\'audit',
      description: 'Rédaction complète de l\'audit patrimonial',
      statut: 'R1 - Audit patrimonial'
    },
    {
      id: 'audit-2',
      titre: 'Incorporation des recommandations avec deadline',
      description: 'Intégration des recommandations stratégiques',
      statut: 'R1 - Audit patrimonial'
    },
    {
      id: 'audit-3',
      titre: 'Créer synthèse/présentation d\'audit et axes de recommandations',
      description: 'Préparation de la synthèse pour présentation',
      statut: 'R1 - Audit patrimonial'
    },
  ],
  'R1-R2 - Stratégie définie': [
    {
      id: 'strategie-1',
      titre: 'Présentation de l\'audit (restitution) Date',
      description: 'Présentation complète de l\'audit au client',
      statut: 'R1-R2 - Stratégie définie'
    },
    {
      id: 'strategie-2',
      titre: 'Validation des recommandations par le client + mail de compte rendu d\'echange du rdv',
      description: 'Validation et accord sur les recommandations',
      statut: 'R1-R2 - Stratégie définie'
    },
    {
      id: 'strategie-3',
      titre: 'Validation des responsables et échéances pour mise en place',
      description: 'Définition du plan d\'action et responsabilités',
      statut: 'R1-R2 - Stratégie définie'
    },
  ],
  'R2 - Recommandation proposée': [
    {
      id: 'reco-1',
      titre: 'Suivi de mise en place des recommandations',
      description: 'Suivi actif de la mise en œuvre',
      statut: 'R2 - Recommandation proposée'
    },
    {
      id: 'reco-2',
      titre: 'Relance partenaires ou client si blocage',
      description: 'Gestion des éventuels blocages',
      statut: 'R2 - Recommandation proposée'
    },
  ],
  'Rsuivi - Suivi patrimonial': [
    {
      id: 'suivi-1',
      titre: 'Planifier rendez-vous réguliers de suivi',
      description: 'Organisation des rendez-vous de suivi périodiques',
      statut: 'Rsuivi - Suivi patrimonial'
    },
    {
      id: 'suivi-2',
      titre: 'Réactualiser projections et recommandations si besoin',
      description: 'Mise à jour selon évolution de situation',
      statut: 'Rsuivi - Suivi patrimonial'
    },
  ],
};

// Fonction pour obtenir l'étape suivante
export function getNextStage(currentStage: string): string | null {
  const stageOrder = [
    'R0 - Prospect',
    'R0-R1 - Découverte',
    'R1 - Audit patrimonial',
    'R1-R2 - Stratégie définie',
    'R2 - Recommandation proposée',
    'Rsuivi - Suivi patrimonial'
  ];
  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null;
  }
  return stageOrder[currentIndex + 1];
}

// Fonction pour obtenir le label de l'étape
export function getStageLabel(stage: string): string {
  // Les statuts sont déjà les bons libellés
  return stage;
}