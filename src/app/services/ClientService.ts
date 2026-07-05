/**
 * CLIENT SERVICE - Delegue vers l'API serveur (api.ts)
 *
 * Architecture :
 * - API serveur = Source de verite (SQLite sur VPS)
 * - localStorage = Cache en lecture seule (TTL 5 min)
 */

import { clientAPI } from './api';
import { cleanupClientData } from '../utils/cleanupClientData';
import type { Task } from '../types/client';

// ============================================
// TYPES
// ============================================

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  situation?: string;
  profession?: string;
  revenus?: any;
  foyer?: any;
  patrimoine?: any;
  objectifs?: any[];
  statut?: string;
  score?: number;
  derniereActivite?: string;
  date_creation?: string;
  createdAt: string;
  updatedAt?: string;

  // 🆕 NOUVEAUX CHAMPS POUR DASHBOARD & PIPELINE (2026-07-05)
  statusOuvert?: 'Prospect' | 'Découverte' | 'Simulation' | 'Lettre Mission' | 'Rapport/Audit' | 'Suivi MEP' | 'Suivi CSP' | 'Arbitrage';
  dateNextRdv?: string; // Date du prochain RDV (utilisée pour "RDV Aujourd'hui" et "RDV Cette semaine")
  tauxCA?: number; // Chiffre d'affaires (somme de tous les tauxCA)
  cspSigne?: boolean; // CSP signé ? (pour restrictions Suivi CSP/Arbitrage)
  taches?: Record<string, Task[]>; // Tâches groupées par statut { 'Prospect': [...], 'Découverte': [...], etc. }
  mailsATraiter?: number; // Nombre de mails avec statut 'À traiter'
  categoriesDossier?: string[]; // Catégories assignées (Chiffrage, Arbitrage, etc.)
  arbitrageClosureDate?: string; // Date de clôture de l'exercice SEL (statut Arbitrage)
  arbitrageTreasuryN1?: number; // Besoin trésorerie N-1 en euros (statut Arbitrage)
}

// ============================================
// CONFIGURATION
// ============================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// CACHE LOCAL (lecture seule, pour perf)
// ============================================

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`cv_cache:${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(`cv_cache:${key}`);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`cv_cache:${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

function removeCache(key: string): void {
  localStorage.removeItem(`cv_cache:${key}`);
}

// ============================================
// CLIENT SERVICE
// ============================================

class ClientServiceClass {
  /**
   * Recupere tous les clients depuis le serveur (cache 5 min)
   */
  async getAllClients(forceRefresh = false): Promise<{
    clients: Client[];
    error: string | null;
    fromCache: boolean;
  }> {
    const cacheKey = 'all_clients';

    if (!forceRefresh) {
      const cached = getCached<Client[]>(cacheKey);
      if (cached) {
        console.log(`Clients charges depuis le cache (${cached.length})`);
        return { clients: cached, error: null, fromCache: true };
      }
    }

    try {
      const clients = await clientAPI.getAll();
      console.log(`Clients charges depuis le serveur: ${clients.length}`);
      setCache(cacheKey, clients);
      return { clients, error: null, fromCache: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement clients';
      console.error('Erreur getAllClients:', msg);
      // Fallback: renvoyer le cache expire si disponible
      const stale = getCached<Client[]>(cacheKey);
      if (stale) return { clients: stale, error: null, fromCache: true };
      return { clients: [], error: msg, fromCache: false };
    }
  }

  /**
   * Recupere un client par ID
   */
  async getClientById(clientId: string, forceRefresh = false): Promise<{
    client: Client | null;
    error: string | null;
    fromCache: boolean;
  }> {
    const cacheKey = `client_${clientId}`;

    if (!forceRefresh) {
      const cached = getCached<Client>(cacheKey);
      if (cached) {
        return { client: cached, error: null, fromCache: true };
      }
    }

    try {
      const client = await clientAPI.getById(clientId);
      setCache(cacheKey, client);
      return { client, error: null, fromCache: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Client introuvable';
      console.error('Erreur getClientById:', msg);
      return { client: null, error: msg, fromCache: false };
    }
  }

  /**
   * Cree un nouveau client sur le serveur
   * L'ID est genere par le serveur (UUID)
   */
  async createClient(clientData: Partial<Client>): Promise<{
    client: Client | null;
    error: string | null;
  }> {
    try {
      const result = await clientAPI.create({
        nom: clientData.nom || '',
        prenom: clientData.prenom || '',
        email: clientData.email || '',
        telephone: clientData.telephone || '',
        statut: clientData.statut || 'R0 - Prospect',
        patrimoine: clientData.patrimoine || 0,
        statusOuvert: clientData.statusOuvert || 'Prospect',
        cspSigne: clientData.cspSigne || false,
        taches: clientData.taches || {},
      });

      // L'API peut renvoyer { client } ou directement l'objet
      const newClient: Client = result.client ?? result;
      console.log('Client cree sur le serveur:', newClient.id);

      // Invalider le cache de la liste
      removeCache('all_clients');

      return { client: newClient, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur creation client';
      console.error('Erreur createClient:', msg);
      return { client: null, error: msg };
    }
  }

  /**
   * Met a jour un client sur le serveur
   */
  async updateClient(clientId: string, updates: Partial<Client>): Promise<{
    client: Client | null;
    error: string | null;
  }> {
    try {
      const result = await clientAPI.update(clientId, updates);
      const updatedClient: Client = result.client ?? result;
      console.log('Client mis a jour sur le serveur:', clientId);

      // Invalider les caches
      removeCache('all_clients');
      removeCache(`client_${clientId}`);

      return { client: updatedClient, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur mise a jour client';
      console.error('Erreur updateClient:', msg);
      return { client: null, error: msg };
    }
  }

  /**
   * Supprime un client sur le serveur
   */
  async deleteClient(clientId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      // 1️⃣ Nettoyer TOUTES les données associées au client
      console.log('🧹 Nettoyage des données du client...');
      const cleanupResult = await cleanupClientData(clientId);

      if (!cleanupResult.success) {
        console.warn('⚠️ Le nettoyage a rencontré des erreurs, mais on continue la suppression');
      } else {
        console.log('✅ Nettoyage des données terminé:', cleanupResult.summary);
      }

      // 2️⃣ Supprimer le client du serveur
      await clientAPI.delete(clientId);
      console.log('Client supprime du serveur:', clientId);

      // 3️⃣ Invalider les caches
      removeCache('all_clients');
      removeCache(`client_${clientId}`);

      return { success: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression client';
      console.error('Erreur deleteClient:', msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Vide le cache local
   */
  clearCache(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith('cv_cache:'))
      .forEach(k => localStorage.removeItem(k));
    console.log('Cache ClientService vide');
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

export const ClientService = new ClientServiceClass();
