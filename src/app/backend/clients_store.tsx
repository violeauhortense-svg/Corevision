// ClientsStore - Domain-specific facade for client-related KV operations
// Centralizes all getByPrefix() calls for clients to break the god node coupling

import * as kv from './kv_store.tsx';

export interface Client {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  phone?: string;
  company?: string;
  patrimoine_total?: number;
  status: 'active' | 'archived' | 'prospect';
  created_at: string;
  updated_at: string;
}

export interface ClientData {
  id: string;
  client_id: string;
  data_type: 'profile' | 'patrimoine' | 'revenues' | 'family';
  content: Record<string, any>;
  collected_at: string;
  updated_at: string;
}

class ClientsStore {
  private readonly CLIENTS_PREFIX = 'client:';

  // Get all clients
  async getAllClients(): Promise<Client[]> {
    try {
      const items = await kv.getByPrefix(this.CLIENTS_PREFIX);
      return items.filter(c => c !== null && c !== undefined);
    } catch (error) {
      console.error('❌ ClientsStore.getAllClients() failed:', error);
      return [];
    }
  }

  // Get client by ID
  async getClient(id: string): Promise<Client | null> {
    try {
      return await kv.get(`${this.CLIENTS_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ ClientsStore.getClient(${id}) failed:`, error);
      return null;
    }
  }

  // Get client by email
  async getClientByEmail(email: string): Promise<Client | null> {
    try {
      const allClients = await this.getAllClients();
      return allClients.find(c => c.email === email) || null;
    } catch (error) {
      console.error(`❌ ClientsStore.getClientByEmail(${email}) failed:`, error);
      return null;
    }
  }

  // Search clients by name
  async searchClients(query: string): Promise<Client[]> {
    try {
      const allClients = await this.getAllClients();
      if (!query || !query.trim()) return allClients;

      const queryLower = query.toLowerCase();
      return allClients.filter(c =>
        c.nom.toLowerCase().includes(queryLower) ||
        c.prenom.toLowerCase().includes(queryLower) ||
        c.email.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error(`❌ ClientsStore.searchClients(${query}) failed:`, error);
      return [];
    }
  }

  // Get clients by status
  async getClientsByStatus(status: 'active' | 'archived' | 'prospect'): Promise<Client[]> {
    try {
      const allClients = await this.getAllClients();
      return allClients.filter(c => c.status === status);
    } catch (error) {
      console.error(`❌ ClientsStore.getClientsByStatus(${status}) failed:`, error);
      return [];
    }
  }

  // Store a client
  async storeClient(id: string, client: Client): Promise<void> {
    try {
      await kv.set(`${this.CLIENTS_PREFIX}${id}`, client);
    } catch (error) {
      console.error(`❌ ClientsStore.storeClient(${id}) failed:`, error);
    }
  }

  // Update client status
  async updateClientStatus(id: string, status: 'active' | 'archived' | 'prospect'): Promise<void> {
    try {
      const client = await this.getClient(id);
      if (client) {
        client.status = status;
        client.updated_at = new Date().toISOString();
        await this.storeClient(id, client);
      }
    } catch (error) {
      console.error(`❌ ClientsStore.updateClientStatus(${id}) failed:`, error);
    }
  }

  // Delete a client (archive)
  async deleteClient(id: string): Promise<void> {
    try {
      await this.updateClientStatus(id, 'archived');
    } catch (error) {
      console.error(`❌ ClientsStore.deleteClient(${id}) failed:`, error);
    }
  }

  // Permanently delete a client
  async permanentlyDeleteClient(id: string): Promise<void> {
    try {
      await kv.del(`${this.CLIENTS_PREFIX}${id}`);
    } catch (error) {
      console.error(`❌ ClientsStore.permanentlyDeleteClient(${id}) failed:`, error);
    }
  }

  // Delete all clients
  async deleteAllClients(): Promise<void> {
    try {
      await kv.delByPrefix(this.CLIENTS_PREFIX);
    } catch (error) {
      console.error('❌ ClientsStore.deleteAllClients() failed:', error);
    }
  }

  // Get client count
  async getClientCount(): Promise<number> {
    try {
      const clients = await this.getAllClients();
      return clients.length;
    } catch (error) {
      console.error('❌ ClientsStore.getClientCount() failed:', error);
      return 0;
    }
  }

  // Get active client count
  async getActiveClientCount(): Promise<number> {
    try {
      const activeClients = await this.getClientsByStatus('active');
      return activeClients.length;
    } catch (error) {
      console.error('❌ ClientsStore.getActiveClientCount() failed:', error);
      return 0;
    }
  }
}

export const clientsStore = new ClientsStore();
