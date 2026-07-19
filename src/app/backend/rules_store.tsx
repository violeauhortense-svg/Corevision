// RulesStore - Domain-specific facade for rule-related KV operations
// Centralizes all getByPrefix() calls for rules to break the god node coupling

import * as kv from './kv_store.tsx';

export interface RegleFiscale {
  id: string;
  titre: string;
  description: string;
  domaine: DomaineRegle;
  statut_validation: 'draft' | 'validated' | 'rejected';
  source: string;
  created_at: string;
  updated_at: string;
}

export enum DomaineRegle {
  FISCAL = 'FISCAL',
  SOCIAL = 'SOCIAL',
  PATRIMOINE = 'PATRIMOINE',
  JURIDIQUE = 'JURIDIQUE'
}

export interface RegleSociale {
  id: string;
  titre: string;
  domaine: string;
  conditions: string[];
  consequences: string[];
  references: string[];
  source: string;
  created_at: string;
}

class RulesStore {
  private readonly FISCAL_PREFIX = 'regle_fiscale:';
  private readonly COLLECTEES_PREFIX = 'regle_collectee:';
  private readonly SOCIALES_PREFIX = 'sections_sociales:';
  private readonly INDEXED_PREFIX = 'index_ia:';

  // Get all fiscal rules
  async getToutesRegles(): Promise<RegleFiscale[]> {
    try {
      const items = await kv.getByPrefix(this.FISCAL_PREFIX);
      return items
        .filter(regle => regle !== null && regle !== undefined);
    } catch (error) {
      console.error('❌ RulesStore.getToutesRegles() failed:', error);
      return [];
    }
  }

  // Get rules by domain
  async getReglesParDomaine(domaine: DomaineRegle): Promise<RegleFiscale[]> {
    try {
      const toutesRegles = await this.getToutesRegles();
      return toutesRegles.filter(r => r.domaine === domaine);
    } catch (error) {
      console.error(`❌ RulesStore.getReglesParDomaine(${domaine}) failed:`, error);
      return [];
    }
  }

  // Search rules by query (text-based, on fiscal rules)
  async searchRegles(
    query?: string,
    statut?: string,
    source?: string
  ): Promise<RegleFiscale[]> {
    try {
      const allItems = await kv.getByPrefix(this.FISCAL_PREFIX);

      let regles: RegleFiscale[] = allItems
        .filter(item => item !== null && item !== undefined)
        .map(item => item as RegleFiscale);

      if (statut) {
        regles = regles.filter(r => r.statut_validation === statut);
      }

      if (source) {
        regles = regles.filter(r => r.source === source);
      }

      if (query && query.trim()) {
        const queryLower = query.toLowerCase();
        regles = regles.filter(r =>
          r.titre.toLowerCase().includes(queryLower) ||
          r.description.toLowerCase().includes(queryLower)
        );
      }

      return regles;
    } catch (error) {
      console.error('❌ RulesStore.searchRegles() failed:', error);
      return [];
    }
  }

  // Get collected rules (used by generators and extractors)
  async getCollectedRules(): Promise<any[]> {
    try {
      return await kv.getByPrefix(this.COLLECTEES_PREFIX);
    } catch (error) {
      console.error('❌ RulesStore.getCollectedRules() failed:', error);
      return [];
    }
  }

  // Delete collected rules by prefix
  async deleteCollectedRules(prefix?: string): Promise<number> {
    try {
      const deletePrefix = prefix ? `${this.COLLECTEES_PREFIX}${prefix}` : this.COLLECTEES_PREFIX;
      return await kv.delByPrefix(deletePrefix);
    } catch (error) {
      console.error('❌ RulesStore.deleteCollectedRules() failed:', error);
      return 0;
    }
  }

  // Get social rules (extracted from documents)
  async getSocialRules(): Promise<RegleSociale[]> {
    try {
      const sections = await kv.getByPrefix(this.SOCIALES_PREFIX) as RegleSociale[];
      return sections.filter(s => s !== null && s !== undefined);
    } catch (error) {
      console.error('❌ RulesStore.getSocialRules() failed:', error);
      return [];
    }
  }

  // Get indexed vectors for similarity search
  async getIndexedVectors(): Promise<any[]> {
    try {
      const allItems = await kv.getByPrefix(this.INDEXED_PREFIX);
      return allItems
        .filter(item => item.key !== `${this.INDEXED_PREFIX}last_indexation`);
    } catch (error) {
      console.error('❌ RulesStore.getIndexedVectors() failed:', error);
      return [];
    }
  }

  // Get specific indexed vector
  async getIndexedVector(regleId: string): Promise<any | null> {
    try {
      return await kv.get(`${this.INDEXED_PREFIX}vecteur_${regleId}`);
    } catch (error) {
      console.error(`❌ RulesStore.getIndexedVector(${regleId}) failed:`, error);
      return null;
    }
  }

  // Store a rule
  async storeRule(id: string, rule: RegleFiscale): Promise<void> {
    try {
      await kv.set(`${this.FISCAL_PREFIX}${id}`, rule);
    } catch (error) {
      console.error(`❌ RulesStore.storeRule(${id}) failed:`, error);
    }
  }

  // Delete a rule
  async deleteRule(id: string): Promise<void> {
    try {
      await kv.del(`${this.FISCAL_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ RulesStore.deleteRule(${id}) failed:`, error);
    }
  }

  // Delete all fiscal rules
  async deleteAllRules(): Promise<void> {
    try {
      await kv.delByPrefix(this.FISCAL_PREFIX);
    } catch (error) {
      console.error('❌ RulesStore.deleteAllRules() failed:', error);
    }
  }

  // Delete all indexed vectors
  async deleteAllVectors(): Promise<void> {
    try {
      await kv.delByPrefix(this.INDEXED_PREFIX);
    } catch (error) {
      console.error('❌ RulesStore.deleteAllVectors() failed:', error);
    }
  }
}

export const rulesStore = new RulesStore();
