import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Mail, Send, AlertCircle, Loader2, ChevronDown, ChevronUp, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { clientAPI, taskAPI, rdvAPI } from '../services/api';
import { ACCOUNTANT_DOCUMENT_CATEGORIES, generateAccountantRequestEmailContent } from '../utils/accountantDocumentHelpers';
import { recordEmailHistory } from '../utils/meetingHelpers';
import type { Task, ClientData } from './client-detail/types';

interface AccountantRequestModalProps {
  isOpen: boolean;
  task: Task | null;
  clientId: string;
  clientStatus?: string;
  onClose: () => void;
  onSuccess?: () => void;
  entreprises?: any[];
  contacts?: any[];
}

export function AccountantRequestModal({
  isOpen,
  task,
  clientId,
  clientStatus = 'R0-R1 - Découverte',
  onClose,
  onSuccess,
  entreprises = [],
  contacts = [],
}: AccountantRequestModalProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedAccountant, setSelectedAccountant] = useState<any | null>(null);
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Auto-générer l'email quand sélections changent
  useEffect(() => {
    if (selectedCompany && selectedDocuments.length > 0) {
      const generatedContent = generateAccountantRequestEmailContent({
        clientName: 'Monsieur/Madame',
        companyName: selectedCompany.name || selectedCompany.raison_sociale || 'l\'entreprise',
        documentsRequested: selectedDocuments,
      });
      setEmailContent(generatedContent);
    }
  }, [selectedCompany, selectedDocuments]);

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

  const handleSendRequest = async () => {
    // Validation
    if (!selectedCompany) {
      toast.error('Veuillez sélectionner une entreprise');
      return;
    }

    if (!selectedAccountant) {
      toast.error('Veuillez sélectionner un comptable');
      return;
    }

    if (selectedDocuments.length === 0) {
      toast.error('Veuillez sélectionner au moins un document');
      return;
    }

    if (!selectedAccountant.email) {
      toast.error('Le comptable sélectionné n\'a pas d\'email');
      return;
    }

    try {
      setIsSending(true);

      // Créer la demande comptable et obtenir le lien de dépôt sécurisé
      // Le backend envoie aussi l'email avec le lien inclus
      const result = await rdvAPI.createAccountantRequest({
        clientId,
        accountantEmail: selectedAccountant.email,
        accountantName: selectedAccountant.firstName || selectedAccountant.lastName || selectedAccountant.email,
        companyName: selectedCompany.name || selectedCompany.raison_sociale || 'l\'entreprise',
        documentsRequested: selectedDocuments,
        emailContent: emailContent,
      });

      console.log('✅ Demande comptable créée et email envoyé:', result);

      // ===== METTRE À JOUR LES TÂCHES =====
      try {
        const allTasks = await taskAPI.getAll();
        const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);

        // Mettre à jour "Collecter documents et infos..."
        let collectTask = clientTasks.find((t: any) =>
          t.title?.includes('Collecter documents')
        );

        if (!collectTask) {
          // Créer la tâche si elle n'existe pas
          const currentStage = clientStatus;
          collectTask = await taskAPI.create(clientId, {
            titre: 'Collecter documents et infos (perso + pro)',
            description: `${selectedDocuments.length} document(s) demandé(s) au comptable - 0 reçu(s)`,
            priorite: 'Moyenne',
            date_echeance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            stage: currentStage,
          });
        }

        // Ajouter les documents demandés
        const requestedDocuments = selectedDocuments.map((docName, index) => ({
          id: `doc_${Date.now()}_${index}`,
          name: docName,
          status: 'requested' as const,
          requestedDate: new Date().toISOString(),
        }));

        // Fusionner avec les documents existants
        const existingDocs = collectTask.documentRequests?.requestedDocuments || [];
        const mergedDocs = [...existingDocs, ...requestedDocuments];

        await taskAPI.update(collectTask.id, {
          ...collectTask,
          documentRequests: {
            requestedDocuments: mergedDocs,
            totalRequested: mergedDocs.length,
            totalReceived: 0,
            allReceived: false,
          },
          description: `📋 ${mergedDocs.length} document(s) demandé(s) - 0 reçu(s)`,
        });

        console.log('✅ Tâche "Collecter documents..." mise à jour');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la mise à jour des tâches:', error);
      }

      // ===== ENREGISTRER L'HISTORIQUE D'EMAIL =====
      try {
        await recordEmailHistory(
          clientId,
          result.requestId || `comptable_${Date.now()}`,
          [selectedAccountant.email],
          `Demande documents comptables - ${selectedCompany.name || selectedCompany.raison_sociale}`,
          emailContent
        );
        console.log('✅ Historique d\'email enregistré');
      } catch (error) {
        console.warn('⚠️ Erreur lors de l\'enregistrement de l\'historique:', error);
      }

      toast.success('✅ Demande comptable envoyée avec succès!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('❌ Erreur envoi demande:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[98vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            Demande de documents comptables
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
            {/* Sélection de l'entreprise */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                🏢 Entreprise concernée
              </h3>
              {entreprises.length === 0 ? (
                <div className="text-sm text-gray-600 p-3 bg-white rounded border border-gray-300">
                  Aucune entreprise disponible dans le patrimoine professionnel.
                </div>
              ) : (
                <select
                  value={selectedCompany?.id || ''}
                  onChange={(e) => {
                    const company = entreprises.find(
                      (p: any) => p.id === e.target.value
                    );
                    setSelectedCompany(company || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionnez une entreprise...</option>
                  {entreprises.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.name || company.raison_sociale || 'Entreprise sans nom'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sélection du comptable */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                👤 Comptable
              </h3>
              {contacts.length === 0 ? (
                <div className="text-sm text-gray-600 p-3 bg-white rounded border border-gray-300">
                  Aucun contact disponible dans l'onglet Contacts.
                </div>
              ) : (
                <select
                  value={selectedAccountant?.id || ''}
                  onChange={(e) => {
                    const accountant = contacts.find(
                      (c: any) => c.id === e.target.value
                    );
                    setSelectedAccountant(accountant || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un comptable...</option>
                  {contacts.map((contact: any) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName} ({contact.email})
                    </option>
                  ))}
                </select>
              )}
              {selectedAccountant?.email && (
                <p className="text-sm text-gray-600 mt-2">📧 {selectedAccountant.email}</p>
              )}
            </div>

            {/* Documents comptables */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">📋 Documents à demander</h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedDocuments.length} document(s) sélectionné(s)
              </p>

              <div className="space-y-3">
                {ACCOUNTANT_DOCUMENT_CATEGORIES.map((category) => (
                  <div key={category.id} className="border rounded-lg overflow-hidden">
                    {/* Entête catégorie */}
                    <button
                      onClick={() => handleToggleCategory(category.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium text-gray-900 flex-1 text-left">
                        {category.label}
                      </span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {category.documents.filter((d) => selectedDocuments.includes(d)).length} /
                        {category.documents.length}
                      </span>
                      {expandedCategories.includes(category.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    {/* Documents */}
                    {expandedCategories.includes(category.id) && (
                      <div className="space-y-2 px-4 py-3 bg-white border-t">
                        {category.documents.map((doc) => (
                          <label
                            key={doc}
                            className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc)}
                              onChange={() => handleToggleDocument(doc)}
                              className="w-4 h-4 text-indigo-600 rounded mt-1 flex-shrink-0"
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

            {/* Email */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                📧 Contenu de l'email
              </h3>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Le contenu est généré automatiquement en fonction de l'entreprise et des documents sélectionnés."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[250px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                ✨ Le contenu se remplit automatiquement en fonction de l'entreprise et des documents sélectionnés.
              </p>
            </div>

            {/* Info box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">✅ Ce qui sera automatisé:</p>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>Mise à jour de la tâche "Collecter documents..."</li>
                  <li>Historique d'email enregistré</li>
                  <li>Délai de 15 jours suggéré</li>
                </ul>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isSending}>
                Annuler
              </Button>
              <Button
                onClick={handleSendRequest}
                disabled={isSending || !selectedCompany || !selectedAccountant || selectedDocuments.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la demande
                  </>
                )}
              </Button>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
