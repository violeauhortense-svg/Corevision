import { useState } from 'react';
import { CheckCircle, Circle, Clock, ArrowRight, AlertCircle, TrendingUp } from 'lucide-react';
import type { AuditRecommendation } from './types';

interface MiseEnPlaceStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  date?: string;
  notes?: string;
}

interface MiseEnPlaceWorkflowProps {
  recommendation: AuditRecommendation;
  onUpdateStep: (stepId: string, status: MiseEnPlaceStep['status'], notes?: string) => void;
  onClose: () => void;
}

export function MiseEnPlaceWorkflow({ recommendation, onUpdateStep, onClose }: MiseEnPlaceWorkflowProps) {
  // Les 6 étapes du workflow de mise en place
  const defaultSteps: MiseEnPlaceStep[] = [
    {
      id: 'validated',
      label: 'Recommandation validée',
      status: 'completed',
      date: recommendation.validatedDate,
    },
    {
      id: 'simulation',
      label: 'Simulation effectuée',
      status: recommendation.implementationSteps?.simulation || 'pending',
      date: recommendation.implementationSteps?.simulationDate,
    },
    {
      id: 'dossier',
      label: 'Dossier envoyé',
      status: recommendation.implementationSteps?.dossier || 'pending',
      date: recommendation.implementationSteps?.dossierDate,
    },
    {
      id: 'signature',
      label: 'Signature obtenue',
      status: recommendation.implementationSteps?.signature || 'pending',
      date: recommendation.implementationSteps?.signatureDate,
    },
    {
      id: 'transmission',
      label: 'Transmission effectuée',
      status: recommendation.implementationSteps?.transmission || 'pending',
      date: recommendation.implementationSteps?.transmissionDate,
    },
    {
      id: 'active',
      label: 'Contrat actif',
      status: recommendation.implementationSteps?.active || 'pending',
      date: recommendation.implementationSteps?.activeDate,
    },
  ];

  const [steps, setSteps] = useState<MiseEnPlaceStep[]>(defaultSteps);
  const [selectedStep, setSelectedStep] = useState<MiseEnPlaceStep | null>(null);
  const [notes, setNotes] = useState('');

  const getStepIcon = (status: MiseEnPlaceStep['status']) => {
    switch (status) {
      case 'completed':
        return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'in-progress':
        return { Icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'blocked':
        return { Icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { Icon: Circle, color: 'text-gray-400', bg: 'bg-gray-100' };
    }
  };

  const handleStepClick = (step: MiseEnPlaceStep) => {
    setSelectedStep(step);
    setNotes(step.notes || '');
  };

  const handleUpdateStatus = (newStatus: MiseEnPlaceStep['status']) => {
    if (!selectedStep) return;

    const updatedSteps = steps.map(s =>
      s.id === selectedStep.id
        ? {
            ...s,
            status: newStatus,
            date: newStatus === 'completed' || newStatus === 'in-progress' ? new Date().toISOString() : s.date,
            notes,
          }
        : s
    );

    setSteps(updatedSteps);
    onUpdateStep(selectedStep.id, newStatus, notes);
    setSelectedStep(null);
    setNotes('');
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Workflow de mise en place</h2>
              <p className="text-indigo-100">{recommendation.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Barre de progression */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progression</span>
              <span className="font-semibold">{completedSteps}/{steps.length} étapes</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline des étapes */}
        <div className="p-6">
          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Étapes */}
            <div className="space-y-6">
              {steps.map((step, index) => {
                const { Icon, color, bg } = getStepIcon(step.status);
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.id} className="relative flex gap-4">
                    {/* Icône */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 pb-2">
                      <div
                        onClick={() => handleStepClick(step)}
                        className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          step.status === 'completed'
                            ? 'border-green-200 hover:border-green-300'
                            : step.status === 'in-progress'
                            ? 'border-blue-200 hover:border-blue-300'
                            : step.status === 'blocked'
                            ? 'border-red-200 hover:border-red-300'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{step.label}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              step.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : step.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-700'
                                : step.status === 'blocked'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {step.status === 'completed'
                              ? 'Terminée'
                              : step.status === 'in-progress'
                              ? 'En cours'
                              : step.status === 'blocked'
                              ? 'Bloquée'
                              : 'En attente'}
                          </span>
                        </div>

                        {step.date && (
                          <p className="text-sm text-gray-500 mb-2">
                            {new Date(step.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        )}

                        {step.notes && (
                          <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                            {step.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats récapitulatives */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Terminées</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {steps.filter(s => s.status === 'completed').length}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">En cours</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {steps.filter(s => s.status === 'in-progress').length}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Bloquées</span>
              </div>
              <p className="text-2xl font-bold text-red-700">
                {steps.filter(s => s.status === 'blocked').length}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Circle className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600 font-medium">En attente</span>
              </div>
              <p className="text-2xl font-bold text-gray-700">
                {steps.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        {/* Modal de modification d'étape */}
        {selectedStep && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">{selectedStep.label}</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus('in-progress')}
                      className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      En cours
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Terminée
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('blocked')}
                      className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Bloquée
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('pending')}
                      className="px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      En attente
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ajoutez des notes ou commentaires..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedStep(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
