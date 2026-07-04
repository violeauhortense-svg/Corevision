/**
 * 🎣 HOOK REACT - BARÈMES FISCAUX
 * 
 * Charge et cache les barèmes fiscaux depuis Supabase
 * Utilisé pour tous les calculs fiscaux de l'application
 */

import { useState, useEffect } from 'react';
import { loadBaremes, BaremesFiscaux, invalidateCache } from '../services/fiscalCalculatorDynamic';

export function useBaremesFiscaux(annee: string = '2026') {
  const [baremes, setBaremes] = useState<BaremesFiscaux | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rechargerBaremes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Invalider le cache pour forcer le rechargement
      invalidateCache();
      
      const data = await loadBaremes(annee);
      setBaremes(data);
    } catch (err) {
      console.error('❌ Erreur chargement barèmes:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const chargerBaremes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await loadBaremes(annee);
        if (mounted) {
          setBaremes(data);
        }
      } catch (err) {
        console.error('❌ Erreur chargement barèmes:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    chargerBaremes();

    return () => {
      mounted = false;
    };
  }, [annee]);

  return {
    baremes,
    loading,
    error,
    rechargerBaremes,
  };
}
