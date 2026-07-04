import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Document } from './types';

interface DocumentsTabProps {
  documents: Document[];
  onUpdateDocuments: (docs: Document[]) => void;
}

export function DocumentsTab({
  documents,
  onUpdateDocuments,
}: DocumentsTabProps) {
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  // ============================================================================
  // FONCTIONS DE GESTION DES DOCUMENTS
  // ============================================================================

  // Upload d'un document client
  const handleUploadDocument = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    const newDocument: Document = {
      id: `doc_${Date.now()}`,
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      uploadDate: new Date().toISOString(),
      category: 'general',
    };

    onUpdateDocuments([...documents, newDocument]);
    toast.success('Document ajouté avec succès');

    // Reset input
    event.target.value = '';
  };

  // Suppression d'un document
  const handleDeleteDocument = (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    const updatedDocuments = documents.filter((d) => d.id !== docId);
    onUpdateDocuments(updatedDocuments);
    toast.success('Document supprimé');
  };

  // Téléchargement d'un document
  const handleDownloadDocument = (doc: Document) => {
    toast.info(`Téléchargement de ${doc.name}...`);
    // Dans une vraie application, cela déclencherait un téléchargement réel
  };

  // Visualisation d'un document
  const handleViewDocument = (doc: Document) => {
    setViewingDocument(doc);
  };

  // Filtrer uniquement les documents généraux
  const clientDocuments = documents.filter((d) => d.category === 'general');

  return (
    <>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-semibold text-gray-900">Documents</h3>
          </div>
        </div>

        {/* Contenu des documents */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Bouton d'upload */}
          <div className="mb-6">
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5" />
              Ajouter un document
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleUploadDocument}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-gray-500 mt-2">
              Formats acceptés : PDF, Word, Excel, Images (max 10MB)
            </p>
          </div>

          {/* Liste des documents */}
          {clientDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-gray-500 text-lg">Aucun document client</p>
              <p className="text-gray-400 text-sm mt-2">
                Ajoutez des documents pour ce client (factures, justificatifs, etc.)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.size} • Ajouté le{' '}
                        {doc.uploadDate
                          ? new Date(doc.uploadDate).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Voir"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de visualisation de document */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête de la modal */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h3 className="text-xl font-bold">{viewingDocument.name}</h3>
                  <p className="text-sm text-blue-100">
                    {viewingDocument.size} • Ajouté le{' '}
                    {viewingDocument.uploadDate
                      ? new Date(viewingDocument.uploadDate).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu de la modal */}
            <div className="p-6 overflow-y-auto flex-1">
              {viewingDocument.content ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {viewingDocument.content}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    Aperçu non disponible pour ce type de document
                  </p>
                  <button
                    onClick={() => handleDownloadDocument(viewingDocument)}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Télécharger le document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
