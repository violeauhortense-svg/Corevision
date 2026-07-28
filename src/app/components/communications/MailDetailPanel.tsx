import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  X,
  Download,
  Send,
  Plus,
  Trash2,
  ChevronDown,
  Calendar,
  User,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import type { HubMail, MailNote, MailTraitementStatus } from '../../types/mail';

interface MailDetailPanelProps {
  mail: HubMail;
  onClose: () => void;
  onUpdate: (mail: HubMail) => Promise<void>;
}

export function MailDetailPanel({ mail, onClose, onUpdate }: MailDetailPanelProps) {
  const [showSignature, setShowSignature] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<MailTraitementStatus>(mail.traitementStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: MailTraitementStatus) => {
    setSelectedStatus(newStatus);
    const updated: HubMail = {
      ...mail,
      traitementStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await onUpdate(updated);
    toast.success(`État changé à "${getStatusLabel(newStatus)}"`);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('La note ne peut pas être vide');
      return;
    }

    const newNoteObj: MailNote = {
      id: `note-${Date.now()}`,
      content: newNote,
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
      setNewNote('');
      toast.success('Note ajoutée avec succès');
    } catch (error) {
      toast.error('Impossible d\'ajouter la note');
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

    try {
      await onUpdate(updated);
      toast.success('Note supprimée');
    } catch (error) {
      toast.error('Impossible de supprimer la note');
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

  const getStatusColor = (status: MailTraitementStatus) => {
    const colors: Record<MailTraitementStatus, string> = {
      a_traiter: 'bg-gray-100 text-gray-800',
      en_cours: 'bg-blue-100 text-blue-800',
      a_valider_gl: 'bg-yellow-100 text-yellow-800',
      valide_gl: 'bg-green-100 text-green-800',
      termine: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
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
              <Badge className={mail.direction === 'received' ? 'bg-green-100 text-green-800 ml-auto' : 'bg-blue-100 text-blue-800 ml-auto'}>
                {mail.direction === 'received' ? '📥 Reçu' : '📤 Envoyé'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Pièces jointes */}
        {mail.attachments.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">📎 Pièces jointes ({mail.attachments.length})</h3>
            <div className="space-y-2">
              {mail.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{(attachment.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                    <Download className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm">Client Associé</h3>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">{mail.clientName || 'Non associé'}</p>
            <p className="text-xs text-blue-700 mt-1">{mail.clientEmail || mail.from}</p>
            {!mail.clientId && (
              <Button size="sm" variant="outline" className="mt-2">
                Associer un client
              </Button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">📝 Notes</h3>

          {/* Affichage des notes existantes */}
          {mail.notes.length > 0 && (
            <div className="space-y-2">
              {mail.notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs text-gray-600">
                      <p className="font-medium">{note.createdByName}</p>
                      <p className="text-gray-500">{formatDate(note.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-900">{note.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ajouter une note */}
          <div className="space-y-2">
            <Textarea
              placeholder="Ajoutez votre note ici..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleAddNote}
              disabled={loading || !newNote.trim()}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une note
            </Button>
          </div>
        </div>

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
                  className={`w-full justify-start ${selectedStatus === status ? 'bg-blue-600' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'a_traiter'
                      ? 'bg-gray-400'
                      : status === 'en_cours'
                        ? 'bg-blue-500'
                        : status === 'a_valider_gl'
                          ? 'bg-yellow-500'
                          : status === 'valide_gl'
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                  }`}></span>
                  {getStatusLabel(status)}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t pt-6">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4 mr-2" />
            ✉️ Répondre
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
