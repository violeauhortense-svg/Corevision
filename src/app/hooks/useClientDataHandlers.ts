import { useCallback } from 'react';
import { toast } from 'sonner';
import { addTimestamps, markNewItems } from '../utils/traceability';
import { validateClientData, validateFinancialData } from '../utils/validation';
import { Events } from '../utils/eventEmitter';
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
  ContactProfessionnel
} from '../components/client-detail/types';

interface UseClientDataHandlersProps {
  clientId: string;
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
  setClientData: (data: ClientData | ((prev: ClientData) => ClientData)) => void;
  setFamilyInfo: (data: FamilyInfo) => void;
  setRevenus: (data: RevenuItem[]) => void;
  setImposition: (data: ImpositionData) => void;
  setActifsFinanciers: (data: PatrimoineItem[]) => void;
  setImmobilier: (data: PatrimoineItem[]) => void;
  setPassifs: (data: PatrimoineItem[]) => void;
  setEntreprises: (data: any[]) => void;
  setObjectifs: (data: Objectif[]) => void;
  setAuditRecommendations: (data: AuditRecommendation[]) => void;
  setDocuments: (data: Document[]) => void;
  setRegulatoryDocs: (data: RegulatoryDocument[]) => void;
  setContactsProfessionnels: (data: ContactProfessionnel[]) => void;
  triggerAutoSave: () => void;
}

export function useClientDataHandlers(props: UseClientDataHandlersProps) {
  const {
    clientId,
    clientData,
    familyInfo,
    revenus,
    imposition,
    actifsFinanciers,
    immobilier,
    passifs,
    entreprises,
    setClientData,
    setFamilyInfo,
    setRevenus,
    setImposition,
    setActifsFinanciers,
    setImmobilier,
    setPassifs,
    setEntreprises,
    setObjectifs,
    setAuditRecommendations,
    setDocuments,
    setRegulatoryDocs,
    setContactsProfessionnels,
    triggerAutoSave,
  } = props;

  const calcPatrimoine = useCallback(
    (newActifs: PatrimoineItem[], newImmobilier: PatrimoineItem[], newPassifs: PatrimoineItem[], newEntreprises: any[]) => {
      const totalEntreprises = newEntreprises.reduce((sum, e) => {
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
      return newActifs.reduce((s, a) => s + a.value, 0)
           + newImmobilier.reduce((s, i) => s + i.value, 0)
           - newPassifs.reduce((s, p) => s + p.value, 0)
           + totalEntreprises;
    },
    []
  );

  const handleUpdateClient = useCallback(async (updates: Partial<ClientData>) => {
    try {
      const updatedData = { ...clientData, ...updates };
      const errors = validateClientData(updatedData);
      if (errors.length > 0) {
        const errorMessages = errors.map(e => e.message).join(', ');
        toast.error(`Validation: ${errorMessages}`);
        return;
      }
      if (updates.status && updates.status !== clientData.status) {
        Events.clientStatusChanged(clientId, clientData.status, updates.status);
      }
      setClientData(updatedData);
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [clientId, clientData, setClientData, triggerAutoSave]);

  const handleUpdateFamily = useCallback(async (family: FamilyInfo) => {
    try {
      const familyWithTimestamp = addTimestamps(family, !familyInfo.maritalStatus);
      setFamilyInfo(familyWithTimestamp);
      Events.clientUpdated(clientId, clientData.name, 'Composition du foyer');
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du foyer:', error);
      toast.error('Erreur lors de la mise à jour du foyer');
    }
  }, [clientId, clientData.name, familyInfo.maritalStatus, setFamilyInfo, triggerAutoSave]);

  const handleUpdateRevenus = useCallback(async (newRevenus: RevenuItem[]) => {
    try {
      const revenusWithTimestamps = markNewItems(newRevenus, revenus);
      setRevenus(revenusWithTimestamps);
      Events.revenusUpdated(clientId);
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des revenus:', error);
      toast.error('Erreur lors de la mise à jour des revenus');
    }
  }, [clientId, revenus, setRevenus, triggerAutoSave]);

  const handleUpdateImposition = useCallback(async (newImposition: ImpositionData, revenusToSave?: RevenuItem[]) => {
    try {
      const errors = validateFinancialData(newImposition);
      if (errors.length > 0) {
        const errorMessages = errors.map(e => e.message).join(', ');
        toast.error(`Validation: ${errorMessages}`);
        return;
      }
      setImposition(newImposition);
      const revenusASauvegarder = revenusToSave || revenus;
      if (revenusToSave) setRevenus(revenusASauvegarder);
      Events.impositionUpdated(clientId);
      triggerAutoSave();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données d'imposition:", error);
      toast.error("Erreur lors de la mise à jour des données d'imposition");
    }
  }, [clientId, revenus, setImposition, setRevenus, triggerAutoSave]);

  const handleUpdateActifs = useCallback(async (newActifs: PatrimoineItem[]) => {
    try {
      const actifsWithTimestamps = markNewItems(newActifs, actifsFinanciers);
      setActifsFinanciers(actifsWithTimestamps);
      const patrimoineTotal = calcPatrimoine(actifsWithTimestamps, immobilier, passifs, entreprises);
      setClientData(prev => ({ ...prev, patrimoine: patrimoineTotal }));
      Events.patrimoineUpdated(clientId, 'actifs_financiers');
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des actifs:', error);
      toast.error('Erreur lors de la mise à jour des actifs');
    }
  }, [clientId, actifsFinanciers, immobilier, passifs, entreprises, setActifsFinanciers, setClientData, calcPatrimoine, triggerAutoSave]);

  const handleUpdateImmobilier = useCallback(async (newImmobilier: PatrimoineItem[]) => {
    try {
      const immobilierWithTimestamps = markNewItems(newImmobilier, immobilier);
      setImmobilier(immobilierWithTimestamps);
      const patrimoineTotal = calcPatrimoine(actifsFinanciers, immobilierWithTimestamps, passifs, entreprises);
      setClientData(prev => ({ ...prev, patrimoine: patrimoineTotal }));
      Events.patrimoineUpdated(clientId, 'immobilier');
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'immobilier:', error);
      toast.error('Erreur lors de la mise à jour de l\'immobilier');
    }
  }, [clientId, actifsFinanciers, immobilier, passifs, entreprises, setImmobilier, setClientData, calcPatrimoine, triggerAutoSave]);

  const handleUpdatePassifs = useCallback(async (newPassifs: PatrimoineItem[]) => {
    try {
      const passifsWithTimestamps = markNewItems(newPassifs, passifs);
      setPassifs(passifsWithTimestamps);
      const patrimoineTotal = calcPatrimoine(actifsFinanciers, immobilier, passifsWithTimestamps, entreprises);
      setClientData(prev => ({ ...prev, patrimoine: patrimoineTotal }));
      Events.patrimoineUpdated(clientId, 'passifs');
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des passifs:', error);
      toast.error('Erreur lors de la mise à jour des passifs');
    }
  }, [clientId, actifsFinanciers, immobilier, passifs, entreprises, setPassifs, setClientData, calcPatrimoine, triggerAutoSave]);

  const handleUpdateEntreprises = useCallback(async (newEntreprises: any[]) => {
    try {
      setEntreprises(newEntreprises);
      const patrimoineTotal = calcPatrimoine(actifsFinanciers, immobilier, passifs, newEntreprises);
      setClientData(prev => ({ ...prev, patrimoine: patrimoineTotal }));
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des entreprises:', error);
      toast.error('Erreur lors de la mise à jour des entreprises');
    }
  }, [actifsFinanciers, immobilier, passifs, setEntreprises, setClientData, calcPatrimoine, triggerAutoSave]);

  const handleUpdateObjectifs = useCallback(async (newObjectifs: Objectif[]) => {
    try {
      setObjectifs(newObjectifs);
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des objectifs:', error);
      toast.error('Erreur lors de la mise à jour des objectifs');
    }
  }, [setObjectifs, triggerAutoSave]);

  const handleUpdateAuditRecommendations = useCallback(async (newRecommendations: AuditRecommendation[]) => {
    try {
      setAuditRecommendations(newRecommendations);
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des recommandations:', error);
      toast.error('Erreur lors de la mise à jour des recommandations');
    }
  }, [setAuditRecommendations, triggerAutoSave]);

  const handleUpdateDocuments = useCallback(async (newDocuments: Document[]) => {
    try {
      setDocuments(newDocuments);
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des documents:', error);
      toast.error('Erreur lors de la mise à jour des documents');
    }
  }, [setDocuments, triggerAutoSave]);

  const handleUpdateRegulatoryDocs = useCallback(async (newDocs: RegulatoryDocument[]) => {
    try {
      setRegulatoryDocs(newDocs);
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des documents réglementaires:', error);
      toast.error('Erreur lors de la mise à jour des documents réglementaires');
    }
  }, [setRegulatoryDocs, triggerAutoSave]);

  const handleUpdateContactsProfessionnels = useCallback(async (newContacts: ContactProfessionnel[]) => {
    try {
      setContactsProfessionnels(newContacts);
      triggerAutoSave();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des contacts professionnels:', error);
      toast.error('Erreur lors de la mise à jour des contacts professionnels');
    }
  }, [setContactsProfessionnels, triggerAutoSave]);

  return {
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
    calcPatrimoine,
  };
}
