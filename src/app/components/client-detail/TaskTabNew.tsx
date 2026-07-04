import { useState, useEffect, useMemo } from 'react';
import {
  Loader2, ChevronRight, Calendar, Target, CheckCircle2, ListTodo,
  Lightbulb, Link2, Plus, Filter, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { TaskStageAccordion } from './TaskStageAccordion';
import { MeetingProposalModal } from '../MeetingProposalModal';
import { AccountantRequestModal } from '../AccountantRequestModal';
import { taskAPI, clientAPI } from '../../services/api';
import { emitTaskUpdated, TASK_EVENTS } from '../../utils/taskEvents';
import { useTaskProgression } from '../../hooks/useTaskProgression';
import { useTaskTemplates } from '../../hooks/useTaskTemplates';
import type { Task, PipelineStage } from '../../types/client';

interface TasksTabProps {
  clientId: string;
  clientStatus: PipelineStage;
  // 🆕 Nouvelles props pour les liens
  objectifs?: Objectif[];
  recommendations?: AuditRecommendation[];
  onUpdateTask?: (tasks: Task[]) => void;
  entreprises?: any[];
  contacts?: any[];
}

// Types pour les liens
interface Objectif {
  id: string;
  category: string;
  description?: string;
  status: string;
  endDate?: string;
}

interface AuditRecommendation {
  id: string;
  title: string;
  category: string;
  context?: string;
}

// Configuration des couleurs par statut
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  activeBg: string;
}> = {
  'R0 - Prospect': {
    label: 'R0 - Prospect',
    color: 'gray',
    bgGradient: 'from-gray-50 to-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
    iconColor: 'text-gray-600',
    activeBg: 'bg-gray-600',
  },
  'R0-R1 - Découverte': {
    label: 'R0-R1 - Découverte',
    color: 'blue',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
    activeBg: 'bg-blue-600',
  },
  'R1 - Audit patrimonial': {
    label: 'R1 - Audit patrimonial',
    color: 'indigo',
    bgGradient: 'from-indigo-50 to-indigo-100',
    borderColor: 'border-indigo-300',
    textColor: 'text-indigo-900',
    iconColor: 'text-indigo-600',
    activeBg: 'bg-indigo-600',
  },
  'R1-R2 - Stratégie définie': {
    label: 'R1-R2 - Stratégie définie',
    color: 'purple',
    bgGradient: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600',
    activeBg: 'bg-purple-600',
  },
  'R2 - Recommandation proposée': {
    label: 'R2 - Recommandation proposée',
    color: 'orange',
    bgGradient: 'from-orange-50 to-orange-100',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-600',
    activeBg: 'bg-orange-600',
  },
  'Rsuivi - Suivi patrimonial': {
    label: 'Rsuivi - Suivi patrimonial',
    color: 'green',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-900',
    iconColor: 'text-green-600',
    activeBg: 'bg-green-600',
  },
};

type TaskSource = 'manual' | 'recommendation' | 'objectif';
type TaskFilter = 'all' | 'pending' | 'completed' | 'recommendation' | 'objectif';

export function TasksTab({
  clientId,
  clientStatus,
  objectifs = [],
  recommendations = [],
  onUpdateTask,
  entreprises = [],
  contacts = []
}: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openStage, setOpenStage] = useState<PipelineStage | null>(() => {
    const saved = localStorage.getItem(`task_tab_openStage_${clientId}`);
    return (saved as PipelineStage | null) || clientStatus;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [currentClientStatus, setCurrentClientStatus] = useState<PipelineStage>(clientStatus);
  const [showMeetingProposalModal, setShowMeetingProposalModal] = useState(false);
  const [selectedTaskForMeeting, setSelectedTaskForMeeting] = useState<Task | null>(null);
  const [showAccountantRequestModal, setShowAccountantRequestModal] = useState(false);
  const [selectedTaskForAccountant, setSelectedTaskForAccountant] = useState<Task | null>(null);

  // 🆕 États pour les filtres et liens
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('pending');
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [showCreateFromLinkModal, setShowCreateFromLinkModal] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<'recommendation' | 'objectif' | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Hooks personnalisés
  const { checkAndProgressToNextStage, checkAndRegressToPreviousStage, getStageState } = useTaskProgression();
  const { migrateTasksWithoutStage, syncTasksWithTemplates, createInitialTasks, getTasksForStage } = useTaskTemplates();

  // Charger les données du client
  useEffect(() => {
    const loadClientData = async () => {
      try {
        const data = await clientAPI.getById(clientId);
        setClientData(data);
        setCurrentClientStatus(data.status);
      } catch (error) {
        console.error('Erreur chargement client:', error);
      }
    };
    loadClientData();
  }, [clientId]);

  // Charger les tâches
  useEffect(() => {
    loadTasks();
  }, [clientId]);

  // Sauvegarder l'état de openStage dans localStorage
  useEffect(() => {
    if (openStage) {
      localStorage.setItem(`task_tab_openStage_${clientId}`, openStage);
    }
  }, [openStage, clientId]);

  // Rafraîchir les tâches quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📋 Rafraîchissement des tâches (retour sur l\'onglet)');
        loadTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [clientId]);

  const loadTasks = async (): Promise<Task[]> => {
    try {
      setIsLoading(true);
      let loadedTasks = await taskAPI.getByClientId(clientId);

      if (loadedTasks.length === 0) {
        // Nouveau client : créer les tâches template du stage actuel
        loadedTasks = await createInitialTasks(clientId, clientStatus);
      } else {
        // Migrer les tâches sans champ 'stage' et synchroniser les templates manquants
        loadedTasks = await migrateTasksWithoutStage(loadedTasks);
        const needsSync = await syncTasksWithTemplates(clientId, clientStatus, loadedTasks);
        if (needsSync) {
          loadedTasks = await taskAPI.getByClientId(clientId);
        }
      }

      setTasks(loadedTasks);

      // ✅ SYNCHRONISER LE STATUT CLIENT DEPUIS LE SERVEUR
      const updatedClientData = await clientAPI.getById(clientId);
      if (updatedClientData) {
        setClientData(updatedClientData);
        setCurrentClientStatus(updatedClientData.status);
        console.log('✅ Statut client synchronisé:', updatedClientData.status);
      }

      return loadedTasks;
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      toast.error('Erreur lors du chargement des tâches');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Statistiques enrichies avec les liens
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    linkedToRecommendations: tasks.filter(t => t.linkedRecommendationId).length,
    linkedToObjectifs: tasks.filter(t => t.linkedObjectifId).length,
  };

  // 🆕 Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return !task.completed;
    if (taskFilter === 'completed') return task.completed;
    if (taskFilter === 'recommendation') return task.linkedRecommendationId;
    if (taskFilter === 'objectif') return task.linkedObjectifId;
    return true;
  });

  // 🆕 Obtenir les recommandations non liées
  const unlinkedRecommendations = recommendations.filter(rec => 
    !tasks.some(task => task.linkedRecommendationId === rec.id)
  );

  // 🆕 Obtenir les objectifs non liés
  const unlinkedObjectifs = objectifs.filter(obj => 
    !tasks.some(task => task.linkedObjectifId === obj.id)
  );

  // 🆕 Créer une tâche depuis une recommandation
  const handleCreateTaskFromRecommendation = async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    try {
      const newTaskData = {
        titre: `Mettre en place: ${recommendation.title}`,
        description: recommendation.context || '',
        date_echeance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        stage: currentClientStatus,
      };
      
      const createdTask = await taskAPI.create(clientId, newTaskData);
      
      // Ajouter les champs supplémentaires
      await taskAPI.update(createdTask.id, {
        ...createdTask,
        linkedRecommendationId: recommendationId,
        dueDate: newTaskData.date_echeance,
      });
      
      await loadTasks();
      toast.success('Tâche créée depuis la recommandation');
      setShowCreateFromLinkModal(false);
    } catch (error) {
      console.error('Erreur création tâche:', error);
      toast.error('Erreur lors de la création de la tâche');
    }
  };

  // 🆕 Créer une tâche depuis un objectif
  const handleCreateTaskFromObjectif = async (objectifId: string) => {
    const objectif = objectifs.find(o => o.id === objectifId);
    if (!objectif) return;

    try {
      const newTaskData = {
        titre: `Avancer sur: ${objectif.category}`,
        description: objectif.description || '',
        date_echeance: objectif.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        stage: currentClientStatus,
      };
      
      const createdTask = await taskAPI.create(clientId, newTaskData);
      
      // Ajouter les champs supplémentaires
      await taskAPI.update(createdTask.id, {
        ...createdTask,
        linkedObjectifId: objectifId,
        dueDate: newTaskData.date_echeance,
      });
      
      await loadTasks();
      toast.success('Tâche créée depuis l\'objectif');
      setShowCreateFromLinkModal(false);
    } catch (error) {
      console.error('Erreur création tâche:', error);
      toast.error('Erreur lors de la création de la tâche');
    }
  };

  // 🆕 Obtenir le badge de liaison
  const renderLinkBadge = (task: Task) => {
    if (task.linkedRecommendationId) {
      const rec = recommendations.find(r => r.id === task.linkedRecommendationId);
      if (rec) {
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            <Lightbulb className="w-3 h-3" />
            {rec.title}
          </span>
        );
      }
    }
    if (task.linkedObjectifId) {
      const obj = objectifs.find(o => o.id === task.linkedObjectifId);
      if (obj) {
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            <Target className="w-3 h-3" />
            {obj.category}
          </span>
        );
      }
    }
    return null;
  };

  // Affichage du loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques enrichies */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ListTodo className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Tâches</h2>
          </div>
          <button
            onClick={() => setShowLinkPanel(!showLinkPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Link2 className="w-5 h-5" />
            Créer depuis une recommandation/objectif
          </button>
        </div>
      </div>

      {/* Panneau de création depuis liens */}
      {showLinkPanel && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Créer des tâches depuis les recommandations et objectifs
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Recommandations non liées */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-600" />
                Recommandations sans tâche ({unlinkedRecommendations.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unlinkedRecommendations.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Toutes les recommandations ont une tâche associée</p>
                ) : (
                  unlinkedRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">{rec.title}</h5>
                          <p className="text-xs text-gray-600 mt-1">{rec.category}</p>
                        </div>
                        <button
                          onClick={() => handleCreateTaskFromRecommendation(rec.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs"
                        >
                          <Plus className="w-3 h-3" />
                          Créer tâche
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Objectifs non liés */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Objectifs sans tâche ({unlinkedObjectifs.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unlinkedObjectifs.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Tous les objectifs ont une tâche associée</p>
                ) : (
                  unlinkedObjectifs.map((obj) => (
                    <div
                      key={obj.id}
                      className="bg-purple-50 border border-purple-200 rounded-lg p-3 hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">{obj.category}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              obj.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                              obj.status === 'Terminé' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {obj.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCreateTaskFromObjectif(obj.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                        >
                          <Plus className="w-3 h-3" />
                          Créer tâche
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtrer par:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                taskFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({stats.total})
            </button>
            <button
              onClick={() => setTaskFilter('pending')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                taskFilter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({stats.pending})
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                taskFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Terminées ({stats.completed})
            </button>
            <button
              onClick={() => setTaskFilter('recommendation')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                taskFilter === 'recommendation' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              Recommandations ({stats.linkedToRecommendations})
            </button>
            <button
              onClick={() => setTaskFilter('objectif')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                taskFilter === 'objectif' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="w-3 h-3" />
              Objectifs ({stats.linkedToObjectifs})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des tâches par stage (accordion existant) */}
      <div className="space-y-3">
        {Object.entries(STATUS_CONFIG).map(([stage, config]) => {
          const stageState = getStageState(stage as PipelineStage, currentClientStatus);
          const isOpen = openStage === stage;
          const isCurrent = stageState === 'current';
          const isPast = stageState === 'past';
          const isFuture = stageState === 'future';

          const stageTemplateTasks = getTasksForStage(stage as PipelineStage);

          // Filtrer les tâches par leur champ 'stage' pour afficher l'historique
          const stageTasks = isFuture
            ? []
            : filteredTasks.filter(t => t.stage === stage);

          // ✅ NETTOYÉ: Logs debug supprimés en production

          return (
            <TaskStageAccordion
              key={stage}
              stage={stage as PipelineStage}
              isOpen={isOpen}
              isCurrent={isCurrent}
              isPast={isPast}
              isFuture={isFuture}
              tasks={stageTasks}
              templateTasks={stageTemplateTasks}
              config={config}
              onToggle={() => setOpenStage(openStage === stage ? null : stage as PipelineStage)}
              onToggleTask={async (taskId: string) => {
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                  const now = new Date().toISOString();
                  const cgpName = clientData?.conseiller || 'CGP';

                  await taskAPI.update(taskId, {
                    completed: newStatus === 'completed',
                    status: newStatus,
                    ...(newStatus === 'completed' && {
                      completedAt: now,
                      completedBy: cgpName,
                    }),
                  });

                  // ✅ OPTIMISÉ: Un seul chargement qui retourne les tâches
                  const updatedTasks = await loadTasks();

                  // Vérifier la progression automatique après la mise à jour
                  await checkAndProgressToNextStage(
                    clientId,
                    currentClientStatus,
                    updatedTasks,
                    (newStatus) => {
                      setCurrentClientStatus(newStatus);
                      setOpenStage(newStatus);
                    },
                    loadTasks
                  );
                }
              }}
              onUpdateTask={async (taskId: string, updates: Partial<Task>) => {
                await taskAPI.update(taskId, updates);
                await loadTasks();
              }}
              onUpdateDueDate={async (taskId: string, dueDate: string) => {
                await taskAPI.update(taskId, { deadline: dueDate });
                await loadTasks();
              }}
              onMarkAsNA={async (taskId: string) => {
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                  const newStatus = task.status === 'na' ? 'pending' : 'na';
                  const now = new Date().toISOString();
                  const cgpName = clientData?.conseiller || 'CGP';

                  await taskAPI.update(taskId, {
                    status: newStatus,
                    completed: newStatus === 'na',
                    ...(newStatus === 'na' && {
                      completedAt: now,
                      completedBy: cgpName,
                      completionNotes: 'Marqué comme N/A',
                    }),
                  });

                  // ✅ OPTIMISÉ: Un seul chargement qui retourne les tâches
                  const updatedTasks = await loadTasks();

                  // Vérifier la progression automatique après le marquage N/A
                  await checkAndProgressToNextStage(
                    clientId,
                    currentClientStatus,
                    updatedTasks,
                    (newStatus) => {
                      setCurrentClientStatus(newStatus);
                      setOpenStage(newStatus);
                    },
                    loadTasks
                  );
                }
              }}
              onSendEmail={(task: Task) => {
                setSelectedTaskForMeeting(task);
                setShowMeetingProposalModal(true);
              }}
              onRequestAccountantDocuments={(task: Task) => {
                setSelectedTaskForAccountant(task);
                setShowAccountantRequestModal(true);
              }}
              clientId={clientId}
              renderLinkBadge={renderLinkBadge}
            />
          );
        })}
      </div>

      {/* Modal de proposition de RDV */}
      <MeetingProposalModal
        isOpen={showMeetingProposalModal}
        task={selectedTaskForMeeting}
        clientId={clientId}
        onClose={() => {
          setShowMeetingProposalModal(false);
          setSelectedTaskForMeeting(null);
        }}
        onSuccess={() => {
          setShowMeetingProposalModal(false);
          setSelectedTaskForMeeting(null);
          loadTasks();
        }}
      />

      {/* Modal de demande de documents comptables */}
      <AccountantRequestModal
        isOpen={showAccountantRequestModal}
        task={selectedTaskForAccountant}
        clientId={clientId}
        clientStatus={clientStatus}
        entreprises={entreprises}
        contacts={contacts}
        onClose={() => {
          setShowAccountantRequestModal(false);
          setSelectedTaskForAccountant(null);
        }}
        onSuccess={() => {
          setShowAccountantRequestModal(false);
          setSelectedTaskForAccountant(null);
          loadTasks();
        }}
      />
    </div>
  );
}