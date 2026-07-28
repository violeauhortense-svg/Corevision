import { Download, File, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { MailAttachment } from '../../types/mail';

interface AttachmentsDisplayProps {
  attachments: MailAttachment[];
  onDownload?: (attachment: MailAttachment, index: number) => Promise<void>;
  loading?: boolean;
}

export function AttachmentsDisplay({
  attachments,
  onDownload,
  loading = false,
}: AttachmentsDisplayProps) {
  if (attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜️';
    return '📎';
  };

  const handleDownload = async (attachment: MailAttachment, index: number) => {
    if (!onDownload) {
      toast.info('Téléchargement non disponible');
      return;
    }

    try {
      await onDownload(attachment, index);
      toast.success(`${attachment.name} téléchargé`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Impossible de télécharger le fichier');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          📎 Pièces jointes ({attachments.length})
        </h3>
      </div>

      <div className="space-y-2">
        {attachments.map((attachment, index) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xl flex-shrink-0">{getFileIcon(attachment.mimeType)}</span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate" title={attachment.name}>
                  {attachment.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(attachment.size)}</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(attachment, index)}
              disabled={loading}
              className="flex-shrink-0 ml-2"
              title={`Télécharger ${attachment.name}`}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900">
          Les fichiers sont stockés de manière sécurisée. Limite: 20 MB par mail.
        </p>
      </div>
    </div>
  );
}
