/**
 * ⚠️ FICHIER OBSOLÈTE - MIGRÉ VERS eventEmitter.ts
 * 
 * Ce fichier est conservé pour compatibilité temporaire.
 * Utiliser directement eventEmitter.ts pour tous les nouveaux codes.
 * 
 * Migration Path:
 * - emitTaskCreated() → Events.taskCreated()
 * - emitTaskUpdated() → Events.taskUpdated()
 * - emitTaskDeleted() → Events.taskDeleted()
 * - emitTasksBulkUpdated() → Events.tasksBulkUpdated()
 */

import { Events, eventEmitter } from './eventEmitter';

export const TASK_EVENTS = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASKS_BULK_UPDATED: 'tasks_bulk_updated',
} as const;

/**
 * @deprecated Utiliser Events.taskUpdated() à la place
 */
export function emitTaskUpdated(clientId: string, taskId?: string) {
  console.warn('⚠️ emitTaskUpdated() est obsolète. Utiliser Events.taskUpdated() à la place.');
  if (taskId) {
    Events.taskUpdated(clientId, '', taskId);
  }
}

/**
 * @deprecated Utiliser Events.taskCreated() à la place
 */
export function emitTaskCreated(clientId: string, taskId: string) {
  console.warn('⚠️ emitTaskCreated() est obsolète. Utiliser Events.taskCreated() à la place.');
  Events.taskCreated(clientId, '', taskId);
}

/**
 * @deprecated Utiliser Events.taskDeleted() à la place
 */
export function emitTaskDeleted(clientId: string, taskId: string) {
  console.warn('⚠️ emitTaskDeleted() est obsolète. Utiliser Events.taskDeleted() à la place.');
  Events.taskDeleted(clientId, '', taskId);
}

/**
 * @deprecated Utiliser Events.tasksBulkUpdated() à la place
 */
export function emitTasksBulkUpdated(clientId: string) {
  console.warn('⚠️ emitTasksBulkUpdated() est obsolète. Utiliser Events.tasksBulkUpdated() à la place.');
  Events.tasksBulkUpdated(clientId, 0);
}

/**
 * Hook pour écouter les événements de tâches
 * @deprecated Utiliser useEventListener() de useEventSystem.ts
 */
export function useTaskEvents(clientId: string, callback: (event: any) => void) {
  console.warn('⚠️ useTaskEvents() est obsolète. Utiliser useEventListener() à la place.');
  
  const handler = (event: any) => {
    if (event.clientId === clientId) {
      callback(event);
    }
  };
  
  eventEmitter.onAny(handler);
  
  return () => {
    eventEmitter.off('*', handler);
  };
}
