/**
 * 🔍 SERVICE INCOHÉRENCES - Interface pour la détection et gestion des incohérences
 * 
 * Phase 3 : Amélioration processus CoreVision
 * - Détection automatique d'incohérences
 * - Validation/Ignore/Correction avec traçabilité
 * - UI de gestion structurée
 */

import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

// ============================================
// TYPES (synchronisés avec le serveur)
// ============================================

export type CategorieIncoherence =
  | 'patrimoine'
  | 'revenus'
  | 'fiscalite'
  | 'familiale'
  | 'professionnelle'
  | 'juridique'
  | 'chronologique';

export type GraviteIncoherence = 'critique' | 'elevee' | 'moyenne' | 'faible';

export type StatutIncoherence = 'detectee' | 'validee' | 'ignoree' | 'corrigee';

export interface Incoherence {
  id: string;
  categorie: CategorieIncoherence;
  gravite: GraviteIncoherence;
  statut: StatutIncoherence;

  // Description
  titre: string;
  description: string;
  consequence: string;

  // Données concernées
  champsAffectes: string[];
  valeursActuelles: any;

  // Suggestions
  suggestionsResolution: string[];
  valeursCorrigees?: any;

  // Traçabilité
  dateDetection: string;
  dateResolution?: string;
  utilisateurResolution?: string;
  commentaireResolution?: string;

  // Règle appliquée
  regleId: string;
  regleDescription: string;
}

export interface RapportIncoherences {
  clientId: string;
  auditId?: string;
  dateAnalyse: string;

  // Statistiques
  totalIncoherences: number;
  parGravite: {
    critique: number;
    elevee: number;
    moyenne: number;
    faible: number;
  };
  parStatut: {
    detectee: number;
    validee: number;
    ignoree: number;
    corrigee: number;
  };

  // Liste des incohérences
  incoherences: Incoherence[];

  // Score de cohérence global
  scoreCoherence: number; // 0-100
}

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = `${apiBaseUrl}/make-server-cac859af`;

// ============================================
// SERVICE
// ============================================

class IncoherencesServiceClass {
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
   * Détecte toutes les incohérences pour un client
   */
  async detecter(
    clientId: string,
    clientData?: any
  ): Promise<{
    rapport: RapportIncoherences | null;
    error: string | null;
  }> {
    const startTime = performance.now();

    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/incoherences/detecter/${clientId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || publicAnonKey}`,
          },
          body: JSON.stringify({ clientData }),
        }
      );

      const duration = performance.now() - startTime;
      console.log(
        `🔍 Détection incohérences: ${response.status} (${Math.round(duration)}ms)`
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { rapport: null, error: errorData.error || 'Erreur de détection' };
      }

      const data = await response.json();
      return { rapport: data.rapport, error: null };
    } catch (error) {
      console.error('❌ Erreur détection incohérences:', error);
      return {
        rapport: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupère le rapport d'incohérences pour un client
   */
  async getRapport(clientId: string): Promise<{
    rapport: RapportIncoherences | null;
    error: string | null;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${API_BASE_URL}/incoherences/${clientId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token || publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { rapport: null, error: errorData.error || 'Rapport non trouvé' };
      }

      const data = await response.json();
      return { rapport: data.rapport, error: null };
    } catch (error) {
      console.error('❌ Erreur récupération rapport:', error);
      return {
        rapport: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Valide une incohérence (accepte comme correcte)
   */
  async valider(
    clientId: string,
    incoherenceId: string,
    utilisateur: string,
    commentaire?: string
  ): Promise<{
    rapport: RapportIncoherences | null;
    error: string | null;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/incoherences/${clientId}/${incoherenceId}/valider`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || publicAnonKey}`,
          },
          body: JSON.stringify({ utilisateur, commentaire }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { rapport: null, error: errorData.error || 'Erreur de validation' };
      }

      const data = await response.json();
      console.log(`✅ Incohérence validée: ${incoherenceId}`);
      return { rapport: data.rapport, error: null };
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      return {
        rapport: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Ignore une incohérence (marque comme non pertinente)
   */
  async ignorer(
    clientId: string,
    incoherenceId: string,
    utilisateur: string,
    raison: string
  ): Promise<{
    rapport: RapportIncoherences | null;
    error: string | null;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/incoherences/${clientId}/${incoherenceId}/ignorer`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || publicAnonKey}`,
          },
          body: JSON.stringify({ utilisateur, raison }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { rapport: null, error: errorData.error || 'Erreur d\'ignore' };
      }

      const data = await response.json();
      console.log(`⏭️ Incohérence ignorée: ${incoherenceId}`);
      return { rapport: data.rapport, error: null };
    } catch (error) {
      console.error('❌ Erreur ignore:', error);
      return {
        rapport: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Marque une incohérence comme corrigée
   */
  async marquerCorrigee(
    clientId: string,
    incoherenceId: string,
    utilisateur: string,
    commentaire?: string
  ): Promise<{
    rapport: RapportIncoherences | null;
    error: string | null;
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/incoherences/${clientId}/${incoherenceId}/corriger`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || publicAnonKey}`,
          },
          body: JSON.stringify({ utilisateur, commentaire }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { rapport: null, error: errorData.error || 'Erreur de correction' };
      }

      const data = await response.json();
      console.log(`🔧 Incohérence corrigée: ${incoherenceId}`);
      return { rapport: data.rapport, error: null };
    } catch (error) {
      console.error('❌ Erreur correction:', error);
      return {
        rapport: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const IncoherencesService = new IncoherencesServiceClass();
