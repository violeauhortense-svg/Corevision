import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  X,
  Send,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientAssociation } from './ClientAssociation';
import { NotesSystem } from './NotesSystem';
import { AttachmentsDisplay } from './AttachmentsDisplay';
import { ReplyModal } from './ReplyModal';
import type { HubMail, MailNote, MailTraitementStatus } from '../../types/mail';

interface MailDetailPanelProps {
  mail: HubMail;
  onClose: () => void;
  onUpdate: (mail: HubMail) => Promise<void>;
}

export function MailDetailPanel({ mail, onClose, onUpdate }: MailDetailPanelProps) {
  const [showSignature, setShowSignature] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<MailTraitementStatus>(mail.traitementStatus);
  const [loading, setLoading] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);

  const handleStatusChange = async (newStatus: MailTraitementStatus) => {
    setSelectedStatus(newStatus);
    const updated: HubMail = {
      ...mail,
      traitementStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };
    setLoading(true);
    try {
      await onUpdate(updated);
      toast.success(`État changé à "${getStatusLabel(newStatus)}"`);
    } catch (error) {
      toast.error('Impossible de changer l\'état');
      setSelectedStatus(mail.traitementStatus); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (content: string) => {
    const newNoteObj: MailNote = {
      id: `note-${Date.now()}`,
      content,
      createdBy: 'user@prudentia.fr', // TODO: Get from session
      createdByName: 'Vous',
      createdAt: new Date().toISOString(),
    };

    const updated: HubMail = {
      ...mail,
      notes: [...mail.notes, newNoteObj],
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await onUpdate(updated);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const updated: HubMail = {
      ...mail,
      notes: mail.notes.filter((n) => n.id !== noteId),
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await onUpdate(updated);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateClient = async (clientId: string, clientName: string, clientEmail?: string) => {
    const updated: HubMail = {
      ...mail,
      clientId: clientId || undefined,
      clientName: clientName || undefined,
      clientEmail: clientEmail || undefined,
      hubTab: clientId ? 'conversation_client' : 'interne_externe',
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await onUpdate(updated);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reply: { to: string[]; subject: string; body: string; cc?: string[] }) => {
    // TODO: Implement actual Outlook integration
    const updated: HubMail = {
      ...mail,
      traitementStatus: 'en_cours',
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await onUpdate(updated);
      toast.success('Réponse envoyée via Outlook');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: MailTraitementStatus) => {
    const labels: Record<MailTraitementStatus, string> = {
      a_traiter: '📥 À traiter',
      en_cours: '🔵 En cours',
      a_valider_gl: '🟡 À valider GL',
      valide_gl: '🟢 Validé GL',
      termine: '✅ Terminé',
    };
    return labels[status];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto z-40">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Détails du Mail</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Affichage du mail */}
          <Card className="p-6 bg-gray-50">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Sujet</h3>
                <p className="text-lg font-bold text-gray-900">{mail.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">De</p>
                  <p className="font-medium text-gray-900">{mail.fromName || mail.from}</p>
                  <p className="text-xs text-gray-500">{mail.from}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Vers</p>
                  <p className="font-medium text-gray-900">{mail.to.join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{formatDate(mail.sentAt)}</span>
                <Badge
                  className={
                    mail.direction === 'received'
                      ? 'bg-green-100 text-green-800 ml-auto'
                      : 'bg-blue-100 text-blue-800 ml-auto'
                  }
                >
                  {mail.direction === 'received' ? '📥 Reçu' : '📤 Envoyé'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Pièces jointes */}
          <AttachmentsDisplay attachments={mail.attachments} loading={loading} />

          {/* Contenu du mail */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Message</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {mail.body}
            </div>
          </div>

          {/* Signature (Collapsible) */}
          <div>
            <button
              onClick={() => setShowSignature(!showSignature)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showSignature ? 'rotate-180' : ''}`} />
              👤 Signature
            </button>
            {showSignature && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {mail.fromName}
                {'\n'}
                {mail.from}
              </div>
            )}
          </div>

          {/* Client associé */}
          <ClientAssociation
            clientId={mail.clientId}
            clientName={mail.clientName}
            clientEmail={mail.clientEmail}
            onAssociate={handleAssociateClient}
            loading={loading}
          />

          {/* Notes */}
          <NotesSystem notes={mail.notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} loading={loading} />

          {/* État du traitement */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">⚡ État du Traitement</h3>
            <div className="space-y-2">
              {(['a_traiter', 'en_cours', 'a_valider_gl', 'valide_gl', 'termine'] as MailTraitementStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    disabled={loading}
                    className={`w-full justify-start ${selectedStatus === status ? 'bg-blue-600' : ''}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        status === 'a_traiter'
                          ? 'bg-gray-400'
                          : status === 'en_cours'
                            ? 'bg-blue-500'
                            : status === 'a_valider_gl'
                              ? 'bg-yellow-500'
                              : status === 'valide_gl'
                                ? 'bg-green-500'
                                : 'bg-gray-400'
                      }`}
                    ></span>
                    {getStatusLabel(status)}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 border-t pt-6">
            <Button
              onClick={() => setReplyModalOpen(true)}
              disabled={loading || mail.direction === 'sent'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              ✉️ Répondre
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full" disabled={loading}>
              Fermer
            </Button>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      <ReplyModal
        open={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        originalMail={mail}
        onSend={handleReply}
      />
    </>
  );
}
