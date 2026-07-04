/**
 * Utilitaires pour la synchronisation des tâches entre les différentes vues
 * (Fiche client, To-Do list, Agenda)
 * MODE LOCALSTORAGE - Ne dépend plus du serveur
 */

import type { Task } from '../types/client';

/**
 * Récupère toutes les tâches de tous les clients depuis localStorage
 */
export async function getAllTasks(accessToken: string): Promise<Task[]> {
  try {
    console.log('🔍 getAllTasks - Récupération depuis localStorage');
    
    // Extraire le user ID du token
    let userId = 'default-user';
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || 'default-user';
    } catch (err) {
      console.warn('⚠️ Impossible d\'extraire le user ID du token');
    }
    
    // Récupérer tous les clients depuis localStorage
    const clientsKey = `clients_${userId}`;
    const storedClients = localStorage.getItem(clientsKey);
    
    if (!storedClients) {
      console.log('ℹ️ Aucun client trouvé');
      return [];
    }
    
    const clients = JSON.parse(storedClients);
    console.log(`✅ ${clients.length} clients récupérés`);

    // Récupérer les tâches pour chaque client
    const allTasks: Task[] = [];
    for (const client of clients) {
      const tasksKey = `client_tasks_${userId}_${client.id}`;
      const storedTasks = localStorage.getItem(tasksKey);
      
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        allTasks.push(...tasks);
      }
    }

    console.log(`📊 Total tâches récupérées: ${allTasks.length}`);
    return allTasks;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tâches:', error);
    return [];
  }
}

/**
 * Met à jour une tâche spécifique
 */
export async function updateTask(accessToken: string, taskId: string, updates: Partial<Task>): Promise<boolean> {
  try {
    // Extraire le user ID du token
    let userId = 'default-user';
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || 'default-user';
    } catch (err) {
      console.warn('⚠️ Impossible d\'extraire le user ID du token');
    }
    
    // Trouver la tâche dans tous les clients
    const clientsKey = `clients_${userId}`;
    const storedClients = localStorage.getItem(clientsKey);
    
    if (!storedClients) return false;
    
    const clients = JSON.parse(storedClients);
    
    for (const client of clients) {
      const tasksKey = `client_tasks_${userId}_${client.id}`;
      const storedTasks = localStorage.getItem(tasksKey);
      
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
        
        if (taskIndex !== -1) {
          // Mettre à jour la tâche
          tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
          localStorage.setItem(tasksKey, JSON.stringify(tasks));
          console.log('✅ Tâche mise à jour avec succès');
          return true;
        }
      }
    }
    
    console.warn('⚠️ Tâche non trouvée');
    return false;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la tâche:', error);
    return false;
  }
}

/**
 * Ajoute une nouvelle tâche pour un client
 */
export async function addTask(accessToken: string, clientId: string, task: Partial<Task>): Promise<Task | null> {
  try {
    // Extraire le user ID du token
    let userId = 'default-user';
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || 'default-user';
    } catch (err) {
      console.warn('⚠️ Impossible d\'extraire le user ID du token');
    }
    
    const tasksKey = `client_tasks_${userId}_${clientId}`;
    const storedTasks = localStorage.getItem(tasksKey);
    const tasks = storedTasks ? JSON.parse(storedTasks) : [];
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      client_id: clientId,
      conseiller_id: userId,
      title: task.title || '',
      completed: false,
      createdAt: new Date().toISOString(),
      clientId: clientId,
      clientName: task.clientName || '',
      ...task,
    };
    
    tasks.push(newTask);
    localStorage.setItem(tasksKey, JSON.stringify(tasks));
    
    console.log('✅ Tâche ajoutée avec succès');
    return newTask;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la tâche:', error);
    return null;
  }
}

/**
 * Supprime une tâche
 */
export async function deleteTask(accessToken: string, taskId: string): Promise<boolean> {
  try {
    // Extraire le user ID du token
    let userId = 'default-user';
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || 'default-user';
    } catch (err) {
      console.warn('⚠️ Impossible d\'extraire le user ID du token');
    }
    
    // Trouver et supprimer la tâche
    const clientsKey = `clients_${userId}`;
    const storedClients = localStorage.getItem(clientsKey);
    
    if (!storedClients) return false;
    
    const clients = JSON.parse(storedClients);
    
    for (const client of clients) {
      const tasksKey = `client_tasks_${userId}_${client.id}`;
      const storedTasks = localStorage.getItem(tasksKey);
      
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const filteredTasks = tasks.filter((t: Task) => t.id !== taskId);
        
        if (filteredTasks.length < tasks.length) {
          localStorage.setItem(tasksKey, JSON.stringify(filteredTasks));
          console.log('✅ Tâche supprimée avec succès');
          return true;
        }
      }
    }
    
    console.warn('⚠️ Tâche non trouvée');
    return false;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la tâche:', error);
    return false;
  }
}

/**
 * Récupère les tâches avec une deadline (pour l'agenda)
 */
export async function getTasksWithDeadline(accessToken: string): Promise<Task[]> {
  const allTasks = await getAllTasks(accessToken);
  return allTasks.filter(task => task.deadline && task.deadline.trim() !== '');
}

/**
 * Récupère les tâches non complétées (pour la to-do list)
 */
export async function getIncompleteTasks(accessToken: string): Promise<Task[]> {
  const allTasks = await getAllTasks(accessToken);
  return allTasks.filter(task => !task.completed);
}