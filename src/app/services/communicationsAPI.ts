import { apiBaseUrl } from '../utils/api/info';

const API_URL = apiBaseUrl;

export const communicationsAPI = {
  // ============= HUB =============

  /**
   * Récupérer le Hub Communications (groupé par catégorie)
   */
  async getHub() {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/communications/hub`, { headers });
    if (!response.ok) throw new Error('Erreur chargement hub');
    return response.json();
  },

  // ============= INTERACTIONS =============

  /**
   * Interaction 1 : Assigner mail à un client
   */
  async assignMailToClient(commId: string, clientId: string, clientName: string) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/communications/${commId}/assign`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ clientId, clientName })
    });
    if (!response.ok) throw new Error('Erreur assignation');
    return response.json();
  },

  /**
   * Interaction 2 : Archiver et ajouter à l'historique client
   */
  async archiveMailToClientHistory(commId: string, clientId: string) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/communications/${commId}/archive`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ clientId })
    });
    if (!response.ok) throw new Error('Erreur archivage');
    return response.json();
  },

  /**
   * Marquer comme terminé
   */
  async completeMail(commId: string) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/communications/${commId}/complete`, {
      method: 'PATCH',
      headers
    });
    if (!response.ok) throw new Error('Erreur completion');
    return response.json();
  }
};
