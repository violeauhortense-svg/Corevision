// PocketBase Client pour Deno/Hono
// Remplace deno-postgres pour le dev local

const POCKETBASE_URL = Deno.env.get('POCKETBASE_URL') || 'http://pc1.tailscale:8090';

interface PBRecord {
  id: string;
  [key: string]: any;
}

export class PocketBaseClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private adminEmail: string | null = null;
  private adminPassword: string | null = null;

  constructor(baseUrl: string = POCKETBASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ─── Auth ───────────────────────────────────────────────────────────
  async authenticate(email: string, password: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      this.authToken = data.token;
      return { user: data.record, token: data.token };
    } catch (err: any) {
      throw new Error(`Auth failed: ${err.message}`);
    }
  }

  // Server-side CRUD operations run as a superuser so they bypass the
  // per-collection API rules meant for end-user auth (which the backend
  // enforces itself via its own JWT, not PocketBase's).
  async authenticateAsAdmin(): Promise<void> {
    this.adminEmail = Deno.env.get('PB_ADMIN_EMAIL') || 'admin@corevision.local';
    this.adminPassword = Deno.env.get('PB_ADMIN_PASSWORD') || 'AdminCoreVision2026!';

    const res = await fetch(`${this.baseUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: this.adminEmail, password: this.adminPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`PocketBase admin auth failed: ${data.message || res.statusText}`);
    }

    const data = await res.json();
    this.authToken = data.token;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  // The superuser token PocketBase issues has a finite lifetime. This
  // backend process stays up indefinitely, so without this every CRUD
  // call would eventually start failing with "Only superusers can
  // perform this action" until someone noticed and restarted it. Any
  // request that comes back 401/403 (or with that specific message)
  // triggers one re-authentication + retry instead of surfacing the
  // error, as long as we know the admin credentials to re-auth with.
  private async fetchWithReauth(url: string, init: RequestInit): Promise<Response> {
    let res = await fetch(url, { ...init, headers: this.getHeaders() });

    if ((res.status === 401 || res.status === 403) && this.adminEmail && this.adminPassword) {
      const bodyText = await res.clone().text().catch(() => '');
      if (res.status === 401 || bodyText.includes('superuser')) {
        try {
          await this.authenticateAsAdmin();
          res = await fetch(url, { ...init, headers: this.getHeaders() });
        } catch {
          // If re-auth itself fails, fall through and return the
          // original (still-failing) response below.
        }
      }
    }

    return res;
  }

  // ─── Generic CRUD ───────────────────────────────────────────────────
  async getRecord(collection: string, id: string): Promise<PBRecord> {
    try {
      const res = await this.fetchWithReauth(`${this.baseUrl}/api/collections/${collection}/records/${id}`, {});

      if (!res.ok) throw new Error(`Record not found: ${id}`);
      return await res.json();
    } catch (err: any) {
      console.error(`Error fetching ${collection}/${id}:`, err.message);
      throw err;
    }
  }

  async listRecords(
    collection: string,
    query?: { filter?: string; sort?: string; perPage?: number; page?: number }
  ): Promise<{ items: PBRecord[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (query?.filter) params.append('filter', query.filter);
      if (query?.sort) params.append('sort', query.sort);
      if (query?.perPage) params.append('perPage', query.perPage.toString());
      if (query?.page) params.append('page', query.page.toString());

      const res = await this.fetchWithReauth(`${this.baseUrl}/api/collections/${collection}/records?${params}`, {});

      if (!res.ok) throw new Error(`Failed to list ${collection}`);
      const data = await res.json();
      return { items: data.items || [], total: data.totalItems || 0 };
    } catch (err: any) {
      console.error(`Error listing ${collection}:`, err.message);
      throw err;
    }
  }

  async createRecord(collection: string, data: any): Promise<PBRecord> {
    try {
      const res = await this.fetchWithReauth(`${this.baseUrl}/api/collections/${collection}/records`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        // err.message alone (e.g. "Failed to create record.") hides the
        // actual per-field validation reason in err.data - log it too or
        // every validation failure looks identical and undiagnosable.
        throw new Error(`${err.message || 'Create failed'} ${JSON.stringify(err.data || {})}`);
      }
      return await res.json();
    } catch (err: any) {
      console.error(`Error creating ${collection}:`, err.message);
      throw err;
    }
  }

  async updateRecord(collection: string, id: string, data: any): Promise<PBRecord> {
    try {
      const res = await this.fetchWithReauth(`${this.baseUrl}/api/collections/${collection}/records/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Update failed for ${id}`);
      return await res.json();
    } catch (err: any) {
      console.error(`Error updating ${collection}/${id}:`, err.message);
      throw err;
    }
  }

  async deleteRecord(collection: string, id: string): Promise<void> {
    try {
      const res = await this.fetchWithReauth(`${this.baseUrl}/api/collections/${collection}/records/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(`Delete failed for ${id}`);
    } catch (err: any) {
      console.error(`Error deleting ${collection}/${id}:`, err.message);
      throw err;
    }
  }

  // ─── Hub Mails Specific ─────────────────────────────────────────────
  async getMailsByClient(clientId: string): Promise<PBRecord[]> {
    const query = { filter: `clientId = "${clientId}"`, sort: '-sentAt' };
    const result = await this.listRecords('hub_mails', query);
    return result.items;
  }

  async getMailsByStatus(status: string): Promise<PBRecord[]> {
    const query = { filter: `traitementStatus = "${status}"`, sort: '-sentAt' };
    const result = await this.listRecords('hub_mails', query);
    return result.items;
  }

  async updateMailStatus(mailId: string, status: string): Promise<PBRecord> {
    return this.updateRecord('hub_mails', mailId, { traitementStatus: status });
  }

  // ─── Hub Calls Specific ─────────────────────────────────────────────
  async getCallsByClient(clientId: string): Promise<PBRecord[]> {
    const query = { filter: `clientId = "${clientId}"`, sort: '-dueDate' };
    const result = await this.listRecords('hub_calls', query);
    return result.items;
  }

  // ─── Helpers ────────────────────────────────────────────────────────
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }
}

// Export singleton instance
export const pb = new PocketBaseClient();
