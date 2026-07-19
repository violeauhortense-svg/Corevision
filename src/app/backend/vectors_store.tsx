// VectorsStore - Domain-specific facade for vector/embedding-related KV operations
// Centralizes all getByPrefix() calls for AI indexing to break the god node coupling

import * as kv from './kv_store.tsx';

export interface VectorIndex {
  id: string;
  regle_id: string;
  vector: number[];
  metadata: {
    titre: string;
    domaine: string;
    source: string;
  };
  created_at: string;
}

export interface IndexMetadata {
  last_indexation: string;
  total_vectors: number;
  domains: string[];
}

class VectorsStore {
  private readonly INDEX_PREFIX = 'index_ia:';

  // Get all indexed vectors
  async getAllVectors(): Promise<VectorIndex[]> {
    try {
      const allItems = await kv.getByPrefix(this.INDEX_PREFIX);
      // Filter out metadata and only return vector entries
      return allItems.filter(item =>
        item !== null &&
        item !== undefined &&
        item.id &&
        !item.id.includes('last_indexation')
      );
    } catch (error) {
      console.error('❌ VectorsStore.getAllVectors() failed:', error);
      return [];
    }
  }

  // Search similar vectors (simple similarity search using metadata)
  async searchSimilarRules(query?: string, domain?: string): Promise<VectorIndex[]> {
    try {
      const allVectors = await this.getAllVectors();

      let results = allVectors;

      if (domain) {
        results = results.filter(v => v.metadata.domaine === domain);
      }

      if (query && query.trim()) {
        const queryLower = query.toLowerCase();
        results = results.filter(v =>
          v.metadata.titre.toLowerCase().includes(queryLower) ||
          v.metadata.source.toLowerCase().includes(queryLower)
        );
      }

      return results;
    } catch (error) {
      console.error('❌ VectorsStore.searchSimilarRules() failed:', error);
      return [];
    }
  }

  // Get vector by regle ID
  async getVectorForRegle(regleId: string): Promise<VectorIndex | null> {
    try {
      return await kv.get(`${this.INDEX_PREFIX}vecteur_${regleId}`);
    } catch (error) {
      console.error(`❌ VectorsStore.getVectorForRegle(${regleId}) failed:`, error);
      return null;
    }
  }

  // Store a vector
  async storeVector(regleId: string, vector: VectorIndex): Promise<void> {
    try {
      await kv.set(`${this.INDEX_PREFIX}vecteur_${regleId}`, vector);
    } catch (error) {
      console.error(`❌ VectorsStore.storeVector(${regleId}) failed:`, error);
    }
  }

  // Store multiple vectors
  async storeVectors(vectors: VectorIndex[]): Promise<void> {
    try {
      const keys = vectors.map(v => `${this.INDEX_PREFIX}vecteur_${v.regle_id}`);
      await kv.mset(keys, vectors);
    } catch (error) {
      console.error('❌ VectorsStore.storeVectors() failed:', error);
    }
  }

  // Delete vector for regle
  async deleteVector(regleId: string): Promise<void> {
    try {
      await kv.del(`${this.INDEX_PREFIX}vecteur_${regleId}`);
    } catch (error) {
      console.error(`❌ VectorsStore.deleteVector(${regleId}) failed:`, error);
    }
  }

  // Delete all vectors
  async deleteAllVectors(): Promise<void> {
    try {
      await kv.delByPrefix(this.INDEX_PREFIX);
    } catch (error) {
      console.error('❌ VectorsStore.deleteAllVectors() failed:', error);
    }
  }

  // Get indexation metadata
  async getIndexMetadata(): Promise<IndexMetadata | null> {
    try {
      return await kv.get(`${this.INDEX_PREFIX}last_indexation`);
    } catch (error) {
      console.error('❌ VectorsStore.getIndexMetadata() failed:', error);
      return null;
    }
  }

  // Store indexation metadata
  async storeIndexMetadata(metadata: IndexMetadata): Promise<void> {
    try {
      await kv.set(`${this.INDEX_PREFIX}last_indexation`, metadata);
    } catch (error) {
      console.error('❌ VectorsStore.storeIndexMetadata() failed:', error);
    }
  }

  // Get count of vectors
  async getVectorCount(): Promise<number> {
    try {
      const vectors = await this.getAllVectors();
      return vectors.length;
    } catch (error) {
      console.error('❌ VectorsStore.getVectorCount() failed:', error);
      return 0;
    }
  }
}

export const vectorsStore = new VectorsStore();
