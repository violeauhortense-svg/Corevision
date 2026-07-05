import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { TaskButtonType } from './taskDefinitions';
import type { Task } from '../types/client';

interface TaskModalsProps {
  isOpen: boolean;
  modalType: TaskButtonType | null;
  task: Task | null;
  clientId: string;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
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

  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{task.title}</h2>
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
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );

  switch (modalType) {
    case 'origine':
      return (
        <Modal>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Origine du prospect</span>
              <input
                type="text"
                placeholder="Recommandation, Publicité, Appel froid..."
                value={formData.origine || ''}
                onChange={(e) => setFormData({ ...formData, origine: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </label>
          </div>
        </Modal>
      );

    case 'rdv':
      return (
        <Modal>
          <div className="space-y-4">
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
        </Modal>
      );

    case 'mailComptable':
      return (
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
        <Modal>
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
