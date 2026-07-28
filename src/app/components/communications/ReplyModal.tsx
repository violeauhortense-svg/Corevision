import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Send, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { HubMail } from '../../types/mail';

interface ReplyModalProps {
  open: boolean;
  onClose: () => void;
  originalMail: HubMail | null;
  onSend: (reply: { to: string[]; subject: string; body: string; cc?: string[] }) => Promise<void>;
}

export function ReplyModal({ open, onClose, originalMail, onSend }: ReplyModalProps) {
  const [to, setTo] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [sending, setSending] = useState(false);

  // Initialize form when modal opens
  if (open && originalMail && !subject) {
    const isReply = originalMail.subject.startsWith('Re:');
    setTo(originalMail.direction === 'received' ? [originalMail.from] : originalMail.to);
    setSubject(isReply ? originalMail.subject : `Re: ${originalMail.subject}`);
    setBody('');
  }

  const handleAddCc = () => {
    if (!ccInput.trim()) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    if (!ccInput.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    if (cc.includes(ccInput.trim())) {
      toast.error('Cette adresse est déjà ajoutée');
      return;
    }

    setCc([...cc, ccInput.trim()]);
    setCcInput('');
  };

  const handleRemoveCc = (email: string) => {
    setCc(cc.filter((e) => e !== email));
  };

  const handleCopyToClipboard = () => {
    const text = `À: ${to.join(', ')}\nCc: ${cc.join(', ')}\n\nSujet: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    toast.success('Texte copié au presse-papiers');
  };

  const handleSendViaOutlook = async () => {
    if (!subject.trim()) {
      toast.error('Le sujet est requis');
      return;
    }

    if (!body.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    if (to.length === 0) {
      toast.error('Veuillez spécifier au moins un destinataire');
      return;
    }

    setSending(true);
    try {
      await onSend({
        to,
        subject,
        body,
        cc: cc.length > 0 ? cc : undefined,
      });

      // Reset form
      setTo([]);
      setSubject('');
      setBody('');
      setCc([]);
      setCcInput('');
      onClose();

      toast.success('Email envoyé via Outlook');
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Impossible d\'envoyer l\'email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✉️ Organiser et Préparer Mail</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* À */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">À</label>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              {to.length > 0 ? (
                <div className="space-y-2">
                  {to.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                    >
                      {email}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Auto-rempli depuis le mail</p>
              )}
            </div>
          </div>

          {/* CC */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Cc (optionnel)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une adresse email..."
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCc()}
                className="text-sm"
              />
              <Button onClick={handleAddCc} size="sm" variant="outline" className="flex-shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {cc.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cc.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs"
                  >
                    {email}
                    <button
                      onClick={() => handleRemoveCc(email)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sujet</label>
            <Input
              placeholder="Sujet du message"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-sm"
            />
            {subject.startsWith('Re:') && (
              <p className="text-xs text-gray-500">Le sujet commence automatiquement par "Re:"</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <Textarea
              placeholder="Saisissez votre réponse..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="resize-none text-sm"
            />
            <p className="text-xs text-gray-500">
              {body.length} caractères ({Math.ceil(body.length / 160)} SMS)
            </p>
          </div>

          {/* Compteur d'emails à répondre */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>📊 Compteur:</strong> {originalMail?.clientName || 'Mail'} en attente de réponse
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="outline" disabled={sending}>
            Annuler
          </Button>

          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copier le texte
          </Button>

          <Button
            onClick={handleSendViaOutlook}
            disabled={sending || !subject.trim() || !body.trim()}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin">
                  <Send className="w-4 h-4" />
                </div>
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer via Outlook
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
