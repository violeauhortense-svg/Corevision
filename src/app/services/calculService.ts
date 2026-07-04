/**
 * 🧮 CALCUL SERVICE - Interface pour les calculs patrimoniaux côté serveur
 * 
 * Architecture :
 * - TOUS les calculs sont effectués côté serveur
 * - Le frontend ne fait QUE de l'affichage
 * - Cache intelligent pour éviter les recalculs
 */

import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

// ============================================
// TYPES (synchronisés avec le serveur)
// ============================================

export interface ActifFinancier {
  id: string;
  type: string;
  nom: string;
  value: number;
  rendement?: number;
}

export interface ActifImmobilier {
  id: string;
  type: string;
  adresse: string;
  value: number;
  revenus?: number;
}

export interface Passif {
  id: string;
  type: string;
  nom: string;
  value: number;
  capitalInitial?: number;
  tauxAnnuel?: number;
  nombreEcheances?: number;
  dateDebut?: string;
  mensualite?: number;
}

export interface Revenu {
  id: string;
  type: string;
  montantAnnuel: number;
}

export interface ImpositionData {
  impotRevenu: number;
  ifi: number;
  tmi: string | number;
}

export interface CalculsPatrimoniauxInput {
  actifsFinanciers: ActifFinancier[];
  actifsImmobiliers: ActifImmobilier[];
  passifs: Passif[];
  revenus: Revenu[];
  imposition: ImpositionData;
}

export interface CalculsPatrimoniauxResult {
  patrimoineNet: number;
  patrimoineTotal: number;
  totalActifsFinanciers: number;
  totalImmobilier: number;
  totalPassifs: number;
  totalRevenus: number;
  chargesAnnuelles: number;
  tauxEndettement: number;
  partImmobilier: number;
  partFinancier: number;
  liquidite: number;
  impotTotal: number;
  pressionFiscale: number;
  rendementGlobal: number;
  profils: {
    fiscal: string;
    patrimonial: string;
    risque: string;
  };
  scores: {
    diversification: number;
    risque: number;
    optimisationFiscale: number;
    liquidite: number;
    global: number;
  };
  indicateurs: {
    tauxEndettement: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
    diversification: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
    pressionFiscale: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
    liquidite: {
      value: number;
      status: 'bon' | 'moyen' | 'alerte';
      message: string;
    };
  };
}

export interface SimulationInput {
  patrimoineInitial: number;
  revenusAnnuels: number;
  chargesAnnuelles: number;
  tauxEpargne: number;
  tauxRendement: number;
  dureeAnnees: number;
}

export interface SimulationResult {
  annees: number[];
  patrimoine: number[];
  revenusPassifs: number[];
  totalEpargne: number;
  patrimoneFinal: number;
}

export interface Probleme {
  id: string;
  categorie: 'fiscal' | 'risque' | 'liquidite' | 'diversification' | 'endettement';
  gravite: 'haute' | 'moyenne' | 'faible';
  titre: string;
  description: string;
  recommandations: string[];
}

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = `${apiBaseUrl}/make-server-cac859af`;
const CACHE_TTL = 30 * 1000; // 30 secondes (calculs rapides)

// ============================================
// CACHE SIMPLE
// ============================================

interface CachedCalcul {
  data: any;
  timestamp: number;
}

const calculCache = new Map<string, CachedCalcul>();

function getCacheKey(type: string, input: any): string {
  return `${type}:${JSON.stringify(input)}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = calculCache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    calculCache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCache(key: string, data: any): void {
  calculCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// ============================================
// CALCUL SERVICE
// ============================================

class CalculServiceClass {
  /**
   * Appelle l'API de calcul avec gestion d'erreurs
   */
  private async fetchAPI<T>(
    endpoint: string,
    body: any
  ): Promise<{ data: T | null; error: string | null }> {
    const startTime = performance.now();

    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || publicAnonKey}`,
        },
        body: JSON.stringify(body),
      });

      const duration = performance.now() - startTime;
      console.log(`🧮 Calcul ${endpoint}: ${response.status} (${Math.round(duration)}ms)`);

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Erreur de calcul' };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('❌ Erreur API calcul:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      const { supabase } = await import('../utils/supabase/client');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Calcule tous les indicateurs patrimoniaux
   */
  async calculerPatrimoine(
    input: CalculsPatrimoniauxInput,
    useCache = true
  ): Promise<{
    calculs: CalculsPatrimoniauxResult | null;
    error: string | null;
    fromCache: boolean;
  }> {
    const cacheKey = getCacheKey('patrimoine', input);

    // Vérifier le cache
    if (useCache) {
      const cached = getFromCache<CalculsPatrimoniauxResult>(cacheKey);
      if (cached) {
        console.log('💾 Calculs patrimoine depuis cache');
        return { calculs: cached, error: null, fromCache: true };
      }
    }

    // Appeler l'API
    const { data, error } = await this.fetchAPI<{ calculs: CalculsPatrimoniauxResult }>(
      '/calculate/patrimoine',
      input
    );

    if (error || !data) {
      return { calculs: null, error: error || 'Erreur de calcul', fromCache: false };
    }

    // Mettre en cache
    setCache(cacheKey, data.calculs);

    return { calculs: data.calculs, error: null, fromCache: false };
  }

  /**
   * Simule l'évolution du patrimoine
   */
  async simulerPatrimoine(
    input: SimulationInput,
    useCache = true
  ): Promise<{
    simulation: SimulationResult | null;
    error: string | null;
    fromCache: boolean;
  }> {
    const cacheKey = getCacheKey('simulation', input);

    if (useCache) {
      const cached = getFromCache<SimulationResult>(cacheKey);
      if (cached) {
        console.log('💾 Simulation depuis cache');
        return { simulation: cached, error: null, fromCache: true };
      }
    }

    const { data, error } = await this.fetchAPI<{ simulation: SimulationResult }>(
      '/calculate/simulation',
      input
    );

    if (error || !data) {
      return { simulation: null, error: error || 'Erreur de simulation', fromCache: false };
    }

    setCache(cacheKey, data.simulation);

    return { simulation: data.simulation, error: null, fromCache: false };
  }

  /**
   * Détecte les problèmes patrimoniaux
   */
  async detecterProblemes(
    input: CalculsPatrimoniauxInput
  ): Promise<{
    problemes: Probleme[];
    calculs: CalculsPatrimoniauxResult | null;
    error: string | null;
  }> {
    const { data, error } = await this.fetchAPI<{
      problemes: Probleme[];
      calculs: CalculsPatrimoniauxResult;
    }>('/calculate/problemes', input);

    if (error || !data) {
      return { problemes: [], calculs: null, error: error || 'Erreur de détection' };
    }

    return { problemes: data.problemes, calculs: data.calculs, error: null };
  }

  /**
   * Calcule le capital restant dû d'un emprunt
   */
  async calculerCRD(
    capitalInitial: number,
    tauxAnnuel: number,
    nombreEcheances: number,
    dateDebut: string
  ): Promise<{
    capitalRestantDu: number | null;
    error: string | null;
  }> {
    const { data, error } = await this.fetchAPI<{ capitalRestantDu: number }>(
      '/calculate/emprunt/crd',
      { capitalInitial, tauxAnnuel, nombreEcheances, dateDebut }
    );

    if (error || !data) {
      return { capitalRestantDu: null, error: error || 'Erreur de calcul CRD' };
    }

    return { capitalRestantDu: data.capitalRestantDu, error: null };
  }

  /**
   * Calcule la mensualité d'un emprunt
   */
  async calculerMensualite(
    capitalInitial: number,
    tauxAnnuel: number,
    nombreEcheances: number
  ): Promise<{
    mensualite: number | null;
    error: string | null;
  }> {
    const { data, error } = await this.fetchAPI<{ mensualite: number }>(
      '/calculate/emprunt/mensualite',
      { capitalInitial, tauxAnnuel, nombreEcheances }
    );

    if (error || !data) {
      return { mensualite: null, error: error || 'Erreur de calcul mensualité' };
    }

    return { mensualite: data.mensualite, error: null };
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    calculCache.clear();
    console.log('🗑️ Cache calculs vidé');
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const CalculService = new CalculServiceClass();
