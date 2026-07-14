import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Circle, Shield } from 'lucide-react';
import { LABFTQuestionnaire } from './LABFTQuestionnaire';
import { clientAPI } from '../services/api';
import { toast } from 'sonner';
import type { Task } from '../types/client';
import { supabase } from '../utils/api/client';

interface LABFTTaskProps {
  task: Task;
  clientId: string;
  onToggle: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export function LABFTTask({ task, clientId, onToggle, onUpdate }: LABFTTaskProps) {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [labftData, setLabftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClientAndLabftData();
  }, [clientId, task.id]);

  const loadClientAndLabftData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les données du client
      const client = await clientAPI.getById(clientId);
      setClientData(client);

      // Vérifier si le questionnaire LAB-FT a déjà été rempli
      if (task.labftData) {
        setLabftData(task.labftData);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestionnaire = async (data: any) => {
    try {
      console.log('💾 Enregistrement questionnaire LAB-FT:', data);

      // 1. Ajouter la date de validation
      const questionnaireWithDate = {
        ...data,
        validatedAt: new Date().toISOString(),
      };

      // 2. Mettre à jour la tâche avec les données du questionnaire
      await onUpdate(task.id, {
        labftData: questionnaireWithDate,
        completed: true, // ✅ Marquer la tâche comme complétée
      });

      // 3. Enregistrer dans les documents réglementaires
      // 🔥 CORRECTION: Utiliser la session Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'default';
      const clientDetailKey = `client_detail_${userId}_${clientId}`;
      console.log('🔑 Clé localStorage utilisée:', clientDetailKey);
      console.log('👤 User ID:', userId);
      const stored = localStorage.getItem(clientDetailKey);

      if (stored) {
        const clientDetails = JSON.parse(stored);

        // Créer le document réglementaire LAB-FT
        const labftDocument = {
          id: 'r3',
          name: 'LAB-FT (Lutte Anti-Blanchiment)',
          status: 'completed' as const, // ✅ Changé de 'validated' à 'completed'
          requiredForStage: 'R1',
          completedDate: questionnaireWithDate.validatedAt,
          validatedAt: questionnaireWithDate.validatedAt,
          data: questionnaireWithDate,
          documentType: 'LAB-FT',
        };

        // Mettre à jour ou ajouter le document dans regulatoryDocs
        if (!clientDetails.regulatoryDocs) {
          clientDetails.regulatoryDocs = [];
        }

        const existingDocIndex = clientDetails.regulatoryDocs.findIndex((doc: any) => doc.id === 'r3');
        if (existingDocIndex >= 0) {
          clientDetails.regulatoryDocs[existingDocIndex] = labftDocument;
        } else {
          clientDetails.regulatoryDocs.push(labftDocument);
        }

        // Sauvegarder dans localStorage
        localStorage.setItem(clientDetailKey, JSON.stringify(clientDetails));
        console.log('✅ Document LAB-FT enregistré dans les documents réglementaires');

        // 🔥 Émettre un événement pour notifier la mise à jour des documents
        window.dispatchEvent(new CustomEvent('documentsUpdated', { 
          detail: { clientId, documentType: 'LAB-FT' } 
        }));
        console.log('📢 Événement documentsUpdated émis');
      }

      setLabftData(questionnaireWithDate);
      toast.success('✅ Questionnaire LAB-FT enregistré et tâche validée');
      setShowQuestionnaire(false);
    } catch (error) {
      console.error('❌ Erreur sauvegarde questionnaire:', error);
      toast.error('❌ Erreur lors de l\'enregistrement');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg">
        <Circle className="w-5 h-5 text-gray-400 animate-spin" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start gap-3 p-4 bg-white border-2 border-indigo-300 rounded-lg hover:shadow-md transition-shadow">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className="flex-shrink-0 mt-1"
        >
          {task.completed ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <Circle className="w-6 h-6 text-gray-400 hover:text-green-600 transition-colors" />
          )}
        </button>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h4
              className={`font-semibold ${
                task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}
            >
              {task.title}
            </h4>
            {labftData && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Complété
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
          )}

          {/* Affichage résumé si questionnaire rempli */}
          {labftData && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-3">
              <h5 className="text-sm font-semibold text-indigo-900 mb-2">
                📋 Résumé du questionnaire LAB-FT
              </h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Risque client :</span>
                  <span className={`ml-2 font-medium ${
                    labftData.risqueClient === 'faible' ? 'text-green-700' :
                    labftData.risqueClient === 'moyen' ? 'text-orange-700' : 'text-red-700'
                  }`}>
                    {labftData.risqueClient}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Risque global :</span>
                  <span className={`ml-2 font-medium ${
                    labftData.risqueGlobal === 'faible' ? 'text-green-700' :
                    labftData.risqueGlobal === 'moyen' ? 'text-orange-700' : 'text-red-700'
                  }`}>
                    {labftData.risqueGlobal}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Décision :</span>
                  <span className={`ml-2 font-medium ${
                    labftData.decision === 'accepter' ? 'text-green-700' :
                    labftData.decision === 'refuser' ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    {labftData.decision === 'accepter' ? '✅ Accepter' :
                     labftData.decision === 'refuser' ? '❌ Refuser' : '⚠️ Complément'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Validé le :</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(labftData.validatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowQuestionnaire(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              {labftData ? 'Consulter / Modifier' : 'Remplir le questionnaire'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal du questionnaire */}
      {showQuestionnaire && clientData && (
        <LABFTQuestionnaire
          clientData={{
            firstName: clientData.prenom || '',
            lastName: clientData.nom || '',
            patrimoine: clientData.patrimoine || '',
          }}
          onClose={() => setShowQuestionnaire(false)}
          onSave={handleSaveQuestionnaire}
        />
      )}
    </>
  );
}
