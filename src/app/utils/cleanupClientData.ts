/**
 * Utilitaires pour nettoyer et auditer les données orphelines d'un client
 */

import { clientAPI, taskAPI } from '../services/api';
import { toast } from 'sonner';

/**
 * Nettoie TOUTES les données associées à un client supprimé
 * À appeler AVANT la suppression du client
 */
export async function cleanupClientData(clientId: string): Promise<{ success: boolean; summary: any }> {
  const summary = {
    tasksRemoved: 0,
    documentsRemoved: 0,
    errors: [] as string[],
  };

  try {

    // 1️⃣ Supprimer toutes les tâches du client
    try {
      const allTasks = await taskAPI.getAll();
      const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);

      for (const task of clientTasks) {
        try {
          await taskAPI.delete(task.id);
          summary.tasksRemoved++;
        } catch (e) {
          console.warn(`⚠️ Erreur suppression tâche ${task.id}:`, e);
        }
      }

    } catch (error) {
      const msg = `Erreur suppression tâches: ${error}`;
      summary.errors.push(msg);
      console.error(msg);
    }

    // 3️⃣ Supprimer les données localStorage associées
    try {
      const userId = localStorage.getItem('user_id') || 'default';
      const keysToRemove = [
        `client_tasks_${userId}_${clientId}`,
        `client_data_${userId}_${clientId}`,
        `client_documents_${userId}_${clientId}`,
      ];

      keysToRemove.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });

    } catch (error) {
      console.warn('⚠️ Erreur suppression localStorage:', error);
    }

    return { success: true, summary };
  } catch (error) {
    console.error('❌ Erreur critique pendant le nettoyage:', error);
    return { success: false, summary };
  }
}

/**
 * Audite TOUTES les données et supprime les orphelines
 * À utiliser régulièrement pour nettoyer la base de données
 */
export async function auditAndCleanupOrphanedData(): Promise<{ success: boolean; summary: any }> {
  const summary = {
    totalClientsChecked: 0,
    orphanedTasksRemoved: 0,
    orphanedDocumentsRemoved: 0,
    orphanedEntriesRemovedFromStorage: 0,
    errors: [] as string[],
  };

  try {

    // Récupérer tous les clients pour vérifier qu'ils existent
    let allClients: any[] = [];
    try {
      allClients = await clientAPI.getAll();
      summary.totalClientsChecked = allClients.length;
    } catch (error) {
      const msg = `Erreur récupération clients: ${error}`;
      summary.errors.push(msg);
      return { success: false, summary };
    }

    const validClientIds = allClients.map((c) => c.id);

    // 1️⃣ Auditer les tâches
    try {
      const allTasks = await taskAPI.getAll();
      const orphanedTasks = allTasks.filter((t: any) => !validClientIds.includes(t.clientId));

      for (const task of orphanedTasks) {
        try {
          await taskAPI.delete(task.id);
          summary.orphanedTasksRemoved++;
        } catch (e) {
          console.warn(`⚠️ Erreur suppression tâche orpheline ${task.id}:`, e);
        }
      }

      if (summary.orphanedTasksRemoved > 0) {
      }
    } catch (error) {
      const msg = `Erreur audit tâches: ${error}`;
      summary.errors.push(msg);
      console.error(msg);
    }

    // 3️⃣ Auditer localStorage
    try {
      const userId = localStorage.getItem('user_id') || 'default';
      const orphanedKeys: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Vérifier si c'est une clé client
        if (key.includes(`_${userId}_`) && key.startsWith('client_')) {
          // Extraire le clientId de la clé (format: client_data_userId_clientId)
          const parts = key.split(`_${userId}_`);
          if (parts.length === 2) {
            const clientId = parts[1];
            if (!validClientIds.includes(clientId)) {
              orphanedKeys.push(key);
            }
          }
        }
      }

      for (const key of orphanedKeys) {
        localStorage.removeItem(key);
        summary.orphanedEntriesRemovedFromStorage++;
      }

      if (summary.orphanedEntriesRemovedFromStorage > 0) {
      }
    } catch (error) {
      const msg = `Erreur audit localStorage: ${error}`;
      summary.errors.push(msg);
      console.error(msg);
    }

    return { success: true, summary };
  } catch (error) {
    console.error('❌ Erreur critique pendant l\'audit:', error);
    return { success: false, summary };
  }
}

/**
 * Affiche un rapport d'audit dans la console
 */
export function displayAuditReport(summary: any): void {
  console.group('📊 Rapport d\'audit');
  console.log('Clients vérifiés:', summary.totalClientsChecked);
  console.log('Tâches orphelines supprimées:', summary.orphanedTasksRemoved);
  console.log('Documents orphelins supprimés:', summary.orphanedDocumentsRemoved);
  console.log('Entrées localStorage orphelines supprimées:', summary.orphanedEntriesRemovedFromStorage);
  if (summary.errors.length > 0) {
    console.warn('Erreurs rencontrées:', summary.errors);
  }
  console.groupEnd();
}
