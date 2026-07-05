import React, { useState } from 'react';

const STATUSES = [
  'Prospect',
  'Découverte',
  'Simulation',
  'Lettre Mission',
  'Rapport/Audit',
  'Suivi MEP',
  'Suivi CSP',
  'Arbitrage'
];

interface Task {
  id: string;
  title: string;
  completed: boolean;
  status: 'pending' | 'completed' | 'na';
  deadline?: string;
  description?: string;
}

interface TasksTabProps {
  clientId: string;
  currentStatus: string;
  taches: Record<string, Task[]>;
  cspSigne?: boolean;
  onTaskUpdate: (status: string, taskId: string, completed: boolean) => Promise<void>;
  onStatusChange?: (newStatus: string) => Promise<void>;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  clientId,
  currentStatus,
  taches,
  cspSigne = false,
  onTaskUpdate,
  onStatusChange
}) => {
  const [expandedBlocs, setExpandedBlocs] = useState<Record<string, boolean>>({
    [currentStatus]: true // Bloc EN COURS toujours ouvert
  });

  const toggleBloc = (status: string) => {
    setExpandedBlocs(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getBlockState = (status: string) => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    const statusIndex = STATUSES.indexOf(status);

    if (statusIndex < currentIndex) return 'COMPLETED';
    if (statusIndex === currentIndex) return 'EN COURS';
    return 'À VENIR';
  };

  const countTasks = (status: string) => {
    const tasks = taches[status] || [];
    return tasks.length;
  };

  const countCompleted = (status: string) => {
    const tasks = taches[status] || [];
    return tasks.filter(t => t.completed || t.status === 'na').length;
  };

  const handleTaskToggle = async (status: string, taskId: string, completed: boolean) => {
    try {
      await onTaskUpdate(status, taskId, !completed);
    } catch (err) {
      console.error('❌ Erreur update tâche:', err);
    }
  };

  // Logique spéciale pour Suivi CSP
  const shouldShowTask = (status: string, task: Task) => {
    if (status !== 'Suivi CSP') return true;
    if (!cspSigne) return false;

    // Si tâche "Prendre contact..." n'est pas validée ET pas de deadline dépassée
    const contactTask = (taches[status] || []).find(t => t.title.includes('Prendre contact'));
    if (contactTask && !contactTask.completed) {
      return task === contactTask;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {STATUSES.map(status => {
        const blockState = getBlockState(status);
        const isExpanded = expandedBlocs[status];
        const tasks = taches[status] || [];
        const completed = countCompleted(status);
        const total = countTasks(status);

        // Restrictions Suivi CSP et Arbitrage
        if ((status === 'Suivi CSP' || status === 'Arbitrage') && !cspSigne) {
          return (
            <div key={status} className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
              <p className="text-sm text-red-700 font-semibold">
                ⚠️ {status} : CSP non signé
              </p>
              <p className="text-xs text-red-600">Signez le CSP pour accéder à ce statut</p>
            </div>
          );
        }

        return (
          <div
            key={status}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              blockState === 'EN COURS'
                ? 'border-blue-400 bg-blue-50'
                : blockState === 'COMPLETED'
                  ? 'border-green-300 bg-gray-50'
                  : 'border-gray-300 bg-gray-50 opacity-60'
            }`}
            onClick={() => blockState !== 'À VENIR' && toggleBloc(status)}
          >
            {/* En-tête du bloc */}
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">
                  {status}
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    {completed}/{total}
                  </span>
                </h3>
              </div>
              <div className="text-sm font-bold px-3 py-1 rounded-full bg-white">
                {blockState === 'COMPLETED' ? '✓ COMPLÉTÉ' : blockState === 'EN COURS' ? '🔵 EN COURS' : '🔒 À VENIR'}
              </div>
              <div className="ml-2">
                {blockState !== 'À VENIR' && (
                  <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                )}
              </div>
            </div>

            {/* Liste des tâches (si bloc ouvert ou EN COURS) */}
            {(isExpanded || blockState === 'EN COURS') && blockState !== 'À VENIR' && (
              <div className="mt-4 space-y-2">
                {tasks
                  .filter(task => shouldShowTask(status, task))
                  .map(task => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-2 rounded border ${
                        blockState === 'COMPLETED'
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed || task.status === 'na'}
                        onChange={() =>
                          blockState === 'EN COURS' &&
                          handleTaskToggle(status, task.id, task.completed)
                        }
                        disabled={blockState !== 'EN COURS'}
                        className="mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed || task.status === 'na'
                              ? 'line-through text-gray-500'
                              : 'text-gray-800'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.deadline && (
                          <p className="text-xs text-gray-500 mt-1">
                            📅 {new Date(task.deadline).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      {task.status === 'na' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Non concerné
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Message pour blocs À VENIR */}
            {blockState === 'À VENIR' && (
              <p className="mt-2 text-sm text-gray-600">
                🔒 Ce statut sera déverrouillé une fois le précédent terminé
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
