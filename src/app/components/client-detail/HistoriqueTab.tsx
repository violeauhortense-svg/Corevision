import { useState, useEffect } from 'react';
import { Calendar, Mail, Phone, FileText, CheckCircle, Send, Clock, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { useClientHistory } from '../../utils/useEventSystem';
import { taskSyncService } from '../../services/taskSyncService';
import type { HistoryEvent } from '../../utils/eventEmitter';
import type { Task } from '../client-detail/types';

interface HistoriqueTabProps {
  clientId: string;
}

interface CombinedEvent extends HistoryEvent {
  isTask?: boolean;
  task?: Task;
}

export function HistoriqueTab({ clientId }: HistoriqueTabProps) {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  // 🔥 Utiliser les événements réels du système
  const events = useClientHistory(clientId);

  // Charger les tâches complétées
  useEffect(() => {
    const loadCompletedTasks = async () => {
      try {
        const tasks = await taskSyncService.getCompletedTasks(clientId);
        setCompletedTasks(tasks);
        console.log('✅ Tâches complétées chargées:', tasks.length);
      } catch (error) {
        console.error('❌ Erreur chargement tâches complétées:', error);
      }
    };
    loadCompletedTasks();
  }, [clientId]);

  // Combiner les événements et les tâches complétées
  const combinedEvents: CombinedEvent[] = [
    ...events,
    ...completedTasks.map(task => ({
      id: `task_${task.id}`,
      clientId,
      date: task.completedAt || task.deadline || new Date().toISOString(),
      type: 'task_completed' as const,
      description: `Tâche complétée: ${task.title || task.stage || 'N/A'}`,
      isTask: true,
      task,
    })),
  ];

  // Trier par date décroissante (plus récent en premier)
  const sortedEvents = [...combinedEvents].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'meeting_created':
      case 'meeting_updated':
        return { Icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'email_sent':
        return { Icon: Mail, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'call_made':
        return { Icon: Phone, color: 'text-green-600', bg: 'bg-green-100' };
      case 'recommendation_created':
      case 'recommendation_updated':
        return { Icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'recommendation_validated':
        return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'document_uploaded':
        return { Icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100' };
      case 'task_created':
      case 'task_updated':
        return { Icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'task_completed':
        return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'objective_created':
        return { Icon: Target, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'objective_completed':
        return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'client_status_changed':
        return { Icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'workflow_step_completed':
        return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      default:
        return { Icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getEventTypeLabel = (type: HistoryEvent['type']): string => {
    const labels: Record<HistoryEvent['type'], string> = {
      meeting_created: 'Rendez-vous planifié',
      meeting_updated: 'Rendez-vous modifié',
      email_sent: 'Email',
      call_made: 'Appel téléphonique',
      document_uploaded: 'Document',
      recommendation_created: 'Recommandation créée',
      recommendation_updated: 'Recommandation',
      recommendation_validated: 'Validation',
      task_created: 'Tâche créée',
      task_completed: 'Tâche complétée',
      task_updated: 'Tâche modifiée',
      objective_created: 'Objectif créé',
      objective_completed: 'Objectif atteint',
      client_status_changed: 'Changement statut',
      workflow_step_completed: 'Étape validée',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Historique relation client</h2>
        </div>
        <p className="text-sm text-gray-500">{sortedEvents.length} événement(s)</p>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-gray-500 text-lg">Aucun événement enregistré</p>
          <p className="text-gray-400 text-sm mt-2">
            L'historique des interactions sera affiché ici
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Timeline */}
          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Événements */}
            <div className="space-y-6">
              {sortedEvents.map((event, index) => {
                const { Icon, color, bg } = getEventIcon(event.type);
                
                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icône */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{getEventTypeLabel(event.type)}</h3>
                          <span className="text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        {event.link && (
                          <button className="mt-2 text-sm text-blue-600 hover:underline">
                            Voir les détails →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
