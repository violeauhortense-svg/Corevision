import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskButtonType } from './taskDefinitions';
import type { Task } from '../types/client';
import { clientAPI } from '../../services/api';
import { hubCommunicationAPI } from '../../services/hubCommunicationAPI';
import { DECOUVERTE_QUESTIONNAIRE, buildQuestionnaireBody } from './decouverteQuestionnaire';

interface TaskModalsProps {
  isOpen: boolean;
  modalType: TaskButtonType | null;
  task: Task | null;
  clientId: string;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
}

// Défini en dehors de TaskModals (et non à l'intérieur, comme avant) : un
// composant déclaré dans le corps d'une fonction est recréé à chaque
// render, donc à chaque frappe dans un champ (formData change -> re-render
// -> nouvelle identité de fonction -> React démonte/remonte tout l'arbre,
// y compris les <input>, qui perdent le focus après chaque lettre).
function Modal({
  title,
  onClose,
  onSave,
  loading,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex gap-3 p-6 border-t justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const TaskModals: React.FC<TaskModalsProps> = ({
  isOpen,
  modalType,
  task,
  clientId,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [clientsList, setClientsList] = useState<{ id: string; label: string }[]>([]);
  const [clientInfo, setClientInfo] = useState<{ email: string; firstName: string } | null>(null);
  const [sendingMail, setSendingMail] = useState(false);

  // Recharge la saisie précédente à chaque ouverture d'une tâche - sans ça,
  // TaskModals restant monté en permanence (isOpen bascule mais le
  // composant lui-même ne démonte jamais), formData d'une tâche fuyait
  // vers la suivante, et les données déjà enregistrées ne réapparaissaient
  // jamais en rouvrant la modale.
  useEffect(() => {
    if (isOpen) {
      setFormData(task?.modalData || {});
    }
  }, [isOpen, task?.id]);

  // Chargée à la demande seulement pour le menu "Origine du prospect" (pas
  // besoin d'aller chercher tous les clients pour les autres modales).
  useEffect(() => {
    if (isOpen && modalType === 'origine') {
      clientAPI
        .getAll()
        .then((clients: any[]) => {
          setClientsList(
            clients
              .filter((c) => c.id !== clientId)
              .map((c) => ({ id: c.id, label: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client sans nom' }))
              .sort((a, b) => a.label.localeCompare(b.label))
          );
        })
        .catch((err) => console.error('❌ Erreur chargement liste clients:', err));
    }
  }, [isOpen, modalType, clientId]);

  // Nécessaire pour envoyer le questionnaire de découverte au bon email -
  // TaskModals ne reçoit que clientId, pas la fiche complète.
  useEffect(() => {
    if (isOpen && modalType === 'rdv') {
      clientAPI
        .getById(clientId)
        .then((client: any) => setClientInfo({ email: client.email || '', firstName: client.firstName || '' }))
        .catch((err) => console.error('❌ Erreur chargement infos client:', err));
    }
  }, [isOpen, modalType, clientId]);

  if (!isOpen || !modalType || !task) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({ ...task, modalData: formData });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  switch (modalType) {
    case 'origine':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Origine du prospect</span>
              <select
                value={formData.origineType || ''}
                onChange={(e) => setFormData({ ...formData, origineType: e.target.value, origineDetail: '' })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              >
                <option value="">— Sélectionner —</option>
                <option value="fiteco">Fiteco</option>
                <option value="expert_comptable">Expert-comptable</option>
                <option value="client">Client</option>
              </select>
            </label>

            {formData.origineType === 'fiteco' && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Quelle agence Fiteco ?</span>
                <input
                  type="text"
                  placeholder="Nom de l'agence"
                  value={formData.origineDetail || ''}
                  onChange={(e) => setFormData({ ...formData, origineDetail: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
            )}

            {formData.origineType === 'expert_comptable' && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Quel expert-comptable / cabinet ?</span>
                <input
                  type="text"
                  placeholder="Nom de l'expert-comptable ou du cabinet"
                  value={formData.origineDetail || ''}
                  onChange={(e) => setFormData({ ...formData, origineDetail: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
            )}

            {formData.origineType === 'client' && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Quel client ?</span>
                <select
                  value={formData.origineDetail || ''}
                  onChange={(e) => setFormData({ ...formData, origineDetail: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">— Sélectionner un client —</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </Modal>
      );

    case 'rdv': {
      const selected: Record<string, boolean> = formData.questionnaireSelected || {};

      const toggleItem = (id: string, checked: boolean) => {
        setFormData({ ...formData, questionnaireSelected: { ...selected, [id]: checked } });
      };

      const toggleSection = (sectionItemIds: string[], checked: boolean) => {
        const next = { ...selected };
        for (const id of sectionItemIds) next[id] = checked;
        setFormData({ ...formData, questionnaireSelected: next });
      };

      const generatePreview = () => {
        const ids = new Set(Object.keys(selected).filter((id) => selected[id]));
        setFormData({
          ...formData,
          mailBody: buildQuestionnaireBody(ids, clientInfo?.firstName),
          mailSubject: formData.mailSubject || 'Informations complémentaires pour la préparation de votre dossier',
        });
      };

      const handleSendMail = async () => {
        if (!clientInfo?.email) {
          toast.error('Email du client introuvable');
          return;
        }
        if (!formData.mailBody?.trim()) {
          toast.error("Générez d'abord l'aperçu du mail (ou écrivez son contenu)");
          return;
        }
        setSendingMail(true);
        try {
          await hubCommunicationAPI.sendNewMail({
            to: [clientInfo.email],
            subject: formData.mailSubject || 'Informations complémentaires',
            body: formData.mailBody,
            clientId,
            clientName: clientInfo.firstName,
          });
          setFormData({ ...formData, mailSentAt: new Date().toISOString() });
          toast.success("Mail mis en file d'envoi - il partira via Outlook au prochain cycle du bridge");
        } catch (err) {
          console.error('Erreur envoi mail questionnaire:', err);
          toast.error("Impossible d'envoyer le mail");
        } finally {
          setSendingMail(false);
        }
      };

      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Date du RDV</span>
                <input
                  type="date"
                  value={formData.rdvDate || ''}
                  onChange={(e) => setFormData({ ...formData, rdvDate: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Heure</span>
                <input
                  type="time"
                  value={formData.rdvTime || ''}
                  onChange={(e) => setFormData({ ...formData, rdvTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 -mt-3">
              Une fois enregistrée, cette date apparaît directement dans l'Agenda.
            </p>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">📋 Questionnaire de découverte</h3>
              <p className="text-xs text-gray-500 mb-3">
                Cochez ce que vous voulez inclure dans le mail envoyé au client.
              </p>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-1 border rounded-lg p-3 bg-gray-50">
                {DECOUVERTE_QUESTIONNAIRE.map((section) => {
                  const sectionItemIds = section.groups.flatMap((g) => g.items.map((i) => i.id));
                  const allChecked = sectionItemIds.length > 0 && sectionItemIds.every((id) => selected[id]);
                  return (
                    <div key={section.id}>
                      <label className="flex items-center gap-2 font-medium text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) => toggleSection(sectionItemIds, e.target.checked)}
                          className="w-4 h-4"
                        />
                        {section.title}
                      </label>
                      <div className="ml-6 mt-1 space-y-1.5">
                        {section.groups.map((group, gi) => (
                          <div key={gi}>
                            {group.label && (
                              <p className="text-xs font-medium text-gray-600 mt-1.5">{group.label}</p>
                            )}
                            {group.items.map((item) => (
                              <label key={item.id} className="flex items-start gap-2 text-sm text-gray-700 py-0.5">
                                <input
                                  type="checkbox"
                                  checked={!!selected[item.id]}
                                  onChange={(e) => toggleItem(item.id, e.target.checked)}
                                  className="w-4 h-4 mt-0.5 shrink-0"
                                />
                                <span>{item.text}</span>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={generatePreview}
                className="mt-3 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                🔄 Générer l'aperçu du mail
              </button>

              <label className="block mt-3">
                <span className="text-sm font-medium text-gray-700">Objet</span>
                <input
                  type="text"
                  value={formData.mailSubject || ''}
                  onChange={(e) => setFormData({ ...formData, mailSubject: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  placeholder="Informations complémentaires pour la préparation de votre dossier"
                />
              </label>

              <label className="block mt-3">
                <span className="text-sm font-medium text-gray-700">Corps du mail (modifiable)</span>
                <textarea
                  value={formData.mailBody || ''}
                  onChange={(e) => setFormData({ ...formData, mailBody: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg font-mono text-xs"
                  rows={8}
                  placeholder="Cliquez sur « Générer l'aperçu » après avoir coché vos questions..."
                />
              </label>

              {clientInfo && !clientInfo.email && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Aucun email enregistré pour ce client - impossible d'envoyer.
                </p>
              )}

              {formData.mailSentAt && (
                <p className="text-xs text-green-600 mt-2">
                  ✅ Mail mis en envoi le {new Date(formData.mailSentAt).toLocaleString('fr-FR')}
                </p>
              )}

              <button
                type="button"
                onClick={handleSendMail}
                disabled={sendingMail || !clientInfo?.email}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sendingMail ? 'Envoi...' : '✉️ Envoyer le mail au client'}
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    case 'mailComptable':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email du comptable</span>
              <input
                type="email"
                placeholder="comptable@example.com"
                value={formData.comptableEmail || ''}
                onChange={(e) => setFormData({ ...formData, comptableEmail: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.comptableCC || false}
                onChange={(e) => setFormData({ ...formData, comptableCC: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Mettre le client en CC</span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Date d'envoi</span>
              <input
                type="date"
                value={formData.mailDate || ''}
                onChange={(e) => setFormData({ ...formData, mailDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
          </div>
        </Modal>
      );

    case 'o2s':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.o2sChecked || false}
                onChange={(e) => setFormData({ ...formData, o2sChecked: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">O2S complété</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.excelChecked || false}
                onChange={(e) => setFormData({ ...formData, excelChecked: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Excel complété</span>
            </label>
            <label className="block mt-4">
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Notes internes..."
              />
            </label>
          </div>
        </Modal>
      );

    case 'conformite':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-3">
            {['Pièce d\'identité', 'Preuve de domicile', 'Déclaration d\'impôts', 'Relevé bancaire', 'Justificatif profession'].map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.conformiteItems?.[item] || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conformiteItems: { ...formData.conformiteItems, [item]: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </Modal>
      );

    case 'bilanSuivi':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Avancement (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.avancement || 0}
                onChange={(e) => setFormData({ ...formData, avancement: parseInt(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <textarea
                value={formData.bilanNotes || ''}
                onChange={(e) => setFormData({ ...formData, bilanNotes: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="État du bilan..."
              />
            </label>
          </div>
        </Modal>
      );

    case 'noteRdv':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Notes du RDV</span>
              <textarea
                value={formData.noteRdv || ''}
                onChange={(e) => setFormData({ ...formData, noteRdv: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={5}
                placeholder="Résumé du RDV, points discutés, décisions..."
              />
            </label>
          </div>
        </Modal>
      );

    case 'verifications':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-3">
            {['Hypothèses', 'Chiffres', 'Formules', 'Comparaisons', 'Validation'].map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.verifications?.[item] || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      verifications: { ...formData.verifications, [item]: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{item} vérifiées</span>
              </label>
            ))}
          </div>
        </Modal>
      );

    case 'noteRapport':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Notes du rapport</span>
              <textarea
                value={formData.noteRapport || ''}
                onChange={(e) => setFormData({ ...formData, noteRapport: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={5}
                placeholder="Points clés à inclure, recommandations..."
              />
            </label>
          </div>
        </Modal>
      );

    case 'recommandation':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Titre de la recommandation</span>
              <input
                type="text"
                placeholder="Ex: Optimiser la structure SARL"
                value={formData.recTitle || ''}
                onChange={(e) => setFormData({ ...formData, recTitle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={formData.recDescription || ''}
                onChange={(e) => setFormData({ ...formData, recDescription: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Détails de la recommandation..."
              />
            </label>
          </div>
        </Modal>
      );

    case 'documents':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-3">
            {['BILAN', '455', '641', '2035', 'IRPP'].map((doc) => (
              <label key={doc} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.documents?.[doc] || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documents: { ...formData.documents, [doc]: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{doc}</span>
              </label>
            ))}
          </div>
        </Modal>
      );

    case 'treso':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Besoin trésorerie (€)</span>
              <input
                type="number"
                placeholder="0"
                value={formData.tresoAmount || ''}
                onChange={(e) => setFormData({ ...formData, tresoAmount: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Date d'envoi du mail</span>
              <input
                type="date"
                value={formData.tresoDate || ''}
                onChange={(e) => setFormData({ ...formData, tresoDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
          </div>
        </Modal>
      );

    case 'mailComptableArb':
      return (
        <Modal title={task.title} onClose={onClose} onSave={handleSave} loading={loading}>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email du comptable</span>
              <input
                type="email"
                placeholder="comptable@example.com"
                value={formData.comptableEmailArb || ''}
                onChange={(e) => setFormData({ ...formData, comptableEmailArb: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.comptableCCArb || false}
                onChange={(e) => setFormData({ ...formData, comptableCCArb: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Mettre le client en CC</span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Date d'envoi</span>
              <input
                type="date"
                value={formData.comptableDateArb || ''}
                onChange={(e) => setFormData({ ...formData, comptableDateArb: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
          </div>
        </Modal>
      );

    default:
      return null;
  }
};
