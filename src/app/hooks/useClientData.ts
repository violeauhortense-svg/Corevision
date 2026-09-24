import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { clientAPI, taskAPI } from '../services/api';
import { apiBaseUrl } from '../utils/api/info';
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

// Build the full API payload from a ClientDataState snapshot
function buildFullData(clientId: string, state: ClientDataState) {
  return {
    id: clientId,
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
    activite: state.clientData.activite,
    secteur: state.clientData.secteur,
    genre: state.clientData.genre,
    maritalStatus: state.familyInfo.maritalStatus,
    regimeMatrimonial: state.familyInfo.regimeMatrimonial,
    spouse: state.familyInfo.spouse,
    children: state.familyInfo.children,
    revenus: state.revenus,
    imposition: state.imposition,
    patrimoineData: {
      actifsFinanciers: state.actifsFinanciers,
      immobilier: state.immobilier,
      passifs: state.passifs,
      entreprises: state.entreprises,
    },
    objectifs: state.objectifs,
    auditRecommendations: state.auditRecommendations,
    documents: state.documents,
    regulatoryDocs: state.regulatoryDocs,
    contactsProfessionnels: state.contactsProfessionnels,
  };
}

export function useClientData(clientId: string, onSave?: (data: ClientDataState) => Promise<void>) {
  const initialState: ClientDataState = {
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
  };

  const [state, setState] = useState<ClientDataState>(initialState);

  // Always-current snapshot of state, so each handler can build the full
  // save payload synchronously without waiting for a React re-render
  // (which is what made the previous debounced-effect approach lose data
  // when the user navigated away right after saving).
  const stateRef = useRef<ClientDataState>(initialState);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Helper: Calculate total patrimoine
  const calcPatrimoine = useCallback((s: ClientDataState) => {
    const { actifsFinanciers, immobilier, passifs, entreprises } = s;
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

  const updateState = useCallback((updates: Partial<ClientDataState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Immediately persists a full state snapshot to the server. Called by
  // every handler right after computing the new state, so a save is never
  // deferred behind a timer the user could navigate past.
  const persistState = useCallback(async (newState: ClientDataState): Promise<boolean> => {
    setSaveStatus('saving');
    try {
      const fullData = buildFullData(clientId, newState);
      await clientAPI.update(clientId, fullData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      if (onSave) {
        await onSave(newState);
      }
      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      setSaveStatus('error');
      toast.error('Erreur lors de la sauvegarde - vos modifications n\'ont pas été enregistrées');
      return false;
    }
  }, [clientId, onSave]);

  // Client handlers — each one updates local state for immediate UI
  // feedback AND persists the full record right away.
  const handleUpdateClient = useCallback(async (updates: Partial<ClientData>) => {
    const updatedData = { ...stateRef.current.clientData, ...updates };
    const errors = validateClientData(updatedData);
    if (errors.length > 0) {
      const errorMessages = errors.map(e => e.message).join(', ');
      toast.error(`Validation: ${errorMessages}`);
      return false;
    }
    if (updates.status && updates.status !== stateRef.current.clientData.status) {
      Events.clientStatusChanged(clientId, stateRef.current.clientData.status, updates.status);
    }
    const newState = { ...stateRef.current, clientData: updatedData };
    setState(newState);
    stateRef.current = newState;
    return persistState(newState);
  }, [clientId, persistState]);

  // Statut réellement avancé dans le pipeline (voir statusOuvert sur
  // ClientData). Patché directement, PAS via persistState/buildFullData:
  // celui-ci exclut délibérément statusOuvert de son payload (seule
  // l'Agenda/TasksTab doivent l'écrire normalement), et clientAPI.update()
  // force par ailleurs nom/prenom/telephone à '' quand ils sont absents du
  // payload - un PATCH complet écraserait le reste du client. Même route
  // et même forme de payload que TasksTab.tsx.
  const handleUpdateStatusOuvert = useCallback(async (newStatus: string) => {
    const previousStatus = stateRef.current.clientData.statusOuvert || stateRef.current.clientData.status;
    const newState = { ...stateRef.current, clientData: { ...stateRef.current.clientData, statusOuvert: newStatus } };
    setState(newState);
    stateRef.current = newState;

    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/api/clients/${clientId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ statusOuvert: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur ${response.status}`);
      }

      if (previousStatus && previousStatus !== newStatus) {
        Events.clientStatusChanged(clientId, previousStatus, newStatus);
      }
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour du statut - non enregistré');
      // Revert optimistic update
      const revertState = { ...stateRef.current, clientData: { ...stateRef.current.clientData, statusOuvert: previousStatus } };
      setState(revertState);
      stateRef.current = revertState;
      return false;
    }
  }, [clientId]);

  const handleUpdateFamily = useCallback(async (family: FamilyInfo) => {
    const familyWithTimestamp = addTimestamps(family, !stateRef.current.familyInfo.maritalStatus);
    const newState = { ...stateRef.current, familyInfo: familyWithTimestamp };
    setState(newState);
    stateRef.current = newState;
    Events.clientUpdated(clientId, newState.clientData.name, 'Composition du foyer');
    return persistState(newState);
  }, [clientId, persistState]);

  const handleUpdateRevenus = useCallback(async (newRevenus: RevenuItem[]) => {
    const revenusWithTimestamps = markNewItems(newRevenus, stateRef.current.revenus);
    const newState = { ...stateRef.current, revenus: revenusWithTimestamps };
    setState(newState);
    stateRef.current = newState;
    Events.revenusUpdated(clientId);
    return persistState(newState);
  }, [clientId, persistState]);

  const handleUpdateImposition = useCallback(async (newImposition: ImpositionData, revenusToSave?: RevenuItem[]) => {
    const errors = validateFinancialData(newImposition);
    if (errors.length > 0) {
      const errorMessages = errors.map(e => e.message).join(', ');
      toast.error(`Validation: ${errorMessages}`);
      return false;
    }
    const revenusASauvegarder = revenusToSave || stateRef.current.revenus;
    const newState = { ...stateRef.current, imposition: newImposition, revenus: revenusASauvegarder };
    setState(newState);
    stateRef.current = newState;
    Events.impositionUpdated(clientId);
    return persistState(newState);
  }, [clientId, persistState]);

  const handleUpdateActifs = useCallback(async (newActifs: PatrimoineItem[]) => {
    const actifsWithTimestamps = markNewItems(newActifs, stateRef.current.actifsFinanciers);
    const intermediate = { ...stateRef.current, actifsFinanciers: actifsWithTimestamps };
    const patrimoineTotal = calcPatrimoine(intermediate);
    const newState = { ...intermediate, clientData: { ...intermediate.clientData, patrimoine: patrimoineTotal } };
    setState(newState);
    stateRef.current = newState;
    Events.patrimoineUpdated(clientId, 'actifs_financiers');
    return persistState(newState);
  }, [clientId, calcPatrimoine, persistState]);

  const handleUpdateImmobilier = useCallback(async (newImmobilier: PatrimoineItem[]) => {
    const immobilierWithTimestamps = markNewItems(newImmobilier, stateRef.current.immobilier);
    const intermediate = { ...stateRef.current, immobilier: immobilierWithTimestamps };
    const patrimoineTotal = calcPatrimoine(intermediate);
    const newState = { ...intermediate, clientData: { ...intermediate.clientData, patrimoine: patrimoineTotal } };
    setState(newState);
    stateRef.current = newState;
    Events.patrimoineUpdated(clientId, 'immobilier');
    return persistState(newState);
  }, [clientId, calcPatrimoine, persistState]);

  const handleUpdatePassifs = useCallback(async (newPassifs: PatrimoineItem[]) => {
    const passifsWithTimestamps = markNewItems(newPassifs, stateRef.current.passifs);
    const intermediate = { ...stateRef.current, passifs: passifsWithTimestamps };
    const patrimoineTotal = calcPatrimoine(intermediate);
    const newState = { ...intermediate, clientData: { ...intermediate.clientData, patrimoine: patrimoineTotal } };
    setState(newState);
    stateRef.current = newState;
    Events.patrimoineUpdated(clientId, 'passifs');
    return persistState(newState);
  }, [clientId, calcPatrimoine, persistState]);

  const handleUpdateEntreprises = useCallback(async (newEntreprises: any[]) => {
    const intermediate = { ...stateRef.current, entreprises: newEntreprises };
    const patrimoineTotal = calcPatrimoine(intermediate);
    const newState = { ...intermediate, clientData: { ...intermediate.clientData, patrimoine: patrimoineTotal } };
    setState(newState);
    stateRef.current = newState;
    return persistState(newState);
  }, [calcPatrimoine, persistState]);

  const handleUpdateObjectifs = useCallback(async (newObjectifs: Objectif[]) => {
    const newState = { ...stateRef.current, objectifs: newObjectifs };
    setState(newState);
    stateRef.current = newState;
    return persistState(newState);
  }, [persistState]);

  const handleUpdateAuditRecommendations = useCallback(async (newRecommendations: AuditRecommendation[]) => {
    const previousRecommendations = stateRef.current.auditRecommendations;
    const newState = { ...stateRef.current, auditRecommendations: newRecommendations };
    setState(newState);
    stateRef.current = newState;
    const ok = await persistState(newState);
    if (!ok) {
      // La sauvegarde a réellement échoué côté serveur - annuler la mise à
      // jour optimiste pour ne pas laisser une recommandation non
      // enregistrée apparaître comme sauvegardée dans la liste.
      const revertState = { ...stateRef.current, auditRecommendations: previousRecommendations };
      setState(revertState);
      stateRef.current = revertState;
    }
    return ok;
  }, [persistState]);

  const handleUpdateDocuments = useCallback(async (newDocuments: Document[]) => {
    const newState = { ...stateRef.current, documents: newDocuments };
    setState(newState);
    stateRef.current = newState;
    return persistState(newState);
  }, [persistState]);

  const handleUpdateRegulatoryDocs = useCallback(async (newDocs: RegulatoryDocument[]) => {
    const newState = { ...stateRef.current, regulatoryDocs: newDocs };
    setState(newState);
    stateRef.current = newState;
    return persistState(newState);
  }, [persistState]);

  const handleUpdateContactsProfessionnels = useCallback(async (newContacts: ContactProfessionnel[]) => {
    const newState = { ...stateRef.current, contactsProfessionnels: newContacts };
    setState(newState);
    stateRef.current = newState;
    return persistState(newState);
  }, [persistState]);

  const handleUpdateTasks = useCallback(async (newTasks: Task[]) => {
    const newState = { ...stateRef.current, tasks: newTasks };
    setState(newState);
    stateRef.current = newState;
    // Tasks are stored server-side via taskAPI directly (not part of the
    // client record), so no persistState() call here.
    if (clientId) {
      try {
        await taskSyncService.syncClientTasks({ clientId, userId: 'default' });
      } catch (error) {
        console.error('Erreur lors de la synchronisation des tâches:', error);
      }
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

      const loadedState: ClientDataState = {
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
          statusOuvert: client.statusOuvert || '',
          patrimoine: patrimoineNumeric,
          majorationPartFiscale: client.majorationPartFiscale || false,
          auditCoreVision: client.auditCoreVision,
          presentationCoreVision: client.presentationCoreVision,
          preconisationsCoreVision: client.preconisationsCoreVision,
          activite: client.activite || '',
          secteur: client.secteur || undefined,
          genre: client.genre || undefined,
          // Prochain RDV réel - la même donnée que l'Agenda/Dashboard,
          // pour laquelle setClientMeeting() (via l'Agenda) reste la
          // seule source d'écriture ; ici on ne fait que l'afficher.
          dateNextRdv: client.dateNextRdv || '',
          nextRdvDetails: client.nextRdvDetails || undefined,
          origineProspect: client.origineProspect || undefined,
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
            genre: client.spouse?.genre || undefined,
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
      };

      setState(loadedState);
      stateRef.current = loadedState;

      // Load tasks from API
      try {
        const clientTasks = await taskAPI.getByClientId(client.id);
        const withTasks = { ...stateRef.current, tasks: clientTasks };
        setState(withTasks);
        stateRef.current = withTasks;
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

  // Kept for backward compatibility with callers expecting an explicit
  // "save everything now" function (e.g. a manual "Save" button).
  const saveToAPI = useCallback(async () => {
    return persistState(stateRef.current);
  }, [persistState]);

  return {
    state,
    setState,
    updateState,
    saveStatus,
    calcPatrimoine: () => calcPatrimoine(state),
    // Handlers
    handleUpdateClient,
    handleUpdateStatusOuvert,
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
