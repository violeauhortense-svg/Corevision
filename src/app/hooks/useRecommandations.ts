/**
 * 🎯 HOOK REACT - RECOMMANDATIONS INTELLIGENTES
 * 
 * Gestion des recommandations patrimoniales avec state management
 */

import { useState, useCallback } from 'react';
import * as recommandationsService from '../services/recommandationsService';
import type { RapportRecommandations } from '../services/recommandationsService';

export interface UseRecommandationsResult {
  rapport: RapportRecommandations | null;
  loading: boolean;
  error: Error | null;
  
  // Actions
  generer: (clientData: any) => Promise<void>;
  charger: () => Promise<void>;
  
  // Helpers
  getParPriorite: (priorite: 'immediate' | 'court_terme' | 'moyen_terme' | 'long_terme') => any[];
  getParCategorie: (categorie: string) => any[];
}

/**
 * Hook pour gérer les recommandations d'un client
 */
export function useRecommandations(clientId: string): UseRecommandationsResult {
  const [rapport, setRapport] = useState<RapportRecommandations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Génère les recommandations pour le client
   */
  const generer = useCallback(async (clientData: any) => {
    if (!clientId) {
      setError(new Error('Client ID manquant'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      
      const result = await recommandationsService.genererRecommandations(clientId, clientData);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la génération');
      }

      setRapport(result.rapport || null);
    } catch (err: any) {
      console.error('❌ [useRecommandations] Erreur:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Charge le rapport existant pour le client
   */
  const charger = useCallback(async () => {
    if (!clientId) {
      setError(new Error('Client ID manquant'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      
      const result = await recommandationsService.getRecommandations(clientId);
      
      if (!result.success) {
        // Si pas de rapport existant, ce n'est pas une erreur
        if (result.error?.includes('Aucun rapport')) {
          setRapport(null);
          return;
        }
        
        throw new Error(result.error || 'Erreur lors du chargement');
      }

      setRapport(result.rapport || null);
    } catch (err: any) {
      console.error('❌ [useRecommandations] Erreur:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Filtre les recommandations par priorité
   */
  const getParPriorite = useCallback((
    priorite: 'immediate' | 'court_terme' | 'moyen_terme' | 'long_terme'
  ) => {
    if (!rapport) return [];
    return rapport.recommandations.filter(r => r.priorite === priorite);
  }, [rapport]);

  /**
   * Filtre les recommandations par catégorie
   */
  const getParCategorie = useCallback((categorie: string) => {
    if (!rapport) return [];
    return rapport.recommandations.filter(r => r.categorie === categorie);
  }, [rapport]);

  return {
    rapport,
    loading,
    error,
    generer,
    charger,
    getParPriorite,
    getParCategorie,
  };
}
