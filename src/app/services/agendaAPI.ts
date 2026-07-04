import type { AgendaEvent } from '../types/agenda';

/**
 * API pour gérer les événements d'agenda
 * Utilise localStorage pour le stockage
 */
export const agendaAPI = {
  /**
   * Récupère tous les événements d'agenda
   */
  getAll: async (): Promise<AgendaEvent[]> => {
    try {
      const userId = localStorage.getItem('user_id') || 'default';
      const key = `agenda_events_${userId}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return [];
      }
      
      const events = JSON.parse(stored);
      console.log(`✅ ${events.length} événements chargés depuis l'agenda`);
      return events;
    } catch (error) {
      console.error('❌ Erreur chargement événements agenda:', error);
      return [];
    }
  },

  /**
   * Récupère un événement par ID
   */
  getById: async (eventId: string): Promise<AgendaEvent | null> => {
    try {
      const events = await agendaAPI.getAll();
      const event = events.find(e => e.id === eventId);
      return event || null;
    } catch (error) {
      console.error('❌ Erreur récupération événement:', error);
      return null;
    }
  },

  /**
   * Récupère tous les événements d'un client
   */
  getByClientId: async (clientId: string): Promise<AgendaEvent[]> => {
    try {
      const events = await agendaAPI.getAll();
      return events.filter(e => e.clientId === clientId);
    } catch (error) {
      console.error('❌ Erreur récupération événements client:', error);
      return [];
    }
  },

  /**
   * Crée un nouvel événement d'agenda
   */
  create: async (eventData: Omit<AgendaEvent, 'id' | 'createdAt'>): Promise<AgendaEvent> => {
    try {
      const userId = localStorage.getItem('user_id') || 'default';
      const key = `agenda_events_${userId}`;
      
      const events = await agendaAPI.getAll();
      
      const newEvent: AgendaEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      
      events.push(newEvent);
      localStorage.setItem(key, JSON.stringify(events));
      
      console.log('✅ Événement agenda créé:', newEvent.title);
      return newEvent;
    } catch (error) {
      console.error('❌ Erreur création événement agenda:', error);
      throw error;
    }
  },

  /**
   * Met à jour un événement existant
   */
  update: async (eventId: string, updates: Partial<AgendaEvent>): Promise<AgendaEvent | null> => {
    try {
      const userId = localStorage.getItem('user_id') || 'default';
      const key = `agenda_events_${userId}`;
      
      const events = await agendaAPI.getAll();
      const eventIndex = events.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        console.warn('⚠️ Événement non trouvé:', eventId);
        return null;
      }
      
      events[eventIndex] = {
        ...events[eventIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      localStorage.setItem(key, JSON.stringify(events));
      
      console.log('✅ Événement agenda mis à jour:', events[eventIndex].title);
      return events[eventIndex];
    } catch (error) {
      console.error('❌ Erreur mise à jour événement agenda:', error);
      return null;
    }
  },

  /**
   * Supprime un événement
   */
  delete: async (eventId: string): Promise<boolean> => {
    try {
      const userId = localStorage.getItem('user_id') || 'default';
      const key = `agenda_events_${userId}`;
      
      const events = await agendaAPI.getAll();
      const filteredEvents = events.filter(e => e.id !== eventId);
      
      if (filteredEvents.length === events.length) {
        console.warn('⚠️ Événement non trouvé:', eventId);
        return false;
      }
      
      localStorage.setItem(key, JSON.stringify(filteredEvents));
      
      console.log('✅ Événement agenda supprimé');
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression événement agenda:', error);
      return false;
    }
  },

  /**
   * Récupère les événements d'une date spécifique
   */
  getByDate: async (date: string): Promise<AgendaEvent[]> => {
    try {
      const events = await agendaAPI.getAll();
      const targetDate = new Date(date).toISOString().split('T')[0];
      
      return events.filter(e => {
        const eventDate = new Date(e.date).toISOString().split('T')[0];
        return eventDate === targetDate;
      });
    } catch (error) {
      console.error('❌ Erreur récupération événements par date:', error);
      return [];
    }
  },

  /**
   * Récupère les événements d'une plage de dates
   */
  getByDateRange: async (startDate: string, endDate: string): Promise<AgendaEvent[]> => {
    try {
      const events = await agendaAPI.getAll();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      return events.filter(e => {
        const eventTime = new Date(e.date).getTime();
        return eventTime >= start && eventTime <= end;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('❌ Erreur récupération événements par plage:', error);
      return [];
    }
  },
};
