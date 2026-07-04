/**
 * 🧮 HOOK useCalculs - Interface React pour les calculs patrimoniaux
 * 
 * Utilisation :
 * const { calculs, loading, error, refresh } = useCalculs(patrimoineData);
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CalculService,
  CalculsPatrimoniauxInput,
  CalculsPatrimoniauxResult,
  SimulationInput,
  SimulationResult,
  Probleme,
} from '../services/calculService';

interface UseCalculsPatrimoineReturn {
  calculs: CalculsPatrimoniauxResult | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook pour calculer automatiquement les indicateurs patrimoniaux
 */
export function useCalculsPatrimoine(
  input: CalculsPatrimoniauxInput | null,
  autoCalculate = true
): UseCalculsPatrimoineReturn {
  const [calculs, setCalculs] = useState<CalculsPatrimoniauxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const calculate = useCallback(
    async (forceRefresh = false) => {
      if (!input) {
        setCalculs(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await CalculService.calculerPatrimoine(input, !forceRefresh);

      setCalculs(result.calculs);
      setError(result.error);
      setFromCache(result.fromCache);
      setLoading(false);
    },
    [input]
  );

  const refresh = useCallback(async () => {
    await calculate(true);
  }, [calculate]);

  useEffect(() => {
    if (autoCalculate && input) {
      calculate();
    }
  }, [autoCalculate, input, calculate]);

  return {
    calculs,
    loading,
    error,
    fromCache,
    refresh,
  };
}

interface UseSimulationReturn {
  simulation: SimulationResult | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  simulate: (params: SimulationInput) => Promise<void>;
}

/**
 * Hook pour les simulations patrimoniales
 */
export function useSimulation(): UseSimulationReturn {
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const simulate = useCallback(async (params: SimulationInput) => {
    setLoading(true);
    setError(null);

    const result = await CalculService.simulerPatrimoine(params);

    setSimulation(result.simulation);
    setError(result.error);
    setFromCache(result.fromCache);
    setLoading(false);
  }, []);

  return {
    simulation,
    loading,
    error,
    fromCache,
    simulate,
  };
}

interface UseDetectionProblemesReturn {
  problemes: Probleme[];
  calculs: CalculsPatrimoniauxResult | null;
  loading: boolean;
  error: string | null;
  detecter: (input: CalculsPatrimoniauxInput) => Promise<void>;
}

/**
 * Hook pour détecter les problèmes patrimoniaux
 */
export function useDetectionProblemes(): UseDetectionProblemesReturn {
  const [problemes, setProblemes] = useState<Probleme[]>([]);
  const [calculs, setCalculs] = useState<CalculsPatrimoniauxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detecter = useCallback(async (input: CalculsPatrimoniauxInput) => {
    setLoading(true);
    setError(null);

    const result = await CalculService.detecterProblemes(input);

    setProblemes(result.problemes);
    setCalculs(result.calculs);
    setError(result.error);
    setLoading(false);
  }, []);

  return {
    problemes,
    calculs,
    loading,
    error,
    detecter,
  };
}
