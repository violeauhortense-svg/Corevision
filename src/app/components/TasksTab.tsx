import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TASK_DEFINITIONS, getStatusColor, getTaskDefs, type TaskButtonType } from './tasks/taskDefinitions';
import { TaskModals } from './tasks/TaskModals';
import { RecommandationsModule } from './client-detail/RecommandationsModule';
import type { AuditRecommendation } from './client-detail/types';
import { ClientService } from '../services/ClientService';
import type { Client } from '../services/ClientService';
import type { Task } from '../types/client';
import { apiBaseUrl } from '../utils/api/info';
import { toast } from 'sonner';

const STATUSES = ['Prospect', 'Découverte', 'Simulation', 'Lettre Mission', 'Rapport/Audit', 'Suivi MEP', 'Suivi CSP', 'Arbitrage'];

interface TasksTabProps {
  clientId: string;
  clientStatus?: string;
  objectifs?: any[];
  auditRecommendations?: AuditRecommendation[];
  onUpdateAuditRecommendations?: (recommendations: AuditRecommendation[]) => Promise<void> | void;
  entreprises?: any[];
  contacts?: any[];
  // Nom du statut/bloc à déplier automatiquement à l'arrivée sur cet
  // onglet - utilisé par les liens "Voir la tâche" ailleurs dans la
  // fiche client (ex: Arbitrage de rémunération depuis le Patrimoine).
  expandBlock?: string;
}

export function TasksTab({ clientId, auditRecommendations = [], onUpdateAuditRecommendations, expandBlock }: TasksTabProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [activeModal, setActiveModal] = useState<{ type: TaskButtonType; taskId: string; status: string } | null>(null);
  const [showRecommandationsModule, setShowRecommandationsModule] = useState(false);
  const [arbitrageClosureDate, setArbitrageClosureDate] = useState('');
  const [arbitrageTreasuryN1, setArbitrageTreasuryN1] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      // Always bypass ClientService's 5-minute cache here: this tab writes
      // directly to the API (not through ClientService.updateClient, which
      // clears the cache itself), so a stale cached record would silently
      // undo every task validation and status progression on next load.
      const { client: data, error } = await ClientService.getClientById(clientId, true);
      if (error || !data) {
        toast.error(error || 'Client introuvable');
        setLoading(false);
        return;
      }
      setClient(data);
      setArbitrageClosureDate(data.arbitrageClosureDate || '');
      setArbitrageTreasuryN1(String(data.arbitrageTreasuryN1 || ''));
      setExpandedBlocks({
        [data.statusOuvert || 'Prospect']: true,
        ...(expandBlock ? { [expandBlock]: true } : {}),
      });
    } catch (err) {
      console.error('❌ Erreur chargement client:', err);
      toast.error('Erreur chargement du client');
    } finally {
      setLoading(false);
    }
  };

  const getBlockState = (status: string) => {
    const clientStatus = client?.statusOuvert || client?.status || 'Prospect';
    // Case-insensitive match: client.status is sometimes stored lowercase
    // ("prospect") while STATUSES uses the display casing ("Prospect").
    // STATUSES.indexOf() with a mismatched case used to return -1, which
    // made every block compare against a nonexistent index and permanently
    // show "À venir" - nothing was ever active.
    let currentIdx = STATUSES.findIndex((s) => s.toLowerCase() === clientStatus.toLowerCase());
    if (currentIdx === -1) currentIdx = 0; // Unrecognized status: default to the first block
    const statusIdx = STATUSES.indexOf(status);

    // "Suivi CSP" and "Arbitrage" run in parallel once a client reaches
    // either one, not sequentially - completing/reaching one shouldn't
    // collapse or lock the other, so both stay open together for as
    // long as the client sits anywhere at or past "Suivi CSP".
    const cspIdx = STATUSES.indexOf('Suivi CSP');
    if ((status === 'Suivi CSP' || status === 'Arbitrage') && currentIdx >= cspIdx) {
      return 'EN_COURS';
    }

    if (statusIdx < currentIdx) return 'COMPLETE';
    if (statusIdx === currentIdx) return 'EN_COURS';
    return 'A_VENIR';
  };

  const toggleBlock = (status: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  // Persists a single field on the client record (e.g. dateNextRdv from
  // the RDV modal) through the generic client PATCH endpoint.
  const updateClientField = async (field: string, value: any) => {
    if (!client) return;
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setClient((prev) => (prev ? { ...prev, [field]: value } : prev));
        ClientService.clearCache();
      } else {
        console.error(`❌ [updateClientField] Failed to update ${field}`);
      }
    } catch (err) {
      console.error(`❌ [updateClientField] Error updating ${field}:`, err);
    }
  };

  // Builds the updated tasks array for a single status block (aligned by
  // index to TASK_DEFINITIONS, like the render below reads it), applies
  // the requested change to one task, and persists everything (including
  // auto-progression to the next status when the block is now complete)
  // through the generic client PATCH endpoint - the /tache/:taskId and
  // /progress endpoints this used to call were never implemented on the
  // backend, so every "Valider"/"N.A." click was silently failing before.
  const applyTaskChange = async (
    status: string,
    taskId: string,
    changes: { completed: boolean; taskStatus: 'validated' | 'pending' | 'na' }
  ) => {
    if (!client) return;
    setValidating(true);

    try {
      const taskDefs = getTaskDefs(status);
      const existingTasks: any[] = client.taches?.[status] || [];

      const updatedTasksForStatus = taskDefs.map((def, idx) => {
        const existing = existingTasks[idx] || {
          id: def.id,
          title: def.title,
          description: def.description,
          completed: false,
          status: 'pending' as const,
        };
        if (def.id === taskId) {
          return { ...existing, id: def.id, title: def.title, description: def.description, completed: changes.completed, status: changes.taskStatus };
        }
        return existing;
      });

      const newTaches = { ...(client.taches || {}), [status]: updatedTasksForStatus };

      const allTasksDone = updatedTasksForStatus.every((t) => t.completed || t.status === 'na');
      const clientCurrentStatus = client.statusOuvert || client.status || 'Prospect';
      const currentIdxNormalized = STATUSES.findIndex((s) => s.toLowerCase() === clientCurrentStatus.toLowerCase());
      const isCurrentBlock = STATUSES.findIndex((s) => s.toLowerCase() === status.toLowerCase()) === currentIdxNormalized;
      const nextStatus = currentIdxNormalized >= 0 ? STATUSES[currentIdxNormalized + 1] : undefined;
      const willProgress = isCurrentBlock && allTasksDone && !!nextStatus;

      const payload: Record<string, any> = { taches: newTaches };
      if (willProgress) {
        payload.statusOuvert = nextStatus;
      }

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedClient = result.data ?? result.client ?? result;
        setClient((prev) => (prev ? { ...prev, ...updatedClient, taches: newTaches, statusOuvert: payload.statusOuvert ?? prev.statusOuvert } : updatedClient));
        ClientService.clearCache();

        toast.success(
          changes.taskStatus === 'na'
            ? '⊘ Tâche marquée N.A.'
            : changes.completed
              ? '✅ Tâche validée'
              : '↩️ Validation annulée'
        );

        if (willProgress) {
          toast.success(`🎉 Passage au statut suivant : ${nextStatus} !`);
        }

        setActiveModal(null);
      } else {
        const errorText = await response.text();
        console.error('❌ [applyTaskChange] Response not OK:', response.status, errorText);
        toast.error('Erreur lors de la mise à jour de la tâche');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erreur réseau');
    } finally {
      setValidating(false);
    }
  };

  const handleTaskUpdate = async (status: string, taskId: string, completed: boolean) => {
    await applyTaskChange(status, taskId, { completed, taskStatus: completed ? 'validated' : 'pending' });
  };

  const handleTaskNA = async (status: string, taskId: string) => {
    await applyTaskChange(status, taskId, { completed: false, taskStatus: 'na' });
  };

  // Manual progression (used by the "Passer au statut suivant" button, for
  // when the advisor wants to move on without completing every task). Uses
  // the same generic client PATCH endpoint as applyTaskChange - the
  // dedicated /progress route this used to call was never implemented.
  const handleProgressToNextStatus = async (currentStatus: string, nextStatus: string) => {
    if (!client) return;

    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ statusOuvert: nextStatus }),
      });

      if (response.ok) {
        toast.success(`✅ Passage à "${nextStatus}" complété`);
        setClient((prev) => (prev ? { ...prev, statusOuvert: nextStatus } : prev));
        ClientService.clearCache();
      } else {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Erreur progression:', error);
        toast.error(`Erreur: ${error.error || 'échec de la progression'}`);
      }
    } catch (err) {
      console.error('❌ Erreur progression:', err);
      toast.error('Erreur réseau');
    }
  };

  const saveArbitrageFields = async () => {
    try {
      const url = `/api/clients/${clientId}`;
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',  // ✨ Send cookies automatically (sessionId)
        headers: {
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
  const clientStatus = client?.statusOuvert || client?.status || 'Prospect';

  return (
    <div className="space-y-4 p-4">
      {STATUSES.map((status) => {
        const blockState = getBlockState(status);
        const isExpanded = expandedBlocks[status];
        const tasks = client.taches?.[status] || [];
        const taskDefs = getTaskDefs(status);
        const isProtected = ['Suivi CSP', 'Arbitrage'].includes(status);
        const color = getStatusColor(status);

        console.log(`   ${status}: blockState=${blockState}, tasks=${tasks.length}`);

        // Protection CSP - il n'existait auparavant aucun moyen dans
        // l'interface de lever ce verrou une fois le CSP réellement signé,
        // ce qui bloquait ces deux statuts en permanence pour tous les
        // clients (cspSigne vaut false par défaut à la création et rien
        // ne le passait jamais à true).
        if (isProtected && !cspSigne) {
          return (
            <div key={status} className="border-l-4 border-red-400 bg-red-50 p-4 rounded flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-red-700 font-semibold">⚠️ {status} : CSP non signé</p>
                <p className="text-xs text-red-600">Signez le CSP pour accéder à ce statut</p>
              </div>
              <button
                onClick={() => updateClientField('cspSigne', true)}
                className="shrink-0 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                ✅ Marquer le CSP comme signé
              </button>
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
                      className={`flex items-start gap-3 p-4 rounded border transition-all ${
                        blockState === 'COMPLETE' ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {/* État de la tâche - Badge visuel */}
                      <div className="flex items-start gap-2">
                        <div className="mt-1">
                          {task.completed && <span className="text-lg">✅</span>}
                          {task.status === 'na' && <span className="text-lg">⊘</span>}
                          {!task.completed && task.status !== 'na' && <span className="text-lg">⭕</span>}
                        </div>
                      </div>

                      {/* Titre et description */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : task.status === 'na' ? 'text-yellow-600' : 'text-gray-800'}`}>
                            {task.title}
                          </p>
                          {/* Badge d'état visible */}
                          {task.completed && (
                            <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                              ✅ VALIDÉE
                            </span>
                          )}
                          {task.status === 'na' && (
                            <span className="px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full">
                              ⊘ N/A
                            </span>
                          )}
                          {!task.completed && task.status !== 'na' && (
                            <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-full">
                              ⏳ EN ATTENTE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{taskDef.description}</p>
                        {task.deadline && (
                          <p className="text-xs text-gray-500 mt-1">📅 {new Date(task.deadline).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>

                      {/* Boutons d'action */}
                      {(blockState === 'EN_COURS' || blockState === 'COMPLETE') && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          {!task.completed && task.status !== 'na' && (
                            <button
                              onClick={() => handleTaskUpdate(status, task.id, true)}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium whitespace-nowrap transition-colors"
                            >
                              ✅ Valider
                            </button>
                          )}
                          {!task.completed && task.status !== 'na' && (
                            <button
                              onClick={() => handleTaskNA(status, task.id)}
                              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 font-medium whitespace-nowrap transition-colors"
                            >
                              ⊘ N.A.
                            </button>
                          )}
                          {task.completed && (
                            <button
                              onClick={() => handleTaskUpdate(status, task.id, false)}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium whitespace-nowrap"
                            >
                              ↩️ Dé-valider
                            </button>
                          )}
                          {task.status === 'na' && (
                            <button
                              onClick={() => handleTaskUpdate(status, task.id, false)}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium whitespace-nowrap"
                            >
                              ↩️ Rétablir
                            </button>
                          )}
                          {taskDef.button && (
                            <button
                              onClick={() =>
                                taskDef.button === 'recommandation'
                                  ? setShowRecommandationsModule(true)
                                  : setActiveModal({ type: taskDef.button!, taskId: task.id, status })
                              }
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium whitespace-nowrap"
                            >
                              {taskDef.button === 'origine' && '📝 Infos'}
                              {taskDef.button === 'rdv' && '📅 RDV'}
                              {taskDef.button === 'mailComptable' && '📧 Mail'}
                              {taskDef.button === 'o2s' && '💾 O2S'}
                              {taskDef.button === 'conformite' && '🔒 Conf'}
                              {taskDef.button === 'bilanSuivi' && '📋 Bilan'}
                              {taskDef.button === 'noteRdv' && '📝 Note'}
                              {taskDef.button === 'verifications' && '💹 Vérif'}
                              {taskDef.button === 'noteRapport' && '📝 Note'}
                              {taskDef.button === 'recommandation' && '➕ Ajouter'}
                              {taskDef.button === 'documents' && '📄 Doc'}
                              {taskDef.button === 'treso' && '💰 Tréso'}
                              {taskDef.button === 'mailComptableArb' && '📞 Call'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

              {/* Statut de progression - Auto-progression quand toutes tâches complétées */}
              {blockState === 'EN_COURS' && (
                <div className="mt-4 pt-4 border-t-2 border-blue-300">
                  {(() => {
                    const allTasksCompleted = tasks.every((t: any) => t.completed || t.status === 'na');
                    const remainingTasks = tasks.filter((t: any) => !t.completed && t.status !== 'na').length;


                    const nextStatusIdx = STATUSES.indexOf(status) + 1;
                    const nextStatus = nextStatusIdx < STATUSES.length ? STATUSES[nextStatusIdx] : undefined;

                    return (
                      <div className="text-sm space-y-2">
                        {allTasksCompleted && nextStatus && (
                          <div className="bg-green-50 border border-green-300 p-3 rounded">
                            <p className="text-green-700 font-bold">✅ Toutes les tâches sont validées !</p>
                            <p className="text-green-600 text-xs mt-1">Le statut suivant ("{nextStatus}") a été déverrouillé automatiquement.</p>
                          </div>
                        )}
                        {allTasksCompleted && !nextStatus && (
                          <div className="bg-green-50 border border-green-300 p-3 rounded">
                            <p className="text-green-700 font-bold">✅ Toutes les tâches sont validées !</p>
                            <p className="text-green-600 text-xs mt-1">C'est le dernier statut du pipeline.</p>
                          </div>
                        )}
                        {!allTasksCompleted && (
                          <div className="bg-orange-50 border border-orange-300 p-3 rounded">
                            <p className="text-orange-700 font-bold">⏳ {remainingTasks} tâche(s) en attente</p>
                            <p className="text-orange-600 text-xs mt-1">Validez ou marquez N/A pour continuer</p>
                          </div>
                        )}
                        {nextStatus && (
                          <button
                            onClick={() => handleProgressToNextStatus(status, nextStatus)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            ➡️ Passer manuellement à "{nextStatus}"
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

            {blockState === 'A_VENIR' && (
              <p className="mt-2 text-sm text-gray-600">🔒 Ce statut sera déverrouillé une fois le précédent terminé</p>
            )}
          </div>
        );
      })}

      {/* Module Recommandations, ouvert depuis la tâche "Incorporation des
          recommandations" - alimente directement la même liste que
          l'onglet Audit et le bouton dédié sur la fiche client. */}
      {showRecommandationsModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-2xl font-bold">Recommandations</h2>
              <button
                onClick={() => setShowRecommandationsModule(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <RecommandationsModule
                recommendations={auditRecommendations}
                onUpdate={async (recs) => {
                  if (onUpdateAuditRecommendations) await onUpdateAuditRecommendations(recs);
                }}
              />
            </div>
          </div>
        </div>
      )}

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
        onSave={async (taskData) => {
          if (!activeModal) return;

          // The RDV modal collects a date/time but this used to be
          // discarded entirely - dateNextRdv (which the Dashboard and
          // Agenda both read) was never updated, so a scheduled meeting
          // never showed up anywhere outside this one modal.
          if (activeModal.type === 'rdv' && taskData?.modalData?.rdvDate) {
            const dateNextRdv = taskData.modalData.rdvTime
              ? `${taskData.modalData.rdvDate}T${taskData.modalData.rdvTime}`
              : taskData.modalData.rdvDate;
            await updateClientField('dateNextRdv', dateNextRdv);
          }

          await handleTaskUpdate(activeModal.status, activeModal.taskId, true);
        }}
      />
    </div>
  );
}
