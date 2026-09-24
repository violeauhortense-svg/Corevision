/**
 * CLIENT TASKS SERVICE
 *
 * Centralizes read/write access to the pipeline task checklists stored on
 * each client record (client.taches[status][] - see TASK_DEFINITIONS).
 * This is the single source of truth shared by TasksTab (per-client view)
 * and TodoView (cross-client "all my open tasks" view), so a task
 * completed from either place is immediately consistent in the other.
 */

import { apiBaseUrl } from '../utils/api/info';
import { ClientService } from './ClientService';
import type { Client } from './ClientService';
import { TASK_DEFINITIONS, getTaskDefs } from '../components/tasks/taskDefinitions';

export const STATUSES = [
  'Prospect',
  'Découverte',
  'Simulation',
  'Lettre Mission',
  'Rapport/Audit',
  'Suivi MEP',
  'Suivi CSP',
  'Arbitrage',
];

export function normalizedClientStatus(client: Pick<Client, 'statusOuvert' | 'status'>): string {
  const raw = client.statusOuvert || client.status || 'Prospect';
  const match = STATUSES.find((s) => s.toLowerCase() === String(raw).toLowerCase());
  return match || 'Prospect';
}

// Every task id is unique across all statuses (p1, d1, s1, ...), so the
// status a task belongs to can be recovered from its id alone.
export function findStatusForTaskId(taskId: string): string | undefined {
  return Object.entries(TASK_DEFINITIONS).find(([, defs]) => defs.some((d) => d.id === taskId))?.[0];
}

export interface OpenClientTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  status: 'pending' | 'validated' | 'na';
  clientId: string;
  clientName: string;
  clientStatus: string;
  deadline?: string;
}

// Tâches jugées inutiles à faire remonter dans la To Do List agrégée -
// elles restent normalement présentes et exigibles dans le pipeline
// propre à chaque client (onglet Tâches de la fiche), seule leur
// apparition ici est supprimée. Demandé le 2026-09-24.
const HIDDEN_FROM_TODO = new Set(['p1', 'd1', 's2', 's4', 'lm1', 'lm3', 'ra1', 'mep1']);

/**
 * Every not-yet-done task in each client's *current* pipeline block,
 * across all clients (minus HIDDEN_FROM_TODO). This is what TodoView and
 * the Dashboard's "tâches" metric both read.
 */
export async function getAllOpenClientTasks(): Promise<OpenClientTask[]> {
  const { clients } = await ClientService.getAllClients();
  const open: OpenClientTask[] = [];

  for (const client of clients) {
    const status = normalizedClientStatus(client);

    // Un client réellement suivi tâche par tâche accumule un historique
    // dans `taches` pour chaque statut déjà franchi (applyTaskChange y
    // écrit avant de faire avancer statusOuvert) - donc un client qui
    // n'est plus au tout premier statut ("Prospect") mais dont `taches`
    // est totalement vide n'a pu y arriver que par un changement de
    // statut direct depuis le header, pas par la case à cocher. Dans ce
    // cas, comme pour les statuts antérieurs déjà traités comme
    // "COMPLÉTÉ" dans l'onglet Tâches, on ne fait pas non plus remonter
    // les tâches de son statut courant ici.
    const hasAnyTaskHistory = Object.keys(client.taches || {}).length > 0;
    if (!hasAnyTaskHistory && status !== 'Prospect') continue;

    const taskDefs = getTaskDefs(status);
    const existing = client.taches?.[status] || [];
    const clientName = `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Client sans nom';

    taskDefs.forEach((def, idx) => {
      if (HIDDEN_FROM_TODO.has(def.id)) return;
      const task = existing[idx];
      const completed = task?.completed || false;
      const taskStatus = task?.status || 'pending';
      if (completed || taskStatus === 'na') return;

      open.push({
        id: def.id,
        title: def.title,
        description: def.description,
        completed,
        status: taskStatus,
        clientId: client.id,
        clientName,
        clientStatus: status,
        deadline: (task as any)?.deadline,
      });
    });
  }

  return open;
}

interface ApplyResult {
  success: boolean;
  statusProgressed?: string;
}

/**
 * Marks one pipeline task done/pending/N.A. for a client, persists the
 * full per-status task array, and auto-advances the client to the next
 * pipeline status when every task in the active block is now done.
 */
export async function applyClientTaskChange(
  client: Client,
  taskId: string,
  changes: { completed: boolean; taskStatus: 'validated' | 'pending' | 'na' }
): Promise<ApplyResult> {
  const status = findStatusForTaskId(taskId);
  if (!status) return { success: false };

  const taskDefs = getTaskDefs(status);
  const existingTasks: any[] = client.taches?.[status] || [];

  const updatedTasksForStatus = taskDefs.map((def) => {
    const existing = existingTasks.find((t) => t.id === def.id) || existingTasks[taskDefs.indexOf(def)] || {
      id: def.id,
      title: def.title,
      description: def.description,
      completed: false,
      status: 'pending' as const,
    };
    if (def.id === taskId) {
      return { ...existing, id: def.id, title: def.title, description: def.description, completed: changes.completed, status: changes.taskStatus };
    }
    return existing;
  });

  const newTaches = { ...(client.taches || {}), [status]: updatedTasksForStatus };

  const allTasksDone = updatedTasksForStatus.every((t) => t.completed || t.status === 'na');
  const clientCurrentStatus = normalizedClientStatus(client);
  const isCurrentBlock = status.toLowerCase() === clientCurrentStatus.toLowerCase();
  const currentIdx = STATUSES.findIndex((s) => s.toLowerCase() === clientCurrentStatus.toLowerCase());
  const nextStatus = currentIdx >= 0 ? STATUSES[currentIdx + 1] : undefined;
  const willProgress = isCurrentBlock && allTasksDone && !!nextStatus;

  const payload: Record<string, any> = { taches: newTaches };
  if (willProgress) {
    payload.statusOuvert = nextStatus;
  }

  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${apiBaseUrl}/api/clients/${client.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return { success: false };
  }

  ClientService.clearCache();
  return { success: true, statusProgressed: willProgress ? nextStatus : undefined };
}

/**
 * Sets (or clears) a task's deadline without touching its completed/N.A.
 * state - used by the deadline date picker in TodoView/TasksTab. The task
 * stays visible in the "all" list regardless of its deadline; only
 * completing or N.A.-ing it removes it from the open-tasks view.
 */
export async function updateClientTaskDeadline(client: Client, taskId: string, deadline: string): Promise<boolean> {
  const status = findStatusForTaskId(taskId);
  if (!status) return false;

  const taskDefs = getTaskDefs(status);
  const existingTasks: any[] = client.taches?.[status] || [];

  const updatedTasksForStatus = taskDefs.map((def) => {
    const existing = existingTasks.find((t) => t.id === def.id) || existingTasks[taskDefs.indexOf(def)] || {
      id: def.id,
      title: def.title,
      description: def.description,
      completed: false,
      status: 'pending' as const,
    };
    if (def.id === taskId) {
      return { ...existing, id: def.id, title: def.title, description: def.description, deadline };
    }
    return existing;
  });

  const newTaches = { ...(client.taches || {}), [status]: updatedTasksForStatus };

  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${apiBaseUrl}/api/clients/${client.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ taches: newTaches }),
  });

  if (!response.ok) return false;
  ClientService.clearCache();
  return true;
}
