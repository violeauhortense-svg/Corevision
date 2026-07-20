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

export interface DocumentCollecte {
  id: string;
  source: 'BOFiP' | 'Legifrance';
  titre: string;
  section: string;
  texte: string;
  date_publication: string;
  date_collecte: string;
  metadata: {
    url: string;
    categorie: string;
    mots_cles: string[];
  };
}

class DocumentsStore {
  private readonly CHUNKS_PREFIX = 'chunks_juridiques:';
  private readonly KB_PREFIX = 'kb_doc_';
  private readonly SOCIAUX_PREFIX = 'documents_sociaux:';
  private readonly COLLECTES_PREFIX = 'juridique:';

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

  // Get all collected juridical documents
  async getAllCollectedDocuments(): Promise<DocumentCollecte[]> {
    try {
      const items = await kv.getByPrefix(this.COLLECTES_PREFIX);
      return items
        .filter(item => item.key !== `${this.COLLECTES_PREFIX}last_collecte` && item !== null && item !== undefined)
        .map(item => item.value as DocumentCollecte);
    } catch (error) {
      console.error('❌ DocumentsStore.getAllCollectedDocuments() failed:', error);
      return [];
    }
  }

  // Get collected documents by source
  async getCollectedDocumentsBySource(source: string): Promise<DocumentCollecte[]> {
    try {
      const prefix = `${this.COLLECTES_PREFIX}${source.toLowerCase()}:`;
      const items = await kv.getByPrefix(prefix);
      return items
        .filter(item => item !== null && item !== undefined)
        .map(item => item.value as DocumentCollecte);
    } catch (error) {
      console.error(`❌ DocumentsStore.getCollectedDocumentsBySource(${source}) failed:`, error);
      return [];
    }
  }

  // Search collected documents
  async searchCollectedDocuments(query?: string, source?: string): Promise<DocumentCollecte[]> {
    try {
      let documents = source
        ? await this.getCollectedDocumentsBySource(source)
        : await this.getAllCollectedDocuments();

      if (query && query.trim()) {
        const queryLower = query.toLowerCase();
        documents = documents.filter(doc =>
          doc.titre.toLowerCase().includes(queryLower) ||
          doc.texte.toLowerCase().includes(queryLower) ||
          doc.section.toLowerCase().includes(queryLower) ||
          doc.metadata.mots_cles.some(kw => kw.toLowerCase().includes(queryLower))
        );
      }

      // Sort by publication date (newest first)
      documents.sort((a, b) => {
        const dateA = new Date(a.date_publication).getTime();
        const dateB = new Date(b.date_publication).getTime();
        return dateB - dateA;
      });

      return documents;
    } catch (error) {
      console.error('❌ DocumentsStore.searchCollectedDocuments() failed:', error);
      return [];
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

  // Store a collected juridical document
  async storeCollectedDocument(id: string, doc: DocumentCollecte): Promise<void> {
    try {
      const source = doc.source.toLowerCase();
      await kv.set(`${this.COLLECTES_PREFIX}${source}:${id}`, doc);
    } catch (error) {
      console.error(`❌ DocumentsStore.storeCollectedDocument(${id}) failed:`, error);
    }
  }

  // Update last collection timestamp
  async updateLastCollectionTimestamp(timestamp: string): Promise<void> {
    try {
      await kv.set(`${this.COLLECTES_PREFIX}last_collecte`, { date: timestamp });
    } catch (error) {
      console.error('❌ DocumentsStore.updateLastCollectionTimestamp() failed:', error);
    }
  }

  // Get last collection timestamp
  async getLastCollectionTimestamp(): Promise<any> {
    try {
      return await kv.get(`${this.COLLECTES_PREFIX}last_collecte`);
    } catch (error) {
      console.error('❌ DocumentsStore.getLastCollectionTimestamp() failed:', error);
      return null;
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

  // Delete collected document
  async deleteCollectedDocument(id: string, source: string): Promise<void> {
    try {
      const sourceKey = source.toLowerCase();
      await kv.del(`${this.COLLECTES_PREFIX}${sourceKey}:${id}`);
    } catch (error) {
      console.error(`❌ DocumentsStore.deleteCollectedDocument(${id}) failed:`, error);
    }
  }

  // Delete all collected documents
  async deleteAllCollectedDocuments(): Promise<void> {
    try {
      await kv.delByPrefix(this.COLLECTES_PREFIX);
    } catch (error) {
      console.error('❌ DocumentsStore.deleteAllCollectedDocuments() failed:', error);
    }
  }
}

export const documentsStore = new DocumentsStore();
