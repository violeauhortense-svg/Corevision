import { useState, useEffect } from 'react';
import { Calendar, Flag, Check, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { ClientTaskItem } from './ClientTaskItem';
import { ClientService } from '../services/ClientService';
import { getAllOpenClientTasks, applyClientTaskChange, type OpenClientTask } from '../services/clientTasksService';

interface TodoViewProps {
  session: any;
  onNavigateToClient?: (clientId: string) => void;
}

type FilterType = 'all' | 'today' | 'completed';

export function TodoView({ session, onNavigateToClient }: TodoViewProps) {
  const [tasks, setTasks] = useState<OpenClientTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const openTasks = await getAllOpenClientTasks();
      setTasks(openTasks);
    } catch (error) {
      console.error('❌ Erreur chargement tâches:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { client } = await ClientService.getClientById(task.clientId, true);
    if (!client) {
      toast.error('Client introuvable');
      return;
    }

    const result = await applyClientTaskChange(client, taskId, { completed: true, taskStatus: 'validated' });
    if (result.success) {
      toast.success('✅ Tâche marquée comme complétée');
      if (result.statusProgressed) {
        toast.success(`🎉 ${task.clientName} passe au statut suivant : ${result.statusProgressed} !`);
      }
      await loadTasks();
    } else {
      toast.error('❌ Erreur lors de la completion de la tâche');
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasksWithDeadline = tasks.filter((t) => t.deadline);
  const tasksWithoutDeadline = tasks.filter((t) => !t.deadline);

  const sortedTasksWithDeadline = [...tasksWithDeadline].sort(
    (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
  );

  const overdueTasks = sortedTasksWithDeadline.filter((t) => {
    const d = new Date(t.deadline!);
    d.setHours(0, 0, 0, 0);
    return d < today;
  });

  const todayTasks = sortedTasksWithDeadline.filter((t) => {
    const d = new Date(t.deadline!);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const upcomingTasks = sortedTasksWithDeadline.filter((t) => {
    const d = new Date(t.deadline!);
    d.setHours(0, 0, 0, 0);
    return d > today;
  });

  const getFilteredTasks = () => {
    if (activeFilter === 'today') return todayTasks;
    if (activeFilter === 'completed') return [];
    return [...overdueTasks, ...todayTasks, ...tasksWithoutDeadline, ...upcomingTasks];
  };

  const filteredTasks = getFilteredTasks();

  const renderTask = (task: OpenClientTask) => (
    <ClientTaskItem
      key={`${task.clientId}-${task.id}`}
      task={task as any}
      onToggle={toggleTask}
      onUpdateDeadline={() => {}}
      showClientName={true}
      onNavigateToClient={onNavigateToClient}
    />
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900">To-Do List</h2>
        <p className="text-gray-600 mt-2">Toutes les tâches en attente de vos clients (pipeline en cours)</p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce:</strong> Ces tâches proviennent directement du pipeline de chaque client (onglet "Tâches" de la fiche client).
          Validez-les ici ou depuis la fiche client - c'est synchronisé.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setActiveFilter('all')}
          className={`bg-white rounded-lg border-2 p-4 text-left transition-all hover:shadow-lg ${
            activeFilter === 'all' ? 'border-gray-400 shadow-md' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total en attente</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
              <Circle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
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
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`bg-white rounded-lg border-2 p-4 text-left transition-all hover:shadow-lg ${
            activeFilter === 'completed' ? 'border-orange-400 shadow-md' : 'border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">En retard</p>
              <p className="text-2xl font-semibold text-orange-600">{overdueTasks.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-100">
              <Flag className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche en attente</h3>
            <p className="text-gray-600">Toutes les tâches de vos clients sont validées 🎉</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-3">{filteredTasks.map(renderTask)}</div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">Aucune tâche pour ce filtre</p>
          </div>
        )}
      </div>
    </div>
  );
}
