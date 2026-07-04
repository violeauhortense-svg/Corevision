import { useEffect, useState, useCallback, useRef } from 'react';
import { eventEmitter, type HistoryEvent, type HistoryEventType } from './eventEmitter';

/**
 * Hook pour récupérer l'historique des événements d'un client
 */
export function useClientHistory(clientId: string) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);

  useEffect(() => {
    // Charger les événements initiaux
    const loadedEvents = eventEmitter.getClientEvents(clientId);
    setEvents(loadedEvents);

    // Créer un handler pour les nouveaux événements
    const handler = (newEvent: HistoryEvent) => {
      if (newEvent.clientId === clientId) {
        setEvents(prev => [...prev, newEvent]);
      }
    };

    // S'abonner aux événements
    eventEmitter.onAny(handler);

    // Se désabonner au démontage
    return () => {
      eventEmitter.off('*', handler);
    };
  }, [clientId]);

  return events;
}

/**
 * Hook pour écouter les événements du système
 */
export function useEventListener(
  eventType: HistoryEventType | '*',
  callback: (event: HistoryEvent) => void
) {
  const callbackRef = useRef(callback);
  
  // Mettre à jour la référence à chaque rendu
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const handler = (event: HistoryEvent) => {
      callbackRef.current(event);
    };

    if (eventType === '*') {
      eventEmitter.onAny(handler);
    } else {
      eventEmitter.on(eventType, handler);
    }

    return () => {
      eventEmitter.off(eventType, handler);
    };
  }, [eventType]);
}

/**
 * Hook pour recalculer automatiquement les KPI
 */
export function useClientKPI(
  clientId: string,
  tasks: any[],
  recommendations: any[],
  lastMeetingDate?: string,
  nextMeetingDate?: string
) {
  const [kpis, setKpis] = useState({
    followUpScore: 0,
    activeRecommendations: 0,
    implementedStrategies: 0,
    pendingActions: 0,
  });

  const calculateKPIs = useCallback(() => {
    // Score de suivi client (0-100)
    let followUpScore = 0;
    if (lastMeetingDate) followUpScore += 25;
    if (nextMeetingDate) followUpScore += 25;
    
    const activeRecs = recommendations?.filter(r => 
      r.status && !['Abandonnée', 'Mise en place'].includes(r.status)
    ).length || 0;
    if (activeRecs > 0) followUpScore += 25;
    
    const implemented = recommendations?.filter(r => r.completed || r.status === 'Mise en place').length || 0;
    if (implemented > 0) followUpScore += 25;

    // Actions en attente
    const pendingActions = tasks?.filter(task => task.status !== 'completed').length || 0;

    setKpis({
      followUpScore,
      activeRecommendations: activeRecs,
      implementedStrategies: implemented,
      pendingActions,
    });
  }, [tasks, recommendations, lastMeetingDate, nextMeetingDate]);

  // Calculer initialement
  useEffect(() => {
    calculateKPIs();
  }, [calculateKPIs]);

  // Recalculer quand un événement pertinent se produit
  useEffect(() => {
    const handler = (event: HistoryEvent) => {
      if (event.clientId === clientId) {
        // Recalculer pour les événements qui affectent les KPI
        if (
          event.type === 'task_completed' ||
          event.type === 'task_created' ||
          event.type === 'recommendation_updated' ||
          event.type === 'recommendation_validated' ||
          event.type === 'meeting_created'
        ) {
          calculateKPIs();
        }
      }
    };

    eventEmitter.onAny(handler);

    return () => {
      eventEmitter.off('*', handler);
    };
  }, [clientId, calculateKPIs]);

  return kpis;
}

/**
 * Hook pour déclencher un rafraîchissement manuel
 */
export function useRefreshTrigger() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const handler = () => {
      setRefreshKey(prev => prev + 1);
    };

    eventEmitter.onAny(handler);

    return () => {
      eventEmitter.off('*', handler);
    };
  }, []);

  return { refreshKey, refresh };
}
