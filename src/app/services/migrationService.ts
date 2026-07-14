/**
 * ?? SERVICE DE MIGRATION
 * 
 * Transfère les clients depuis localStorage vers le backend Supabase KV
 */

import { apiBaseUrl, publicAnonKey } from '../utils/api/info';
import type { Client } from './clientService';

const API_BASE_URL = `${apiBaseUrl}/make-server-cac859af`;

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Récupère l'access token de la session courante
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const { supabase } = await import('../utils/api/client');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('? Erreur récupération token:', error);
    return null;
  }
}

/**
 * Récupère le userId de la session courante
 */
async function getUserId(): Promise<string | null> {
  try {
    const { supabase } = await import('../utils/api/client');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('? Erreur récupération userId:', error);
    return null;
  }
}

/**
 * Migre tous les clients de localStorage vers le backend KV
 */
export async function migrateLocalStorageToBackend(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    const userId = await getUserId();
    const token = await getAccessToken();

    if (!userId || !token) {
      result.errors.push('Utilisateur non authentifié');
      return result;
    }

    console.log('?? Début de la migration localStorage ? Backend KV...');

    // Récupérer les clients depuis localStorage
    const legacyKey = `clients_${userId}`;
    const stored = localStorage.getItem(legacyKey);

    if (!stored) {
      console.log('?? Aucun client trouvé dans localStorage');
      result.success = true;
      return result;
    }

    let localClients: Client[] = [];
    try {
      localClients = JSON.parse(stored);
    } catch (error) {
      result.errors.push('Erreur parsing localStorage');
      return result;
    }

    console.log(`?? ${localClients.length} clients trouvés dans localStorage`);

    // Migrer chaque client
    for (const client of localClients) {
      try {
        console.log(`?? Migration du client ${client.id}...`);

        const response = await fetch(`${API_BASE_URL}/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            nom: client.nom,
            prenom: client.prenom,
            email: client.email,
            telephone: client.telephone,
            statut: client.statut,
            patrimoine: client.patrimoine,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`? Erreur migration client ${client.id}:`, errorText);
          result.failedCount++;
          result.errors.push(`Client ${client.prenom} ${client.nom}: ${errorText}`);
        } else {
          console.log(`? Client ${client.id} migré avec succès`);
          result.migratedCount++;
        }
      } catch (error) {
        console.error(`? Erreur lors de la migration du client ${client.id}:`, error);
        result.failedCount++;
        result.errors.push(`Client ${client.prenom} ${client.nom}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    console.log(`? Migration terminée: ${result.migratedCount} succès, ${result.failedCount} échecs`);
    result.success = result.migratedCount > 0 || (result.migratedCount === 0 && result.failedCount === 0);

    // Si tout est migré avec succès, on peut nettoyer localStorage
    if (result.failedCount === 0 && result.migratedCount > 0) {
      console.log('??? Nettoyage optionnel de localStorage (conservé pour sécurité)');
      // localStorage.removeItem(legacyKey); // Décommenter pour nettoyer
    }

    return result;
  } catch (error) {
    console.error('? Erreur globale de migration:', error);
    result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    return result;
  }
}

/**
 * Vérifie si une migration est nécessaire
 */
export async function needsMigration(): Promise<boolean> {
  try {
    const userId = await getUserId();
    if (!userId) return false;

    const legacyKey = `clients_${userId}`;
    const stored = localStorage.getItem(legacyKey);
    
    if (!stored) return false;

    const localClients: Client[] = JSON.parse(stored);
    return localClients.length > 0;
  } catch (error) {
    console.error('? Erreur vérification migration:', error);
    return false;
  }
}
