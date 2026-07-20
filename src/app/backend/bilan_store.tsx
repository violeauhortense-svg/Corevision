import * as kv from './kv_store.tsx';

export interface BilanSignature {
  token: string;
  clientId: string;
  userId: string;
  statut: 'en_attente' | 'signe' | 'expire';
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface TaskBilan {
  id: string;
  userId: string;
  clientId: string;
  statut: string;
  [key: string]: any;
}

class BilanStore {
  private readonly PREFIX = 'bilan_signature:';
  private readonly CLIENT_INDEX_PREFIX = 'bilan_signature:client:';
  private readonly TASK_PREFIX = 'task:';

  async getBilan(token: string): Promise<BilanSignature | null> {
    try {
      return await kv.get(`${this.PREFIX}${token}`);
    } catch (error) {
      console.error(`❌ BilanStore.getBilan(${token}) failed:`, error);
      return null;
    }
  }

  async getAllBilans(): Promise<BilanSignature[]> {
    try {
      const items = await kv.getByPrefix(this.PREFIX);
      return items
        .filter(item => item !== null && item !== undefined && item.token)
        .map(item => item as BilanSignature);
    } catch (error) {
      console.error('❌ BilanStore.getAllBilans() failed:', error);
      return [];
    }
  }

  async getBilanByClient(clientId: string): Promise<BilanSignature | null> {
    try {
      const mapping = await kv.get(`${this.CLIENT_INDEX_PREFIX}${clientId}`);
      if (!mapping?.token) return null;
      return this.getBilan(mapping.token);
    } catch (error) {
      console.error(`❌ BilanStore.getBilanByClient(${clientId}) failed:`, error);
      return null;
    }
  }

  async storeBilan(bilan: BilanSignature): Promise<void> {
    try {
      await kv.set(`${this.PREFIX}${bilan.token}`, bilan);
      await kv.set(`${this.CLIENT_INDEX_PREFIX}${bilan.clientId}`, {
        token: bilan.token,
        clientId: bilan.clientId
      });
    } catch (error) {
      console.error(`❌ BilanStore.storeBilan(${bilan.token}) failed:`, error);
    }
  }

  async updateBilan(token: string, updates: Partial<BilanSignature>): Promise<void> {
    try {
      const existing = await this.getBilan(token);
      if (!existing) return;
      await kv.set(`${this.PREFIX}${token}`, {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ BilanStore.updateBilan(${token}) failed:`, error);
    }
  }

  async deleteBilan(token: string): Promise<void> {
    try {
      const bilan = await this.getBilan(token);
      if (bilan) {
        await kv.del(`${this.CLIENT_INDEX_PREFIX}${bilan.clientId}`);
      }
      await kv.del(`${this.PREFIX}${token}`);
    } catch (error) {
      console.error(`❌ BilanStore.deleteBilan(${token}) failed:`, error);
    }
  }

  async getTasksForBilan(userId: string, clientId: string): Promise<TaskBilan[]> {
    try {
      const items = await kv.getByPrefix(`${this.TASK_PREFIX}${userId}:${clientId}:`);
      return items.filter(item => item !== null && item !== undefined) as TaskBilan[];
    } catch (error) {
      console.error(`❌ BilanStore.getTasksForBilan(${userId}, ${clientId}) failed:`, error);
      return [];
    }
  }

  async updateTask(userId: string, clientId: string, taskId: string, task: TaskBilan): Promise<void> {
    try {
      await kv.set(`${this.TASK_PREFIX}${userId}:${clientId}:${taskId}`, task);
    } catch (error) {
      console.error(`❌ BilanStore.updateTask(${taskId}) failed:`, error);
    }
  }
}

export const bilanStore = new BilanStore();
