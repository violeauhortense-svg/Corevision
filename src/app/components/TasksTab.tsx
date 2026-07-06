import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TASK_DEFINITIONS, getStatusColor, getTaskDefs, type TaskButtonType } from './tasks/taskDefinitions';
import { TaskModals } from './tasks/TaskModals';
import { ClientService } from '../services/ClientService';
import type { Client } from '../services/ClientService';
import type { Task } from '../types/client';
import { apiBaseUrl } from '../utils/supabase/info';
import { toast } from 'sonner';

const STATUSES = ['Prospect', 'Découverte', 'Simulation', 'Lettre Mission', 'Rapport/Audit', 'Suivi MEP', 'Suivi CSP', 'Arbitrage'];

interface TasksTabProps {
  clientId: string;
  clientStatus?: string;
  objectifs?: any[];
  recommendations?: any[];
  entreprises?: any[];
  contacts?: any[];
}

export function TasksTab({ clientId }: TasksTabProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [activeModal, setActiveModal] = useState<{ type: TaskButtonType; taskId: string; status: string } | null>(null);
  const [arbitrageClosureDate, setArbitrageClosureDate] = useState('');
  const [arbitrageTreasuryN1, setArbitrageTreasuryN1] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const { client: data, error } = await ClientService.getClientById(clientId);
      if (error || !data) {
        toast.error(error || 'Client introuvable');
        setLoading(false);
        return;
      }
      setClient(data);
      setArbitrageClosureDate(data.arbitrageClosureDate || '');
      setArbitrageTreasuryN1(String(data.arbitrageTreasuryN1 || ''));
      setExpandedBlocks({ [data.statusOuvert || 'Prospect']: true });
    } catch (err) {
      console.error('❌ Erreur chargement client:', err);
      toast.error('Erreur chargement du client');
    } finally {
      setLoading(false);
    }
  };

  const getBlockState = (status: string) => {
    if (!client?.statusOuvert) return 'A_VENIR';
    const currentIdx = STATUSES.indexOf(client.statusOuvert);
    const statusIdx = STATUSES.indexOf(status);
    if (statusIdx < currentIdx) return 'COMPLETE';
    if (statusIdx === currentIdx) return 'EN_COURS';
    return 'A_VENIR';
  };

  const toggleBlock = (status: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleTaskUpdate = async (status: string, taskId: string, completed: boolean) => {
    if (!client) return;

    try {
      const token = localStorage.getItem('auth_token');
      const url = `${apiBaseUrl}/clients/${clientId}/tache/${taskId}`;
      console.log('🔗 Fetching:', url);
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        toast.success('Tâche mise à jour');
        await loadClient();
      } else {
        toast.error('Erreur mise à jour');
      }
    } catch (err) {
      console.error('❌ Erreur update tâche:', err);
      toast.error('Erreur réseau');
    }
  };

  const saveArbitrageFields = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = `${apiBaseUrl}/clients/${clientId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arbitrageClosureDate,
          arbitrageTreasuryN1: arbitrageTreasuryN1 ? parseInt(arbitrageTreasuryN1) : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Informations arbitrage enregistrées');
        await loadClient();
      }
    } catch (err) {
      console.error('❌ Erreur save arbitrage:', err);
      toast.error('Erreur sauvegarde');
    }
  };

  const calculateArbitrageDeadline = (closureDate: string) => {
    if (!closureDate) return '';
    const date = new Date(closureDate);
    date.setMonth(date.getMonth() + 3);
    return date.toLocaleDateString('fr-FR');
  };

  if (loading || !client) return <div className="p-4 text-center">Chargement...</div>;

  const cspSigne = client.cspSigne ?? false;

  return (
    <div className="space-y-4 p-4">
      {STATUSES.map((status) => {
        const blockState = getBlockState(status);
        const isExpanded = expandedBlocks[status];
        const tasks = client.taches?.[status] || [];
        const taskDefs = getTaskDefs(status);
        const isProtected = ['Suivi CSP', 'Arbitrage'].includes(status);
        const color = getStatusColor(status);

        // Protection CSP
        if (isProtected && !cspSigne) {
          return (
            <div key={status} className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
              <p className="text-sm text-red-700 font-semibold">⚠️ {status} : CSP non signé</p>
              <p className="text-xs text-red-600">Signez le CSP pour accéder à ce statut</p>
            </div>
          );
        }

        return (
          <div key={status} className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            blockState === 'EN_COURS'
              ? `border-[${color}] bg-opacity-10`
              : blockState === 'COMPLETE'
                ? 'border-green-300 bg-gray-50'
                : 'border-gray-300 bg-gray-50 opacity-60'
          }`} style={{
            borderColor: blockState === 'EN_COURS' ? color : undefined,
            backgroundColor: blockState === 'EN_COURS' ? `${color}15` : undefined,
          }}>
            <div className="flex justify-between items-center" onClick={() => blockState !== 'A_VENIR' && toggleBlock(status)}>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{status}</h3>
                <p className="text-xs text-gray-500">{tasks.length} tâches</p>
              </div>
              <div className="text-sm font-bold px-3 py-1 rounded-full bg-white">
                {blockState === 'COMPLETE' ? '✓ COMPLÉTÉ' : blockState === 'EN_COURS' ? '🔵 EN COURS' : '🔒 À VENIR'}
              </div>
              <div className="ml-2">
                {blockState !== 'A_VENIR' && (isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />)}
              </div>
            </div>

            {/* Champs spéciaux Arbitrage */}
            {status === 'Arbitrage' && (isExpanded || blockState === 'EN_COURS') && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">📅 Date de clôture de l'exercice (SEL)</span>
                  <input
                    type="date"
                    value={arbitrageClosureDate}
                    onChange={(e) => setArbitrageClosureDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </label>

                {arbitrageClosureDate && (
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <span className="text-green-700 font-semibold">⏰ Date limite arbitrage:</span>
                    <span className="text-green-600 ml-2 font-bold">{calculateArbitrageDeadline(arbitrageClosureDate)}</span>
                  </div>
                )}

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">💰 Besoin trésorerie N-1 (€)</span>
                  <input
                    type="number"
                    value={arbitrageTreasuryN1}
                    onChange={(e) => setArbitrageTreasuryN1(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="0"
                  />
                </label>

                <button
                  onClick={saveArbitrageFields}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  💾 Enregistrer les informations
                </button>
              </div>
            )}

            {/* Liste des tâches */}
            {(isExpanded || blockState === 'EN_COURS') && blockState !== 'A_VENIR' && (
              <div className="mt-4 space-y-2">
                {taskDefs.map((taskDef, idx) => {
                  const task = tasks[idx] || {
                    id: taskDef.id,
                    title: taskDef.title,
                    completed: false,
                    status: 'pending' as const,
                    description: taskDef.description,
                  };

                  // Logique Suivi CSP: masquer tâches 2 et 3 si tâche 1 non complétée
                  if (status === 'Suivi CSP' && idx > 0) {
                    const firstTask = tasks[0];
                    if (firstTask && !firstTask.completed) {
                      return null;
                    }
                  }

                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded border transition-all ${
                        blockState === 'COMPLETE' ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed || task.status === 'na'}
                        onChange={(e) => {
                          const taskIdToSend = String(idx);
                          console.log('🔍 Checkbox clicked:', {
                            blockState,
                            status,
                            idx,
                            'task.id': task.id,
                            'taskIdToSend': taskIdToSend,
                            'URL will be': `/make-server-cac859af/clients/${clientId}/tache/${taskIdToSend}`
                          });
                          if (blockState === 'EN_COURS') {
                            console.log('✅ Calling handleTaskUpdate with taskId:', taskIdToSend);
                            handleTaskUpdate(status, taskIdToSend, !task.completed);
                          } else {
                            console.warn('⚠️ blockState is not EN_COURS:', blockState);
                          }
                        }}
                        disabled={blockState !== 'EN_COURS'}
                        className="mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{taskDef.description}</p>
                        {task.deadline && (
                          <p className="text-xs text-gray-500 mt-1">📅 {new Date(task.deadline).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                      {blockState === 'EN_COURS' && taskDef.button && (
                        <button
                          onClick={() => setActiveModal({ type: taskDef.button!, taskId: task.id, status })}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium whitespace-nowrap"
                        >
                          {taskDef.button === 'origine' && '➕ Ajouter'}
                          {taskDef.button === 'rdv' && '📅 Organiser'}
                          {taskDef.button === 'mailComptable' && '📧 Préparer'}
                          {taskDef.button === 'o2s' && '💾 O2S+Excel'}
                          {taskDef.button === 'conformite' && '🔒 Conformité'}
                          {taskDef.button === 'bilanSuivi' && '📋 Suivi'}
                          {taskDef.button === 'noteRdv' && '📝 Notes'}
                          {taskDef.button === 'verifications' && '💹 Vérif'}
                          {taskDef.button === 'noteRapport' && '📝 Notes'}
                          {taskDef.button === 'recommandation' && '➕ Recomm'}
                          {taskDef.button === 'documents' && '📄 Documents'}
                          {taskDef.button === 'treso' && '💰 Tréso'}
                          {taskDef.button === 'mailComptableArb' && '📞 Comptable'}
                        </button>
                      )}
                      {task.status === 'na' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⊘ N.C.</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {blockState === 'A_VENIR' && (
              <p className="mt-2 text-sm text-gray-600">🔒 Ce statut sera déverrouillé une fois le précédent terminé</p>
            )}
          </div>
        );
      })}

      <TaskModals
        isOpen={!!activeModal}
        modalType={activeModal?.type || null}
        task={
          activeModal
            ? (client.taches?.[activeModal.status]?.find((t) => t.id === activeModal.taskId) || {
                id: activeModal.taskId,
                title: '',
                completed: false,
                status: 'pending' as const,
              })
            : null
        }
        clientId={clientId}
        onClose={() => setActiveModal(null)}
        onSave={async () => {
          if (activeModal) {
            await handleTaskUpdate(activeModal.status, activeModal.taskId, true);
          }
        }}
      />
    </div>
  );
}
