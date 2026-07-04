import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { Task, PipelineStage } from '../../types/client';

interface TaskProgressWidgetProps {
  tasks: Task[];
  currentStage: PipelineStage;
  onOpenTasks: () => void;
}

export function TaskProgressWidget({
  tasks,
  currentStage,
  onOpenTasks,
}: TaskProgressWidgetProps) {
  // Récupérer les tâches du stage courant
  const stageTasks = tasks.filter(t => t.stage === currentStage);
  const completedTasks = stageTasks.filter(t => t.completed || t.status === 'completed' || t.status === 'na');
  const pendingTasks = stageTasks.filter(t => !t.completed && t.status !== 'na');

  const progressPercentage = stageTasks.length > 0
    ? Math.round((completedTasks.length / stageTasks.length) * 100)
    : 0;

  // Label du stage pour l'afficher clairement
  const getStageLabel = (stage: PipelineStage) => {
    const labels: Record<PipelineStage, string> = {
      'R0 - Prospect': '📋 R0 - Prospect',
      'R0-R1 - Découverte': '🔍 R0-R1 - Découverte',
      'R1 - Audit patrimonial': '📊 R1 - Audit patrimonial',
      'R1-R2 - Stratégie définie': '💡 R1-R2 - Stratégie définie',
      'R2 - Recommandation proposée': '✨ R2 - Recommandation proposée',
      'Rsuivi - Suivi patrimonial': '📈 Rsuivi - Suivi patrimonial',
    };
    return labels[stage];
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{getStageLabel(currentStage)}</h3>
          <p className="text-sm text-gray-600">Étape actuelle du dossier</p>
        </div>
        <button
          onClick={onOpenTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Voir les tâches
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Statistiques des tâches */}
      {stageTasks.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{stageTasks.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-green-100">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            </div>
            <div className="text-xs text-gray-600">Complétées</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-orange-100">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
            </div>
            <div className="text-xs text-gray-600">En attente</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Aucune tâche pour cette étape</p>
        </div>
      )}

      {/* Liste rapide des tâches en attente */}
      {pendingTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">📌 À faire immédiatement:</p>
          <div className="space-y-2">
            {pendingTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-start gap-2 text-sm bg-white rounded p-2 border border-orange-100">
                <span className="text-orange-500 mt-1">•</span>
                <span className="text-gray-700">{task.title}</span>
              </div>
            ))}
            {pendingTasks.length > 3 && (
              <p className="text-xs text-gray-500 italic">+{pendingTasks.length - 3} autres tâches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
