import type { PipelineStage } from '../types/client';

export const getTasksForStatus = (status: PipelineStage): string[] => {
  switch (status) {
    case 'R0 - Prospect':
      return [
        'Origine du prospect',
        'Contacter le client / planifier le premier rendez-vous',
        'Contacter le comptable pour obtenir les infos pro (si chez fiteco)',
      ];
    case 'R0-R1 - Découverte':
      return [
        'Collecter documents et infos (perso + pro)',
        'RDV découverte – finalisation de remplissage des infos et objectifs clients',
        'Transmission du devis au client',
        'Réception accord étude patrimoniale + date de restitution',
      ];
    case 'R1 - Audit patrimonial':
      return [
        'Rédaction de l\'audit',
        'Incorporation des recommandations avec deadline',
        'Créer synthèse/présentation d\'audit et axes de recommandations',
      ];
    case 'R1-R2 - Stratégie définie':
      return [
        'Présentation de l\'audit (restitution) Date',
        'Validation des recommandations par le client + mail de compte rendu d\'echange du rdv',
        'Validation des responsables et échéances pour mise en place',
      ];
    case 'R2 - Recommandation proposée':
      return [
        'Suivi de mise en place des recommandations',
        'Relance partenaires ou client si blocage',
      ];
    case 'Rsuivi - Suivi patrimonial':
      return [
        'Planifier rendez-vous réguliers de suivi',
        'Réactualiser projections et recommandations si besoin',
      ];
    default:
      return [];
  }
};

export const getNextStatus = (currentStatus: PipelineStage): PipelineStage | null => {
  const statusFlow: Record<PipelineStage, PipelineStage | null> = {
    'R0 - Prospect': 'R0-R1 - Découverte',
    'R0-R1 - Découverte': 'R1 - Audit patrimonial',
    'R1 - Audit patrimonial': 'R1-R2 - Stratégie définie',
    'R1-R2 - Stratégie définie': 'R2 - Recommandation proposée',
    'R2 - Recommandation proposée': 'Rsuivi - Suivi patrimonial',
    'Rsuivi - Suivi patrimonial': null,
  };
  return statusFlow[currentStatus];
};

export const getTransitionButtonLabel = (currentStatus: PipelineStage): string => {
  switch (currentStatus) {
    case 'R0 - Prospect':
      return 'Passer à Entre R0-R1';
    case 'R0-R1 - Découverte':
      return 'Mail envoyé / Étape terminée';
    case 'R1 - Audit patrimonial':
      return 'R1 complété';
    case 'R1-R2 - Stratégie définie':
      return 'Bilan / Livrables prêts';
    case 'R2 - Recommandation proposée':
      return 'R2 terminé / Dossier clos';
    case 'Rsuivi - Suivi patrimonial':
      return 'Archiver';
    default:
      return 'Suivant';
  }
};