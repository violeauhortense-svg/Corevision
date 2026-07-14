import { useState, useEffect } from 'react';
import { 
  Upload, FileText, Settings, Trash2, RefreshCw, Download, 
  CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, X,
  Lightbulb, Scale, Package, Shield, BookOpen, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { SourcesCollecteTab } from './SourcesCollecteTab';

// Types
interface KnowledgeDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  status: 'pending' | 'processing' | 'completed' | 'error';
  chunksCount: number;
  indexedAt: string;
  fileSize: number;
  priority: boolean;
  errorMessage?: string;
}

type DocumentCategory = 'Fiscal' | 'Civil' | 'Produit' | 'Conformité' | 'Pédagogique';

interface IngestionParams {
  chunkSize: number;
  overlap: number;
  autoClean: boolean;
  priority: boolean;
}

const CATEGORIES: { value: DocumentCategory; label: string; icon: any; color: string }[] = [
  { value: 'Fiscal', label: 'Fiscal', icon: Scale, color: 'blue' },
  { value: 'Civil', label: 'Civil', icon: Shield, color: 'purple' },
  { value: 'Produit', label: 'Produit', icon: Package, color: 'green' },
  { value: 'Conformité', label: 'Conformité', icon: AlertCircle, color: 'orange' },
  { value: 'Pédagogique', label: 'Pédagogique', icon: BookOpen, color: 'indigo' },
];

interface AdminKnowledgeBaseProps {
  session?: any;
}

export function AdminKnowledgeBase({ session }: AdminKnowledgeBaseProps) {
  const [activeSection, setActiveSection] = useState<'documents' | 'sources'>('documents');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localStorageInfo, setLocalStorageInfo] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Fiscal');
  const [params, setParams] = useState<IngestionParams>({
    chunkSize: 300,  // 300 tokens ˜ 225 mots (meilleur pour le chunking)
    overlap: 50,     // 50 tokens ˜ 38 mots (overlap raisonnable)
    autoClean: true,
    priority: false,
  });

  // Charger les documents depuis le backend
  useEffect(() => {
    loadDocuments();
    scanLocalStorage();
  }, []);

  const loadDocuments = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/api/info');
      
      // NE PAS utiliser l'access token - utiliser uniquement le publicAnonKey
      const authToken = publicAnonKey;
      
      const response = await fetch(
        `${apiBaseUrl}/knowledge-base/documents`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      
    } catch (error) {
      toast.error('Erreur lors du chargement des documents');
    }
  };

  const scanLocalStorage = () => {
    const info = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      info.push({ key, value });
    }
    setLocalStorageInfo(info);
  };

  // Gestion du drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(f => f.type === 'application/pdf');
    
    if (pdfFile) {
      setSelectedFile(pdfFile);
      setDocumentName(pdfFile.name.replace('.pdf', ''));
    } else {
      toast.error('Seuls les fichiers PDF sont acceptés');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setDocumentName(file.name.replace('.pdf', ''));
    } else {
      toast.error('Seuls les fichiers PDF sont acceptés');
    }
  };

  // Indexer le document
  const handleIndexDocument = async () => {
    if (!selectedFile || !documentName || !category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsUploading(true);

    try {
      const { projectId, publicAnonKey } = await import('../utils/api/info');
      const authToken = publicAnonKey;

      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', documentName);
      formData.append('category', category);
      formData.append('chunkSize', params.chunkSize.toString());
      formData.append('overlap', params.overlap.toString());
      formData.append('autoClean', params.autoClean.toString());
      formData.append('priority', params.priority.toString());

      // Appeler l'API d'ingestion
      const response = await fetch(
        `${apiBaseUrl}/knowledge-base/ingest`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || 'Failed to upload PDF');
      }

      const result = await response.json();
      console.log('? Document indexé:', result);

      // Ajouter au journal
      addLog(
        documentName,
        'completed',
        `? Indexé avec succès (${result.chunksCount} chunks)`
      );

      // Recharger la liste des documents
      await loadDocuments();

      // Réinitialiser le formulaire
      setSelectedFile(null);
      setDocumentName('');
    } catch (error) {
      console.error('? Erreur indexation:', error);
      addLog(
        documentName,
        'error',
        `? Erreur: ${error instanceof Error ? error.message : 'Upload failed'}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Supprimer un document
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document de l\'index ?')) {
      return;
    }

    try {
      // TODO: Appeler l'API pour supprimer
      // await fetch(`/api/knowledge-base/documents/${docId}`, { method: 'DELETE' });
      
      setDocuments(documents.filter(doc => doc.id !== docId));
      toast.success('Document supprimé de l\'index');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Réindexer un document
  const handleReindexDocument = async (docId: string) => {
    try {
      // TODO: Appeler l'API pour réindexer
      setDocuments(documents.map(doc => 
        doc.id === docId ? { ...doc, status: 'processing', chunksCount: 0 } : doc
      ));
      
      toast.success('Réindexation lancée');

      // Simuler la complétion
      setTimeout(() => {
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { ...doc, status: 'completed', chunksCount: Math.floor(Math.random() * 200) + 50 }
            : doc
        ));
        toast.success('Réindexation terminée !');
      }, 5000);
    } catch (error) {
      console.error('Erreur réindexation:', error);
      toast.error('Erreur lors de la réindexation');
    }
  };

  // Télécharger le log d'indexation
  const handleDownloadLog = () => {
    const logContent = documents.map(doc => ({
      nom: doc.name,
      categorie: doc.category,
      statut: doc.status,
      chunks: doc.chunksCount,
      date: doc.indexedAt,
      priorite: doc.priority,
    }));

    const blob = new Blob([JSON.stringify(logContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-base-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Log téléchargé');
  };

  const getStatusConfig = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Terminé' };
      case 'processing':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'En cours' };
      case 'error':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Erreur' };
      case 'pending':
        return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'En attente' };
    }
  };

  const getCategoryConfig = (cat: DocumentCategory) => {
    return CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];
  };

  const addLog = (name: string, status: KnowledgeDocument['status'], message: string) => {
    const logEntry = {
      name,
      status,
      message,
      timestamp: new Date().toISOString(),
    };
    console.log('Ajout au journal:', logEntry);
    // Vous pouvez ici ajouter le logEntry à une base de données ou un fichier de log
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Base de Connaissances IA</h1>
            <p className="text-indigo-100">
              Gestion des règles fiscales et indexation des documents pour l'assistant IA
            </p>
          </div>
          <Lightbulb className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('documents')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeSection === 'documents'
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Documents IA
          </button>
          <button
            onClick={() => setActiveSection('sources')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeSection === 'sources'
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Database className="w-5 h-5" />
            Sources de Collecte
          </button>
        </div>

        <div className="p-6">
          {/* Section Documents IA */}
          {activeSection === 'documents' && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-indigo-600" />
                  Uploader un nouveau document
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Zone de drop */}
                  <div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                      }`}
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      {selectedFile ? (
                        <div className="space-y-3">
                          <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
                          <div>
                            <p className="font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setDocumentName('');
                            }}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 mx-auto"
                          >
                            <X className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <p className="font-medium text-gray-700">
                              Glissez un PDF ici ou cliquez pour sélectionner
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Taille maximale : 10 MB
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        id="file-input"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Formulaire */}
                  <div className="space-y-4">
                    {/* Nom du document */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du document *
                      </label>
                      <input
                        type="text"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Ex: Guide fiscal 2026"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie *
                      </label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Paramètres avancés */}
                    <div>
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        Paramètres avancés
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                      </button>

                      {showAdvanced && (
                        <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                          {/* Info chunking */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs text-blue-800 leading-relaxed">
                              ?? <strong>Chunking optimisé :</strong> Les documents sont découpés en morceaux de ~{Math.floor(params.chunkSize * 0.75)} mots (˜{params.chunkSize} tokens) avec un chevauchement de ~{Math.floor(params.overlap * 0.75)} mots pour une meilleure recherche sémantique.
                            </p>
                          </div>

                          {/* Taille chunks */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Taille des chunks (tokens)
                            </label>
                            <input
                              type="number"
                              value={params.chunkSize}
                              onChange={(e) => setParams({ ...params, chunkSize: parseInt(e.target.value) })}
                              min="200"
                              max="2000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Recommandé : 200-400 tokens pour une bonne granularité
                            </p>
                          </div>

                          {/* Overlap */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Overlap (tokens)
                            </label>
                            <input
                              type="number"
                              value={params.overlap}
                              onChange={(e) => setParams({ ...params, overlap: parseInt(e.target.value) })}
                              min="0"
                              max="500"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={params.autoClean}
                                onChange={(e) => setParams({ ...params, autoClean: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <span className="text-sm text-gray-700">Nettoyage automatique du texte</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={params.priority}
                                onChange={(e) => setParams({ ...params, priority: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <span className="text-sm text-gray-700">Priorité haute (traitement urgent)</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bouton indexer */}
                    <button
                      onClick={handleIndexDocument}
                      disabled={!selectedFile || !documentName || isUploading}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Clock className="w-5 h-5 animate-spin" />
                          Indexation en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Indexer le document
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Journal d'indexation */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    Journal d'indexation ({documents.length})
                  </h2>
                  <button
                    onClick={handleDownloadLog}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le log
                  </button>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun document indexé pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Document
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Catégorie
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Statut
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Chunks
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => {
                          const statusConfig = getStatusConfig(doc.status);
                          const catConfig = getCategoryConfig(doc.category);
                          const StatusIcon = statusConfig.icon;
                          const CategoryIcon = catConfig.icon;

                          return (
                            <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                      {doc.priority && (
                                        <span className="ml-2 text-orange-600">? Priorité haute</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${catConfig.color}-50 text-${catConfig.color}-700`}>
                                  <CategoryIcon className="w-3 h-3" />
                                  {doc.category}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-900 font-medium">
                                  {doc.status === 'processing' ? (
                                    <span className="text-blue-600 animate-pulse">...</span>
                                  ) : (
                                    doc.chunksCount
                                  )}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm text-gray-600">
                                  {new Date(doc.indexedAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleReindexDocument(doc.id)}
                                    disabled={doc.status === 'processing'}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Réindexer"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    disabled={doc.status === 'processing'}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Documents indexés</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {documents.filter(d => d.status === 'completed').length}
                  </p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">En traitement</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {documents.filter(d => d.status === 'processing').length}
                  </p>
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-gray-600">Chunks totaux</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">
                    {documents.reduce((acc, doc) => acc + doc.chunksCount, 0)}
                  </p>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-gray-600">Erreurs</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    {documents.filter(d => d.status === 'error').length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section Sources de Collecte */}
          {activeSection === 'sources' && (
            <SourcesCollecteTab />
          )}
        </div>
      </div>
    </div>
  );
}
