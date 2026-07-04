import { toast } from 'sonner';
import { clientAPI, taskAPI } from '../services/api';
import { getTasksForStatus } from '../utils/taskTemplates';
import type { Task, PipelineStage } from '../types/client';

/**
 * Hook personnalisé pour gérer la progression et régression automatique des statuts clients
 */
export function useTaskProgression() {
  
  /**
   * Vérifie si toutes les tâches d'un statut sont complétées et fait progresser le client au statut suivant
   */
  const checkAndProgressToNextStage = async (
    clientId: string,
    currentClientStatus: PipelineStage,
    currentTasks: Task[],
    onStatusChange: (newStatus: PipelineStage) => void,
    onTasksReload: () => Promise<void>
  ) => {
    // 🔥 CORRECTION : Filtrer les tâches par leur champ 'stage', pas par leur titre
    const currentStageTasksData = currentTasks.filter(t => t.stage === currentClientStatus);
    const allCompleted = currentStageTasksData.length > 0 && currentStageTasksData.every((t) => t.completed);
    
    if (!allCompleted) {
      return; // Pas toutes complétées, ne rien faire
    }

    // Définir le statut suivant selon le statut actuel
    const nextStageMap: Record<PipelineStage, PipelineStage | null> = {
      'R0 - Prospect': 'R0-R1 - Découverte',
      'R0-R1 - Découverte': 'R1 - Audit patrimonial',
      'R1 - Audit patrimonial': 'R1-R2 - Stratégie définie',
      'R1-R2 - Stratégie définie': 'R2 - Recommandation proposée',
      'R2 - Recommandation proposée': 'Rsuivi - Suivi patrimonial',
      'Rsuivi - Suivi patrimonial': null, // Pas de statut suivant
    };

    const nextStage = nextStageMap[currentClientStatus];
    
    if (!nextStage) {
      console.log('✅ Toutes les tâches complétées - Dernier statut atteint');
      return; // Pas de statut suivant
    }

    try {
      console.log(`🚀 Toutes les tâches de ${currentClientStatus} complétées, passage à ${nextStage}`);
      
      // Mettre à jour le statut du client
      await clientAPI.update(clientId, { status: nextStage });
      
      // Mettre à jour l'état local
      onStatusChange(nextStage);
      
      toast.success(`🎉 Toutes les tâches complétées ! Le client passe en ${nextStage}`, {
        duration: 5000,
      });

      // Générer les nouvelles tâches pour le statut suivant
      const nextStageTasks = getTasksForStatus(nextStage);
      for (const templateTitle of nextStageTasks) {
        const taskData = {
          titre: templateTitle,
          description: '',
          priorite: 'normal',
          date_echeance: '',
        };

        try {
          const createdTask = await taskAPI.create(clientId, taskData);
          
          // 🔥 CORRECTION : Ajouter le champ stage à la tâche créée
          await taskAPI.update(createdTask.id, {
            ...createdTask,
            stage: nextStage,
          });
          
          console.log(`✅ Ajoutée tâche template \"${templateTitle}\" pour le statut ${nextStage}`);
        } catch (error) {
          console.error(`Erreur création tâche \"${templateTitle}\":`, error);
        }
      }

      // Recharger les tâches pour afficher les nouvelles
      await onTasksReload();

      // Émettre un événement pour mettre à jour les autres composants
      window.dispatchEvent(new CustomEvent('clientStatusChanged', { 
        detail: { clientId, newStatus: nextStage } 
      }));
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      toast.error('Erreur lors de la progression automatique');
    }
  };

  /**
   * Vérifie si une tâche décochée appartient à un statut antérieur et fait régresser le client
   */
  const checkAndRegressToPreviousStage = async (
    clientId: string,
    task: Task,
    currentClientStatus: PipelineStage,
    onStatusChange: (newStatus: PipelineStage) => void,
    onTasksReload: () => Promise<void>
  ) => {
    // 🔥 CORRECTION : Utiliser task.stage au lieu de chercher par titre
    const taskStage = task.stage;
    
    if (!taskStage) {
      console.log('❌ Tâche sans stage défini - Pas de régression');
      return;
    }

    // Vérifier si cette tâche appartient à un statut antérieur au statut actuel
    const stageOrder: PipelineStage[] = ['R0 - Prospect', 'R0-R1 - Découverte', 'R1 - Audit patrimonial', 'R1-R2 - Stratégie définie', 'R2 - Recommandation proposée', 'Rsuivi - Suivi patrimonial'];
    const taskStageIndex = stageOrder.indexOf(taskStage);
    const currentStageIndex = stageOrder.indexOf(currentClientStatus);

    if (taskStageIndex >= currentStageIndex) {
      // La tâche n'appartient pas à un statut antérieur, pas de régression
      console.log(`✅ Tâche du statut ${taskStage} (actuel: ${currentClientStatus}) - Pas de régression`);
      return;
    }

    try {
      console.log(`🔙 Tâche décochée du statut ${taskStage}, régression au statut ${taskStage}`);
      
      // Mettre à jour le statut du client pour revenir au statut de la tâche décochée
      await clientAPI.update(clientId, { status: taskStage });
      
      // Mettre à jour l'état local
      onStatusChange(taskStage);
      
      toast.success(`🔙 Tâche décochée ! Le client revient en ${taskStage}`, {
        duration: 5000,
      });

      // Recharger les tâches
      await onTasksReload();

      // Émettre un événement pour mettre à jour les autres composants
      window.dispatchEvent(new CustomEvent('clientStatusChanged', { 
        detail: { clientId, newStatus: taskStage } 
      }));
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      toast.error('Erreur lors de la régression automatique');
    }
  };

  /**
   * Détermine si un statut est passé, actif ou futur par rapport au statut actuel
   */
  const getStageState = (stage: PipelineStage, currentClientStatus: PipelineStage): 'past' | 'current' | 'future' => {
    const stageOrder: PipelineStage[] = ['R0 - Prospect', 'R0-R1 - Découverte', 'R1 - Audit patrimonial', 'R1-R2 - Stratégie définie', 'R2 - Recommandation proposée', 'Rsuivi - Suivi patrimonial'];
    const stageIndex = stageOrder.indexOf(stage);
    const currentIndex = stageOrder.indexOf(currentClientStatus);
    
    if (stageIndex < currentIndex) return 'past';
    if (stageIndex === currentIndex) return 'current';
    return 'future';
  };

  return {
    checkAndProgressToNextStage,
    checkAndRegressToPreviousStage,
    getStageState,
  };
}