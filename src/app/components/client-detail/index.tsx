import { useState, useEffect, useMemo } from 'react';
import { clientAPI } from '../../services/api';
import { toast } from 'sonner';
import { BarChart3, X, Check, AlertCircle } from 'lucide-react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useClientData, initializeRequiredDocuments } from '../../hooks/useClientData';

// Import des composants modulaires
import { ClientHeader } from './ClientHeader';
import { TabNavigation } from './TabNavigation';
import { FoyerTab } from './FoyerTab';
import { RevenusTab } from './RevenuTab';
import { PatrimoineTab } from './PatrimoineTab';
import { ObjectifsTab } from './ObjectifsTab';
import { PreAnalyseTab } from './PreAnalyseTab';
import { AuditTab } from './AuditTab';
import { TasksTab } from '../TasksTab';
import { DocumentsTab } from './DocumentsTab';
import { HistoriqueTab } from './HistoriqueTab';
import { ContactsProfessionnelsTab } from './ContactsProfessionnelsTab';

// Import des types
import type { ClientDetailProps, ClientData, TabType, FamilyInfo, RevenuItem, ImpositionData, PatrimoineItem, Objectif, AuditRecommendation, Document, RegulatoryDocument, PipelineStage, ContactProfessionnel } from './types';


export function ClientDetailView({ clientId, onBack, onDelete }: ClientDetailProps) {
  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('foyer');
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showPreAnalyseModal, setShowPreAnalyseModal] = useState(false);

  // Client data management hook - consolidates 17 useState + 13 handlers
  const {
    state,
    handleUpdateClient,
    handleUpdateFamily,
    handleUpdateRevenus,
    handleUpdateImposition,
    handleUpdateActifs,
    handleUpdateImmobilier,
    handleUpdatePassifs,
    handleUpdateEntreprises,
    handleUpdateObjectifs,
    handleUpdateAuditRecommendations,
    handleUpdateDocuments,
    handleUpdateRegulatoryDocs,
    handleUpdateContactsProfessionnels,
    loadFromAPI,
    saveToAPI,
  } = useClientData(clientId);

  // Auto-save hook
  const { saveStatus, hasUnsavedChanges, triggerAutoSave } = useAutoSave({
    delay: 3000,
    onSave: saveToAPI,
    onError: (error) => {
      console.error('❌ Erreur auto-sauvegarde:', error);
    },
  });

  // Trigger auto-save after each state change (debounced by useAutoSave)
  useEffect(() => {
    triggerAutoSave();
  }, [state, triggerAutoSave]);

  // Memoized calculations for patrimoine to avoid recalculation on every render
  const patrimoineImmobilierNet = useMemo(() => {
    return state.immobilier.reduce((sum, i) => sum + i.value, 0)
         - state.passifs.filter(p => p.actifLie).reduce((sum, p) => sum + p.value, 0);
  }, [state.immobilier, state.passifs]);

  const totalLoyersNus = useMemo(() => {
    return state.immobilier
      .filter(i => i.regimeLocation === undefined || i.regimeLocation === 'reel')
      .reduce((sum, i) => sum + (i.loyerAnnuel || 0), 0);
  }, [state.immobilier]);

  const totalLoyersMeubles = useMemo(() => {
    return state.immobilier
      .filter(i => i.regimeLocation === 'micro')
      .reduce((sum, i) => sum + (i.loyerAnnuel || 0), 0);
  }, [state.immobilier]);

  const patrimoineNet = useMemo(() => {
    return state.actifsFinanciers.reduce((sum, a) => sum + a.value, 0) +
           state.immobilier.reduce((sum, i) => sum + i.value, 0) -
           state.passifs.reduce((sum, p) => sum + p.value, 0);
  }, [state.actifsFinanciers, state.immobilier, state.passifs]);

  // Chargement des données depuis l'API
  useEffect(() => {
    loadClientData();
    // Charger la session depuis localStorage
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        setSession(JSON.parse(userStr));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [clientId]);

  // Écouter l'événement personnalisé pour changer d'onglet
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab as TabType);
        
        // Si on passe à l'onglet documents, recharger les données
        if (event.detail.tab === 'documents') {
          reloadDocuments();
        }
      }
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  // Écouter les événements de mise à jour des documents
  useEffect(() => {
    const handleDocumentsUpdate = () => {
      console.log('📢 Événement de mise à jour des documents détecté');
      reloadDocuments();
    };

    window.addEventListener('documentsUpdated', handleDocumentsUpdate);
    
    return () => {
      window.removeEventListener('documentsUpdated', handleDocumentsUpdate);
    };
  }, [clientId]);

  // 🔥 Écouter l'événement de validation admin CoreVision
  useEffect(() => {
    const handleAdminValidation = (event: CustomEvent) => {
      if (event.detail && event.detail.clientId === clientId) {
        console.log('📢 Validation admin CoreVision détectée - Rechargement des données...');
        loadClientData(); // Recharger toutes les données pour avoir les nouvelles infos CoreVision
        toast.success('📋 Données CoreVision mises à jour !');
      }
    };

    window.addEventListener('adminValidated', handleAdminValidation as EventListener);

    return () => {
      window.removeEventListener('adminValidated', handleAdminValidation as EventListener);
    };
  }, [clientId]);

  // Reload documents from API
  const reloadDocuments = async () => {
    try {
      console.log('🔄 Rechargement des documents depuis l\'API...');
      const client = await clientAPI.getById(clientId);
      if (client) {
        const initializedRegulatoryDocs = initializeRequiredDocuments(client.status, client.regulatoryDocs || []);
        handleUpdateDocuments(client.documents || []);
        handleUpdateRegulatoryDocs(initializedRegulatoryDocs);
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des documents:', error);
    }
  };

  const loadClientData = async () => {
    try {
      setIsLoading(true);
      const client = await clientAPI.getById(clientId);

      if (client) {
        await loadFromAPI(client);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setIsLoading(false);
    }
  };







  // Affichage du loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header avec informations client */}
      <div className="flex items-center justify-between mb-4">
        <ClientHeader
          clientData={state.clientData}
          onBack={onBack}
          onUpdate={handleUpdateClient}
        />
        {/* Indicateur de sauvegarde */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
          {saveStatus === 'saving' && (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-blue-600 font-medium">💾 Sauvegarde...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">✅ Sauvegardé</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">❌ Erreur sauvegarde</span>
            </>
          )}
          {saveStatus === 'idle' && hasUnsavedChanges && (
            <>
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-sm text-orange-600 font-medium">⏳ Modifications</span>
            </>
          )}
        </div>
      </div>

      {/* Bouton Pré-analyse */}
      <div className="mb-6">
        <button
          onClick={() => setShowPreAnalyseModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">📊 Voir la Pré-analyse</span>
        </button>
      </div>

      {/* Modal Pré-analyse */}
      {showPreAnalyseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête de la modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <BarChart3 className="w-7 h-7" />
                Pré-analyse Patrimoniale - {state.clientData.name}
              </h2>
              <button
                onClick={() => setShowPreAnalyseModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu scrollable de la modal */}
            <div className="overflow-y-auto p-6">
              <PreAnalyseTab
                clientId={clientId}
                clientName={state.clientData.name}
                actifsFinanciers={state.actifsFinanciers}
                immobilier={state.immobilier}
                passifs={state.passifs}
                revenus={state.revenus}
                impositionData={state.imposition}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs de navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Contenu des onglets */}
        <div className="p-6">
          {/* Onglet Foyer */}
          {activeTab === 'foyer' && (
            <FoyerTab
              clientData={state.clientData}
              familyInfo={state.familyInfo}
              onUpdateFamily={handleUpdateFamily}
            />
          )}

          {/* Onglet Revenus */}
          {activeTab === 'revenus' && (
            <RevenusTab
              revenus={state.revenus}
              imposition={state.imposition}
              familyInfo={state.familyInfo}
              onUpdateRevenus={handleUpdateRevenus}
              onUpdateImposition={handleUpdateImposition}
              clientData={state.clientData}
              patrimoineImmobilierNet={patrimoineImmobilierNet}
              totalLoyersNus={totalLoyersNus}
              totalLoyersMeubles={totalLoyersMeubles}
            />
          )}

          {/* Onglet Patrimoine */}
          {activeTab === 'patrimoine' && (
            <PatrimoineTab
              actifsFinanciers={state.actifsFinanciers}
              immobilier={state.immobilier}
              passifs={state.passifs}
              onUpdateActifs={handleUpdateActifs}
              onUpdateImmobilier={handleUpdateImmobilier}
              onUpdatePassifs={handleUpdatePassifs}
              clientData={state.clientData}
              familyInfo={state.familyInfo}
              entreprises={state.entreprises}
              onUpdateEntreprises={handleUpdateEntreprises}
            />
          )}

          {/* Onglet Pré-analyse */}
          {activeTab === 'preanalyse' && (
            <PreAnalyseTab
              clientId={clientId}
              clientName={state.clientData.name}
              actifsFinanciers={state.actifsFinanciers}
              immobilier={state.immobilier}
              passifs={state.passifs}
              revenus={state.revenus}
              impositionData={state.imposition}
            />
          )}

          {/* Onglet Objectifs */}
          {activeTab === 'objectifs' && (
            <ObjectifsTab
              clientId={clientId}
              clientName={state.clientData.name}
              objectifs={state.objectifs}
              onUpdateObjectifs={handleUpdateObjectifs}
              patrimoineNet={patrimoineNet}
              cgpAbonnement="aucun"
              session={session}
              bilanData={{
                patrimoineData: {
                  actifsFinanciers: state.actifsFinanciers,
                  immobilier: state.immobilier,
                  passifs: state.passifs,
                  entreprises: state.entreprises,
                },
                revenusData: state.revenus,
                impositionData: state.imposition,
                familyInfo: state.familyInfo,
              }}
            />
          )}

          {/* Onglet Tâches */}
          {activeTab === 'taches' && (
            <TasksTab
              clientId={clientId}
              clientStatus={state.clientData.status}
              objectifs={state.objectifs}
              recommendations={state.auditRecommendations}
              entreprises={state.entreprises}
              contacts={state.contactsProfessionnels}
            />
          )}

          {/* Onglet Documents */}
          {activeTab === 'documents' && (
            <DocumentsTab
              documents={state.documents}
              onUpdateDocuments={handleUpdateDocuments}
            />
          )}

          {/* Onglet Audit */}
          {activeTab === 'audit' && (
            <AuditTab
              clientId={clientId}
              clientName={`${state.clientData.firstName} ${state.clientData.lastName}`}
            />
          )}

          {/* Onglet Historique */}
          {activeTab === 'historique' && (
            <HistoriqueTab
              clientId={clientId}
            />
          )}

          {/* Onglet Contacts professionnels */}
          {activeTab === 'contacts' && (
            <ContactsProfessionnelsTab
              contacts={state.contactsProfessionnels}
              onUpdateContacts={handleUpdateContactsProfessionnels}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Export des types pour utilisation externe
export type { ClientDetailProps };
