import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TaskStageAccordion } from './TaskStageAccordion';
import { taskAPI, clientAPI } from '../../services/api';
import { emitTaskUpdated, TASK_EVENTS } from '../../utils/taskEvents';
import { useTaskProgression } from '../../hooks/useTaskProgression';
import { useTaskTemplates } from '../../hooks/useTaskTemplates';
import type { Task, PipelineStage } from '../../types/client';

interface TasksTabProps {
  clientId: string;
  clientStatus: PipelineStage;
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
    label: '1️⃣ Prospect',
    color: 'blue',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
    activeBg: 'bg-blue-600',
  },
  'R0-R1 - Découverte': {
    label: '2️⃣ Découverte',
    color: 'cyan',
    bgGradient: 'from-cyan-50 to-cyan-100',
    borderColor: 'border-cyan-300',
    textColor: 'text-cyan-900',
    iconColor: 'text-cyan-600',
    activeBg: 'bg-cyan-600',
  },
  'R1 - Audit patrimonial': {
    label: '3️⃣ Audit patrimonial',
    color: 'indigo',
    bgGradient: 'from-indigo-50 to-indigo-100',
    borderColor: 'border-indigo-300',
    textColor: 'text-indigo-900',
    iconColor: 'text-indigo-600',
    activeBg: 'bg-indigo-600',
  },
  'R1-R2 - Stratégie définie': {
    label: '4️⃣ Stratégie définie',
    color: 'teal',
    bgGradient: 'from-teal-50 to-teal-100',
    borderColor: 'border-teal-300',
    textColor: 'text-teal-900',
    iconColor: 'text-teal-600',
    activeBg: 'bg-teal-600',
  },
  'R2 - Recommandation proposée': {
    label: '5️⃣ Recommandation proposée',
    color: 'green',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-900',
    iconColor: 'text-green-600',
    activeBg: 'bg-green-600',
  },
  'Rsuivi - Suivi patrimonial': {
    label: '7️⃣ Suivi patrimonial',
    color: 'purple',
    bgGradient: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600',
    activeBg: 'bg-purple-600',
  },
};

export function TasksTab({ clientId, clientStatus }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openStage, setOpenStage] = useState<PipelineStage | null>(clientStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [currentClientStatus, setCurrentClientStatus] = useState<PipelineStage>(clientStatus);

  // Hooks personnalisés
  const { checkAndProgressToNextStage, checkAndRegressToPreviousStage, getStageState } = useTaskProgression();
  const { migrateTasksWithoutStage, syncTasksWithTemplates, createInitialTasks, getTasksForStage } = useTaskTemplates();

  // Charger les données du client pour le modal d'email
  useEffect(() => {
    const loadClientData = async () => {
      try {
        const data = await clientAPI.getById(clientId);
        console.log('✅ Client data chargé:', data);
        setClientData(data);
      } catch (error) {
        console.error('❌ Erreur chargement client:', error);
      }
    };

    loadClientData();
  }, [clientId]);

  // Charger les tâches du client
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      
      console.log(`📋 Chargement des tâches pour client ${clientId}, statut actuel: ${currentClientStatus}`);
      
      const allTasks = await taskAPI.getAll();
      
      // Filtrer les tâches du client
      let clientTasks = allTasks.filter((task: Task) => task.clientId === clientId);
      
      console.log(`📋 ${clientTasks.length} tâches trouvées pour ce client`);
      
      // Auto-création : Si aucune tâche n'existe, les créer automatiquement
      if (clientTasks.length === 0) {
        console.log(`⚠️ Aucune tâche trouvée, création pour le statut ${currentClientStatus}`);
        clientTasks = await createInitialTasks(clientId, currentClientStatus);
      }
      
      // Migration : Migrer les tâches qui n'ont pas de champ 'stage'
      clientTasks = await migrateTasksWithoutStage(clientTasks);
      
      // Migration : Vérifier si les tâches correspondent aux nouveaux templates
      const hasMigrated = await syncTasksWithTemplates(clientId, currentClientStatus, clientTasks);
      
      if (hasMigrated) {
        // Recharger les tâches après migration
        const refreshedTasks = await taskAPI.getAll();
        clientTasks = refreshedTasks.filter((task: Task) => task.clientId === clientId);
      }
      
      console.log(`✅ ${clientTasks.length} tâches chargées après migration`);
      setTasks(clientTasks);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      toast.error('Erreur lors du chargement des tâches');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les tâches au montage et mettre à jour l'accordéon selon le statut
  useEffect(() => {
    console.log(`🔄 TaskTab useEffect déclenché: clientId=${clientId}, clientStatus=${clientStatus}`);
    setCurrentClientStatus(clientStatus); // Synchroniser le statut local avec le prop
    loadTasks();
    setOpenStage(clientStatus);
  }, [clientId, clientStatus]);

  // Écouter les événements de mise à jour des tâches
  useEffect(() => {
    const handleTaskUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { clientId: updatedClientId } = customEvent.detail;
      
      if (updatedClientId === clientId) {
        console.log('🔄 Rechargement des tâches suite à un événement');
        loadTasks();
      }
    };

    window.addEventListener(TASK_EVENTS.TASK_UPDATED, handleTaskUpdated);
    window.addEventListener(TASK_EVENTS.TASK_CREATED, handleTaskUpdated);
    window.addEventListener(TASK_EVENTS.TASK_DELETED, handleTaskUpdated);
    window.addEventListener(TASK_EVENTS.TASKS_BULK_UPDATED, handleTaskUpdated);

    return () => {
      window.removeEventListener(TASK_EVENTS.TASK_UPDATED, handleTaskUpdated);
      window.removeEventListener(TASK_EVENTS.TASK_CREATED, handleTaskUpdated);
      window.removeEventListener(TASK_EVENTS.TASK_DELETED, handleTaskUpdated);
      window.removeEventListener(TASK_EVENTS.TASKS_BULK_UPDATED, handleTaskUpdated);
    };
  }, [clientId]);

  // Toggle l'état de complétion d'une tâche
  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        toast.error('Tâche introuvable');
        return;
      }

      const updatedTask = { ...task, completed: !task.completed };
      await taskAPI.update(taskId, updatedTask);
      
      const newTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
      setTasks(newTasks);
      emitTaskUpdated(updatedTask);

      toast.success(
        updatedTask.completed ? 'Tâche marquée comme complétée' : 'Tâche marquée comme en cours'
      );

      // Si on DÉCOCHE une tâche, vérifier la régression
      if (!updatedTask.completed) {
        await checkAndRegressToPreviousStage(
          clientId,
          task,
          currentClientStatus,
          setCurrentClientStatus,
          loadTasks
        );
      } else {
        // Si on COCHE une tâche, vérifier la progression
        await checkAndProgressToNextStage(
          clientId,
          currentClientStatus,
          newTasks,
          (newStatus) => {
            setCurrentClientStatus(newStatus);
            setOpenStage(newStatus);
          },
          loadTasks
        );
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  // Mettre à jour une tâche (pour les champs personnalisés)
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        toast.error('Tâche introuvable');
        return;
      }

      const updatedTask = { ...task, ...updates };
      await taskAPI.update(taskId, updatedTask);
      
      const newTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
      setTasks(newTasks);
      emitTaskUpdated(updatedTask);

      toast.success('Tâche mise à jour');

      // Vérifier si toutes les tâches sont complétées
      await checkAndProgressToNextStage(
        clientId,
        currentClientStatus,
        newTasks,
        (newStatus) => {
          setCurrentClientStatus(newStatus);
          setOpenStage(newStatus);
        },
        loadTasks
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  // Mettre à jour la date d'échéance d'une tâche
  const handleUpdateDueDate = async (taskId: string, dueDate: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        toast.error('Tâche introuvable');
        return;
      }

      const updatedTask = { ...task, dueDate };
      await taskAPI.update(taskId, updatedTask);
      
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? updatedTask : t))
      );

      emitTaskUpdated(updatedTask);
      toast.success("Date d'échéance mise à jour");
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la date:', error);
      toast.error('Erreur lors de la mise à jour de la date');
    }
  };

  // Ouvrir le modal d'email
  const handleSendEmail = (task: Task) => {
    // Fonctionnalité d'envoi d'email désactivée
    toast.info('Fonctionnalité d\'envoi d\'email non disponible');
  };

  // Toggle l'accordéon
  const toggleStage = (stage: PipelineStage) => {
    setOpenStage(openStage === stage ? null : stage);
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-3 text-gray-400 animate-spin" />
        <p className="text-gray-500">Chargement des tâches...</p>
      </div>
    );
  }

  // Liste de tous les statuts à afficher
  const allStages: PipelineStage[] = ['R0 - Prospect', 'R0-R1 - Découverte', 'R1 - Audit patrimonial', 'R1-R2 - Stratégie définie', 'R2 - Recommandation proposée', 'Rsuivi - Suivi patrimonial'];

  return (
    <div className="space-y-4">
      {/* Accordéons pour chaque statut */}
      {allStages.map((stage) => {
        const config = STATUS_CONFIG[stage] || STATUS_CONFIG['R0 - Prospect'];
        const stageState = getStageState(stage, currentClientStatus);
        const isOpen = openStage === stage;
        const isCurrent = stageState === 'current';
        const isPast = stageState === 'past';
        const isFuture = stageState === 'future';
        
        const stageTemplateTasks = getTasksForStage(stage);
        
        // Filtrer les tâches par leur champ 'stage' pour afficher l'historique
        const stageTasks = isFuture 
          ? []
          : tasks.filter(t => t.stage === stage);

        return (
          <TaskStageAccordion
            key={stage}
            stage={stage}
            isOpen={isOpen}
            isCurrent={isCurrent}
            isPast={isPast}
            isFuture={isFuture}
            tasks={stageTasks}
            templateTasks={stageTemplateTasks}
            config={config}
            onToggle={() => toggleStage(stage)}
            onToggleTask={handleToggleTask}
            onUpdateTask={handleUpdateTask}
            onUpdateDueDate={handleUpdateDueDate}
            onSendEmail={handleSendEmail}
            clientId={clientId}
          />
        );
      })}
    </div>
  );
}