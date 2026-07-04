import { useState, useEffect } from 'react';
import { Users, TrendingUp, Euro, CheckCircle, ArrowRight, Calendar, Mail, FileCheck, DollarSign, PackageCheck } from 'lucide-react';
import { PipelineClientCard } from './PipelineClientCard';
import { PIPELINE_TASKS, getStageLabel } from '../utils/pipelineTasks';
import { toast } from 'sonner';
import { agendaAPI } from '../services/agendaAPI';
import { corevisionAPI } from '../services/corevisionAPI';
import { clientAPI } from '../services/api';
import type { AgendaEvent } from '../types/agenda';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  patrimoine: number;
  statut: string;
  date_creation: string;
  conseiller_id: string;
}

interface ClientTask {
  id: string;
  client_id: string;
  task_id: string;
  titre: string;
  completed: boolean;
}

interface DashboardViewProps {
  session: any;
}

export function DashboardView({ session }: DashboardViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientTasks, setClientTasks] = useState<ClientTask[]>([]);
  const [meetings, setMeetings] = useState<AgendaEvent[]>([]);
  const [commandesEnAttente, setCommandesEnAttente] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Chargement initial
  useEffect(() => {
    checkServerAndLoadClients();
    loadTasksFromLocalStorage();
    loadMeetings();
    loadCommandesCoreVision();
  }, []);

  useEffect(() => {
    // Initialiser les tâches pour les nouveaux clients
    initializeClientTasks();
  }, [clients]);

  const initializeClientTasks = () => {
    const newTasks: ClientTask[] = [...clientTasks];
    let hasChanges = false;

    clients.forEach(client => {
      const pipelineTasks = PIPELINE_TASKS[client.statut] || [];
      pipelineTasks.forEach(pipelineTask => {
        const taskExists = newTasks.some(
          t => t.client_id === client.id && t.task_id === pipelineTask.id
        );
        if (!taskExists) {
          newTasks.push({
            id: `${client.id}-${pipelineTask.id}`,
            client_id: client.id,
            task_id: pipelineTask.id,
            titre: pipelineTask.titre,
            completed: false,
          });
          hasChanges = true;
        }
      });
    });

    if (hasChanges) {
      setClientTasks(newTasks);
      saveTasksToLocalStorage(newTasks);
    }
  };

  const loadTasksFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(`client_tasks_${session?.user?.id || 'default'}`);
      if (stored) {
        setClientTasks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement tâches localStorage:', error);
    }
  };

  const saveTasksToLocalStorage = (tasks: ClientTask[]) => {
    try {
      localStorage.setItem(`client_tasks_${session?.user?.id || 'default'}`, JSON.stringify(tasks));
    } catch (error) {
      console.error('Erreur sauvegarde tâches localStorage:', error);
    }
  };

  const saveClientsToLocalStorage = (clientsList: Client[]) => {
    try {
      localStorage.setItem(`clients_${session?.user?.id || 'default'}`, JSON.stringify(clientsList));
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  };

  const handleTaskToggle = (clientId: string, taskId: string, completed: boolean) => {
    const updatedTasks = clientTasks.map(t =>
      t.client_id === clientId && t.task_id === taskId
        ? { ...t, completed }
        : t
    );
    setClientTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
  };

  const handleClientStageChange = async (clientId: string, newStage: string) => {
    // Optimistic update
    const updatedClients = clients.map(c =>
      c.id === clientId ? { ...c, statut: newStage } : c
    );
    setClients(updatedClients);

    // Persister sur le serveur
    try {
      await clientAPI.update(clientId, { statut: newStage });
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      // Rollback
      setClients(clients);
      toast.error('Erreur lors du changement de statut');
      return;
    }

    // Réinitialiser les tâches pipeline pour la nouvelle étape
    const filteredTasks = clientTasks.filter(t => t.client_id !== clientId);
    const newPipelineTasks = PIPELINE_TASKS[newStage] || [];
    const newClientTasks = newPipelineTasks.map((pt, index) => {
      const isFirstTaskR0 = newStage === 'R0 - Prospect' && index === 0 && pt.titre === 'Origine du prospect';
      return {
        id: `${clientId}-${pt.id}`,
        client_id: clientId,
        task_id: pt.id,
        titre: pt.titre,
        completed: isFirstTaskR0,
      };
    });

    const allTasks = [...filteredTasks, ...newClientTasks];
    setClientTasks(allTasks);
    saveTasksToLocalStorage(allTasks);
  };

  const getClientTasks = (clientId: string) => {
    return clientTasks.filter(t => t.client_id === clientId);
  };

  const checkServerAndLoadClients = async () => {
    try {
      setLoading(true);
      const clients = await clientAPI.getAll();
      console.log(`✅ Dashboard - ${clients.length} clients chargés depuis le serveur`);
      setClients(clients);
    } catch (error) {
      console.error('❌ Dashboard - Erreur chargement clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClientsFromLocalStorage = () => {
    // Conservé pour compatibilité ascendante, redirige vers l'API
    checkServerAndLoadClients();
  };

  const loadClients = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/clients`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientTasks = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/client-tasks`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClientTasks(data.client_tasks || []);
      }
    } catch (error) {
      console.error('Erreur chargement tâches clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMeetings = async () => {
    try {
      const allMeetings = await agendaAPI.getAll();
      setMeetings(allMeetings);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    }
  };

  const loadCommandesCoreVision = async () => {
    try {
      const count = await corevisionAPI.getPendingCount();
      setCommandesEnAttente(count);
    } catch (error) {
      console.error('Erreur chargement commandes CoreVision:', error);
    }
  };

  // Calcul des statistiques
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  // KPI: RDV aujourd'hui
  const rdvToday = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    meetingDate.setHours(0, 0, 0, 0);
    return meetingDate.getTime() === today.getTime() && !meeting.completed;
  }).length;

  // KPI: RDV cette semaine
  const rdvThisWeek = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    return meetingDate >= today && meetingDate <= endOfWeek && !meeting.completed;
  }).length;

  // KPI: Commandes en attente
  const commandesEnAttenteCount = commandesEnAttente;

  // KPI: Recommandations non validées (clients au statut R2)
  const recommendationsNonValidees = clients.filter(c => c.statut === 'R2 - Recommandation proposée').length;

  // KPI: Mails non traités (placeholder pour plus tard)
  const mailsNonTraites = 0; // À implémenter plus tard

  // KPI: Chiffre d'affaires (placeholder pour plus tard)
  const chiffreAffaires = 0; // À implémenter plus tard

  const stats = {
    total: clients.length,
    prospect: clients.filter(c => c.statut === 'R0 - Prospect').length,
    decouverte: clients.filter(c => c.statut === 'R0-R1 - Découverte').length,
    audit: clients.filter(c => c.statut === 'R1 - Audit patrimonial').length,
    strategie: clients.filter(c => c.statut === 'R1-R2 - Stratégie définie').length,
    recommandations: clients.filter(c => c.statut === 'R2 - Recommandation proposée').length,
    miseEnPlace: 0, // Statut obsolète
    suivi: clients.filter(c => c.statut === 'Rsuivi - Suivi patrimonial').length,
    patrimoineTotal: clients.reduce((sum, c) => sum + c.patrimoine, 0),
  };

  const getStatusLabel = (statut: string) => {
    return statut; // Les statuts sont déjà les bons libellés
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'R0 - Prospect': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'R0-R1 - Découverte': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'R1 - Audit patrimonial': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'R1-R2 - Stratégie définie': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'R2 - Recommandation proposée': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Rsuivi - Suivi patrimonial': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats Cards - KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        {/* RDV aujourd'hui */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{rdvToday}</div>
          <div className="text-sm text-gray-600">RDV aujourd'hui</div>
        </div>

        {/* RDV cette semaine */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{rdvThisWeek}</div>
          <div className="text-sm text-gray-600">RDV cette semaine</div>
        </div>

        {/* Commandes en attente */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <PackageCheck className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{commandesEnAttenteCount}</div>
          <div className="text-sm text-gray-600">Rédaction audit en attente</div>
        </div>

        {/* Recommandations non validées */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{recommendationsNonValidees}</div>
          <div className="text-sm text-gray-600">Recommandations en attente</div>
        </div>

        {/* Mails non traités - Placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 opacity-50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{mailsNonTraites}</div>
          <div className="text-sm text-gray-600">Mails non traités</div>
          <div className="text-xs text-gray-400 mt-1">(À venir)</div>
        </div>

        {/* Chiffre d'affaires - Placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 opacity-50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {chiffreAffaires.toLocaleString('fr-FR')}€
          </div>
          <div className="text-sm text-gray-600">CA du mois</div>
          <div className="text-xs text-gray-400 mt-1">(À venir)</div>
        </div>
      </div>

      {/* Pipeline visuelle */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Pipeline client - Cycle de conseil patrimonial</h3>
          <p className="text-sm text-gray-600">Cliquez sur les clients pour gérer leurs tâches</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {/* Prospect */}
          <div className={`border-2 rounded-lg p-4 ${getStatusColor('R0 - Prospect')}`}>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-1">{stats.prospect}</div>
              <div className="text-xs font-semibold">Prospect</div>
              <div className="text-xs opacity-75 mt-1">
                {clientTasks.filter(t => clients.find(c => c.id === t.client_id && c.statut === 'R0 - Prospect') && !t.completed).length} actions
              </div>
            </div>
            <div className="space-y-3">
              {clients.filter(c => c.statut === 'R0 - Prospect').map(client => (
                <PipelineClientCard
                  key={client.id}
                  client={client}
                  tasks={getClientTasks(client.id)}
                  onTaskToggle={handleTaskToggle}
                  onClientStageChange={handleClientStageChange}
                />
              ))}
            </div>
          </div>

          {/* Découverte */}
          <div className={`border-2 rounded-lg p-4 ${getStatusColor('R0-R1 - Découverte')}`}>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-1">{stats.decouverte}</div>
              <div className="text-xs font-semibold">Découverte</div>
              <div className="text-xs opacity-75 mt-1">
                {clientTasks.filter(t => clients.find(c => c.id === t.client_id && c.statut === 'R0-R1 - Découverte') && !t.completed).length} actions
              </div>
            </div>
            <div className="space-y-3">
              {clients.filter(c => c.statut === 'R0-R1 - Découverte').map(client => (
                <PipelineClientCard
                  key={client.id}
                  client={client}
                  tasks={getClientTasks(client.id)}
                  onTaskToggle={handleTaskToggle}
                  onClientStageChange={handleClientStageChange}
                />
              ))}
            </div>
          </div>

          {/* Audit patrimonial */}
          <div className={`border-2 rounded-lg p-4 ${getStatusColor('R1 - Audit patrimonial')}`}>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-1">{stats.audit}</div>
              <div className="text-xs font-semibold">Audit patrimonial</div>
              <div className="text-xs opacity-75 mt-1">
                {clientTasks.filter(t => clients.find(c => c.id === t.client_id && c.statut === 'R1 - Audit patrimonial') && !t.completed).length} actions
              </div>
            </div>
            <div className="space-y-3">
              {clients.filter(c => c.statut === 'R1 - Audit patrimonial').map(client => (
                <PipelineClientCard
                  key={client.id}
                  client={client}
                  tasks={getClientTasks(client.id)}
                  onTaskToggle={handleTaskToggle}
                  onClientStageChange={handleClientStageChange}
                />
              ))}
            </div>
          </div>

          {/* Stratégie définie */}
          <div className={`border-2 rounded-lg p-4 ${getStatusColor('R1-R2 - Stratégie définie')}`}>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-1">{stats.strategie}</div>
              <div className="text-xs font-semibold">Stratégie définie</div>
              <div className="text-xs opacity-75 mt-1">
                {clientTasks.filter(t => clients.find(c => c.id === t.client_id && c.statut === 'R1-R2 - Stratégie définie') && !t.completed).length} actions
              </div>
            </div>
            <div className="space-y-3">
              {clients.filter(c => c.statut === 'R1-R2 - Stratégie définie').map(client => (
                <PipelineClientCard
                  key={client.id}
                  client={client}
                  tasks={getClientTasks(client.id)}
                  onTaskToggle={handleTaskToggle}
                  onClientStageChange={handleClientStageChange}
                />
              ))}
            </div>
          </div>

          {/* Recommandations proposées */}
          <div className={`border-2 rounded-lg p-4 ${getStatusColor('R2 - Recommandation proposée')}`}>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-1">{stats.recommandations}</div>
              <div className="text-xs font-semibold">Recommandations</div>
              <div className="text-xs opacity-75 mt-1">
                {clientTasks.filter(t => clients.find(c => c.id === t.client_id && c.statut === 'R2 - Recommandation proposée') && !t.completed).length} actions
              </div>
            </div>
            <div className="space-y-3">
              {clients.filter(c => c.statut === 'R2 - Recommandation proposée').map(client => (
                <PipelineClientCard
                  key={client.id}
                  client={client}
                  tasks={getClientTasks(client.id)}
                  onTaskToggle={handleTaskToggle}
                  onClientStageChange={handleClientStageChange}
                />
              ))}
            </div>
          </div>

          {/* Mises en place en cours */}
          <div className={`border-2 rounded-lg p-4 ${getStatusColor('Mises en place en cours')}`}>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-1">{stats.miseEnPlace}</div>
              <div className="text-xs font-semibold">Mises en place</div>
              <div className="text-xs opacity-75 mt-1">
                {clientTasks.filter(t => clients.find(c => c.id === t.client_id && c.statut === 'Mises en place en cours') && !t.completed).length} actions
              </div>
            </div>
            <div className="space-y-3">
              {clients.filter(c => c.statut === 'Mises en place en cours').map(client => (
                <PipelineClientCard
                  key={client.id}
                  client={client}
                  tasks={getClientTasks(client.id)}
                  onTaskToggle={handleTaskToggle}
                  onClientStageChange={handleClientStageChange}
                />
              ))}
            </div>
          </div>

          {/* Suivi patrimonial */}
          <div className={`border-2 rounded-lg p-4 ${getStatusColor('Rsuivi - Suivi patrimonial')}`}>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-1">{stats.suivi}</div>
              <div className="text-xs font-semibold">Suivi patrimonial</div>
              <div className="text-xs opacity-75 mt-1">
                {clientTasks.filter(t => clients.find(c => c.id === t.client_id && c.statut === 'Rsuivi - Suivi patrimonial') && !t.completed).length} actions
              </div>
            </div>
            <div className="space-y-3">
              {clients.filter(c => c.statut === 'Rsuivi - Suivi patrimonial').map(client => (
                <PipelineClientCard
                  key={client.id}
                  client={client}
                  tasks={getClientTasks(client.id)}
                  onTaskToggle={handleTaskToggle}
                  onClientStageChange={handleClientStageChange}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Activité récente</h3>
        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucune activité pour le moment</p>
            <p className="text-sm text-gray-500 mt-1">Créez votre premier client pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.slice(0, 5).map(client => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {client.prenom[0]}{client.nom[0]}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{client.prenom} {client.nom}</div>
                    <div className="text-sm text-gray-600">Créé le {client.date_creation}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.statut)}`}>
                  {client.statut}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}