/**
 * ?? SERVICE FRONTEND - RECOMMANDATIONS INTELLIGENTES
 * 
 * Gestion des recommandations patrimoniales automatiques
 */

import { apiBaseUrl, publicAnonKey } from '../utils/api/info';

// ============================================
// TYPES
// ============================================

export interface Recommandation {
  id: string;
  categorie: CategorieRecommandation;
  titre: string;
  description: string;
  
  // Pertinence
  scorePertinence: number; // 0-10
  priorite: 'immediate' | 'court_terme' | 'moyen_terme' | 'long_terme';
  
  // Conditions d'application
  conditionsRequises: string[];
  conditionsRemplies: boolean;
  
  // Avantages/Risques
  avantages: string[];
  risques: string[];
  inconvenients: string[];
  
  // Impact financier
  simulation?: SimulationFinanciere;
  
  // Métadonnées
  strategieId: string;
  dateGeneration: string;
}

export type CategorieRecommandation =
  | 'fiscalite'
  | 'patrimoine'
  | 'retraite'
  | 'transmission'
  | 'protection'
  | 'investissement'
  | 'optimisation';

export interface SimulationFinanciere {
  gainFiscalAnnuel: number;
  gainFiscal10ans: number;
  gainFiscal20ans: number;
  gainFiscal30ans: number;
  
  coutMiseEnPlace: number;
  rentabiliteAnnuelle?: number;
  
  patrimoineActuel: number;
  patrimoine10ans: number;
  patrimoine20ans: number;
  patrimoine30ans: number;
  
  hypotheses: string[];
}

export interface RapportRecommandations {
  clientId: string;
  dateGeneration: string;
  
  // Statistiques
  totalRecommandations: number;
  recommandationsImmédiates: number;
  recommandationsCourtTerme: number;
  recommandationsMoyenTerme: number;
  recommandationsLongTerme: number;
  
  // Score global d'optimisation possible
  scoreOptimisation: number; // 0-100
  gainFiscalPotentielAnnuel: number;
  
  // Liste
  recommandations: Recommandation[];
}

// ============================================
// API
// ============================================

const BASE_URL = `${apiBaseUrl}/recommandations`;

/**
 * Génère les recommandations pour un client
 */
export async function genererRecommandations(
  clientId: string,
  clientData: any
): Promise<{ success: boolean; rapport?: RapportRecommandations; error?: string }> {
  try {
    console.log(`?? Génération recommandations pour client ${clientId}...`);
    
    const response = await fetch(`${BASE_URL}/generer/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ clientData }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('? Erreur API:', data);
      return {
        success: false,
        error: data.error || 'Erreur lors de la génération',
      };
    }

    console.log(`? ${data.rapport.totalRecommandations} recommandation(s) générée(s)`);
    
    return {
      success: true,
      rapport: data.rapport,
    };
  } catch (error: any) {
    console.error('? Erreur génération recommandations:', error);
    return {
      success: false,
      error: error.message || 'Erreur réseau',
    };
  }
}

/**
 * Récupère le rapport de recommandations pour un client
 */
export async function getRecommandations(
  clientId: string
): Promise<{ success: boolean; rapport?: RapportRecommandations; error?: string }> {
  try {
    console.log(`?? Récupération recommandations pour client ${clientId}...`);
    
    const response = await fetch(`${BASE_URL}/${clientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('? Erreur API:', data);
      return {
        success: false,
        error: data.error || 'Erreur lors de la récupération',
      };
    }

    console.log(`? Rapport chargé: ${data.rapport.totalRecommandations} recommandation(s)`);
    
    return {
      success: true,
      rapport: data.rapport,
    };
  } catch (error: any) {
    console.error('? Erreur récupération recommandations:', error);
    return {
      success: false,
      error: error.message || 'Erreur réseau',
    };
  }
}

// ============================================
// HELPERS UI
// ============================================

/**
 * Obtient la couleur badge selon la catégorie
 */
export function getCategorieColor(categorie: CategorieRecommandation): string {
  const colors: Record<CategorieRecommandation, string> = {
    fiscalite: 'bg-blue-100 text-blue-700',
    patrimoine: 'bg-green-100 text-green-700',
    retraite: 'bg-purple-100 text-purple-700',
    transmission: 'bg-orange-100 text-orange-700',
    protection: 'bg-red-100 text-red-700',
    investissement: 'bg-indigo-100 text-indigo-700',
    optimisation: 'bg-yellow-100 text-yellow-700',
  };
  
  return colors[categorie] || 'bg-gray-100 text-gray-700';
}

/**
 * Obtient l'emoji selon la catégorie
 */
export function getCategorieEmoji(categorie: CategorieRecommandation): string {
  const emojis: Record<CategorieRecommandation, string> = {
    fiscalite: '??',
    patrimoine: '??',
    retraite: '??',
    transmission: '??',
    protection: '???',
    investissement: '??',
    optimisation: '?',
  };
  
  return emojis[categorie] || '??';
}

/**
 * Obtient la couleur selon la priorité
 */
export function getPrioriteColor(priorite: Recommandation['priorite']): string {
  const colors = {
    immediate: 'bg-red-100 text-red-700 border-red-300',
    court_terme: 'bg-orange-100 text-orange-700 border-orange-300',
    moyen_terme: 'bg-blue-100 text-blue-700 border-blue-300',
    long_terme: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  
  return colors[priorite];
}

/**
 * Obtient le label selon la priorité
 */
export function getPrioriteLabel(priorite: Recommandation['priorite']): string {
  const labels = {
    immediate: '?? Immédiate',
    court_terme: '?? Court terme',
    moyen_terme: '?? Moyen terme',
    long_terme: '? Long terme',
  };
  
  return labels[priorite];
}

/**
 * Obtient la couleur selon le score de pertinence
 */
export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-gray-600';
}

/**
 * Formate un montant en euros
 */
export function formatEuros(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} €`;
}

/**
 * Formate un pourcentage
 */
export function formatPourcentage(valeur: number): string {
  return `${valeur.toFixed(1)} %`;
}
