import { useState, useEffect } from 'react';
import { Upload, FileText, Check, X, Trash2, Loader2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getRequestedDocuments, 
  uploadRequestedDocument, 
  deleteRequestedDocument,
  RequestedDocument 
} from '../utils/documentRequestHelpers';
import type { Task } from '../types/client';

interface DocumentReceptionTaskProps {
  task: Task;
  clientId: string;
  onToggle: (taskId: string) => Promise<void>;
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export function DocumentReceptionTask({ task, clientId, onToggle, onUpdate }: DocumentReceptionTaskProps) {
  const [documents, setDocuments] = useState<RequestedDocument[]>([]);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [clientId]);

  const loadDocuments = async () => {
    setLoading(true);
    const docs = await getRequestedDocuments(clientId);
    setDocuments(docs);
    setLoading(false);
  };

  const handleFileUpload = async (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10 MB)');
      return;
    }

    setUploadingDocId(documentId);

    try {
      const success = await uploadRequestedDocument(clientId, documentId, file);
      
      if (success) {
        toast.success('✅ Document reçu et enregistré');
        loadDocuments();
        
        // Notifier le parent pour rafraîchir
        if (onUpdate) {
          await onUpdate(task.id, {});
        }
      } else {
        toast.error('Erreur lors de l\'upload du document');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload du document');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande de document ?')) {
      return;
    }

    try {
      const success = await deleteRequestedDocument(clientId, documentId);
      
      if (success) {
        toast.success('Document supprimé');
        loadDocuments();
        
        // Notifier le parent pour rafraîchir
        if (onUpdate) {
          await onUpdate(task.id, {});
        }
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const totalRequested = documents.length;
  const totalReceived = documents.filter(doc => doc.status === 'received').length;
  const progressPercentage = totalRequested > 0 ? (totalReceived / totalRequested) * 100 : 0;

  return (
    <div className={`border-2 rounded-xl p-5 transition-all ${
      task.completed
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
        : 'bg-white border-gray-200 hover:border-indigo-300'
    }`}>
      {/* En-tête de la tâche avec checkbox */}
      <div className="flex items-start gap-4 mb-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 mt-1 cursor-pointer"
        />
        <div className="flex-1">
          <h4 className={`font-semibold text-lg ${
            task.completed ? 'text-green-800 line-through' : 'text-gray-900'
          }`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
        </div>
        {task.completed && (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            Complétée
          </span>
        )}
      </div>

      {/* Contenu des documents */}
      {loading ? (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun document demandé
          </h3>
          <p className="text-sm text-gray-500">
            Les documents demandés apparaîtront ici lorsqu'un email de confirmation de RDV sera envoyé.
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          {/* Barre de progression */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Progression des documents
              </h3>
              <span className="text-sm font-medium text-indigo-600">
                {totalReceived} / {totalRequested} reçus
              </span>
            </div>
            
            {/* Barre de progression */}
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-600 mt-2">
              {progressPercentage === 100 
                ? '✅ Tous les documents ont été reçus !' 
                : `${Math.round(progressPercentage)}% complétés`}
            </p>
          </div>

          {/* Liste des documents */}
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`border-2 rounded-xl p-5 transition-all ${
                  doc.status === 'received'
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icône de statut */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    doc.status === 'received'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {doc.status === 'received' ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>

                  {/* Informations du document */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {doc.name}
                    </h4>
                    
                    {doc.status === 'requested' ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          📅 Demandé le {new Date(doc.requestedDate).toLocaleDateString('fr-FR')}
                        </p>
                        
                        {/* Zone d'upload */}
                        <div className="flex items-center gap-3">
                          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                            uploadingDocId === doc.id
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}>
                            {uploadingDocId === doc.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Upload...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">Importer</span>
                              </>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => handleFileUpload(doc.id, e)}
                              disabled={uploadingDocId === doc.id}
                            />
                          </label>
                          
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Supprimer cette demande"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <Check className="w-4 h-4" />
                          <span className="font-medium">
                            Reçu le {new Date(doc.receivedDate!).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        {doc.fileName && (
                          <p className="text-xs text-gray-600">
                            📎 Fichier : {doc.fileName}
                          </p>
                        )}
                        
                        {/* Actions sur le document reçu */}
                        <div className="flex items-center gap-2 mt-3">
                          {doc.fileUrl && (
                            <>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Voir
                              </a>
                              <a
                                href={doc.fileUrl}
                                download
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Télécharger
                              </a>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Note d'information */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              💡 <strong>Astuce :</strong> Les documents importés ici sont automatiquement ajoutés à la section "Documents" du client pour un accès facile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
