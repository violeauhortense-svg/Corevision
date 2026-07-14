/**
 * Utilitaire pour s'assurer que les tâches d'un client existent
 * Crée automatiquement les tâches si elles n'existent pas
 */

import type { PipelineStage } from '../types/client';

// Templates de tâches par stage
const TASK_TEMPLATES: Record<PipelineStage, string[]> = {
  'R0': [
    'Premier contact établi',
    'Qualifier le besoin',
    'Planifier rendez-vous de découverte',
  ],
  'R0-R1': [
    'Valider le profil client',
    'Recueillir les documents',
    'Analyser la situation',
  ],
  'R1': [
    'Réaliser bilan patrimonial',
    'Établir préconisations',
    'Présenter recommandations',
  ],
  'R1-R2': [
    'Validation des recommandations',
    'Préparation mise en œuvre',
    'Signature des documents',
  ],
  'R2': [
    'Mise en place solutions',
    'Suivi des investissements',
    'Reporting trimestriel',
  ],
  'Rsuivi': [
    'Rendez-vous annuel',
    'Actualisation bilan',
    'Ajustements stratégie',
  ],
};

/**
 * Vérifie l'existence des tâches pour un client et les crée si nécessaire
 */
export async function ensureClientTasks(clientId: string, clientStatus: PipelineStage): Promise<void> {
  const userId = localStorage.getItem('user_id') || 'default';
  const tasksKey = `client_tasks_${userId}_${clientId}`;
  const storedTasks = localStorage.getItem(tasksKey);
  
  if (!storedTasks) {
    await createTasksForClient(clientId, clientStatus);
  } else {
  }
}

/**
 * Crée les tâches initiales pour un client
 */
async function createTasksForClient(clientId: string, clientStatus: PipelineStage): Promise<void> {
  const userId = localStorage.getItem('user_id') || 'default';
  const tasksKey = `client_tasks_${userId}_${clientId}`;
  
  // Récupérer les templates de tâches pour ce statut
  const taskTemplates = TASK_TEMPLATES[clientStatus] || [];
  
  // Créer les tâches
  const tasks = taskTemplates.map((titre, index) => ({
    id: `task-${clientId}-${index}-${Date.now()}`,
    titre,
    title: titre, // Alias pour compatibilité
    clientId,
    client_id: clientId, // Alias pour compatibilité
    statut: 'à_faire',
    completed: false,
    stage: clientStatus,
    createdAt: new Date().toISOString(),
    conseiller_id: userId,
  }));
  
  // Sauvegarder dans localStorage
  localStorage.setItem(tasksKey, JSON.stringify(tasks));
  
}

/**
 * Force le rechargement des tâches d'un client
 */
export function reloadClientTasks(clientId: string): void {
  const event = new CustomEvent('task-updated', {
    detail: { clientId }
  });
  window.dispatchEvent(event);
}
