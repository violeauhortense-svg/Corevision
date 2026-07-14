// ============================================
// TASK STATES DEFINITIONS & VALIDATORS
// ============================================

/**
 * Les 3 états d'une tâche dans le pipeline
 *
 * ☑️ VALIDÉE
 * - La tâche est cochée ✓ + date de validation enregistrée
 * - Compte pour la progression vers le statut suivant
 * - validatedAt: ISO8601 timestamp
 * - validatedBy: user.id
 *
 * ⊘ NON_CONCERNÉE (N/A)
 * - La tâche ne s'applique pas pour ce client
 * - Compte AUSSI pour la progression (équivalente à validée)
 * - naAt: ISO8601 timestamp
 * - naBy: user.id
 *
 * ☐ NON_VALIDÉE (Pending)
 * - La tâche doit encore être complétée
 * - N'COMPTE PAS pour la progression
 * - Status par défaut quand initialized
 */

export enum TaskState {
  VALIDATED = 'validated',
  NA = 'na',
  PENDING = 'pending',
}

export const TASK_STATES = {
  VALIDATED: 'validated',    // ☑️ Complétée et validée
  NA: 'na',                  // ⊘ Non applicable
  PENDING: 'pending',        // ☐ En attente
} as const;

// Valider qu'un state est acceptable
export function isValidTaskState(state: any): state is TaskState {
  return Object.values(TASK_STATES).includes(state);
}

// États qui comptent pour la progression
export function isTaskCompleted(state: TaskState): boolean {
  return state === TASK_STATES.VALIDATED || state === TASK_STATES.NA;
}

// Descriptions lisibles
export const TASK_STATE_LABELS: Record<TaskState, string> = {
  [TASK_STATES.VALIDATED]: '✅ Validée',
  [TASK_STATES.NA]: '⊘ Non concernée',
  [TASK_STATES.PENDING]: '☐ Non validée',
};

/**
 * Vérifier si TOUTES les tâches d'un statut sont complétées
 * (validée OU non concernée)
 */
export function areAllTasksCompleted(tasks: any[]): boolean {
  if (!tasks || tasks.length === 0) return true;
  return tasks.every(task => isTaskCompleted(task.status));
}

/**
 * Compter les tâches par état
 */
export function countTasksByState(tasks: any[]): Record<TaskState, number> {
  return {
    validated: tasks.filter(t => t.status === TASK_STATES.VALIDATED).length,
    na: tasks.filter(t => t.status === TASK_STATES.NA).length,
    pending: tasks.filter(t => t.status === TASK_STATES.PENDING).length,
  };
}

/**
 * Schema validé pour une tâche mise à jour
 */
export interface TaskUpdatePayload {
  completed?: boolean;
  status?: TaskState;
  validatedAt?: string;
  validatedBy?: string;
  validatedByName?: string;
}

/**
 * Valider et normaliser une demande de mise à jour de tâche
 */
export function validateTaskUpdate(payload: any, userId: string): {
  valid: boolean;
  error?: string;
  normalized?: TaskUpdatePayload;
} {
  if (!payload) {
    return { valid: false, error: 'Empty payload' };
  }

  // Si status est fourni, vérifier que c'est valide
  if (payload.status && !isValidTaskState(payload.status)) {
    return {
      valid: false,
      error: `Invalid status: ${payload.status}. Must be one of: ${Object.values(TASK_STATES).join(', ')}`
    };
  }

  // Normaliser: si completed=true et pas de status, mettre "validated"
  const normalized: TaskUpdatePayload = {
    status: payload.status,
    completed: payload.completed,
    validatedAt: payload.validatedAt || new Date().toISOString(),
    validatedBy: payload.validatedBy || userId,
    validatedByName: payload.validatedByName,
  };

  // Si pas de status mais completed est spécifié, déduire le status
  if (!normalized.status && typeof payload.completed === 'boolean') {
    if (payload.completed) {
      normalized.status = TASK_STATES.VALIDATED;
    } else if (payload.status === TASK_STATES.NA) {
      normalized.status = TASK_STATES.NA;
    } else {
      normalized.status = TASK_STATES.PENDING;
    }
  }

  return {
    valid: true,
    normalized
  };
}

/**
 * Appliquer une mise à jour validée à une tâche
 */
export function applyTaskUpdate(
  task: any,
  update: TaskUpdatePayload,
  userId: string
): any {
  const updated = { ...task };

  // Mettre à jour l'état
  if (update.status) {
    updated.status = update.status;
    updated.updated_at = new Date().toISOString();

    // Enregistrer les détails selon l'état
    if (update.status === TASK_STATES.VALIDATED) {
      updated.validated_at = update.validatedAt || new Date().toISOString();
      updated.validated_by = update.validatedBy || userId;
      updated.validated_by_name = update.validatedByName;
      updated.completed = true;
    } else if (update.status === TASK_STATES.NA) {
      updated.na_at = update.validatedAt || new Date().toISOString();
      updated.na_by = update.validatedBy || userId;
      updated.na_by_name = update.validatedByName;
      updated.completed = true;
    } else if (update.status === TASK_STATES.PENDING) {
      updated.completed = false;
      // Effacer les dates de validation si on repasse en pending
      delete updated.validated_at;
      delete updated.validated_by;
      delete updated.validated_by_name;
      delete updated.na_at;
      delete updated.na_by;
      delete updated.na_by_name;
    }
  }

  return updated;
}
