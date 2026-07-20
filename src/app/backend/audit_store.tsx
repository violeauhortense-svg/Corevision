import * as kv from './kv_store.tsx';

export interface AuditPatrimonial {
  id: string;
  userId: string;
  clientId: string;
  statut: 'en_cours' | 'termine' | 'valide';
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

class AuditStore {
  private readonly PREFIX = 'audit_patrimonial:';

  async getAudit(auditId: string): Promise<AuditPatrimonial | null> {
    try {
      return await kv.get(`${this.PREFIX}${auditId}`);
    } catch (error) {
      console.error(`❌ AuditStore.getAudit(${auditId}) failed:`, error);
      return null;
    }
  }

  async getAllAudits(): Promise<AuditPatrimonial[]> {
    try {
      const items = await kv.getByPrefix(this.PREFIX);
      return items.filter(item => item !== null && item !== undefined) as AuditPatrimonial[];
    } catch (error) {
      console.error('❌ AuditStore.getAllAudits() failed:', error);
      return [];
    }
  }

  async storeAudit(audit: AuditPatrimonial): Promise<void> {
    try {
      await kv.set(`${this.PREFIX}${audit.id}`, audit);
    } catch (error) {
      console.error(`❌ AuditStore.storeAudit(${audit.id}) failed:`, error);
    }
  }

  async updateAudit(auditId: string, updates: Partial<AuditPatrimonial>): Promise<void> {
    try {
      const existing = await this.getAudit(auditId);
      if (!existing) return;
      await kv.set(`${this.PREFIX}${auditId}`, {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ AuditStore.updateAudit(${auditId}) failed:`, error);
    }
  }

  async deleteAudit(auditId: string): Promise<void> {
    try {
      await kv.del(`${this.PREFIX}${auditId}`);
    } catch (error) {
      console.error(`❌ AuditStore.deleteAudit(${auditId}) failed:`, error);
    }
  }
}

export const auditStore = new AuditStore();
