import { useState, useEffect } from 'react';
import { CheckCircle2, Shield, AlertCircle, Eye } from 'lucide-react';
import { GelAvoirsChecker } from './GelAvoirsChecker';
import { GelAvoirsReportView } from './GelAvoirsReportView';
import { clientAPI, taskAPI } from '../services/api';
import { toast } from 'sonner';
import type { Task } from '../types/client';

interface GelAvoirsTaskProps {
  task: Task;
  clientId: string;
  onToggle: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export function GelAvoirsTask({ task, clientId, onToggle, onUpdate }: GelAvoirsTaskProps) {
  const [clientData, setClientData] = useState<any>(null);
  const [gelAvoirsReport, setGelAvoirsReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);

  // Charger les données du client
  useEffect(() => {
    const loadClientData = async () => {
      try {
        const data = await clientAPI.getById(clientId);
        setClientData(data);

        // Vérifier si un rapport existe déjà dans les documents réglementaires
        if (data.regulatoryDocs) {
          const existingReport = data.regulatoryDocs.find(
            (doc: any) => doc.id === 'r4' && doc.validatedAt
          );
          if (existingReport) {
            setGelAvoirsReport(existingReport);
          }
        }
      } catch (error) {
        console.error('Erreur chargement client:', error);
      }
    };

    loadClientData();
  }, [clientId]);

  // Gestionnaire pour la génération du rapport
  const handleReportGenerated = async (reportData: any) => {

    try {
      setLoading(true);

      // 1. Sauvegarder le rapport dans les documents réglementaires
      const session = await getSession();
      const userId = session.user?.id || 'default';
      const clientDetailKey = `client_detail_${userId}_${clientId}`;
      const storedData = localStorage.getItem(clientDetailKey);

      if (storedData) {
        const clientDetail = JSON.parse(storedData);
        const regulatoryDocs = clientDetail.regulatoryDocs || [];

        // Mettre à jour ou ajouter le document r4
        const existingIndex = regulatoryDocs.findIndex((doc: any) => doc.id === 'r4');
        
        const gelAvoirsDoc = {
          id: 'r4',
          name: 'Gel des avoirs',
          status: reportData.status === 'clean' ? 'completed' as const : 'pending' as const, // ✅ Changé : 'completed' si clean, 'pending' si alert
          requiredForStage: 'R1',
          completedDate: reportData.status === 'clean' ? new Date().toISOString() : undefined,
          validatedAt: new Date().toISOString(),
          content: reportData.content,
          date: reportData.date,
          alertStatus: reportData.status, // 'clean', 'alert', ou 'error'
        };

        if (existingIndex !== -1) {
          regulatoryDocs[existingIndex] = gelAvoirsDoc;
        } else {
          regulatoryDocs.push(gelAvoirsDoc);
        }

        // Sauvegarder les modifications
        clientDetail.regulatoryDocs = regulatoryDocs;
        localStorage.setItem(clientDetailKey, JSON.stringify(clientDetail));
        
        // 🔥 Émettre un événement pour notifier la mise à jour des documents
        window.dispatchEvent(new CustomEvent('documentsUpdated', { 
          detail: { clientId, documentType: 'GelAvoirs' } 
        }));


        // 2. Valider automatiquement la tâche
        await onUpdate(task.id, {
          completed: true,
          completedAt: new Date().toISOString(),
          gelAvoirsReport: gelAvoirsDoc,
        });

        setGelAvoirsReport(gelAvoirsDoc);

        toast.success('✅ Rapport Gel des Avoirs enregistré et tâche validée');
      }
    } catch (error) {
      console.error('Erreur sauvegarde rapport:', error);
      toast.error('❌ Erreur lors de la sauvegarde du rapport');
    } finally {
      setLoading(false);
    }
  };

  // Helper pour récupérer la session
  const getSession = async () => {
    const userId = localStorage.getItem('user_id') || 'default';
    return {
      user: { id: userId },
      isValid: false,
    };
  };

  return (
    <div className="p-4 border-l-4 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-sm">
      {/* Header de la tâche */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(task.id)}
            disabled={loading}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-red-500'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>

          <div className="flex-1">
            <h4
              className={`font-semibold transition-all ${
                task.completed
                  ? 'text-gray-500 line-through'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Vérification obligatoire des listes de sanctions financières
            </p>
          </div>
        </div>

        {task.completed && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Vérifié
          </span>
        )}
      </div>

      {/* Description */}
      <div className="ml-9 mb-4 text-sm text-gray-700 bg-white/60 p-3 rounded border border-red-100">
        <p className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-red-600" />
          <span className="font-medium">Obligation réglementaire</span>
        </p>
        <p>
          Vérification du client sur les listes de sanctions financières (Trésor français, UE, OFAC).
          Cette vérification est obligatoire avant toute entrée en relation.
        </p>
      </div>

      {/* Actions */}
      <div className="ml-9 space-y-3">
        {!task.completed && clientData && (
          <div>
            <GelAvoirsChecker
              clientId={clientId}
              clientData={{
                firstName: clientData.firstName || '',
                lastName: clientData.lastName || '',
                name: clientData.name || `${clientData.firstName} ${clientData.lastName}`,
                email: clientData.email || '',
                phone: clientData.phone || '',
                birthDate: clientData.birthDate,
                birthPlace: clientData.birthPlace,
                nationality: clientData.nationality,
                fiscalResidence: clientData.fiscalResidence,
                profession: clientData.profession,
              }}
              familyInfo={{
                situationFamiliale: clientData.maritalStatus,
              }}
              onReportGenerated={handleReportGenerated}
            />
          </div>
        )}

        {/* Si déjà complété, afficher le statut et le bouton pour consulter */}
        {task.completed && gelAvoirsReport && (
          <div className="space-y-2">
            {/* Statut de la vérification */}
            <div
              className={`p-3 rounded-lg border-2 ${
                gelAvoirsReport.alertStatus === 'clean'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {gelAvoirsReport.alertStatus === 'clean' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        ✅ Aucune correspondance trouvée
                      </p>
                      <p className="text-sm text-green-700">
                        Vérifié le {new Date(gelAvoirsReport.validatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">
                        ⚠️ Correspondances trouvées
                      </p>
                      <p className="text-sm text-red-700">
                        Vérifié le {new Date(gelAvoirsReport.validatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bouton pour consulter le rapport */}
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Consulter le rapport complet
            </button>
          </div>
        )}
      </div>

      {/* Modal du rapport */}
      {showReport && gelAvoirsReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Rapport de vérification - Gel des Avoirs
              </h3>
              <button
                onClick={() => setShowReport(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-600">×</span>
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
              <GelAvoirsReportView content={gelAvoirsReport.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
