/**
 * ?? COREVISION SERVICE - Gestion des commandes d'audit
 * 
 * Architecture similaire à ClientService pour cohérence
 */

import { apiBaseUrl, publicAnonKey } from '../utils/api/info';

// ============================================
// TYPES
// ============================================

export interface CoreVisionOrder {
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
  audit?: string;
  preconisations?: string;
  presentation?: string;
}

interface CacheMetadata {
  timestamp: number;
  version: string;
}

interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

// ============================================
// CONFIGURATION
// ============================================

const CACHE_VERSION = '1.0.0';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes (plus court car données admin)
const API_BASE_URL = `${apiBaseUrl}/make-server-cac859af`;

// ============================================
// CACHE MANAGER
// ============================================

class CacheManager {
  private prefix = 'corevision_service';

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.getKey(key));
      if (!cached) return null;

      const parsed: CachedData<T> = JSON.parse(cached);

      if (parsed.metadata.version !== CACHE_VERSION) {
        this.remove(key);
        return null;
      }

      const age = Date.now() - parsed.metadata.timestamp;
      if (age > CACHE_TTL) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  set<T>(key: string, data: T): void {
    try {
      const cached: CachedData<T> = {
        data,
        metadata: {
          timestamp: Date.now(),
          version: CACHE_VERSION,
        },
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(cached));
    } catch (error) {
      console.error('? Erreur écriture cache:', error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

// ============================================
// COREVISION SERVICE
// ============================================

class CoreVisionServiceClass {
  private cache: CacheManager;
  private pendingRequests: Map<string, Promise<any>>;

  constructor() {
    this.cache = new CacheManager();
    this.pendingRequests = new Map();
  }

  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers,
        },
      });

      const duration = performance.now() - startTime;
      console.log(`?? API ${options.method || 'GET'} ${endpoint}: ${response.status} (${Math.round(duration)}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          data: null, 
          error: `Erreur ${response.status}: ${errorText}` 
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('? Erreur API:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  /**
   * Récupère toutes les commandes CoreVision
   */
  async getAllOrders(forceRefresh = false): Promise<{
    orders: CoreVisionOrder[];
    error: string | null;
    fromCache: boolean;
  }> {
    console.log('?? CoreVisionService.getAllOrders - forceRefresh:', forceRefresh);
    const cacheKey = 'all_orders';

    if (!forceRefresh) {
      const cached = this.cache.get<CoreVisionOrder[]>(cacheKey);
      if (cached) {
        console.log('? Chargement depuis le cache:', cached.length, 'commandes');
        return { orders: cached, error: null, fromCache: true };
      }
    }

    const requestKey = cacheKey;
    if (this.pendingRequests.has(requestKey)) {
      console.log('? Requête déjà en cours, attente...');
      return this.pendingRequests.get(requestKey)!;
    }

    const promise = (async () => {
      console.log('?? Appel API: /corevision/orders');
      const { data, error } = await this.fetchAPI<{ orders: CoreVisionOrder[]; count: number }>('/corevision/orders');

      console.log('?? Réponse API:', { data, error });

      if (error || !data) {
        // Fallback vers localStorage si API échoue
        const localKey = 'corevision_local_orders';
        const local = localStorage.getItem(localKey);
        if (local) {
          const localOrders = JSON.parse(local);
          console.log('?? Fallback localStorage:', localOrders.length, 'commandes');
          return { orders: localOrders, error: null, fromCache: true };
        }
        console.error('? Aucune commande trouvée (ni API ni localStorage)');
        return { orders: [], error: error || 'Erreur inconnue', fromCache: false };
      }

      console.log('? Commandes récupérées depuis l\'API:', data.orders.length);
      this.cache.set(cacheKey, data.orders);

      return { orders: data.orders, error: null, fromCache: false };
    })();

    this.pendingRequests.set(requestKey, promise);
    
    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Met à jour une commande
   */
  async updateOrder(
    orderId: string, 
    updates: Partial<CoreVisionOrder>
  ): Promise<{
    order: CoreVisionOrder | null;
    error: string | null;
  }> {
    const { data, error } = await this.fetchAPI<{ order: CoreVisionOrder }>(
      `/corevision/orders/${orderId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );

    if (error || !data) {
      return { order: null, error: error || 'Erreur mise à jour' };
    }

    // Invalider le cache
    this.cache.remove('all_orders');

    return { order: data.order, error: null };
  }

  /**
   * Supprime une commande
   */
  async deleteOrder(orderId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    const { error } = await this.fetchAPI(`/corevision/orders/${orderId}`, {
      method: 'DELETE',
    });

    if (error) {
      return { success: false, error };
    }

    // Invalider le cache
    this.cache.remove('all_orders');

    return { success: true, error: null };
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const CoreVisionService = new CoreVisionServiceClass();
