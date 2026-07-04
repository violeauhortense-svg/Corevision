import { useState, useEffect } from 'react';
import { Loader2, Calendar, CheckCircle, Clock, AlertCircle, ListTodo, Eye, Flag, Check, Circle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ClientTaskItem } from './ClientTaskItem';
import { taskSyncService } from '../services/taskSyncService';
import { taskAPI } from '../services/api';

interface TodoViewProps {
  session: any;
  onNavigateToClient?: (clientId: string) => void;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  deadline?: string;
  clientId?: string;
  clientName?: string;
}

type FilterType = 'all' | 'overdue' | 'today' | 'completed';

// Synced utility functions
const getAllOpenTasks = async (): Promise<Task[]> => {
  const userId = localStorage.getItem('user_id') || 'default';
  return await taskSyncService.getOpenTasks(userId);
};

const completeTask = async (taskId: string): Promise<boolean> => {
  try {
    // Find task to get clientId
    const userId = localStorage.getItem('user_id') || 'default';
    const allOpenTasks = await getAllOpenTasks();
    const task = allOpenTasks.find(t => t.id === taskId);

    if (!task || !task.clientId) {
      console.error('Tâche ou clientId non trouvé');
      return false;
    }

    // Mark as completed via API
    const success = await taskSyncService.completeTask(task.clientId, taskId, userId);
    return success;
  } catch (error) {
    console.error('Erreur completion task:', error);
    return false;
  }
};

const updateTaskDeadline = async (taskId: string, deadline: string): Promise<boolean> => {
  try {
    // Update via API
    await taskAPI.update(taskId, { deadline });
    // Sync after update
    const userId = localStorage.getItem('user_id') || 'default';
    const allOpenTasks = await getAllOpenTasks();
    const task = allOpenTasks.find(t => t.id === taskId);
    if (task?.clientId) {
      await taskSyncService.syncClientTasks({ clientId: task.clientId, userId });
    }
    return true;
  } catch (error) {
    console.error('Erreur update deadline:', error);
    return false;
  }
};

export function TodoView({ session, onNavigateToClient }: TodoViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Charger toutes les tâches au montage
  useEffect(() => {
    loadTasks();
  }, [session]);

  const loadTasks = async () => {
    try {
      const allTasks = await getAllOpenTasks();
      console.log('📋 Tâches ouvertes chargées:', allTasks);
      setTasks(allTasks);
    } catch (error) {
      console.error('❌ Erreur chargement tâches:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    const success = await completeTask(taskId);
    if (success) {
      await loadTasks();
      toast.success('✅ Tâche marquée comme complétée');
    } else {
      toast.error('❌ Erreur lors de la completion de la tâche');
    }
  };

  const deleteTaskHandler = async (taskId: string) => {
    try {
      await taskAPI.delete(taskId);
      await loadTasks();
      toast.success('✅ Tâche supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('❌ Erreur lors de la suppression de la tâche');
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('❌ Veuillez saisir un titre pour la tâche');
      return;
    }

    if (!session?.access_token) {
      toast.error('❌ Non authentifié');
      return;
    }

    // Note: Pour les tâches globales (non liées à un client), on utilise un clientId spécial
    // Vous pouvez créer un "client système" ou permettre uniquement des tâches liées à des clients
    toast.info('💡 Les tâches globales nécessitent un client associé. Créez la tâche depuis la fiche d\'un client.');
  };

  const updateDeadline = async (taskId: string, deadline: string) => {
    const success = await updateTaskDeadline(taskId, deadline);
    if (success) {
      await loadTasks();
      toast.success('✅ Échéance mise à jour');
    } else {
      toast.error('❌ Erreur lors de la mise à jour de l\'échéance');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Séparer les tâches avec et sans deadline pour une meilleure visibilité
  const tasksWithoutDeadline = activeTasks.filter(t => !t.deadline);
  const tasksWithDeadline = activeTasks.filter(t => t.deadline);

  // Trier les tâches avec deadline par deadline
  const sortedTasksWithDeadline = [...tasksWithDeadline].sort((a, b) => {
    return new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime();
  });

  // Catégoriser par urgence
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueTasks = sortedTasksWithDeadline.filter(t => {
    const deadline = new Date(t.deadline!);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  });

  const todayTasks = sortedTasksWithDeadline.filter(t => {
    const deadline = new Date(t.deadline!);
    deadline.setHours(0, 0, 0, 0);
    return deadline.getTime() === today.getTime();
  });

  const upcomingTasks = sortedTasksWithDeadline.filter(t => {
    const deadline = new Date(t.deadline!);
    deadline.setHours(0, 0, 0, 0);
    return deadline > today;
  });

  // Filtrer les tâches selon le filtre actif
  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'overdue':
        return overdueTasks;
      case 'today':
        return todayTasks;
      case 'completed':
        return completedTasks;
      default:
        return [...overdueTasks, ...todayTasks, ...tasksWithoutDeadline, ...upcomingTasks];
    }
  };

  const filteredTasks = getFilteredTasks();

  const getDeadlineColor = (deadline?: string) => {
    if (!deadline) return 'text-gray-500';
    
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (deadlineDate < todayDate) return 'text-red-600 font-semibold';
    if (deadlineDate.getTime() === todayDate.getTime()) return 'text-blue-600 font-semibold';
    
    const daysUntil = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getDeadlineText = (deadline?: string) => {
    if (!deadline) return 'Pas d\'échéance';
    
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (deadlineDate < todayDate) {
      const daysAgo = Math.ceil((todayDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
      return `⚠️ En retard de ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`;
    }
    
    if (deadlineDate.getTime() === todayDate.getTime()) {
      return '🔥 Aujourd\'hui';
    }
    
    const daysUntil = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    return `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;
  };

  const renderTask = (task: Task) => {
    // Détecter les tâches spéciales
    const isEmailPresentationTask = task.title.toLowerCase().includes('envoyer email de présentation');
    const isDocumentReceptionTask = task.title.toLowerCase().includes('réception des documents clients');
    const isLABFTTask = task.title.toLowerCase().includes('lab-ft');
    const isProfilRisqueTask = task.title.toLowerCase().includes('profil de risque');
    const isCompteRenduRDVTask = task.title.toLowerCase().includes('envoi du compte rendu de rdv');
    
    // Charger les documents demandés pour la tâche de réception
    let requestedDocs: any[] = [];
    if (isDocumentReceptionTask && task.clientId) {
      const userId = session?.user?.id || 'default';
      const requestedDocsKey = `requested_docs_${userId}_${task.clientId}`;
      const stored = localStorage.getItem(requestedDocsKey);
      if (stored) {
        requestedDocs = JSON.parse(stored);
      }
    }

    // Fonction pour toggle un document reçu
    const toggleDocumentReceived = (docName: string) => {
      if (!task.clientId) return;
      const userId = session?.user?.id || 'default';
      const requestedDocsKey = `requested_docs_${userId}_${task.clientId}`;
      const stored = localStorage.getItem(requestedDocsKey);
      if (stored) {
        const docs = JSON.parse(stored);
        const updatedDocs = docs.map((d: any) => 
          d.name === docName ? { ...d, received: !d.received, receivedDate: !d.received ? new Date().toISOString() : null } : d
        );
        localStorage.setItem(requestedDocsKey, JSON.stringify(updatedDocs));
        loadTasks(); // Recharger pour mettre à jour l'affichage
        toast.success(updatedDocs.find((d: any) => d.name === docName).received ? '✅ Document marqué comme reçu' : '⚪ Document marqué comme non reçu');
      }
    };

    // Générer les actionButtons pour les tâches spéciales
    let actionButtons: React.ReactNode = undefined;

    if (isDocumentReceptionTask && requestedDocs.length > 0) {
      actionButtons = (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            📋 Suivi des documents demandés ({requestedDocs.filter(d => d.received).length}/{requestedDocs.length} reçus)
          </h4>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {requestedDocs.map((doc: any, index: number) => (
              <div key={doc.name} className={`flex items-center gap-3 p-3 rounded border-2 transition-colors ${
                doc.received ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}>
                <input
                  type="checkbox"
                  checked={doc.received}
                  onChange={() => toggleDocumentReceived(doc.name)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 flex-shrink-0"
                />
                <span className={`text-sm flex-1 ${doc.received ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                  {doc.name}
                </span>
                
                {doc.received && (
                  <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Reçu</span>
                )}
                {!doc.received && (
                  <span className="text-xs text-red-600 font-medium flex-shrink-0">✗ Manquant</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (isDocumentReceptionTask) {
      actionButtons = (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mt-3">
          💡 Aucun document n'a été demandé pour ce client. Générez d'abord l'email de présentation depuis la fiche client.
        </div>
      );
    } else if (isLABFTTask) {
      // Pour LAB-FT, ajouter un bouton pour aller à la fiche client
      actionButtons = (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mt-3">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-2">
                📝 Questionnaire LAB-FT
              </p>
              <p className="text-xs text-blue-700 mb-3">
                Générez le questionnaire LAB-FT pré-rempli avec les informations du client
              </p>
              {task.clientId && onNavigateToClient && (
                <button
                  onClick={() => onNavigateToClient(task.clientId!)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ouvrir la fiche client</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else if (isProfilRisqueTask && task.clientId) {
      // Pour le Profil de risque, afficher directement les boutons d'action
      actionButtons = (
        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50 mt-3">
          <div className="flex items-start gap-3 mb-3">
            <FileText className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-purple-900 font-medium mb-1">
                🎯 Questionnaire Profil de Risque
              </p>
              <p className="text-xs text-purple-700">
                Générez et envoyez les questionnaires au client et au conjoint
              </p>
            </div>
          </div>
        </div>
      );
    } else if (isCompteRenduRDVTask && task.clientId) {
      // Fonctionnalité de compte rendu désactivée
      actionButtons = (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-3">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-medium mb-2">
                📊 Compte rendu de RDV
              </p>
              <p className="text-xs text-gray-600">
                Fonctionnalité disponible prochainement.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ClientTaskItem
        key={task.id}
        task={task}
        onToggle={toggleTask}
        onUpdateDeadline={updateDeadline}
        actionButtons={actionButtons}
        showClientName={true}
        onNavigateToClient={onNavigateToClient}
      />
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900">To-Do List</h2>
        <p className="text-gray-600 mt-2">Gérez toutes vos tâches clients</p>
      </div>

      {/* Info synchronisation */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce:</strong> Les tâches sont automatiquement créées lors de la création d'un client. 
          Ajoutez des échéances pour qu'elles apparaissent dans l'Agenda.
        </p>
      </div>

      {/* Statistiques - Cards cliquables pour filtrer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveFilter('all')}
          className={`bg-white rounded-lg border-2 p-4 text-left transition-all hover:shadow-lg ${
            activeFilter === 'all' ? 'border-gray-400 shadow-md' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeFilter === 'all' ? 'bg-gray-200' : 'bg-gray-100'
            }`}>
              <Circle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          {activeFilter === 'all' && (
            <p className="text-xs text-gray-500 mt-2">✓ Filtre actif</p>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('overdue')}
          className={`bg-white rounded-lg border-2 p-4 text-left transition-all hover:shadow-lg ${
            activeFilter === 'overdue' ? 'border-red-400 shadow-md' : 'border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">En retard</p>
              <p className="text-2xl font-semibold text-red-600">{overdueTasks.length}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeFilter === 'overdue' ? 'bg-red-200' : 'bg-red-100'
            }`}>
              <Flag className="w-6 h-6 text-red-600" />
            </div>
          </div>
          {activeFilter === 'overdue' && (
            <p className="text-xs text-red-500 mt-2">✓ Filtre actif</p>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('today')}
          className={`bg-white rounded-lg border-2 p-4 text-left transition-all hover:shadow-lg ${
            activeFilter === 'today' ? 'border-blue-400 shadow-md' : 'border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Aujourd'hui</p>
              <p className="text-2xl font-semibold text-blue-600">{todayTasks.length}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeFilter === 'today' ? 'bg-blue-200' : 'bg-blue-100'
            }`}>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          {activeFilter === 'today' && (
            <p className="text-xs text-blue-500 mt-2">✓ Filtre actif</p>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`bg-white rounded-lg border-2 p-4 text-left transition-all hover:shadow-lg ${
            activeFilter === 'completed' ? 'border-green-400 shadow-md' : 'border-green-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Complétées</p>
              <p className="text-2xl font-semibold text-green-600">{completedTasks.length}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeFilter === 'completed' ? 'bg-green-200' : 'bg-green-100'
            }`}>
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          {activeFilter === 'completed' && (
            <p className="text-xs text-green-500 mt-2">✓ Filtre actif</p>
          )}
        </button>
      </div>

      {/* Tâches filtrées */}
      <div className="space-y-6">
        {activeFilter === 'all' ? (
          <>
            {/* En retard */}
            {overdueTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  En retard ({overdueTasks.length})
                </h3>
                <div className="space-y-3">
                  {overdueTasks.map(renderTask)}
                </div>
              </div>
            )}

            {/* Aujourd'hui */}
            {todayTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Aujourd'hui ({todayTasks.length})
                </h3>
                <div className="space-y-3">
                  {todayTasks.map(renderTask)}
                </div>
              </div>
            )}

            {/* Sans échéance - Nouvelle section dédiée */}
            {tasksWithoutDeadline.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-amber-600 flex items-center gap-2">
                    <Circle className="w-5 h-5" />
                    Sans échéance ({tasksWithoutDeadline.length})
                  </h3>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    ⚡ Ajoutez une date
                  </span>
                </div>
                <div className="space-y-3">
                  {tasksWithoutDeadline.map(renderTask)}
                </div>
              </div>
            )}

            {/* À venir */}
            {upcomingTasks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Circle className="w-5 h-5" />
                  À venir ({upcomingTasks.length})
                </h3>
                <div className="space-y-3">
                  {upcomingTasks.map(renderTask)}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Vue filtrée */}
            {filteredTasks.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {activeFilter === 'overdue' && <><Flag className="w-5 h-5 text-red-600" /> <span className="text-red-600">En retard</span></>}
                  {activeFilter === 'today' && <><Calendar className="w-5 h-5 text-blue-600" /> <span className="text-blue-600">Aujourd'hui</span></>}
                  {activeFilter === 'completed' && <><Check className="w-5 h-5 text-green-600" /> <span className="text-green-600">Tâches complétées</span></>}
                  <span className="text-gray-600">({filteredTasks.length})</span>
                </h3>
                <div className="space-y-3">
                  {filteredTasks.map(renderTask)}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeFilter === 'overdue' && <Flag className="w-8 h-8 text-gray-400" />}
                  {activeFilter === 'today' && <Calendar className="w-8 h-8 text-gray-400" />}
                  {activeFilter === 'completed' && <Check className="w-8 h-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeFilter === 'overdue' && 'Aucune tâche en retard'}
                  {activeFilter === 'today' && 'Aucune tâche pour aujourd\'hui'}
                  {activeFilter === 'completed' && 'Aucune tâche complétée'}
                </h3>
                <p className="text-gray-600">
                  {activeFilter === 'overdue' && '🎉 Bravo ! Vous êtes à jour.'}
                  {activeFilter === 'today' && 'Ajoutez des échéances pour voir les tâches ici'}
                  {activeFilter === 'completed' && 'Les tâches complétées apparaîtront ici'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Aucune tâche */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Circle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h3>
            <p className="text-gray-600 mb-4">Créez un client pour générer automatiquement des tâches</p>
          </div>
        )}
      </div>
    </div>
  );
}