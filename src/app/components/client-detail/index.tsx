import { useState, useEffect, useMemo } from 'react';
import { clientAPI } from '../../services/api';
import { toast } from 'sonner';
import { BarChart3, Lightbulb, X } from 'lucide-react';
import { useClientData, initializeRequiredDocuments } from '../../hooks/useClientData';

// Import des composants modulaires
import { ClientHeader } from './ClientHeader';
import { TabNavigation } from './TabNavigation';
import { FoyerTab } from './FoyerTab';
import { RevenusTab } from './RevenuTab';
import { PatrimoineTab } from './PatrimoineTab';
import { ObjectifsTab } from './ObjectifsTab';
import { BilanPatrimonial } from './BilanPatrimonial';
import { AuditTab } from './AuditTab';
import { RecommandationsModule } from './RecommandationsModule';
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
  const [showBilanPatrimonialModal, setShowBilanPatrimonialModal] = useState(false);
  const [showRecommandationsModal, setShowRecommandationsModal] = useState(false);

  // Client data management hook - consolidates 17 useState + 13 handlers.
  // Every handleUpdateXxx call persists immediately to the server, with
  // no debounce.
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
      <div className="mb-4">
        <ClientHeader
          clientData={state.clientData}
          onBack={onBack}
          onUpdate={handleUpdateClient}
        />
      </div>

      {/* Boutons Bilan Patrimonial / Recommandations */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowBilanPatrimonialModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">📊 Voir le Bilan Patrimonial</span>
        </button>
        <button
          onClick={() => setShowRecommandationsModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
        >
          <Lightbulb className="w-5 h-5" />
          <span className="font-medium">💡 Voir les Recommandations</span>
        </button>
      </div>

      {/* Modal Bilan Patrimonial */}
      {showBilanPatrimonialModal && (
        <BilanPatrimonial
          clientData={state.clientData}
          familyInfo={state.familyInfo}
          actifsFinanciers={state.actifsFinanciers}
          immobilier={state.immobilier}
          passifs={state.passifs}
          revenus={state.revenus}
          imposition={state.imposition}
          objectifs={state.objectifs}
          onClose={() => setShowBilanPatrimonialModal(false)}
        />
      )}

      {/* Modal Recommandations */}
      {showRecommandationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Lightbulb className="w-7 h-7" />
                Recommandations - {state.clientData.name}
              </h2>
              <button
                onClick={() => setShowRecommandationsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <RecommandationsModule
                recommendations={state.auditRecommendations}
                onUpdate={handleUpdateAuditRecommendations}
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
              auditRecommendations={state.auditRecommendations}
              onUpdateAuditRecommendations={handleUpdateAuditRecommendations}
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
              recommendations={state.auditRecommendations}
              onUpdateRecommendations={handleUpdateAuditRecommendations}
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
