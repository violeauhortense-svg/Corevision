/**
 * API pour gérer les commandes CoreVision
 * Source unique : serveur. Pas de fallback localStorage.
 */

import { apiBaseUrl } from '../utils/api/info';
import { supabase } from '../utils/api/client';

interface CoreVisionOrder {
  orderId: string;
  clientId: string;
  clientName: string;
  cgpName: string;
  cgpEmail: string;
  objectifs: any[];
  validatedAt: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

const BASE = `${apiBaseUrl}/make-server-cac859af`;

export const corevisionAPI = {
  /**
   * Récupère toutes les commandes CoreVision depuis le serveur
   */
  getAll: async (): Promise<CoreVisionOrder[]> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${BASE}/corevision/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('❌ Erreur chargement commandes CoreVision:', response.status);
        return [];
      }

      const data = await response.json();
      const orders = data.orders ?? [];
      console.log(`📡 ${orders.length} commande(s) chargée(s) depuis le serveur`);
      return orders;
    } catch (error) {
      console.error('❌ Erreur chargement commandes CoreVision:', error);
      return [];
    }
  },

  /**
   * Récupère le nombre de commandes en attente (pending + in_progress)
   */
  getPendingCount: async (): Promise<number> => {
    try {
      const orders = await corevisionAPI.getAll();
      const pending = orders.filter(o => o.status === 'pending' || o.status === 'in_progress');
      console.log('🔍 DEBUG getPendingCount - Total commandes:', orders.length);
      console.log('🔍 DEBUG getPendingCount - Commandes pending/in_progress:', pending.length);
      console.log('🔍 DEBUG getPendingCount - Statuts:', orders.map(o => o.status));
      return pending.length;
    } catch (error) {
      console.error('❌ Erreur comptage commandes en attente:', error);
      return 0;
    }
  },

  /**
   * Récupère les commandes par statut
   */
  getByStatus: async (status: 'pending' | 'in_progress' | 'completed'): Promise<CoreVisionOrder[]> => {
    try {
      const orders = await corevisionAPI.getAll();
      return orders.filter(o => o.status === status);
    } catch (error) {
      console.error('❌ Erreur récupération commandes par statut:', error);
      return [];
    }
  },
};
