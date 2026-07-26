import { apiBaseUrl } from '../utils/api/info';

const API_URL = apiBaseUrl;

export const agendaAPI = {
  // ============= ÉVÉNEMENTS =============

  /**
   * Créer un événement Agenda
   */
  async createEvent(data: {
    clientId?: string;
    clientName?: string;
    taskId?: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location?: string;
    locationType?: string;
    meetingType?: string;
    source?: string;
  }) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/agenda-events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur création événement');
    return response.json();
  },

  /**
   * Interaction 3 : Créer RDV avec clientId (met à jour client.dateNextRdv)
   */
  async createClientMeeting(clientId: string, clientName: string, data: any) {
    return this.createEvent({
      clientId,
      clientName,
      ...data,
      source: 'outlook'
    });
  },

  /**
   * Interaction 4 : Récupérer les événements du mois (RDVs + Tâches + Actions)
   */
  async getMonthEvents(year: number, month: number) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/agenda/month/${year}/${month}`, { headers });
    if (!response.ok) throw new Error('Erreur chargement mois');
    return response.json();
  },

  /**
   * Interaction 4 : Synchroniser avec Outlook
   */
  async syncWithOutlook(eventId: string, outlookEventId: string) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/agenda-events/${eventId}/sync-outlook`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ outlookEventId })
    });
    if (!response.ok) throw new Error('Erreur sync Outlook');
    return response.json();
  },

  /**
   * Interaction 5 : Répondre à une invitation RDV
   */
  async respondToInvitation(eventId: string, response: 'accepted' | 'declined' | 'tentative') {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const apiResponse = await fetch(`${API_URL}/agenda-events/${eventId}/respond`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ response })
    });
    if (!apiResponse.ok) throw new Error('Erreur réponse invitation');
    return apiResponse.json();
  },

  /**
   * Récupérer un événement
   */
  async getEvent(eventId: string) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/agenda-events/${eventId}`, { headers });
    if (!response.ok) throw new Error('Événement introuvable');
    return response.json();
  }
};
