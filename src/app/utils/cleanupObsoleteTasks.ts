/**
 * Utilitaire pour nettoyer les tâches obsolètes de tous les clients
 * À exécuter une seule fois pour supprimer les anciennes tâches
 */

export const cleanupObsoleteTasks = async (): Promise<void> => {
  
  const obsoleteTasks = [
    "Envoyer le DER (Document d'Entrée en Relation)",
  ];
  
  // Récupérer l'ID utilisateur
  const userId = localStorage.getItem('user_id') || 'default';
  
  // Récupérer tous les clients
  const clientsKey = `clients_${userId}`;
  const storedClients = localStorage.getItem(clientsKey);
  
  if (!storedClients) {
    return;
  }
  
  const clients = JSON.parse(storedClients);
  let totalDeleted = 0;
  
  // Pour chaque client, nettoyer ses tâches
  for (const client of clients) {
    const tasksKey = `client_tasks_${userId}_${client.id}`;
    const storedTasks = localStorage.getItem(tasksKey);
    
    if (!storedTasks) {
      continue;
    }
    
    const tasks = JSON.parse(storedTasks);
    const originalLength = tasks.length;
    
    // Filtrer les tâches obsolètes
    const filteredTasks = tasks.filter((task: any) => {
      const isObsolete = obsoleteTasks.includes(task.title);
      if (isObsolete) {
      }
      return !isObsolete;
    });
    
    const deletedCount = originalLength - filteredTasks.length;
    
    if (deletedCount > 0) {
      // Sauvegarder les tâches nettoyées
      localStorage.setItem(tasksKey, JSON.stringify(filteredTasks));
      totalDeleted += deletedCount;
    }
  }
  
  
  if (totalDeleted > 0) {
  }
};
