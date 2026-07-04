import { Clock, Circle, CheckCircle, ChevronDown, ChevronUp, Edit2, Calendar as CalendarIcon, Plus, Minus, AlertCircle, Target, Lightbulb, TrendingUp, Eye, ListTodo, FileText, Mail } from 'lucide-react';
import { RiskQuestionnaireTaskButtons } from '../RiskQuestionnaireTaskButtons';
import { LABFTTask } from '../LABFTTask';
import { MeetingConfirmationTask } from '../MeetingConfirmationTask';
import { GelAvoirsTask } from '../GelAvoirsTask';
import { AuditPatrimonialTask } from '../AuditPatrimonialTask';
import { ProspectRegistrationTask } from '../ProspectRegistrationTask';
import { DocumentReceptionTask } from '../DocumentReceptionTask';
import { ClientTaskItem } from '../ClientTaskItem';
import type { Task, PipelineStage } from '../../types/client';
import React from 'react';

interface TaskStageAccordionProps {
  stage: PipelineStage;
  isOpen: boolean;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  tasks: Task[];
  templateTasks: string[];
  config: {
    label: string;
    color: string;
    bgGradient: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    activeBg: string;
  };
  onToggle: () => void;
  onToggleTask: (taskId: string) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onUpdateDueDate: (taskId: string, dueDate: string) => Promise<void>;
  onMarkAsNA?: (taskId: string) => Promise<void>;
  onSendEmail: (task: Task) => void;
  onRequestAccountantDocuments?: (task: Task) => void;
  clientId: string;
  renderLinkBadge?: (task: Task) => React.ReactNode;
}

export function TaskStageAccordion({
  stage,
  isOpen,
  isCurrent,
  isPast,
  isFuture,
  tasks,
  templateTasks,
  config,
  onToggle,
  onToggleTask,
  onUpdateTask,
  onUpdateDueDate,
  onMarkAsNA,
  onSendEmail,
  onRequestAccountantDocuments,
  clientId,
  renderLinkBadge,
}: TaskStageAccordionProps) {
  const stageCompleted = tasks.filter((t) => t.completed).length;
  const stageTotal = isFuture ? templateTasks.length : tasks.length;
  const stagePending = isFuture ? templateTasks.length : (stageTotal - stageCompleted);
  const stagePercentage = stageTotal > 0 && !isFuture ? Math.round((stageCompleted / stageTotal) * 100) : 0;

  return (
    <div
      className={`border-2 rounded-xl overflow-hidden transition-all ${
        isCurrent
          ? `${config.borderColor} shadow-lg`
          : isFuture
          ? 'border-gray-200 opacity-60'
          : 'border-gray-300 opacity-80'
      }`}
    >
      {/* En-tête de l'accordéon */}
      <button
        onClick={isFuture ? undefined : onToggle}
        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
          isFuture ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${
          isCurrent
            ? `bg-gradient-to-r ${config.bgGradient}`
            : isFuture
            ? 'bg-gray-50'
            : 'bg-gray-100 hover:bg-gray-150'
        } ${isFuture ? 'pointer-events-none opacity-50' : ''}`}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Indicateur visuel */}
          <div
            className={`w-3 h-3 rounded-full ${
              isCurrent
                ? config.activeBg
                : isFuture
                ? 'bg-gray-300'
                : 'bg-green-500'
            }`}
          />
          
          {/* Titre et stats */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-3">
              <h3
                className={`text-lg font-bold ${
                  isCurrent ? config.textColor : 'text-gray-700'
                }`}
              >
                {config.label}
              </h3>
              {isCurrent && (
                <span className="px-2 py-1 bg-white rounded-full text-xs font-semibold text-indigo-600">
                  En cours
                </span>
              )}
              {isPast && (
                <span className="px-2 py-1 bg-green-100 rounded-full text-xs font-semibold text-green-700">
                  Complété
                </span>
              )}
              {isFuture && (
                <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-semibold text-gray-500">
                  À venir
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className={isCurrent ? config.textColor : 'text-gray-600'}>
                {stageTotal} tâche{stageTotal > 1 ? 's' : ''}
              </span>
              {stageTotal > 0 && (
                <>
                  <span className="text-green-600 font-medium">
                    ✓ {stageCompleted} terminée{stageCompleted > 1 ? 's' : ''}
                  </span>
                  {stagePending > 0 && (
                    <span className="text-orange-600 font-medium">
                      ⏳ {stagePending} en cours
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Barre de progression */}
          {stageTotal > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    isCurrent ? config.activeBg : 'bg-green-500'
                  }`}
                  style={{ width: `${stagePercentage}%` }}
                />
              </div>
              <span
                className={`text-sm font-bold w-12 text-right ${
                  isCurrent ? config.textColor : 'text-gray-700'
                }`}
              >
                {stagePercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Icône expand/collapse */}
        {isOpen ? (
          <ChevronUp className={`w-6 h-6 ml-4 ${isCurrent ? config.iconColor : 'text-gray-500'}`} />
        ) : (
          <ChevronDown className={`w-6 h-6 ml-4 ${isCurrent ? config.iconColor : 'text-gray-500'}`} />
        )}
      </button>

      {/* Contenu de l'accordéon */}
      {isOpen && (
        <div className={`p-6 ${isCurrent ? 'bg-white' : 'bg-gray-50'}`}>
          {/* STATUTS FUTURS : afficher les templates en prévisualisation */}
          {isFuture ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>Prévisualisation :</strong> Ces tâches seront automatiquement générées lorsque le client atteindra cette étape.
                </p>
              </div>
              {templateTasks.map((taskTitle, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg opacity-60"
                >
                  <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-700 font-medium">{taskTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cette tâche sera créée automatiquement
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            // Aucune tâche trouvée pour statut passé/actuel
            <div className="text-center py-8">
              <ListTodo className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Aucune tâche</p>
            </div>
          ) : (
            // Afficher les tâches réelles pour statuts passés/actuel
            <>
              {isPast && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    <strong>Étape complétée :</strong> Vous pouvez modifier les tâches ci-dessous. Si vous décochez une tâche, le client reviendra à ce statut.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {tasks.map((task) => {
                  // Composant spécial pour "Origine du prospect"
                  if (task.title === 'Origine du prospect') {
                    return (
                      <ProspectRegistrationTask
                        key={task.id}
                        task={task}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                      />
                    );
                  }

                  // Composant spécial pour "Collecter documents et infos (perso + pro)"
                  if (task.title === 'Collecter documents et infos (perso + pro)') {
                    return (
                      <DocumentReceptionTask
                        key={task.id}
                        task={task}
                        clientId={clientId}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                      />
                    );
                  }

                  // Composant spécial pour "Contacter le client / planifier le premier rendez-vous"
                  if (
                    task.title === 'Contacter le client / planifier le premier rendez-vous'
                  ) {
                    return (
                      <MeetingConfirmationTask
                        key={task.id}
                        task={task}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                        onSendEmail={onSendEmail}
                      />
                    );
                  }

                  // Composant spécial pour "Contacter le comptable pour..."
                  if (task.title?.includes('Contacter le comptable')) {
                    return (
                      <div key={task.id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            {task.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600 transition-colors" />
                            )}
                          </button>

                          <div className="flex-1">
                            <p className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => onRequestAccountantDocuments?.(task)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Demander les documents
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Boutons d'action pour les tâches standard
                  let actionButtons = null;
                  
                  // Aucun profil de risque dans les nouveaux templates
                  // Le questionnaire profil de risque est géré séparément

                  // ✅ Composant LAB-FT pour les tâches spécifiques (plus dans les templates actuels)
                  if (task.title === 'LAB-FT') {
                    return (
                      <LABFTTask
                        key={task.id}
                        task={task}
                        clientId={clientId}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                      />
                    );
                  }

                  // ✅ Composant Gel des Avoirs (plus dans les templates actuels)
                  if (task.title === 'Gel des Avoirs' || task.title === 'Gel des avoirs') {
                    return (
                      <GelAvoirsTask
                        key={task.id}
                        task={task}
                        clientId={clientId}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                      />
                    );
                  }

                  // ✅ Composant Audit Patrimonial pour les tâches R1
                  if (
                    task.title === 'Rédaction de l\'audit' ||
                    task.title === 'Incorporation des recommandations avec deadline' ||
                    task.title === 'Créer synthèse/présentation d\'audit et axes de recommandations'
                  ) {
                    return (
                      <AuditPatrimonialTask
                        key={task.id}
                        task={task}
                        clientId={clientId}
                        onToggle={onToggleTask}
                        onUpdate={onUpdateTask}
                      />
                    );
                  }

                  // ✅ Composant Signature des Documents - Désactivé
                  if (task.title === 'Signature des documents') {
                    return (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            {task.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600 transition-colors" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                              <FileText className="w-4 h-4 inline mr-1" />
                              Fonctionnalité de signature de documents disponible prochainement.
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Composant standard pour les autres tâches
                  return (
                    <ClientTaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onUpdateDeadline={onUpdateDueDate}
                      onMarkAsNA={onMarkAsNA} // 🆕
                      actionButtons={actionButtons}
                      renderLinkBadge={renderLinkBadge} // 🆕
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}