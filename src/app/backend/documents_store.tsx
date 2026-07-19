// DocumentsStore - Domain-specific facade for document-related KV operations
// Centralizes all getByPrefix() calls for documents to break the god node coupling

import * as kv from './kv_store.tsx';

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  contenu: string;
  embeddings?: number[];
  created_at: string;
}

export interface DocumentJuridique {
  id: string;
  titre: string;
  type: 'contrat' | 'document' | 'acte' | 'legal';
  contenu: string;
  source_url?: string;
  created_at: string;
}

export interface DocumentSocial {
  id: string;
  titre: string;
  type: string;
  contenu: string;
  created_at: string;
}

class DocumentsStore {
  private readonly CHUNKS_PREFIX = 'chunks_juridiques:';
  private readonly KB_PREFIX = 'kb_doc_';
  private readonly SOCIAUX_PREFIX = 'documents_sociaux:';

  // Get all document chunks
  async getAllChunks(): Promise<DocumentChunk[]> {
    try {
      const items = await kv.getByPrefix(this.CHUNKS_PREFIX);
      return items.filter(c => c !== null && c !== undefined);
    } catch (error) {
      console.error('❌ DocumentsStore.getAllChunks() failed:', error);
      return [];
    }
  }

  // Search document chunks by query
  async searchChunks(query?: string): Promise<DocumentChunk[]> {
    try {
      const allChunks = await this.getAllChunks();
      if (!query || !query.trim()) return allChunks;

      const queryLower = query.toLowerCase();
      return allChunks.filter(chunk =>
        chunk.contenu.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error('❌ DocumentsStore.searchChunks() failed:', error);
      return [];
    }
  }

  // Get all knowledge base documents
  async getAllKbDocuments(): Promise<DocumentJuridique[]> {
    try {
      const items = await kv.getByPrefix(this.KB_PREFIX);
      return items.filter(d => d !== null && d !== undefined);
    } catch (error) {
      console.error('❌ DocumentsStore.getAllKbDocuments() failed:', error);
      return [];
    }
  }

  // Search knowledge base documents
  async searchDocuments(query?: string): Promise<DocumentJuridique[]> {
    try {
      const allDocs = await this.getAllKbDocuments();
      if (!query || !query.trim()) return allDocs;

      const queryLower = query.toLowerCase();
      return allDocs.filter(doc =>
        doc.titre.toLowerCase().includes(queryLower) ||
        doc.contenu.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error('❌ DocumentsStore.searchDocuments() failed:', error);
      return [];
    }
  }

  // Get all social documents
  async getAllSocialDocuments(): Promise<DocumentSocial[]> {
    try {
      const items = await kv.getByPrefix(this.SOCIAUX_PREFIX);
      return items.filter(d => d !== null && d !== undefined);
    } catch (error) {
      console.error('❌ DocumentsStore.getAllSocialDocuments() failed:', error);
      return [];
    }
  }

  // Get chunk by ID
  async getChunk(id: string): Promise<DocumentChunk | null> {
    try {
      return await kv.get(`${this.CHUNKS_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ DocumentsStore.getChunk(${id}) failed:`, error);
      return null;
    }
  }

  // Get KB document by ID
  async getKbDocument(id: string): Promise<DocumentJuridique | null> {
    try {
      return await kv.get(`${this.KB_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ DocumentsStore.getKbDocument(${id}) failed:`, error);
      return null;
    }
  }

  // Get social document by ID
  async getSocialDocument(id: string): Promise<DocumentSocial | null> {
    try {
      return await kv.get(`${this.SOCIAUX_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ DocumentsStore.getSocialDocument(${id}) failed:`, error);
      return null;
    }
  }

  // Store a chunk
  async storeChunk(id: string, chunk: DocumentChunk): Promise<void> {
    try {
      await kv.set(`${this.CHUNKS_PREFIX}${id}`, chunk);
    } catch (error) {
      console.error(`❌ DocumentsStore.storeChunk(${id}) failed:`, error);
    }
  }

  // Store a KB document
  async storeKbDocument(id: string, doc: DocumentJuridique): Promise<void> {
    try {
      await kv.set(`${this.KB_PREFIX}${id}`, doc);
    } catch (error) {
      console.error(`❌ DocumentsStore.storeKbDocument(${id}) failed:`, error);
    }
  }

  // Store a social document
  async storeSocialDocument(id: string, doc: DocumentSocial): Promise<void> {
    try {
      await kv.set(`${this.SOCIAUX_PREFIX}${id}`, doc);
    } catch (error) {
      console.error(`❌ DocumentsStore.storeSocialDocument(${id}) failed:`, error);
    }
  }

  // Delete chunk
  async deleteChunk(id: string): Promise<void> {
    try {
      await kv.del(`${this.CHUNKS_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ DocumentsStore.deleteChunk(${id}) failed:`, error);
    }
  }

  // Delete KB document
  async deleteKbDocument(id: string): Promise<void> {
    try {
      await kv.del(`${this.KB_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ DocumentsStore.deleteKbDocument(${id}) failed:`, error);
    }
  }

  // Delete social document
  async deleteSocialDocument(id: string): Promise<void> {
    try {
      await kv.del(`${this.SOCIAUX_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ DocumentsStore.deleteSocialDocument(${id}) failed:`, error);
    }
  }

  // Delete all chunks
  async deleteAllChunks(): Promise<void> {
    try {
      await kv.delByPrefix(this.CHUNKS_PREFIX);
    } catch (error) {
      console.error('❌ DocumentsStore.deleteAllChunks() failed:', error);
    }
  }

  // Delete all KB documents
  async deleteAllKbDocuments(): Promise<void> {
    try {
      await kv.delByPrefix(this.KB_PREFIX);
    } catch (error) {
      console.error('❌ DocumentsStore.deleteAllKbDocuments() failed:', error);
    }
  }

  // Delete all social documents
  async deleteAllSocialDocuments(): Promise<void> {
    try {
      await kv.delByPrefix(this.SOCIAUX_PREFIX);
    } catch (error) {
      console.error('❌ DocumentsStore.deleteAllSocialDocuments() failed:', error);
    }
  }
}

export const documentsStore = new DocumentsStore();
