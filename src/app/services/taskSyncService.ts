import { taskAPI } from './api';
import { agendaAPI } from './agendaAPI';
import type { AgendaEvent } from '../types/agenda';
import type { Task } from '../types/client';

interface SyncOptions {
  clientId: string;
  userId?: string;
}

/**
 * Service de synchronisation des tâches client avec :
 * - TodoView (tâches ouvertes)
 * - Agenda (tâches avec deadline)
 * - Historique (tâches complétées)
 */
export const taskSyncService = {
  /**
   * Synchronise les tâches d'un client dans tous les endroits
   */
  syncClientTasks: async (options: SyncOptions) => {
    try {
      const { clientId, userId = 'default' } = options;

      // Récupérer les tâches du client
      const tasks = await taskAPI.getByClientId(clientId);

      // Ajouter/mettre à jour les tâches dans localStorage pour TodoView
      await taskSyncService.syncToTodoList(tasks, userId);

      // Ajouter/mettre à jour les événements d'agenda pour les tâches avec deadline
      await taskSyncService.syncToAgenda(tasks, clientId);

      // Historique sera géré par HistoriqueTab (qui affiche les tâches complétées)

      return { success: true, synced: tasks.length };
    } catch (error) {
      console.error('❌ Erreur synchronisation tâches:', error);
      return { success: false, synced: 0 };
    }
  },

  /**
   * Synchronise les tâches dans la to-do list
   */
  syncToTodoList: async (tasks: Task[], userId: string) => {
    try {
      const key = `todo_client_tasks_${userId}`;

      // Filtrer les tâches ouvertes/en cours (exclure les complétées)
      const openTasks = tasks.filter(task =>
        task.completed !== true && task.completed !== 'Terminé'
      );


      localStorage.setItem(key, JSON.stringify(openTasks));
      return { success: true, count: openTasks.length };
    } catch (error) {
      console.error('❌ Erreur sync TodoList:', error);
      return { success: false, count: 0 };
    }
  },

  /**
   * Synchronise les tâches dans l'agenda
   * Note: Cette fonction prépare les tâches pour l'agenda mais ne les ajoute pas automatiquement
   * L'agenda gère ses propres événements et les tâches y sont ajoutées manuellement via l'UI
   */
  syncToAgenda: async (tasks: Task[], clientId: string) => {
    try {
      // Filtrer les tâches avec deadline pour affichage
      const tasksWithDeadline = tasks.filter(task => task.deadline);


      // Note: L'agenda devrait afficher les tâches avec deadline de manière read-only
      // pour que les utilisateurs sachent quand les tâches doivent être complétées
      // Cette intégration complète sera implémentée dans le composant AgendaView

      return { success: true, count: tasksWithDeadline.length, tasks: tasksWithDeadline };
    } catch (error) {
      console.error('❌ Erreur sync Agenda:', error);
      return { success: false, count: 0, tasks: [] };
    }
  },

  /**
   * Récupère les tâches complétées d'un client pour l'historique
   */
  getCompletedTasks: async (clientId: string): Promise<Task[]> => {
    try {
      const tasks = await taskAPI.getByClientId(clientId);
      return tasks.filter(task => task.completed === true || task.completed === 'Terminé');
    } catch (error) {
      console.error('❌ Erreur récupération tâches complétées:', error);
      return [];
    }
  },

  /**
   * Récupère les tâches ouvertes pour la TodoView
   */
  getOpenTasks: async (userId: string): Promise<Task[]> => {
    try {
      const key = `todo_client_tasks_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erreur récupération tâches ouvertes:', error);
      return [];
    }
  },

  /**
   * Marque une tâche comme complétée et synchronise partout
   */
  completeTask: async (clientId: string, taskId: string, userId: string): Promise<boolean> => {
    try {
      // Mettre à jour dans la tâche
      await taskAPI.update(taskId, { completed: true });

      // Synchroniser les tâches du client
      await taskSyncService.syncClientTasks({ clientId, userId });

      return true;
    } catch (error) {
      console.error('❌ Erreur completion tâche:', error);
      return false;
    }
  },
};
