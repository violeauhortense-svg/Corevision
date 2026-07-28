import type { HubMail, CallToHandle, HubTab, HubStats, MailTraitementStatus } from '../types/mail';

// Hub Communication uses relative URLs (routed by Vercel to Render)
const API_URL = '/api/hub';

/**
 * Client API pour le Hub Communication
 * Gère tous les appels API vers le backend
 */
export const hubCommunicationAPI = {
  // ============= AUTHENTIFICATION =============

  _getHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  _handleError(response: Response, context: string) {
    if (!response.ok) {
      throw new Error(`${context}: ${response.status} ${response.statusText}`);
    }
  },

  // ============= MAILS =============

  /**
   * Charger les mails d'un onglet
   */
  async getMailsByTab(tab: HubTab, limit = 50, skip = 0): Promise<{ mails: HubMail[]; total: number; stats: HubStats }> {
    const params = new URLSearchParams({ tab, limit: String(limit), skip: String(skip) });
    const response = await fetch(`${API_URL}/mails?${params}`, {
      headers: this._getHeaders(),
    });

    this._handleError(response, 'Erreur chargement mails');
    return response.json();
  },

  /**
   * Charger un mail spécifique
   */
  async getMailById(mailId: string): Promise<HubMail> {
    const response = await fetch(`${API_URL}/mails/${mailId}`, {
      headers: this._getHeaders(),
    });

    this._handleError(response, 'Erreur chargement mail');
    return response.json();
  },

  /**
   * Mettre à jour un mail
   */
  async updateMail(
    mailId: string,
    updates: {
      traitementStatus?: MailTraitementStatus;
      processingNotes?: string;
      clientId?: string;
      clientName?: string;
      clientEmail?: string;
    }
  ): Promise<HubMail> {
    const response = await fetch(`${API_URL}/mails/${mailId}`, {
      method: 'PUT',
      headers: this._getHeaders(),
      body: JSON.stringify(updates),
    });

    this._handleError(response, 'Erreur mise à jour mail');
    return response.json();
  },

  /**
   * Changer le statut de traitement
   */
  async updateMailStatus(mailId: string, status: MailTraitementStatus): Promise<HubMail> {
    return this.updateMail(mailId, { traitementStatus: status });
  },

  /**
   * Associer un mail à un client
   */
  async associateClient(
    mailId: string,
    clientId: string,
    clientName: string,
    clientEmail?: string
  ): Promise<HubMail> {
    return this.updateMail(mailId, { clientId, clientName, clientEmail });
  },

  // ============= NOTES =============

  /**
   * Ajouter une note à un mail
   */
  async addMailNote(
    mailId: string,
    content: string,
    createdBy: string,
    createdByName: string
  ) {
    const response = await fetch(`${API_URL}/mails/${mailId}/notes`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({ content, createdBy, createdByName }),
    });

    this._handleError(response, 'Erreur ajout note');
    return response.json();
  },

  /**
   * Supprimer une note
   */
  async deleteMailNote(mailId: string, noteId: string) {
    const response = await fetch(`${API_URL}/mails/${mailId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: this._getHeaders(),
    });

    this._handleError(response, 'Erreur suppression note');
    return response.json();
  },

  // ============= RÉPONSES =============

  /**
   * Envoyer une réponse à un mail
   */
  async sendMailReply(
    mailId: string,
    to: string[],
    subject: string,
    body: string,
    cc?: string[]
  ): Promise<HubMail> {
    const response = await fetch(`${API_URL}/mails/${mailId}/reply`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({ to, subject, body, cc }),
    });

    this._handleError(response, 'Erreur envoi réponse');
    return response.json();
  },

  // ============= RECHERCHE =============

  /**
   * Rechercher des mails
   */
  async searchMails(query: string, tab?: HubTab, limit = 50): Promise<HubMail[]> {
    const response = await fetch(`${API_URL}/mails/search`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({ query, tab, limit }),
    });

    this._handleError(response, 'Erreur recherche');
    return response.json();
  },

  // ============= STATISTIQUES =============

  /**
   * Récupérer les statistiques
   */
  async getStats(): Promise<HubStats> {
    const response = await fetch(`${API_URL}/stats`, {
      headers: this._getHeaders(),
    });

    this._handleError(response, 'Erreur chargement stats');
    return response.json();
  },

  // ============= APPELS =============

  /**
   * Charger les appels à traiter
   */
  async getCalls(
    status?: 'pending' | 'in_progress' | 'completed',
    limit = 50,
    skip = 0
  ): Promise<{ calls: CallToHandle[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), skip: String(skip) });
    if (status) params.append('status', status);

    const response = await fetch(`${API_URL}/calls?${params}`, {
      headers: this._getHeaders(),
    });

    this._handleError(response, 'Erreur chargement appels');
    return response.json();
  },

  /**
   * Charger un appel spécifique
   */
  async getCallById(callId: string): Promise<CallToHandle> {
    const response = await fetch(`${API_URL}/calls/${callId}`, {
      headers: this._getHeaders(),
    });

    this._handleError(response, 'Erreur chargement appel');
    return response.json();
  },

  /**
   * Créer un nouvel appel
   */
  async createCall(call: Omit<CallToHandle, 'id' | 'createdAt'>): Promise<CallToHandle> {
    const response = await fetch(`${API_URL}/calls`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(call),
    });

    this._handleError(response, 'Erreur création appel');
    return response.json();
  },

  /**
   * Mettre à jour un appel
   */
  async updateCall(callId: string, updates: Partial<CallToHandle>): Promise<CallToHandle> {
    const response = await fetch(`${API_URL}/calls/${callId}`, {
      method: 'PUT',
      headers: this._getHeaders(),
      body: JSON.stringify(updates),
    });

    this._handleError(response, 'Erreur mise à jour appel');
    return response.json();
  },

  /**
   * Marquer un appel comme complété
   */
  async completeCall(callId: string): Promise<CallToHandle> {
    const response = await fetch(`${API_URL}/calls/${callId}/complete`, {
      method: 'POST',
      headers: this._getHeaders(),
    });

    this._handleError(response, 'Erreur complétion appel');
    return response.json();
  },
};
