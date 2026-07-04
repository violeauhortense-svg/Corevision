import { User, Phone, Mail, Euro, Calendar, CheckCircle, Circle, ChevronRight } from 'lucide-react';
import type { Client, PipelineStage } from '../types/client';
import { getTransitionButtonLabel } from '../utils/taskTemplates';

interface PipelineColumnProps {
  stage: PipelineStage;
  label: string;
  color: string;
  clients: Client[];
  onDragStart: (e: React.DragEvent, clientId: string, stage: PipelineStage) => void;
  onDrop: (e: React.DragEvent, stage: PipelineStage) => void;
  onDragOver: (e: React.DragEvent) => void;
  onToggleTask: (clientId: string, taskId: string) => void;
  onAdvanceClient: (clientId: string, stage: PipelineStage) => void;
}

export function PipelineColumn({
  stage,
  label,
  color,
  clients,
  onDragStart,
  onDrop,
  onDragOver,
  onToggleTask,
  onAdvanceClient,
}: PipelineColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className={`border-2 rounded-lg ${color} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">{label}</h4>
          <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
            {clients.length}
          </span>
        </div>

        <div
          className="space-y-3 min-h-[200px]"
          onDrop={(e) => onDrop(e, stage)}
          onDragOver={onDragOver}
        >
          {clients.map((client) => {
            const allTasksCompleted = client.tasks.every(task => task.completed);
            const completedCount = client.tasks.filter(task => task.completed).length;
            const totalTasks = client.tasks.length;

            return (
              <div
                key={client.id}
                draggable
                onDragStart={(e) => onDragStart(e, client.id, stage)}
                className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{client.name}</h5>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Euro className="w-3 h-3" />
                      <span>{client.patrimoine}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{client.date}</span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Tâches</span>
                    <span className="text-xs text-gray-600">
                      {completedCount}/{totalTasks}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {client.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(client.id, task.id);
                        }}
                      >
                        {task.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        allTasksCompleted ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${(completedCount / totalTasks) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Action button */}
                {(allTasksCompleted || stage === 'R0') && !client.dossierClos && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdvanceClient(client.id, stage);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <span>{getTransitionButtonLabel(stage)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {client.dossierClos && (
                  <div className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium text-center">
                    Dossier clos
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
