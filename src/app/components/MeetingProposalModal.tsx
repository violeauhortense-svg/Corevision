import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar, MapPin, Mail, Send, AlertCircle, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { clientAPI, rdvAPI, taskAPI } from '../services/api';
import { generateEmailContent, recordEmailHistory } from '../utils/meetingHelpers';
import { agendaAPI } from '../services/agendaAPI';
import type { Task, ClientData, FamilyInfo } from './client-detail/types';

// Types
interface MeetingProposalModalProps {
  isOpen: boolean;
  task: Task | null;
  clientId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DocumentCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  documents: string[];
}

// Liste des documents par catégorie
const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'id',
    label: 'État civil & situation personnelle',
    icon: '👤',
    color: 'blue',
    documents: [
      'Pièce d\'identité (CNI ou passeport)',
      'Livret de famille',
      'Contrat de mariage ou PACS (si applicable)',
      'Jugement de divorce (si applicable)',
      'Justificatif de domicile',
    ],
  },
  {
    id: 'rev',
    label: 'Revenus & fiscalité',
    icon: '📄',
    color: 'teal',
    documents: [
      '2 derniers avis d\'imposition (IR)',
      '3 dernières déclarations de revenus (formulaires 2042, 2042-C…)',
      'Bulletins de salaire des 3 derniers mois',
      'Relevés de pensions ou retraites',
      'IFI : déclaration 2042-IFI si concerné',
      'Déclaration 2074 (plus-values) si applicable',
    ],
  },
  {
    id: 'immo',
    label: 'Patrimoine immobilier',
    icon: '🏠',
    color: 'amber',
    documents: [
      'Titres de propriété de chaque bien',
      'Taxe foncière (dernière année) pour chaque bien',
      'Estimation de valeur vénale (notaire, agence, ou DVF)',
      'Tableaux d\'amortissement des crédits immobiliers en cours',
      'Contrats de bail (si location)',
      'Relevés de charges de copropriété',
      'Assurance(s) habitation / PNO',
    ],
  },
  {
    id: 'fin',
    label: 'Patrimoine financier',
    icon: '📈',
    color: 'green',
    documents: [
      'Relevés de comptes courants (3 derniers mois)',
      'Relevés de livrets réglementés (Livret A, LDDS, LEP…)',
      'Relevés PEA & compte-titres (dernière date d\'arrêté)',
      'Relevés de contrats d\'assurance-vie (toutes compagnies)',
      'Relevés PEE/PER/PERCO',
      'Relevés de PER individuel',
      'Relevés de compte d\'épargne salariale',
    ],
  },
  {
    id: 'prev',
    label: 'Prévoyance & assurances',
    icon: '🛡️',
    color: 'coral',
    documents: [
      'Contrat de prévoyance individuelle (décès, invalidité, arrêt de travail)',
      'Relevé de droits retraite (EIG ou compte carrière)',
      'Contrat de mutuelle / complémentaire santé',
      'Contrat de prévoyance collective (si salarié)',
    ],
  },
  {
    id: 'ent',
    label: 'Patrimoine professionnel',
    icon: '🏢',
    color: 'purple',
    documents: [
      'Statuts de la société (à jour)',
      'Kbis de moins de 3 mois',
      '3 derniers bilans comptables complets (liasse fiscale)',
      'Dernière liasse fiscale (2065, 2033 ou 2031…)',
      'Pacte d\'associés (le cas échéant)',
      'Valorisation de la société (méthode retenue)',
      'Table de capitalisation / tableau des associés',
      'Contrat de dirigeant : statut TNS ou assimilé salarié',
      'Contrat Madelin (retraite/prévoyance TNS)',
      'BSA, BSPCE, AGA (tableau récapitulatif)',
      'Convention de compte courant d\'associé',
      'Déclaration de revenus professionnels 2035 ou 2031',
    ],
  },
  {
    id: 'suc',
    label: 'Transmission & succession',
    icon: '⚖️',
    color: 'pink',
    documents: [
      'Testament (si existant)',
      'Mandat de protection future (si existant)',
      'Donations antérieures (actes notariés)',
      'Clause bénéficiaire de chaque contrat d\'assurance-vie',
      'Acte de donation-partage (si applicable)',
      'SCI familiale : statuts et rôle de chaque associé',
    ],
  },
  {
    id: 'dette',
    label: 'Passif & engagements',
    icon: '📋',
    color: 'gray',
    documents: [
      'Tableau d\'amortissement de chaque emprunt en cours (immo, conso, pro)',
      'Garanties données (cautions, hypothèques, nantissements)',
      'Crédit-bail ou leasing en cours',
      'Comptes courants d\'associés (solde et conditions)',
    ],
  },
];

export function MeetingProposalModal({
  isOpen,
  task,
  clientId,
  onClose,
  onSuccess,
}: MeetingProposalModalProps) {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Données du RDV
  const [rdvDate, setRdvDate] = useState('');
  const [rdvTime, setRdvTime] = useState('');
  const [rdvLocation, setRdvLocation] = useState('cabinet');
  const [rdvLocationOther, setRdvLocationOther] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [sendToSpouse, setSendToSpouse] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Charger les données du client
  useEffect(() => {
    if (isOpen && clientId) {
      loadClientData();
    }
  }, [isOpen, clientId]);

  // Générer automatiquement le contenu de l'email quand les données changent
  useEffect(() => {
    if (clientData && rdvDate && rdvTime) {
      const locationDisplay = (() => {
        switch (rdvLocation) {
          case 'cabinet':
            return 'Au cabinet';
          case 'client':
            return 'Chez le client';
          case 'visio':
            return 'En visio';
          case 'autre':
            return rdvLocationOther || 'À définir';
          default:
            return '';
        }
      })();

      const generatedContent = generateEmailContent({
        clientName: clientData.firstName || clientData.name || 'Monsieur/Madame',
        date: rdvDate,
        time: rdvTime,
        location: locationDisplay,
        documentsRequested: selectedDocuments,
        spouseName: sendToSpouse && familyInfo?.spouse?.firstName ? familyInfo.spouse.firstName : undefined,
        clientAddress: clientData.address,
      });
      setEmailContent(generatedContent);
    }
  }, [rdvDate, rdvTime, rdvLocation, rdvLocationOther, selectedDocuments, sendToSpouse, clientData, familyInfo]);

  const loadClientData = async () => {
    try {
      setIsLoading(true);
      const data = await clientAPI.getById(clientId);
      setClientData(data);

      if (data.familyInfo) {
        setFamilyInfo(data.familyInfo);
        setSendToSpouse(!!(data.familyInfo.spouse?.email));
      }
    } catch (error) {
      console.error('Erreur chargement données client:', error);
      toast.error('Erreur lors du chargement des données du client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleToggleDocument = (docName: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docName)
        ? prev.filter((d) => d !== docName)
        : [...prev, docName]
    );
  };

  const getLocationDisplay = () => {
    switch (rdvLocation) {
      case 'cabinet':
        return 'Au cabinet';
      case 'client':
        return 'Chez le client';
      case 'visio':
        return 'En visio';
      case 'autre':
        return rdvLocationOther || 'À définir';
      default:
        return '';
    }
  };

  const handleSendProposal = async () => {
    // Validation
    if (!rdvDate || !rdvTime) {
      toast.error('Veuillez sélectionner une date et une heure');
      return;
    }

    if (rdvLocation === 'autre' && !rdvLocationOther.trim()) {
      toast.error('Veuillez préciser le lieu');
      return;
    }

    if (!clientData?.email) {
      toast.error('Email du client manquant');
      return;
    }

    try {
      setIsSending(true);

      // Appeler le backend pour créer la proposition
      const result = await rdvAPI.createProposal({
        clientId,
        date: rdvDate,
        time: rdvTime,
        location: rdvLocation,
        locationOther: rdvLocation === 'autre' ? rdvLocationOther : undefined,
        documentsRequested: selectedDocuments,
        sendToSpouse: sendToSpouse && !!familyInfo?.spouse?.email,
        emailContent: emailContent,
        clientEmail: clientData.email,
        clientName: `${clientData.firstName} ${clientData.lastName}`,
        spouseEmail: sendToSpouse ? familyInfo?.spouse?.email : undefined,
        spouseName: sendToSpouse ? `${familyInfo?.spouse?.firstName} ${familyInfo?.spouse?.lastName}` : undefined,
      });


      // ===== CRÉER L'ÉVÉNEMENT D'AGENDA =====
      if (result.agendaEvent) {
        await agendaAPI.create(result.agendaEvent);
      }

      // ===== METTRE À JOUR LES TÂCHES =====
      try {
        const allTasks = await taskAPI.getAll();
        const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);
        const rdvId = result.rdvId;

        // 1. MARQUER "Contacter le client..." COMME COMPLÉTÉE
        const contactTask = clientTasks.find((t: any) =>
          t.title?.includes('Contacter le client') || t.title?.includes('planifier le premier')
        );
        if (contactTask) {
          await taskAPI.update(contactTask.id, { ...contactTask, completed: true });
        }

        // 2. CRÉER/METTRE À JOUR "Collecter documents et infos..."
        if (selectedDocuments.length > 0) {
          let collectTask = clientTasks.find((t: any) =>
            t.title?.includes('Collecter documents')
          );

          if (!collectTask) {
            // Créer la tâche
            const currentStage = clientData.status || 'R0-R1 - Découverte';
            collectTask = await taskAPI.create(clientId, {
              titre: 'Collecter documents et infos (perso + pro)',
              description: `${selectedDocuments.length} document(s) demandé(s) - 0 reçu(s)`,
              priorite: 'Moyenne',
              date_echeance: rdvDate,
              stage: currentStage,
            });
          }

          // Mettre à jour avec les documents demandés
          const requestedDocuments = selectedDocuments.map((docName, index) => ({
            id: `doc_${Date.now()}_${index}`,
            name: docName,
            status: 'requested' as const,
            requestedDate: new Date().toISOString(),
          }));

          await taskAPI.update(collectTask.id, {
            ...collectTask,
            documentRequests: {
              requestedDocuments,
              totalRequested: requestedDocuments.length,
              totalReceived: 0,
              allReceived: false,
            },
            description: `📋 ${requestedDocuments.length} document(s) demandé(s) - 0 reçu(s)`,
          });
        } else {
          // Pas de documents demandés: valider ou supprimer la tâche
          const collectTask = clientTasks.find((t: any) =>
            t.title?.includes('Collecter documents')
          );
          if (collectTask) {
            // Marquer comme complétée puisqu'il n'y a pas de documents à collecter
            await taskAPI.update(collectTask.id, { ...collectTask, completed: true });
          }
        }

        // 3. METTRE À JOUR "RDV découverte - finalisation..." ET LA LIER AU RDV
        const discoveryTask = clientTasks.find((t: any) =>
          t.title?.includes('RDV découverte')
        );
        if (discoveryTask) {
          const [year, month, day] = rdvDate.split('-');
          const deadlineDate = new Date(`${year}-${month}-${day}T${rdvTime}:00`);

          await taskAPI.update(discoveryTask.id, {
            ...discoveryTask,
            deadline: deadlineDate.toISOString(),
            rdvId,
          });
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de la mise à jour des tâches:', error);
        // Ne pas bloquer le flux si les tâches ne se mettent pas à jour
      }

      // ===== ENREGISTRER L'HISTORIQUE D'EMAIL =====
      if (result.emailInfo && result.rdvId) {
        try {
          // Enregistrer l'email client
          await recordEmailHistory(
            clientId,
            result.rdvId,
            [clientData.email],
            result.emailInfo.subject,
            result.emailInfo.clientEmailHtml
          );

          // Enregistrer l'email du conjoint si applicable
          if (result.emailInfo.spouseEmailHtml && sendToSpouse && familyInfo?.spouse?.email) {
            await recordEmailHistory(
              clientId,
              result.rdvId,
              [familyInfo.spouse.email],
              result.emailInfo.subject,
              result.emailInfo.spouseEmailHtml
            );
          }

        } catch (error) {
          console.warn('⚠️ Erreur lors de l\'enregistrement de l\'historique d\'email:', error);
          // Ne pas bloquer le flux si l'historique ne s'enregistre pas
        }
      }

      toast.success('✅ Proposition de RDV envoyée avec succès!');

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('❌ Erreur envoi proposition:', error);
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la proposition'}`);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Proposer un rendez-vous
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Chargement des données...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Date & Heure */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                📅 Date et heure du RDV
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rdvDate" className="text-sm font-medium">
                    Date du RDV
                  </Label>
                  <input
                    id="rdvDate"
                    type="date"
                    value={rdvDate}
                    onChange={(e) => setRdvDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="rdvTime" className="text-sm font-medium">
                    Heure du RDV
                  </Label>
                  <input
                    id="rdvTime"
                    type="time"
                    value={rdvTime}
                    onChange={(e) => setRdvTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Lieu */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                📍 Lieu du RDV
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value="cabinet"
                    checked={rdvLocation === 'cabinet'}
                    onChange={(e) => setRdvLocation(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Au cabinet (adresse du profil)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value="client"
                    checked={rdvLocation === 'client'}
                    onChange={(e) => setRdvLocation(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Chez le client</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value="visio"
                    checked={rdvLocation === 'visio'}
                    onChange={(e) => setRdvLocation(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">En visio (lien transmis ultérieurement)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value="autre"
                    checked={rdvLocation === 'autre'}
                    onChange={(e) => setRdvLocation(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Autre</span>
                </label>
                {rdvLocation === 'autre' && (
                  <input
                    type="text"
                    value={rdvLocationOther}
                    onChange={(e) => setRdvLocationOther(e.target.value)}
                    placeholder="Saisissez le lieu du RDV"
                    className="w-full ml-7 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {/* Section 3: Documents à demander */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                📋 Documents à demander ({selectedDocuments.length} sélectionnés)
              </h3>
              <div className="space-y-2">
                {DOCUMENT_CATEGORIES.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleToggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium text-gray-900">{category.label}</span>
                        <span className="text-sm text-gray-500">
                          ({category.documents.filter((d) => selectedDocuments.includes(d)).length}/{category.documents.length})
                        </span>
                      </div>
                      {expandedCategories.includes(category.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {expandedCategories.includes(category.id) && (
                      <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">
                        {category.documents.map((doc) => (
                          <label key={doc} className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc)}
                              onChange={() => handleToggleDocument(doc)}
                              className="w-4 h-4 text-blue-600 rounded mt-1 flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700">{doc}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Destinataires */}
            {clientData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">👤 Destinataires</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked disabled className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-gray-900">{clientData.firstName} {clientData.lastName}</p>
                      <p className="text-sm text-gray-600">{clientData.email}</p>
                    </div>
                  </div>

                  {familyInfo?.spouse?.email && (
                    <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
                      <input
                        type="checkbox"
                        checked={sendToSpouse}
                        onChange={(e) => setSendToSpouse(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{familyInfo.spouse.firstName} {familyInfo.spouse.lastName}</p>
                        <p className="text-sm text-gray-600">{familyInfo.spouse.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 5: Email */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                📧 Contenu de l'email
              </h3>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Le contenu est généré automatiquement en fonction de vos sélections. Vous pouvez le modifier si vous le souhaitez."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[250px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                ✨ Le contenu se remplit automatiquement en fonction de la date, l'heure, le lieu et les documents sélectionnés.
                Si aucun document n'est coché, cette section sera automatiquement supprimée de l'email.
                Le lien de dépôt sécurisé sera également automatiquement ajouté.
              </p>
            </div>

            {/* Info box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">✅ Ce qui sera automatisé:</p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>Création du RDV dans votre agenda</li>
                  <li>Lien de dépôt sécurisé dans l'email</li>
                  <li>Mise à jour automatique de la tâche "Collecter documents..."</li>
                  <li>Échéance de "RDV découverte..." définie à la date du RDV</li>
                </ul>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendProposal}
                disabled={isSending || !rdvDate || !rdvTime}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la proposition
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
