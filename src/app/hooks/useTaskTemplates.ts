import { toast } from 'sonner';
import { taskAPI } from '../services/api';
import { getTasksForStatus } from '../utils/taskTemplates';
import type { Task, PipelineStage } from '../types/client';

/**
 * Hook personnalisé pour gérer les templates de tâches et leur synchronisation
 */
export function useTaskTemplates() {
  
  /**
   * Migre les tâches existantes qui n'ont pas de champ 'stage'
   * en leur attribuant un stage basé sur leur titre et les templates
   * ET supprime les tâches obsolètes
   */
  const migrateTasksWithoutStage = async (
    tasks: Task[]
  ): Promise<Task[]> => {
    const allStages: PipelineStage[] = [
      'R0 - Prospect',
      'R0-R1 - Découverte',
      'R1 - Audit patrimonial',
      'R1-R2 - Stratégie définie',
      'R2 - Recommandation proposée',
      'Rsuivi - Suivi patrimonial'
    ];
    let hasChanges = false;
    
    // Mapping spécifique pour les tâches qui ne sont plus dans les templates
    const taskStageMapping: Record<string, PipelineStage> = {
      "Origine du prospect": 'R0 - Prospect',
      "Contacter le client / planifier le premier rendez-vous": 'R0 - Prospect',
      "Contacter le comptable pour obtenir les infos pro (si chez fiteco)": 'R0 - Prospect',
      "Collecter documents et infos (perso + pro)": 'R0-R1 - Découverte',
      "RDV découverte – finalisation de remplissage des infos et objectifs clients": 'R0-R1 - Découverte',
      "Transmission du devis au client": 'R0-R1 - Découverte',
      "Réception accord étude patrimoniale + date de restitution": 'R0-R1 - Découverte',
      "Rédaction de l'audit": 'R1 - Audit patrimonial',
      "Incorporation des recommandations avec deadline": 'R1 - Audit patrimonial',
      "Créer synthèse/présentation d'audit et axes de recommandations": 'R1 - Audit patrimonial',
      "Présentation de l'audit (restitution) Date": 'R1-R2 - Stratégie définie',
      "Validation des recommandations par le client + mail de compte rendu d'echange du rdv": 'R1-R2 - Stratégie définie',
      "Validation des responsables et échéances pour mise en place": 'R1-R2 - Stratégie définie',
      "Suivi de mise en place des recommandations": 'R2 - Recommandation proposée',
      "Relance partenaires ou client si blocage": 'R2 - Recommandation proposée',
      "Planifier rendez-vous réguliers de suivi": 'Rsuivi - Suivi patrimonial',
      "Réactualiser projections et recommandations si besoin": 'Rsuivi - Suivi patrimonial',
    };
    
    // Liste des tâches obsolètes à supprimer automatiquement
    const obsoleteTasks = [
      "Envoyer le DER (Document d'Entrée en Relation)",
    ];
    
    // Tâches qui doivent être UNIQUEMENT en Audit patrimonial (à corriger si trouvées ailleurs)
    const auditOnlyTasks = [
      "LAB-FT",
      "Profil de risque",
      "Gel des avoirs",
      "Recueil d'informations remplis",
    ];
    
    // Tâches qui doivent être UNIQUEMENT en Audit patrimonial (à corriger si trouvées ailleurs)
    const auditReceptionTasks = [
      "Réception des documents clients",
    ];
    
    // ✅ NOUVEAU : Détecter et supprimer TOUS les doublons de tâches
    const taskTitles = [...new Set(tasks.map(t => t.title))];
    
    for (const title of taskTitles) {
      const duplicateTasks = tasks.filter(t => t.title === title);
      
      if (duplicateTasks.length > 1) {
        console.log(`⚠️ ${duplicateTasks.length} doublons de "${title}" détectés`);
        
        // Stratégie de choix de la tâche à garder :
        // 1. Priorité : Tâche avec documentRequests (pour "Réception des documents clients")
        // 2. Sinon : Tâche avec le stage le plus récent
        // 3. Sinon : Tâche complétée en priorité
        // 4. Sinon : Première tâche
        let taskToKeep = duplicateTasks[0];
        
        // Vérifier si une tâche a des données spéciales
        for (const task of duplicateTasks) {
          if (task.documentRequests && task.documentRequests.requestedDocuments?.length > 0) {
            taskToKeep = task;
            break;
          }
        }
        
        // Si pas de données spéciales, garder la tâche complétée
        if (taskToKeep === duplicateTasks[0]) {
          const completedTask = duplicateTasks.find(t => t.completed);
          if (completedTask) {
            taskToKeep = completedTask;
          }
        }
        
        // Supprimer les doublons
        for (const task of duplicateTasks) {
          if (task.id !== taskToKeep.id) {
            console.log(`🗑️ Suppression du doublon: "${task.title}" (ID: ${task.id}, Stage: ${task.stage})`);
            try {
              await taskAPI.delete(task.id);
              hasChanges = true;
            } catch (error) {
              console.error(`❌ Erreur suppression doublon ${task.id}:`, error);
            }
          }
        }
      }
    }
    
    // Recharger les tâches après suppression des doublons pour éviter de traiter des tâches supprimées
    let workingTasks = tasks.filter(t => {
      const title = t.title;
      const sameTitleTasks = tasks.filter(tt => tt.title === title);
      if (sameTitleTasks.length > 1) {
        // Garder uniquement une tâche
        let taskToKeep = sameTitleTasks[0];
        for (const task of sameTitleTasks) {
          if (task.documentRequests && task.documentRequests.requestedDocuments?.length > 0) {
            taskToKeep = task;
            break;
          }
        }
        if (taskToKeep === sameTitleTasks[0]) {
          const completedTask = sameTitleTasks.find(tt => tt.completed);
          if (completedTask) taskToKeep = completedTask;
        }
        return t.id === taskToKeep.id;
      }
      return true;
    });
    
    const migratedTasks = await Promise.all(workingTasks.map(async (task) => {
      // Supprimer les tâches obsolètes
      if (obsoleteTasks.includes(task.title)) {
        console.log(`🗑️ Suppression de la tâche obsolète: "${task.title}"`);
        try {
          await taskAPI.delete(task.id);
          return null; // Marquer pour suppression
        } catch (error) {
          console.error(`❌ Erreur suppression tâche obsolète ${task.id}:`, error);
          return task; // Garder la tâche si la suppression échoue
        }
      }
      
      // Corriger les tâches Audit patrimonial qui sont au mauvais endroit (pas en R1)
      // ⚠️ CORRECTION : Au lieu de supprimer, on corrige le stage
      if (auditOnlyTasks.includes(task.title) && task.stage && task.stage !== 'R1') {
        console.log(`🔧 Correction du stage de "${task.title}" : ${task.stage} → R1`);
        hasChanges = true;
        try {
          const correctedTask = { ...task, stage: 'R1' as PipelineStage };
          await taskAPI.update(task.id, correctedTask);
          return correctedTask;
        } catch (error) {
          console.error(`❌ Erreur correction stage tâche ${task.id}:`, error);
          return task;
        }
      }
      
      // Corriger les tâches qui doivent être en R1 (Audit patrimonial)
      // ⚠️ CORRECTION : Au lieu de supprimer, on corrige le stage
      if (auditReceptionTasks.includes(task.title) && task.stage && task.stage !== 'R1') {
        console.log(`🔧 Correction du stage de "${task.title}" : ${task.stage} → R1`);
        hasChanges = true;
        try {
          const correctedTask = { ...task, stage: 'R1' as PipelineStage };
          await taskAPI.update(task.id, correctedTask);
          return correctedTask;
        } catch (error) {
          console.error(`❌ Erreur correction stage tâche ${task.id}:`, error);
          return task;
        }
      }
      
      // Si la tâche a déjà un stage, pas besoin de migration
      if (task.stage) {
        return task;
      }
      
      let foundStage: PipelineStage | null = null;
      
      // 1. Vérifier d'abord le mapping spécifique
      if (taskStageMapping[task.title]) {
        foundStage = taskStageMapping[task.title];
        console.log(`🔄 Migration tâche "${task.title}" vers stage ${foundStage} (mapping spécifique)`);
      } else {
        // 2. Trouver le stage qui contient cette tâche dans ses templates
        for (const stage of allStages) {
          const stageTasks = getTasksForStatus(stage);
          if (stageTasks.includes(task.title)) {
            foundStage = stage;
            break;
          }
        }
        
        if (foundStage) {
          console.log(`🔄 Migration tâche "${task.title}" vers stage ${foundStage} (trouvé dans templates)`);
        }
      }
      
      // Si on a trouvé un stage, migrer la tâche
      if (foundStage) {
        hasChanges = true;
        const migratedTask = { ...task, stage: foundStage };
        
        try {
          await taskAPI.update(task.id, migratedTask);
          return migratedTask;
        } catch (error) {
          console.error(`❌ Erreur migration tâche ${task.id}:`, error);
          return task;
        }
      }
      
      // Si aucun stage trouvé, assigner R0 par défaut et logger un avertissement
      console.warn(`⚠️ Tâche sans stage assignée à R0 par défaut: "${task.title}"`);
      hasChanges = true;
      const migratedTask = { ...task, stage: 'R0' as PipelineStage };
      
      try {
        await taskAPI.update(task.id, migratedTask);
        return migratedTask;
      } catch (error) {
        console.error(`❌ Erreur migration tâche ${task.id}:`, error);
        return task;
      }
    }));
    
    // Filtrer les tâches null (supprimées)
    const filteredTasks = migratedTasks.filter(task => task !== null) as Task[];
    
    if (hasChanges) {
      console.log('✅ Migration des tâches terminée');
    }
    
    const deletedCount = migratedTasks.length - filteredTasks.length;
    if (deletedCount > 0) {
      console.log(`🗑️ ${deletedCount} tâche(s) obsolète(s) supprimée(s)`);
    }
    
    // 📊 Afficher un récapitulatif des tâches par stage
    console.log('📊 Récapitulatif des tâches par stage:');
    const stageGroups = filteredTasks.reduce((acc, task) => {
      const stage = task.stage || 'Sans stage';
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(task.title);
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(stageGroups).forEach(([stage, titles]) => {
      console.log(`  ${stage}: ${titles.length} tâche(s) - ${titles.join(', ')}`);
    });
    
    return filteredTasks;
  };
  
  /**
   * Synchronise les tâches existantes avec les templates actuels
   * - Ajoute les tâches manquantes
   * - NE SUPPRIME PLUS les tâches des stages précédents (pour garder l'historique)
   * - 🔥 CORRECTION : Vérifie les tâches dans TOUS les stages pour éviter les doublons
   */
  const syncTasksWithTemplates = async (
    clientId: string,
    clientStatus: PipelineStage,
    clientTasks: Task[]
  ): Promise<boolean> => {
    const templateTasks = getTasksForStatus(clientStatus);

    // 🔥 CORRECTION : Vérifier les tâches dans TOUS les stages, pas seulement le stage actuel
    // pour éviter les doublons si une tâche existe déjà dans un autre stage
    const existingTaskTitles = clientTasks.map(task => task.title);
    const missingTemplates = templateTasks.filter(templateTitle => !existingTaskTitles.includes(templateTitle));

    // NE PLUS SUPPRIMER les anciennes tâches - on garde l'historique complet
    // Les tâches des stages précédents restent visibles dans leur accordéon respectif

    // Ajouter les tâches manquantes pour le stage actuel
    for (let i = 0; i < missingTemplates.length; i++) {
      const templateTitle = missingTemplates[i];
      const isFirstTaskR0 = clientStatus === 'R0' && i === 0 && templateTitle === 'Enregistrement du prospect';
      
      const taskData = {
        titre: templateTitle,
        description: '',
        priorite: 'normal',
        date_echeance: '',
      };

      try {
        const createdTask = await taskAPI.create(clientId, taskData);
        
        // Ajouter le champ stage à la tâche
        const taskWithStage = {
          ...createdTask,
          stage: clientStatus,
        };
        
        // Si c'est la première tâche R0, l'initialiser avec les champs spéciaux
        if (isFirstTaskR0) {
          await taskAPI.update(createdTask.id, {
            ...taskWithStage,
            completed: true,
            prospectOrigin: '',
            referrerName: '',
          });
        } else {
          await taskAPI.update(createdTask.id, taskWithStage);
        }
        
        console.log(`✅ Ajoutée tche template "${templateTitle}" pour le stage ${clientStatus}`);
        clientTasks.push(taskWithStage);
      } catch (error) {
        console.error(`Erreur création tâche "${templateTitle}":`, error);
      }
    }

    // Si des modifications ont été faites, retourner true
    if (missingTemplates.length > 0) {
      console.log(`🔄 Migration des tâches : ${missingTemplates.length} ajoutées pour le stage ${clientStatus}`);
      return true;
    }
    return false;
  };

  /**
   * Crée automatiquement les tâches pour un client qui n'en a pas
   */
  const createInitialTasks = async (
    clientId: string,
    clientStatus: PipelineStage
  ): Promise<Task[]> => {
    console.log('⚠️ Aucune tâche trouvée, création automatique des tâches...');
    const taskTemplates = getTasksForStatus(clientStatus);
    const createdTasks: Task[] = [];
    
    for (const templateTitle of taskTemplates) {
      const taskData = {
        titre: templateTitle,
        description: '',
        priorite: 'normal',
        date_echeance: '',
      };

      try {
        const createdTask = await taskAPI.create(clientId, taskData);
        
        // Ajouter le champ stage à la tâche
        const taskWithStage = {
          ...createdTask,
          stage: clientStatus,
        };
        
        await taskAPI.update(createdTask.id, taskWithStage);
        createdTasks.push(taskWithStage);
        console.log(`✅ Tâche créée: "${templateTitle}" pour le stage ${clientStatus}`);
      } catch (error) {
        console.error(`❌ Erreur création tâche "${templateTitle}":`, error);
      }
    }
    
    if (createdTasks.length > 0) {
      toast.success(`✅ ${createdTasks.length} tâches créées automatiquement pour ce client`);
    }
    
    return createdTasks;
  };

  /**
   * Récupère les tâches d'un statut spécifique
   */
  const getTasksForStage = (stage: PipelineStage): string[] => {
    return getTasksForStatus(stage);
  };

  return {
    migrateTasksWithoutStage,
    syncTasksWithTemplates,
    createInitialTasks,
    getTasksForStage,
  };
}