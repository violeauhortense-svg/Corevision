import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { clientAPI, taskAPI } from '../services/api';
import { addTimestamps, markNewItems } from '../utils/traceability';
import { validateClientData, validateFinancialData } from '../utils/validation';
import { Events } from '../utils/eventEmitter';
import { taskSyncService } from '../services/taskSyncService';
import type {
  ClientData,
  FamilyInfo,
  RevenuItem,
  ImpositionData,
  PatrimoineItem,
  Objectif,
  AuditRecommendation,
  Document,
  RegulatoryDocument,
  ContactProfessionnel,
  Task
} from '../components/client-detail/types';

interface ClientDataState {
  clientData: ClientData;
  familyInfo: FamilyInfo;
  revenus: RevenuItem[];
  imposition: ImpositionData;
  actifsFinanciers: PatrimoineItem[];
  immobilier: PatrimoineItem[];
  passifs: PatrimoineItem[];
  entreprises: any[];
  objectifs: Objectif[];
  auditRecommendations: AuditRecommendation[];
  documents: Document[];
  regulatoryDocs: RegulatoryDocument[];
  contactsProfessionnels: ContactProfessionnel[];
  tasks: Task[]; // ✨ Tasks linked to client
}

// Helper: Initialize required documents for a given stage
export function initializeRequiredDocuments(
  clientStatus: string,
  existingDocs: RegulatoryDocument[]
): RegulatoryDocument[] {
  const requiredDocsByStage: Record<string, Array<{ id: string; name: string; requiredForStage: string }>> = {
    'R0 - Prospect': [],
    'R0-R1 - Découverte': [
      { id: 'r1', name: "Document d'Entrée en Relation (DER)", requiredForStage: 'R0-R1 - Découverte' },
    ],
    'R1 - Audit patrimonial': [
      { id: 'r1', name: "Document d'Entrée en Relation (DER)", requiredForStage: 'R0-R1 - Découverte' },
      { id: 'r3', name: 'LAB-FT (Lutte Anti-Blanchiment)', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r4', name: 'Gel des avoirs', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r6', name: 'Questionnaire investisseur - Client', requiredForStage: 'R1 - Audit patrimonial' },
    ],
    'R1-R2 - Stratégie définie': [
      { id: 'r1', name: "Document d'Entrée en Relation (DER)", requiredForStage: 'R0-R1 - Découverte' },
      { id: 'r3', name: 'LAB-FT (Lutte Anti-Blanchiment)', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r4', name: 'Gel des avoirs', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r6', name: 'Questionnaire investisseur - Client', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r7', name: 'Mail compte rendu + bilan', requiredForStage: 'R1-R2 - Stratégie définie' },
      { id: 'r8', name: 'Lettre de mission', requiredForStage: 'R1-R2 - Stratégie définie' },
      { id: 'r9', name: 'Mandat de recherche IAS', requiredForStage: 'R1-R2 - Stratégie définie' },
    ],
    'R2 - Recommandation proposée': [
      { id: 'r1', name: "Document d'Entrée en Relation (DER)", requiredForStage: 'R0-R1 - Découverte' },
      { id: 'r3', name: 'LAB-FT (Lutte Anti-Blanchiment)', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r4', name: 'Gel des avoirs', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r6', name: 'Questionnaire investisseur - Client', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r7', name: 'Mail compte rendu + bilan', requiredForStage: 'R1-R2 - Stratégie définie' },
      { id: 'r8', name: 'Lettre de mission', requiredForStage: 'R1-R2 - Stratégie définie' },
      { id: 'r9', name: 'Mandat de recherche IAS', requiredForStage: 'R1-R2 - Stratégie définie' },
    ],
    'Rsuivi - Suivi patrimonial': [
      { id: 'r1', name: "Document d'Entrée en Relation (DER)", requiredForStage: 'R0-R1 - Découverte' },
      { id: 'r3', name: 'LAB-FT (Lutte Anti-Blanchiment)', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r4', name: 'Gel des avoirs', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r6', name: 'Questionnaire investisseur - Client', requiredForStage: 'R1 - Audit patrimonial' },
      { id: 'r7', name: 'Mail compte rendu + bilan', requiredForStage: 'R1-R2 - Stratégie définie' },
      { id: 'r8', name: 'Lettre de mission', requiredForStage: 'R1-R2 - Stratégie définie' },
      { id: 'r9', name: 'Mandat de recherche IAS', requiredForStage: 'R1-R2 - Stratégie définie' },
    ],
  };

  const requiredDocs = requiredDocsByStage[clientStatus] || [];
  const result = [...existingDocs];

  requiredDocs.forEach((requiredDoc) => {
    const exists = existingDocs.some(doc => doc.id === requiredDoc.id);
    if (!exists) {
      result.push({
        id: requiredDoc.id,
        name: requiredDoc.name,
        status: 'required',
        requiredForStage: requiredDoc.requiredForStage,
      });
    }
  });

  return result;
}

export function useClientData(clientId: string, onSave?: (data: ClientDataState) => Promise<void>) {
  // Consolidated state object to avoid stale closure issues
  const [state, setState] = useState<ClientDataState>({
    clientData: {
      id: clientId,
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      birthDate: '',
      status: 'R0 - Prospect',
      patrimoine: 0,
      majorationPartFiscale: false,
      auditCoreVision: undefined,
      presentationCoreVision: undefined,
      preconisationsCoreVision: undefined,
    },
    familyInfo: {
      maritalStatus: 'Célibataire',
      regimeMatrimonial: 'Communauté réduite aux acquêts',
      spouse: {
        firstName: '',
        lastName: '',
        birthDate: '',
        profession: '',
        email: '',
        majorationPartFiscale: false,
      },
      children: [],
    },
    revenus: [],
    imposition: {
      traitementsSalairesPensions: 0,
      revenusTNS: 0,
      locationsMeublesNonPro: 0,
      locationsMeublesNonProType: 'micro',
      reveusValeursCapitauxMobiliers: 0,
      plusValueMobiliere: 0,
      revenusFonciers: 0,
      nombreParts: 1,
      tmi: '0',
      impotRevenu: 0,
      ifi: 0,
    },
    actifsFinanciers: [],
    immobilier: [],
    passifs: [],
    entreprises: [],
    objectifs: [],
    auditRecommendations: [],
    documents: [],
    regulatoryDocs: [],
    contactsProfessionnels: [],
    tasks: [],
  });

  // Helper: Calculate total patrimoine
  const calcPatrimoine = useCallback((state: ClientDataState) => {
    const { actifsFinanciers, immobilier, passifs, entreprises } = state;
    const totalEntreprises = entreprises.reduce((sum, e) => {
      const a = (e.actifs?.immobilisationsCorporelles || 0)
              + (e.actifs?.immobilisationsIncorporelles || 0)
              + (e.actifs?.immobilisationsFinancieres || 0)
              + (e.actifs?.stocks || 0)
              + (e.actifs?.creancesClients || 0)
              + (e.actifs?.disponibilites || 0);
      const p = (e.passifs?.dettesBancaires || 0)
              + (e.passifs?.dettesFournisseurs || 0)
              + (e.passifs?.dettesFiscalesSociales || 0);
      return sum + (a - p);
    }, 0);
    return actifsFinanciers.reduce((s, a) => s + a.value, 0)
         + immobilier.reduce((s, i) => s + i.value, 0)
         - passifs.reduce((s, p) => s + p.value, 0)
         + totalEntreprises;
  }, []);

  // Consolidated update handler using setState callback to avoid stale closure
  const updateState = useCallback((updates: Partial<ClientDataState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Client handlers
  const handleUpdateClient = useCallback(async (updates: Partial<ClientData>) => {
    try {
      setState(prev => {
        const updatedData = { ...prev.clientData, ...updates };
        const errors = validateClientData(updatedData);
        if (errors.length > 0) {
          const errorMessages = errors.map(e => e.message).join(', ');
          toast.error(`Validation: ${errorMessages}`);
          return prev;
        }
        if (updates.status && updates.status !== prev.clientData.status) {
          Events.clientStatusChanged(clientId, prev.clientData.status, updates.status);
        }
        return { ...prev, clientData: updatedData };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [clientId]);

  const handleUpdateFamily = useCallback(async (family: FamilyInfo) => {
    try {
      setState(prev => {
        const familyWithTimestamp = addTimestamps(family, !prev.familyInfo.maritalStatus);
        Events.clientUpdated(clientId, prev.clientData.name, 'Composition du foyer');
        return { ...prev, familyInfo: familyWithTimestamp };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du foyer:', error);
      toast.error('Erreur lors de la mise à jour du foyer');
    }
  }, [clientId]);

  const handleUpdateRevenus = useCallback(async (newRevenus: RevenuItem[]) => {
    try {
      setState(prev => {
        const revenusWithTimestamps = markNewItems(newRevenus, prev.revenus);
        Events.revenusUpdated(clientId);
        return { ...prev, revenus: revenusWithTimestamps };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des revenus:', error);
      toast.error('Erreur lors de la mise à jour des revenus');
    }
  }, [clientId]);

  const handleUpdateImposition = useCallback(async (newImposition: ImpositionData, revenusToSave?: RevenuItem[]) => {
    try {
      setState(prev => {
        const errors = validateFinancialData(newImposition);
        if (errors.length > 0) {
          const errorMessages = errors.map(e => e.message).join(', ');
          toast.error(`Validation: ${errorMessages}`);
          return prev;
        }
        const revenusASauvegarder = revenusToSave || prev.revenus;
        Events.impositionUpdated(clientId);
        return { ...prev, imposition: newImposition, revenus: revenusASauvegarder };
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données d'imposition:", error);
      toast.error("Erreur lors de la mise à jour des données d'imposition");
    }
  }, [clientId]);

  const handleUpdateActifs = useCallback(async (newActifs: PatrimoineItem[]) => {
    try {
      setState(prev => {
        const actifsWithTimestamps = markNewItems(newActifs, prev.actifsFinanciers);
        const newState = { ...prev, actifsFinanciers: actifsWithTimestamps };
        const patrimoineTotal = calcPatrimoine(newState);
        Events.patrimoineUpdated(clientId, 'actifs_financiers');
        return {
          ...newState,
          clientData: { ...newState.clientData, patrimoine: patrimoineTotal }
        };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des actifs:', error);
      toast.error('Erreur lors de la mise à jour des actifs');
    }
  }, [clientId, calcPatrimoine]);

  const handleUpdateImmobilier = useCallback(async (newImmobilier: PatrimoineItem[]) => {
    try {
      setState(prev => {
        const immobilierWithTimestamps = markNewItems(newImmobilier, prev.immobilier);
        const newState = { ...prev, immobilier: immobilierWithTimestamps };
        const patrimoineTotal = calcPatrimoine(newState);
        Events.patrimoineUpdated(clientId, 'immobilier');
        return {
          ...newState,
          clientData: { ...newState.clientData, patrimoine: patrimoineTotal }
        };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'immobilier:', error);
      toast.error('Erreur lors de la mise à jour de l\'immobilier');
    }
  }, [clientId, calcPatrimoine]);

  const handleUpdatePassifs = useCallback(async (newPassifs: PatrimoineItem[]) => {
    try {
      setState(prev => {
        const passifsWithTimestamps = markNewItems(newPassifs, prev.passifs);
        const newState = { ...prev, passifs: passifsWithTimestamps };
        const patrimoineTotal = calcPatrimoine(newState);
        Events.patrimoineUpdated(clientId, 'passifs');
        return {
          ...newState,
          clientData: { ...newState.clientData, patrimoine: patrimoineTotal }
        };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des passifs:', error);
      toast.error('Erreur lors de la mise à jour des passifs');
    }
  }, [clientId, calcPatrimoine]);

  const handleUpdateEntreprises = useCallback(async (newEntreprises: any[]) => {
    try {
      setState(prev => {
        const newState = { ...prev, entreprises: newEntreprises };
        const patrimoineTotal = calcPatrimoine(newState);
        return {
          ...newState,
          clientData: { ...newState.clientData, patrimoine: patrimoineTotal }
        };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des entreprises:', error);
      toast.error('Erreur lors de la mise à jour des entreprises');
    }
  }, [calcPatrimoine]);

  const handleUpdateObjectifs = useCallback(async (newObjectifs: Objectif[]) => {
    try {
      setState(prev => {
        return { ...prev, objectifs: newObjectifs };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des objectifs:', error);
      toast.error('Erreur lors de la mise à jour des objectifs');
    }
  }, []);

  const handleUpdateAuditRecommendations = useCallback(async (newRecommendations: AuditRecommendation[]) => {
    try {
      setState(prev => {
        return { ...prev, auditRecommendations: newRecommendations };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des recommandations:', error);
      toast.error('Erreur lors de la mise à jour des recommandations');
    }
  }, []);

  const handleUpdateDocuments = useCallback(async (newDocuments: Document[]) => {
    try {
      setState(prev => {
        return { ...prev, documents: newDocuments };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des documents:', error);
      toast.error('Erreur lors de la mise à jour des documents');
    }
  }, []);

  const handleUpdateRegulatoryDocs = useCallback(async (newDocs: RegulatoryDocument[]) => {
    try {
      setState(prev => {
        return { ...prev, regulatoryDocs: newDocs };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des documents réglementaires:', error);
      toast.error('Erreur lors de la mise à jour des documents réglementaires');
    }
  }, []);

  const handleUpdateContactsProfessionnels = useCallback(async (newContacts: ContactProfessionnel[]) => {
    try {
      setState(prev => {
        return { ...prev, contactsProfessionnels: newContacts };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des contacts professionnels:', error);
      toast.error('Erreur lors de la mise à jour des contacts professionnels');
    }
  }, []);

  const handleUpdateTasks = useCallback(async (newTasks: Task[]) => {
    try {
      setState(prev => {
        return { ...prev, tasks: newTasks };
      });
      // Sync tasks to TodoView, Agenda, and History
      if (clientId) {
        await taskSyncService.syncClientTasks({ clientId, userId: 'default' });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tâches:', error);
      toast.error('Erreur lors de la mise à jour des tâches');
    }
  }, [clientId]);

  // Load data from API
  const loadFromAPI = useCallback(async (client: any) => {
    try {
      const patrimoineNumeric = typeof client.patrimoine === 'string'
        ? parseFloat(client.patrimoine.replace(/[^\d.-]/g, '')) * 1000 || 0
        : (client.patrimoine || 0);

      const patrimoineData = client.patrimoineData || {};
      const initializedRegulatoryDocs = client.regulatoryDocs || [];

      setState({
        clientData: {
          id: client.id,
          name: client.name,
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email,
          phone: client.phone,
          address: client.address || '',
          birthDate: client.birthDate || '',
          status: client.status,
          patrimoine: patrimoineNumeric,
          majorationPartFiscale: client.majorationPartFiscale || false,
          auditCoreVision: client.auditCoreVision,
          presentationCoreVision: client.presentationCoreVision,
          preconisationsCoreVision: client.preconisationsCoreVision,
        },
        familyInfo: {
          maritalStatus: client.maritalStatus || 'Célibataire',
          regimeMatrimonial: client.regimeMatrimonial || 'Communauté réduite aux acquêts',
          spouse: {
            firstName: client.spouse?.firstName || '',
            lastName: client.spouse?.lastName || '',
            birthDate: client.spouse?.birthDate || '',
            profession: client.spouse?.profession || '',
            email: client.spouse?.email || '',
            majorationPartFiscale: client.spouse?.majorationPartFiscale || false,
          },
          children: client.children || [],
        },
        revenus: client.revenus || [],
        imposition: {
          traitementsSalairesPensions: client.imposition?.traitementsSalairesPensions || 0,
          revenusTNS: client.imposition?.revenusTNS || 0,
          locationsMeublesNonPro: client.imposition?.locationsMeublesNonPro || 0,
          locationsMeublesNonProType: client.imposition?.locationsMeublesNonProType || 'micro',
          reveusValeursCapitauxMobiliers: client.imposition?.reveusValeursCapitauxMobiliers || 0,
          plusValueMobiliere: client.imposition?.plusValueMobiliere || 0,
          revenusFonciers: client.imposition?.revenusFonciers || 0,
          nombreParts: client.imposition?.nombreParts || 1,
          tmi: client.imposition?.tmi || '0',
          impotRevenu: client.imposition?.impotRevenu || 0,
          ifi: client.imposition?.ifi || 0,
        },
        actifsFinanciers: patrimoineData.actifsFinanciers || [],
        immobilier: patrimoineData.immobilier || [],
        passifs: patrimoineData.passifs || [],
        entreprises: patrimoineData.entreprises || [],
        objectifs: client.objectifs || [],
        auditRecommendations: client.auditRecommendations || [],
        documents: client.documents || [],
        regulatoryDocs: initializedRegulatoryDocs,
        contactsProfessionnels: client.contactsProfessionnels || [],
        tasks: [], // Will be loaded separately via loadTasks
      });

      // Load tasks from API
      try {
        const clientTasks = await taskAPI.getByClientId(client.id);
        setState(prev => ({ ...prev, tasks: clientTasks }));
        // Sync tasks immediately after loading
        await taskSyncService.syncClientTasks({ clientId: client.id, userId: 'default' });
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      throw error;
    }
  }, []);

  // Save to API - uses current state to avoid stale closure
  const saveToAPI = useCallback(async () => {
    try {
      const fullData = {
        // Basic data
        id: state.clientData.id,
        name: state.clientData.name,
        firstName: state.clientData.firstName,
        lastName: state.clientData.lastName,
        email: state.clientData.email,
        phone: state.clientData.phone,
        address: state.clientData.address,
        birthDate: state.clientData.birthDate,
        status: state.clientData.status,
        patrimoine: state.clientData.patrimoine,
        majorationPartFiscale: state.clientData.majorationPartFiscale,
        auditCoreVision: state.clientData.auditCoreVision,
        presentationCoreVision: state.clientData.presentationCoreVision,
        preconisationsCoreVision: state.clientData.preconisationsCoreVision,
        // Family
        maritalStatus: state.familyInfo.maritalStatus,
        regimeMatrimonial: state.familyInfo.regimeMatrimonial,
        spouse: state.familyInfo.spouse,
        children: state.familyInfo.children,
        // Revenue & tax
        revenus: state.revenus,
        imposition: state.imposition,
        // Assets
        patrimoineData: {
          actifsFinanciers: state.actifsFinanciers,
          immobilier: state.immobilier,
          passifs: state.passifs,
          entreprises: state.entreprises,
        },
        // Goals & audit
        objectifs: state.objectifs,
        auditRecommendations: state.auditRecommendations,
        // Documents
        documents: state.documents,
        regulatoryDocs: state.regulatoryDocs,
        // Contacts
        contactsProfessionnels: state.contactsProfessionnels,
      };

      await clientAPI.update(clientId, fullData);

      // Sync tasks after saving client data
      if (state.tasks.length > 0) {
        await taskSyncService.syncClientTasks({ clientId, userId: 'default' });
      }

      if (onSave) {
        await onSave(state);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      return false;
    }
  }, [state, clientId, onSave]);

  return {
    state,
    setState,
    updateState,
    calcPatrimoine: () => calcPatrimoine(state),
    // Handlers
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
    handleUpdateTasks,
    // Data loading/saving
    loadFromAPI,
    saveToAPI,
  };
}
