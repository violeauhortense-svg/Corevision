// MontagesStore - Domain-specific facade for montage-related KV operations
// Centralizes all getByPrefix() calls for montages to break the god node coupling

import * as kv from './kv_store.tsx';

export interface Montage {
  id: string;
  titre: string;
  description: string;
  objectif: string;
  source: 'collecte' | 'template' | 'manual';
  regles_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface MontageCollecte {
  id: string;
  client_id: string;
  titre: string;
  description: string;
  regles_appliquees: string[];
  created_at: string;
}

class MontagesStore {
  private readonly COLLECTES_PREFIX = 'montage_collecte:';
  private readonly PATRIMONIAUX_PREFIX = 'montage_patrimonial:';

  // Get all collected montages
  async getMontagesCollectes(): Promise<MontageCollecte[]> {
    try {
      const items = await kv.getByPrefix(this.COLLECTES_PREFIX);
      return items.filter(m => m !== null && m !== undefined);
    } catch (error) {
      console.error('❌ MontagesStore.getMontagesCollectes() failed:', error);
      return [];
    }
  }

  // Get all patrimonial montages
  async getMontagesPatrimoniaux(): Promise<Montage[]> {
    try {
      const items = await kv.getByPrefix(this.PATRIMONIAUX_PREFIX);
      return items.filter(m => m !== null && m !== undefined);
    } catch (error) {
      console.error('❌ MontagesStore.getMontagesPatrimoniaux() failed:', error);
      return [];
    }
  }

  // Get montage by ID
  async getMontage(id: string): Promise<Montage | null> {
    try {
      const montage = await kv.get(`${this.PATRIMONIAUX_PREFIX}${id}`);
      return montage || null;
    } catch (error) {
      console.error(`❌ MontagesStore.getMontage(${id}) failed:`, error);
      return null;
    }
  }

  // Get collected montage by ID
  async getMontageCollecte(id: string): Promise<MontageCollecte | null> {
    try {
      const montage = await kv.get(`${this.COLLECTES_PREFIX}${id}`);
      return montage || null;
    } catch (error) {
      console.error(`❌ MontagesStore.getMontageCollecte(${id}) failed:`, error);
      return null;
    }
  }

  // Store a patrimonial montage
  async storeMontage(id: string, montage: Montage): Promise<void> {
    try {
      await kv.set(`${this.PATRIMONIAUX_PREFIX}${id}`, montage);
    } catch (error) {
      console.error(`❌ MontagesStore.storeMontage(${id}) failed:`, error);
    }
  }

  // Store a collected montage
  async storeMontageCollecte(id: string, montage: MontageCollecte): Promise<void> {
    try {
      await kv.set(`${this.COLLECTES_PREFIX}${id}`, montage);
    } catch (error) {
      console.error(`❌ MontagesStore.storeMontageCollecte(${id}) failed:`, error);
    }
  }

  // Delete a patrimonial montage
  async deleteMontage(id: string): Promise<void> {
    try {
      await kv.del(`${this.PATRIMONIAUX_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ MontagesStore.deleteMontage(${id}) failed:`, error);
    }
  }

  // Delete a collected montage
  async deleteMontageCollecte(id: string): Promise<void> {
    try {
      await kv.del(`${this.COLLECTES_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ MontagesStore.deleteMontageCollecte(${id}) failed:`, error);
    }
  }

  // Delete all patrimonial montages
  async deleteAllMontages(): Promise<void> {
    try {
      await kv.delByPrefix(this.PATRIMONIAUX_PREFIX);
    } catch (error) {
      console.error('❌ MontagesStore.deleteAllMontages() failed:', error);
    }
  }

  // Delete all collected montages
  async deleteAllMontagesCollectes(): Promise<void> {
    try {
      await kv.delByPrefix(this.COLLECTES_PREFIX);
    } catch (error) {
      console.error('❌ MontagesStore.deleteAllMontagesCollectes() failed:', error);
    }
  }

  // Delete collected montages by prefix
  async deleteMontagesCollectesByPrefix(prefix: string): Promise<number> {
    try {
      const deletePrefix = `${this.COLLECTES_PREFIX}${prefix}`;
      return await kv.delByPrefix(deletePrefix);
    } catch (error) {
      console.error('❌ MontagesStore.deleteMontagesCollectesByPrefix() failed:', error);
      return 0;
    }
  }
}

export const montagesStore = new MontagesStore();
