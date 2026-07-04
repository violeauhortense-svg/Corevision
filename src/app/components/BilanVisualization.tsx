import { useState } from 'react';
import { Eye, Download, Trash2, Loader2 } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface BilanVisualizationProps {
  bilanSignature: any;
  onDelete?: () => void;
}

export function BilanVisualization({ bilanSignature, onDelete }: BilanVisualizationProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleView = () => {
    setShowPreview(true);
    // Ouvrir dans une nouvelle fenêtre
    window.open(
      `${apiBaseUrl}/make-server-cac859af/bilan-document/${bilanSignature.token}`,
      '_blank'
    );
  };

  const handleDownload = () => {
    // Ouvrir le document pour permettre l'impression/sauvegarde PDF
    window.open(
      `${apiBaseUrl}/make-server-cac859af/bilan-document/${bilanSignature.token}`,
      '_blank'
    );
    toast.success('📄 Document ouvert dans un nouvel onglet');
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bilan patrimonial signé ?')) {
      return;
    }

    try {
      setDeleting(true);
      
      if (onDelete) {
        onDelete();
      }
      
      toast.success('✅ Bilan supprimé');
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleView}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        title="Visualiser"
      >
        <Eye className="w-5 h-5" />
      </button>
      
      <button
        onClick={handleDownload}
        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
        title="Télécharger"
      >
        <Download className="w-5 h-5" />
      </button>
      
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          title="Supprimer"
        >
          {deleting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
}
