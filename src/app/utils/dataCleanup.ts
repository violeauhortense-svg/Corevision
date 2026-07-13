/**
 * Utilitaire pour nettoyer toutes les données de l'application
 * Peut être appelé depuis le code ou depuis la console du navigateur
 */

/**
 * 🗑️ NETTOYAGE COMPLET DES DONNÉES DE TEST
 * Supprime toutes les données clients et conserve uniquement le profil utilisateur
 */
export function clearAllTestData(): void {
  console.log('🗑️ NETTOYAGE COMPLET DES DONNÉES DE TEST...');
  
  try {
    const keysToRemove: string[] = [];
    const keysToKeep: string[] = [];
    
    // Lister toutes les clés du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // 🔑 Conserver uniquement les clés essentielles
        if (
          key === 'user_profile' ||
          key === 'user_id' ||
          key.includes('auth') ||
          key.includes('supabase') ||
          key.includes('cleanup') ||
          key.includes('obsolete')
        ) {
          keysToKeep.push(key);
        } 
        // 🗑️ Supprimer toutes les données clients et de test
        else if (
          key.startsWith('clients_') ||
          key.startsWith('client_tasks_') ||
          key.startsWith('documents_') ||
          key.startsWith('family_info_') ||
          key.startsWith('patrimoine_') ||
          key.startsWith('todos_') ||
          key.startsWith('meetings_') ||
          key.startsWith('emails_') ||
          key.startsWith('signatures_') ||
          key.startsWith('audits_') ||
          key.startsWith('recommendations_') ||
          key.startsWith('corevision_') ||
          key.startsWith('objectives_') ||
          key.startsWith('roadmap_') ||
          key.startsWith('events_') ||
          key.startsWith('rdv_') ||
          key.startsWith('history_') ||
          key.startsWith('gel_avoirs_') ||
          key.startsWith('dernier_audit_') ||
          key.startsWith('progression_') ||
          key.startsWith('workflow_') ||
          key.includes('_state') ||
          key.includes('_data') ||
          key.includes('_cache')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Supprimer toutes les clés identifiées
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Supprimé: ${key}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${keysToRemove.length} clés de données de test supprimées`);
    console.log(`🔑 ${keysToKeep.length} clés essentielles conservées`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 CRM prêt pour de vraies données clients !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

/**
 * Nettoyer toutes les données de l'application
 */
export function clearAllApplicationData(userId?: string): void {
  console.log('🧹 Nettoyage de toutes les données...');
  
  try {
    // Si aucun userId n'est fourni, nettoyer toutes les clés liées à l'app
    if (!userId) {
      // Nettoyer toutes les clés qui correspondent au pattern de l'app
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('clients_') ||
          key.startsWith('client_tasks_') ||
          key.startsWith('documents_') ||
          key.startsWith('family_info_') ||
          key.startsWith('patrimoine_') ||
          key.startsWith('todos_') ||
          key.startsWith('meetings_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Supprimé: ${key}`);
      });
      
      console.log(`✅ ${keysToRemove.length} clés supprimées`);
    } else {
      // Nettoyer uniquement pour l'utilisateur spécifié
      const keys = [
        `clients_${userId}`,
        `client_tasks_${userId}`,
        `documents_${userId}`,
        `family_info_${userId}`,
        `patrimoine_${userId}`,
        `todos_${userId}`,
        `meetings_${userId}`,
      ];
      
      keys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Supprimé: ${key}`);
      });
      
      console.log(`✅ Toutes les données de l'utilisateur ${userId} ont été supprimées`);
    }
    
    console.log('✅ Nettoyage terminé avec succès !');
    return;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

/**
 * Nettoyer uniquement les clients
 */
export function clearClients(userId: string): void {
  localStorage.removeItem(`clients_${userId}`);
  console.log('✅ Clients supprimés');
}

/**
 * Nettoyer uniquement les tâches
 */
export function clearTasks(userId: string): void {
  localStorage.removeItem(`client_tasks_${userId}`);
  console.log('✅ Tâches supprimées');
}

/**
 * Obtenir un résumé des données stockées
 */
export function getDataSummary(userId?: string): void {
  console.log('📊 Résumé des données stockées:');
  console.log('================================');
  
  if (userId) {
    // Résumé pour un utilisateur spécifique
    const clientsKey = `clients_${userId}`;
    const tasksKey = `client_tasks_${userId}`;
    
    const clients = localStorage.getItem(clientsKey);
    const tasks = localStorage.getItem(tasksKey);
    
    console.log(`Clients (${clientsKey}):`, clients ? JSON.parse(clients).length : 0);
    console.log(`Tâches (${tasksKey}):`, tasks ? JSON.parse(tasks).length : 0);
  } else {
    // Résumé complet
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    
    const appKeys = allKeys.filter(key => 
      key.startsWith('clients_') ||
      key.startsWith('client_tasks_') ||
      key.startsWith('documents_')
    );
    
    console.log(`Total de clés: ${localStorage.length}`);
    console.log(`Clés de l'application: ${appKeys.length}`);
    console.log('Détail:');
    appKeys.forEach(key => {
      const data = localStorage.getItem(key);
      const count = data ? JSON.parse(data).length : 0;
      console.log(`  - ${key}: ${count} éléments`);
    });
  }
  
  console.log('================================');
}

// Exposer les fonctions dans window pour un accès facile depuis la console
if (typeof window !== 'undefined') {
  (window as any).clearAllData = clearAllApplicationData;
  (window as any).clearAllTestData = clearAllTestData;
  (window as any).getDataSummary = getDataSummary;
  (window as any).clearClients = clearClients;
  (window as any).clearTasks = clearTasks;
}
