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
import { hubCommunicationAPI } from '../../services/hubCommunicationAPI';
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
    setLoading(true);
    try {
      const updated = await hubCommunicationAPI.updateMailStatus(mail.id, newStatus);
      await onUpdate(updated);
      toast.success(`État changé à "${getStatusLabel(newStatus)}"`);
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error('Impossible de changer l\'état');
      setSelectedStatus(mail.traitementStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (content: string) => {
    setLoading(true);
    try {
      const note = await hubCommunicationAPI.addMailNote(
        mail.id,
        content,
        'user@prudentia.fr',
        'Vous'
      );
      const updated = await hubCommunicationAPI.getMailById(mail.id);
      await onUpdate(updated);
      toast.success('Note ajoutée');
    } catch (error) {
      console.error('Erreur ajout note:', error);
      toast.error('Impossible d\'ajouter la note');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setLoading(true);
    try {
      await hubCommunicationAPI.deleteMailNote(mail.id, noteId);
      const updated = await hubCommunicationAPI.getMailById(mail.id);
      await onUpdate(updated);
      toast.success('Note supprimée');
    } catch (error) {
      console.error('Erreur suppression note:', error);
      toast.error('Impossible de supprimer la note');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateClient = async (clientId: string, clientName: string, clientEmail?: string) => {
    setLoading(true);
    try {
      const updated = await hubCommunicationAPI.associateClient(
        mail.id,
        clientId,
        clientName,
        clientEmail
      );
      await onUpdate(updated);
      toast.success('Client associé');
    } catch (error) {
      console.error('Erreur association client:', error);
      toast.error('Impossible d\'associer le client');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reply: { to: string[]; subject: string; body: string; cc?: string[] }) => {
    setLoading(true);
    try {
      const updated = await hubCommunicationAPI.sendMailReply(
        mail.id,
        reply.to,
        reply.subject,
        reply.body,
        reply.cc
      );
      await onUpdate(updated);
      toast.success('Réponse envoyée');
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      toast.error('Impossible d\'envoyer la réponse');
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
          {/* Affichage du mail - mise en page façon client mail : sujet en
              titre, puis expéditeur/destinataires en lignes étiquetées
              plutôt qu'en colonnes serrées, pour rester lisible même avec
              plusieurs destinataires. */}
          <Card className="p-5 bg-white border border-gray-200">
            <div className="pb-3 mb-3 border-b border-gray-100 flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">{mail.subject || '(Sans sujet)'}</h3>
              <Badge
                className={`shrink-0 ${
                  mail.direction === 'received'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {mail.direction === 'received' ? '📥 Reçu' : '📤 Envoyé'}
              </Badge>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="w-14 shrink-0 text-xs font-semibold text-gray-500">De</span>
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 text-sm">{mail.fromName || mail.from}</span>
                  {mail.fromName && mail.from && (
                    <span className="text-xs text-gray-500 ml-2">{mail.from}</span>
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="w-14 shrink-0 text-xs font-semibold text-gray-500">À</span>
                <div className="min-w-0 flex flex-wrap gap-1.5">
                  {mail.to.length > 0 ? (
                    mail.to.map((recipient, i) => (
                      <span key={i} className="text-sm text-gray-800 bg-gray-100 rounded px-2 py-0.5">
                        {recipient}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">Destinataire non renseigné</span>
                  )}
                </div>
              </div>

              {mail.cc && mail.cc.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="w-14 shrink-0 text-xs font-semibold text-gray-500">Cc</span>
                  <div className="min-w-0 flex flex-wrap gap-1.5">
                    {mail.cc.map((recipient, i) => (
                      <span key={i} className="text-sm text-gray-800 bg-gray-100 rounded px-2 py-0.5">
                        {recipient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-3 pt-1">
                <span className="w-14 shrink-0 text-xs font-semibold text-gray-500">Date</span>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(mail.sentAt)}
                </div>
              </div>
            </div>
          </Card>

          {/* Pièces jointes */}
          <AttachmentsDisplay attachments={mail.attachments} loading={loading} />

          {/* Contenu du mail - pas de scroll interne : le panel entier
              défile déjà, une boîte à hauteur fixe en plus n'ajoutait
              qu'un cadre exigu pour rien. */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Message</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
              {mail.body?.trim() ? mail.body : <span className="text-gray-400 italic">Aucun contenu</span>}
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
