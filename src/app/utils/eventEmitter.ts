/**
 * 🔔 Système d'événements centralisé pour le CRM
 * Permet la synchronisation cross-modules et le rafraîchissement automatique
 */

export type HistoryEventType = 
  | 'meeting_created'
  | 'meeting_updated'
  | 'email_sent'
  | 'call_made'
  | 'document_uploaded'
  | 'recommendation_created'
  | 'recommendation_updated'
  | 'recommendation_validated'
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'objective_created'
  | 'objective_completed'
  | 'client_status_changed'
  | 'workflow_step_completed'
  | 'task_deleted'
  | 'tasks_bulk_updated'
  | 'client_updated'
  | 'client_created'
  | 'client_deleted'
  | 'patrimoine_updated'
  | 'revenus_updated'
  | 'imposition_updated'
  | 'corevision_order_created'
  | 'corevision_order_validated'
  | 'audit_generated'
  | 'incoherence_detected'
  | 'incoherence_resolved'
  | 'recommandation_generated';

export interface HistoryEvent {
  id: string;
  clientId: string;
  type: HistoryEventType;
  date: string;
  title: string;
  description: string;
  metadata?: {
    recommendationId?: string;
    taskId?: string;
    objectiveId?: string;
    documentId?: string;
    oldStatus?: string;
    newStatus?: string;
    [key: string]: any;
  };
}

export type EventListener = (event: HistoryEvent) => void;

class EventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();
  private eventHistory: HistoryEvent[] = [];

  /**
   * S'abonner à un type d'événement
   */
  on(eventType: string, callback: EventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  /**
   * S'abonner à tous les événements
   */
  onAny(callback: EventListener) {
    this.on('*', callback);
  }

  /**
   * Se désabonner d'un événement
   */
  off(eventType: string, callback: EventListener) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Émettre un événement
   */
  emit(event: HistoryEvent) {
    // Ajouter à l'historique local
    this.eventHistory.push(event);

    // Sauvegarder dans localStorage
    this.saveToLocalStorage(event);

    // Notifier les listeners spécifiques
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }

    // Notifier les listeners globaux
    const globalCallbacks = this.listeners.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach(callback => callback(event));
    }

    console.log('📢 Event emitted:', event.type, event);
  }

  /**
   * Créer et émettre un événement
   */
  createEvent(
    clientId: string,
    type: HistoryEventType,
    title: string,
    description: string,
    metadata?: HistoryEvent['metadata']
  ): HistoryEvent {
    const event: HistoryEvent = {
      id: crypto.randomUUID(),
      clientId,
      type,
      date: new Date().toISOString(),
      title,
      description,
      metadata,
    };

    this.emit(event);
    return event;
  }

  /**
   * Récupérer les événements d'un client
   */
  getClientEvents(clientId: string): HistoryEvent[] {
    const storedEvents = this.loadFromLocalStorage();
    return storedEvents.filter(event => event.clientId === clientId);
  }

  /**
   * Récupérer tous les événements
   */
  getAllEvents(): HistoryEvent[] {
    return this.loadFromLocalStorage();
  }

  /**
   * Sauvegarder dans localStorage
   */
  private saveToLocalStorage(event: HistoryEvent) {
    try {
      const existingEvents = this.loadFromLocalStorage();
      const updatedEvents = [...existingEvents, event];
      
      // Garder seulement les 1000 derniers événements pour éviter la surcharge
      const limitedEvents = updatedEvents.slice(-1000);
      
      localStorage.setItem('crm_events_history', JSON.stringify(limitedEvents));
    } catch (error) {
      console.error('Error saving event to localStorage:', error);
    }
  }

  /**
   * Charger depuis localStorage
   */
  private loadFromLocalStorage(): HistoryEvent[] {
    try {
      const stored = localStorage.getItem('crm_events_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading events from localStorage:', error);
      return [];
    }
  }

  /**
   * Nettoyer l'historique (utile pour les tests)
   */
  clearHistory() {
    this.eventHistory = [];
    localStorage.removeItem('crm_events_history');
  }
}

// Instance singleton
export const eventEmitter = new EventEmitter();

/**
 * 🎯 Helpers pour créer des événements rapidement
 */
export const Events = {
  // Rendez-vous
  meetingCreated: (clientId: string, title: string, date: string) =>
    eventEmitter.createEvent(
      clientId,
      'meeting_created',
      'Rendez-vous planifié',
      `${title} prévu le ${new Date(date).toLocaleDateString('fr-FR')}`,
      { date }
    ),

  meetingUpdated: (clientId: string, title: string, date: string) =>
    eventEmitter.createEvent(
      clientId,
      'meeting_updated',
      'Rendez-vous modifié',
      `${title} replanifié le ${new Date(date).toLocaleDateString('fr-FR')}`,
      { date }
    ),

  // Emails
  emailSent: (clientId: string, subject: string, recipient: string) =>
    eventEmitter.createEvent(
      clientId,
      'email_sent',
      'Email envoyé',
      `Email "${subject}" envoyé à ${recipient}`,
      { subject, recipient }
    ),

  // Appels
  callMade: (clientId: string, duration: string, notes?: string) =>
    eventEmitter.createEvent(
      clientId,
      'call_made',
      'Appel téléphonique',
      `Appel de ${duration}${notes ? ` - ${notes}` : ''}`,
      { duration, notes }
    ),

  // Documents
  documentUploaded: (clientId: string, documentName: string, category: string) =>
    eventEmitter.createEvent(
      clientId,
      'document_uploaded',
      'Document ajouté',
      `${documentName} (${category})`,
      { documentName, category }
    ),

  // Recommandations
  recommendationCreated: (clientId: string, recommendationTitle: string, recommendationId: string) =>
    eventEmitter.createEvent(
      clientId,
      'recommendation_created',
      'Nouvelle recommandation',
      recommendationTitle,
      { recommendationId }
    ),

  recommendationUpdated: (clientId: string, recommendationTitle: string, oldStatus: string, newStatus: string, recommendationId: string) =>
    eventEmitter.createEvent(
      clientId,
      'recommendation_updated',
      'Recommandation mise à jour',
      `${recommendationTitle} : ${oldStatus} → ${newStatus}`,
      { recommendationId, oldStatus, newStatus }
    ),

  recommendationValidated: (clientId: string, recommendationTitle: string, recommendationId: string) =>
    eventEmitter.createEvent(
      clientId,
      'recommendation_validated',
      'Recommandation validée',
      recommendationTitle,
      { recommendationId }
    ),

  // Tâches
  taskCreated: (clientId: string, taskTitle: string, taskId: string, dueDate?: string) =>
    eventEmitter.createEvent(
      clientId,
      'task_created',
      'Tâche créée',
      `${taskTitle}${dueDate ? ` - Échéance : ${new Date(dueDate).toLocaleDateString('fr-FR')}` : ''}`,
      { taskId, dueDate }
    ),

  taskCompleted: (clientId: string, taskTitle: string, taskId: string) =>
    eventEmitter.createEvent(
      clientId,
      'task_completed',
      'Tâche terminée',
      taskTitle,
      { taskId }
    ),

  taskUpdated: (clientId: string, taskTitle: string, taskId: string) =>
    eventEmitter.createEvent(
      clientId,
      'task_updated',
      'Tâche mise à jour',
      taskTitle,
      { taskId }
    ),

  // Objectifs
  objectiveCreated: (clientId: string, objectiveDescription: string, objectiveId: string) =>
    eventEmitter.createEvent(
      clientId,
      'objective_created',
      'Nouvel objectif',
      objectiveDescription,
      { objectiveId }
    ),

  objectiveCompleted: (clientId: string, objectiveDescription: string, objectiveId: string) =>
    eventEmitter.createEvent(
      clientId,
      'objective_completed',
      'Objectif atteint',
      objectiveDescription,
      { objectiveId }
    ),

  // Statut client
  clientStatusChanged: (clientId: string, oldStatus: string, newStatus: string) =>
    eventEmitter.createEvent(
      clientId,
      'client_status_changed',
      'Statut client modifié',
      `${oldStatus} → ${newStatus}`,
      { oldStatus, newStatus }
    ),

  // Workflow
  workflowStepCompleted: (clientId: string, recommendationTitle: string, stepLabel: string, recommendationId: string) =>
    eventEmitter.createEvent(
      clientId,
      'workflow_step_completed',
      'Étape de mise en place validée',
      `${recommendationTitle} - ${stepLabel}`,
      { recommendationId, stepLabel }
    ),
  
  // 🆕 Tâches avancées
  taskDeleted: (clientId: string, taskTitle: string, taskId: string) =>
    eventEmitter.createEvent(
      clientId,
      'task_deleted',
      'Tâche supprimée',
      taskTitle,
      { taskId }
    ),
  
  tasksBulkUpdated: (clientId: string, count: number) =>
    eventEmitter.createEvent(
      clientId,
      'tasks_bulk_updated',
      'Mise à jour en masse',
      `${count} tâche(s) mise(s) à jour`,
      { count }
    ),
  
  // 🆕 Clients
  clientCreated: (clientId: string, clientName: string) =>
    eventEmitter.createEvent(
      clientId,
      'client_created',
      'Nouveau client',
      `Client ${clientName} créé`,
      { clientName }
    ),
  
  clientUpdated: (clientId: string, clientName: string, field?: string) =>
    eventEmitter.createEvent(
      clientId,
      'client_updated',
      'Client modifié',
      field ? `${clientName} - ${field} modifié` : `${clientName} modifié`,
      { clientName, field }
    ),
  
  clientDeleted: (clientId: string, clientName: string) =>
    eventEmitter.createEvent(
      clientId,
      'client_deleted',
      'Client supprimé',
      `Client ${clientName} supprimé`,
      { clientName }
    ),
  
  // 🆕 Patrimoine
  patrimoineUpdated: (clientId: string, type: 'actifs_financiers' | 'immobilier' | 'passifs') =>
    eventEmitter.createEvent(
      clientId,
      'patrimoine_updated',
      'Patrimoine modifié',
      `${type.replace('_', ' ')} mis à jour`,
      { type }
    ),
  
  revenusUpdated: (clientId: string) =>
    eventEmitter.createEvent(
      clientId,
      'revenus_updated',
      'Revenus modifiés',
      'Revenus et charges mis à jour',
      {}
    ),
  
  impositionUpdated: (clientId: string) =>
    eventEmitter.createEvent(
      clientId,
      'imposition_updated',
      'Imposition modifiée',
      'Données fiscales mises à jour',
      {}
    ),
  
  // 🆕 CoreVision & Audit
  corevisionOrderCreated: (clientId: string, orderId: string, type: string) =>
    eventEmitter.createEvent(
      clientId,
      'corevision_order_created',
      'Commande CoreVision créée',
      `Commande ${type} initiée`,
      { orderId, type }
    ),
  
  corevisionOrderValidated: (clientId: string, orderId: string) =>
    eventEmitter.createEvent(
      clientId,
      'corevision_order_validated',
      'Commande CoreVision validée',
      'Validation administrateur effectuée',
      { orderId }
    ),
  
  auditGenerated: (clientId: string, auditType: string) =>
    eventEmitter.createEvent(
      clientId,
      'audit_generated',
      'Audit généré',
      `Audit ${auditType} disponible`,
      { auditType }
    ),
  
  // 🆕 Incohérences
  incoherenceDetected: (clientId: string, ruleId: string, severity: string) =>
    eventEmitter.createEvent(
      clientId,
      'incoherence_detected',
      'Incohérence détectée',
      `Incohérence ${ruleId} (${severity})`,
      { ruleId, severity }
    ),
  
  incoherenceResolved: (clientId: string, ruleId: string, action: string) =>
    eventEmitter.createEvent(
      clientId,
      'incoherence_resolved',
      'Incohérence résolue',
      `${ruleId} - ${action}`,
      { ruleId, action }
    ),
  
  // 🆕 Recommandations IA
  recommandationGenerated: (clientId: string, count: number, gainPotentiel: number) =>
    eventEmitter.createEvent(
      clientId,
      'recommandation_generated',
      'Recommandations générées',
      `${count} recommandation(s) - Gain potentiel: ${gainPotentiel.toLocaleString('fr-FR')} €/an`,
      { count, gainPotentiel }
    ),
};