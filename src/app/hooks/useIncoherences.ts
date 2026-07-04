/**
 * 🔍 HOOK useIncoherences - Interface React pour la gestion des incohérences
 * 
 * Utilisation :
 * const { rapport, loading, error, detecter, valider, ignorer, corriger } = useIncoherences(clientId);
 */

import { useState, useCallback, useEffect } from 'react';
import {
  IncoherencesService,
  RapportIncoherences,
} from '../services/incoherencesService';

interface UseIncoherencesReturn {
  rapport: RapportIncoherences | null;
  loading: boolean;
  error: string | null;
  detecter: (clientData?: any) => Promise<void>;
  valider: (incoherenceId: string, utilisateur: string, commentaire?: string) => Promise<void>;
  ignorer: (incoherenceId: string, utilisateur: string, raison: string) => Promise<void>;
  corriger: (incoherenceId: string, utilisateur: string, commentaire?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook pour gérer les incohérences d'un client
 */
export function useIncoherences(
  clientId: string | null,
  autoDetect = false
): UseIncoherencesReturn {
  const [rapport, setRapport] = useState<RapportIncoherences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Détecte les incohérences
   */
  const detecter = useCallback(
    async (clientData?: any) => {
      if (!clientId) {
        setError('Client ID manquant');
        return;
      }

      setLoading(true);
      setError(null);

      const result = await IncoherencesService.detecter(clientId, clientData);

      if (result.error) {
        setError(result.error);
        setRapport(null);
      } else {
        setRapport(result.rapport);
      }

      setLoading(false);
    },
    [clientId]
  );

  /**
   * Récupère le rapport existant
   */
  const refresh = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    const result = await IncoherencesService.getRapport(clientId);

    if (result.error) {
      // Pas de rapport = pas d'erreur critique
      setRapport(null);
    } else {
      setRapport(result.rapport);
    }

    setLoading(false);
  }, [clientId]);

  /**
   * Valide une incohérence
   */
  const valider = useCallback(
    async (incoherenceId: string, utilisateur: string, commentaire?: string) => {
      if (!clientId) return;

      setLoading(true);
      setError(null);

      const result = await IncoherencesService.valider(
        clientId,
        incoherenceId,
        utilisateur,
        commentaire
      );

      if (result.error) {
        setError(result.error);
      } else {
        setRapport(result.rapport);
      }

      setLoading(false);
    },
    [clientId]
  );

  /**
   * Ignore une incohérence
   */
  const ignorer = useCallback(
    async (incoherenceId: string, utilisateur: string, raison: string) => {
      if (!clientId) return;

      setLoading(true);
      setError(null);

      const result = await IncoherencesService.ignorer(
        clientId,
        incoherenceId,
        utilisateur,
        raison
      );

      if (result.error) {
        setError(result.error);
      } else {
        setRapport(result.rapport);
      }

      setLoading(false);
    },
    [clientId]
  );

  /**
   * Marque une incohérence comme corrigée
   */
  const corriger = useCallback(
    async (incoherenceId: string, utilisateur: string, commentaire?: string) => {
      if (!clientId) return;

      setLoading(true);
      setError(null);

      const result = await IncoherencesService.marquerCorrigee(
        clientId,
        incoherenceId,
        utilisateur,
        commentaire
      );

      if (result.error) {
        setError(result.error);
      } else {
        setRapport(result.rapport);
      }

      setLoading(false);
    },
    [clientId]
  );

  // Auto-detect au chargement
  useEffect(() => {
    if (autoDetect && clientId) {
      refresh();
    }
  }, [autoDetect, clientId, refresh]);

  return {
    rapport,
    loading,
    error,
    detecter,
    valider,
    ignorer,
    corriger,
    refresh,
  };
}
