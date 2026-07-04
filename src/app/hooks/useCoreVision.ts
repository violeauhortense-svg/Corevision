/**
 * 🎯 HOOK useCoreVision - Interface React pour CoreVisionService
 */

import { useState, useEffect, useCallback } from 'react';
import { CoreVisionService, CoreVisionOrder } from '../services/corevisionService';

interface UseCoreVisionReturn {
  orders: CoreVisionOrder[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
  updateOrder: (id: string, data: Partial<CoreVisionOrder>) => Promise<CoreVisionOrder | null>;
  deleteOrder: (id: string) => Promise<boolean>;
}

/**
 * Hook pour gérer les commandes CoreVision
 */
export function useCoreVision(autoLoad = true): UseCoreVisionReturn {
  const [orders, setOrders] = useState<CoreVisionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadOrders = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    const result = await CoreVisionService.getAllOrders(forceRefresh);

    setOrders(result.orders);
    setError(result.error);
    setFromCache(result.fromCache);
    setLoading(false);

    return result;
  }, []);

  const refresh = useCallback(async () => {
    await loadOrders(true);
  }, [loadOrders]);

  const updateOrder = useCallback(async (id: string, data: Partial<CoreVisionOrder>) => {
    const result = await CoreVisionService.updateOrder(id, data);
    
    if (result.error) {
      setError(result.error);
      return null;
    }

    // Optimistic update
    if (result.order) {
      setOrders(prev => prev.map(o => o.orderId === id ? result.order! : o));
    }

    return result.order;
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    const result = await CoreVisionService.deleteOrder(id);
    
    if (result.error) {
      setError(result.error);
      return false;
    }

    // Optimistic update
    setOrders(prev => prev.filter(o => o.orderId !== id));

    return result.success;
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadOrders();
    }
  }, [autoLoad, loadOrders]);

  return {
    orders,
    loading,
    error,
    fromCache,
    refresh,
    updateOrder,
    deleteOrder,
  };
}
