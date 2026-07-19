// StatsStore - Domain-specific facade for statistics/analysis-related KV operations
// Centralizes all getByPrefix() calls for stats to break the god node coupling

import * as kv from './kv_store.tsx';

export interface AuditStats {
  id: string;
  client_id: string;
  audit_type: 'fiscal' | 'patrimonial' | 'social';
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  data: Record<string, any>;
}

export interface AnalysisData {
  id: string;
  client_id: string;
  analysis_type: string;
  results: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CollectionStats {
  total_regles_collectees: number;
  total_documents: number;
  total_clients: number;
  last_collection: string;
  domains_covered: string[];
}

class StatsStore {
  private readonly AUDIT_PREFIX = 'audit_patrimonial:';
  private readonly ANALYSIS_PREFIX = 'analyse_patrimoniale:';
  private readonly STATS_PREFIX = 'collecte_stats:';

  // Get all audit statistics
  async getAllAudits(): Promise<AuditStats[]> {
    try {
      const items = await kv.getByPrefix(this.AUDIT_PREFIX);
      return items.filter(a => a !== null && a !== undefined);
    } catch (error) {
      console.error('❌ StatsStore.getAllAudits() failed:', error);
      return [];
    }
  }

  // Get audit by ID
  async getAudit(id: string): Promise<AuditStats | null> {
    try {
      return await kv.get(`${this.AUDIT_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ StatsStore.getAudit(${id}) failed:`, error);
      return null;
    }
  }

  // Get audits for a client
  async getAuditsForClient(clientId: string): Promise<AuditStats[]> {
    try {
      const allAudits = await this.getAllAudits();
      return allAudits.filter(a => a.client_id === clientId);
    } catch (error) {
      console.error(`❌ StatsStore.getAuditsForClient(${clientId}) failed:`, error);
      return [];
    }
  }

  // Store an audit
  async storeAudit(id: string, audit: AuditStats): Promise<void> {
    try {
      await kv.set(`${this.AUDIT_PREFIX}${id}`, audit);
    } catch (error) {
      console.error(`❌ StatsStore.storeAudit(${id}) failed:`, error);
    }
  }

  // Delete an audit
  async deleteAudit(id: string): Promise<void> {
    try {
      await kv.del(`${this.AUDIT_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ StatsStore.deleteAudit(${id}) failed:`, error);
    }
  }

  // Delete all audits
  async deleteAllAudits(): Promise<void> {
    try {
      await kv.delByPrefix(this.AUDIT_PREFIX);
    } catch (error) {
      console.error('❌ StatsStore.deleteAllAudits() failed:', error);
    }
  }

  // Get all analysis data
  async getAllAnalysis(): Promise<AnalysisData[]> {
    try {
      const items = await kv.getByPrefix(this.ANALYSIS_PREFIX);
      return items.filter(a => a !== null && a !== undefined);
    } catch (error) {
      console.error('❌ StatsStore.getAllAnalysis() failed:', error);
      return [];
    }
  }

  // Get analysis by ID
  async getAnalysis(id: string): Promise<AnalysisData | null> {
    try {
      return await kv.get(`${this.ANALYSIS_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ StatsStore.getAnalysis(${id}) failed:`, error);
      return null;
    }
  }

  // Get analysis for a client
  async getAnalysisForClient(clientId: string): Promise<AnalysisData[]> {
    try {
      const allAnalysis = await this.getAllAnalysis();
      return allAnalysis.filter(a => a.client_id === clientId);
    } catch (error) {
      console.error(`❌ StatsStore.getAnalysisForClient(${clientId}) failed:`, error);
      return [];
    }
  }

  // Store analysis
  async storeAnalysis(id: string, analysis: AnalysisData): Promise<void> {
    try {
      await kv.set(`${this.ANALYSIS_PREFIX}${id}`, analysis);
    } catch (error) {
      console.error(`❌ StatsStore.storeAnalysis(${id}) failed:`, error);
    }
  }

  // Delete analysis
  async deleteAnalysis(id: string): Promise<void> {
    try {
      await kv.del(`${this.ANALYSIS_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ StatsStore.deleteAnalysis(${id}) failed:`, error);
    }
  }

  // Delete all analysis
  async deleteAllAnalysis(): Promise<void> {
    try {
      await kv.delByPrefix(this.ANALYSIS_PREFIX);
    } catch (error) {
      console.error('❌ StatsStore.deleteAllAnalysis() failed:', error);
    }
  }

  // Get collection statistics
  async getCollectionStats(): Promise<CollectionStats | null> {
    try {
      return await kv.get(`${this.STATS_PREFIX}main`);
    } catch (error) {
      console.error('❌ StatsStore.getCollectionStats() failed:', error);
      return null;
    }
  }

  // Store collection statistics
  async storeCollectionStats(stats: CollectionStats): Promise<void> {
    try {
      await kv.set(`${this.STATS_PREFIX}main`, stats);
    } catch (error) {
      console.error('❌ StatsStore.storeCollectionStats() failed:', error);
    }
  }
}

export const statsStore = new StatsStore();
