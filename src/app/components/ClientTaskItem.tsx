import { Calendar, ListTodo, CheckCircle, Circle, Ban } from 'lucide-react';
import type { Task } from '../types/client';
import { toast } from 'sonner';

interface ClientTaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onUpdateDeadline: (taskId: string, deadline: string) => void;
  onMarkAsNA?: (taskId: string) => void; // 🆕 Nouvelle fonction pour marquer N/A
  actionButtons?: React.ReactNode;
  statusBadge?: React.ReactNode;
  showClientName?: boolean;
  renderLinkBadge?: (task: Task) => React.ReactNode;
  onNavigateToClient?: (clientId: string) => void;
}

export function ClientTaskItem({ task, onToggle, onUpdateDeadline, onMarkAsNA, actionButtons, statusBadge, showClientName, renderLinkBadge, onNavigateToClient }: ClientTaskItemProps) {
  const isNA = task.status === 'na';
  const isCompleted = task.status === 'completed' || task.completed;
  
  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isCompleted
          ? 'bg-green-50 border-green-200'
          : isNA
          ? 'bg-gray-50 border-gray-300'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-medium ${
                isCompleted ? 'text-green-900 line-through' : 
                isNA ? 'text-gray-500 line-through' : 
                'text-gray-900'
              }`}>
                {task.title}
              </p>
              {/* Badge de statut personnalisé */}
              {statusBadge}
              {/* 🆕 Badge de liaison */}
              {renderLinkBadge && renderLinkBadge(task)}
              {/* 🆕 Badge N/A */}
              {isNA && (
                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">
                  N/A
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              <span>Créée le {new Date(task.createdAt).toLocaleDateString('fr-FR')}</span>
              {task.deadline && (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <Calendar className="w-4 h-4" />
                  Échéance: {new Date(task.deadline).toLocaleDateString('fr-FR')}
                </span>
              )}
              {showClientName && task.clientName && task.clientId && onNavigateToClient && (
                <button
                  onClick={() => onNavigateToClient(task.clientId!)}
                  className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs rounded-full font-medium transition-colors cursor-pointer"
                  title="Cliquez pour voir la fiche client"
                >
                  👤 {task.clientName}
                </button>
              )}
            </div>
            
            {/* Boutons d'action personnalisés */}
            {actionButtons && (
              <div className="mt-3">
                {actionButtons}
              </div>
            )}
            
            {/* Champ pour ajouter/modifier la deadline */}
            <div className="mt-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <label className="text-xs text-gray-600">Échéance:</label>
              <input
                type="date"
                value={task.deadline || ''}
                onChange={(e) => {
                  onUpdateDeadline(task.id, e.target.value);
                  toast.success('✅ Échéance mise à jour - visible dans To-Do et Agenda');
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>
            {!task.deadline && (
              <p className="text-xs text-amber-600 mt-1">
                💡 Ajoutez une échéance pour que cette tâche apparaisse dans l'Agenda
              </p>
            )}
          </div>
        </div>
        
        {/* 🆕 Deux boutons : Valider et N/A */}
        <div className="ml-4 flex flex-col gap-2">
          <button
            onClick={() => onToggle(task.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isCompleted
                ? 'bg-green-600 text-white'
                : 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50'
            }`}
            title={isCompleted ? 'Tâche validée' : 'Valider la tâche'}
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{isCompleted ? 'Validé' : 'Valider'}</span>
          </button>
          
          {onMarkAsNA && (
            <button
              onClick={() => onMarkAsNA(task.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isNA
                  ? 'bg-gray-600 text-white'
                  : 'bg-white border-2 border-gray-400 text-gray-600 hover:bg-gray-50'
              }`}
              title={isNA ? 'Marqué N/A' : 'Marquer comme N/A'}
            >
              <Ban className="w-5 h-5" />
              <span className="text-sm">N/A</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}