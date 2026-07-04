/**
 * 🎯 HOOK useClients - Interface React pour ClientService
 * 
 * Fonctionnalités :
 * - Auto-loading states
 * - Auto-error handling
 * - Auto-refresh
 * - Optimistic updates
 */

import { useState, useEffect, useCallback } from 'react';
import { ClientService, Client } from '../services/ClientService';

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
  createClient: (data: Partial<Client>) => Promise<Client | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
}

/**
 * Hook pour gérer la liste de tous les clients
 */
export function useClients(autoLoad = true): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadClients = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    const result = await ClientService.getAllClients(forceRefresh);

    setClients(result.clients);
    setError(result.error);
    setFromCache(result.fromCache);
    setLoading(false);

    return result;
  }, []);

  const refresh = useCallback(async () => {
    await loadClients(true);
  }, [loadClients]);

  const createClient = useCallback(async (data: Partial<Client>) => {
    const result = await ClientService.createClient(data);
    
    if (result.error) {
      setError(result.error);
      return null;
    }

    // Optimistic update
    if (result.client) {
      setClients(prev => [...prev, result.client!]);
    }

    return result.client;
  }, []);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    const result = await ClientService.updateClient(id, data);
    
    if (result.error) {
      setError(result.error);
      return null;
    }

    // Optimistic update
    if (result.client) {
      setClients(prev => prev.map(c => c.id === id ? result.client! : c));
    }

    return result.client;
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const result = await ClientService.deleteClient(id);
    
    if (result.error) {
      setError(result.error);
      return false;
    }

    // Optimistic update
    setClients(prev => prev.filter(c => c.id !== id));

    return result.success;
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadClients();
    }
  }, [autoLoad, loadClients]);

  return {
    clients,
    loading,
    error,
    fromCache,
    refresh,
    createClient,
    updateClient,
    deleteClient,
  };
}

interface UseClientReturn {
  client: Client | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
  update: (data: Partial<Client>) => Promise<Client | null>;
}

/**
 * Hook pour gérer un client spécifique
 */
export function useClient(clientId: string | null, autoLoad = true): UseClientReturn {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const loadClient = useCallback(async (forceRefresh = false) => {
    if (!clientId) {
      setClient(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await ClientService.getClientById(clientId, forceRefresh);

    setClient(result.client);
    setError(result.error);
    setFromCache(result.fromCache);
    setLoading(false);

    return result;
  }, [clientId]);

  const refresh = useCallback(async () => {
    await loadClient(true);
  }, [loadClient]);

  const update = useCallback(async (data: Partial<Client>) => {
    if (!clientId) return null;

    const result = await ClientService.updateClient(clientId, data);
    
    if (result.error) {
      setError(result.error);
      return null;
    }

    // Optimistic update
    if (result.client) {
      setClient(result.client);
    }

    return result.client;
  }, [clientId]);

  useEffect(() => {
    if (autoLoad && clientId) {
      loadClient();
    }
  }, [autoLoad, clientId, loadClient]);

  return {
    client,
    loading,
    error,
    fromCache,
    refresh,
    update,
  };
}
