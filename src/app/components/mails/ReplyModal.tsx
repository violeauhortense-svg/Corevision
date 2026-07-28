import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Send, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MailMessage } from '../../types/mail';

interface ReplyModalProps {
  open: boolean;
  onClose: () => void;
  originalMail: MailMessage | null;
  onSend: (reply: Partial<MailMessage>) => Promise<void>;
}

export function ReplyModal({ open, onClose, originalMail, onSend }: ReplyModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [sending, setSending] = useState(false);

  const handleAddCc = () => {
    if (ccInput.trim() && ccInput.includes('@')) {
      setCc([...cc, ccInput.trim()]);
      setCcInput('');
    } else {
      toast.error('Adresse email invalide');
    }
  };

  const handleRemoveCc = (email: string) => {
    setCc(cc.filter((e) => e !== email));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Veuillez remplir le sujet et le message');
      return;
    }

    try {
      setSending(true);
      await onSend({
        subject,
        body,
        cc: cc.length > 0 ? cc : undefined,
      });
      toast.success('Message envoyé avec succès');
      setSubject('');
      setBody('');
      setCc([]);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  // Auto-populate when original mail changes
  if (originalMail && !subject && open) {
    const isReply = originalMail.subject.startsWith('RE:');
    setSubject(isReply ? originalMail.subject : `RE: ${originalMail.subject}`);
    setBody('');
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Répondre au client</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {originalMail && (
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p className="text-gray-600">
                <span className="font-medium">À:</span> {originalMail.from}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              placeholder="Sujet du message"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>CC (optionnel)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Ajouter une adresse email en CC..."
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCc()}
              />
              <Button onClick={handleAddCc} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {cc.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cc.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {email}
                    <button
                      onClick={() => handleRemoveCc(email)}
                      className="hover:text-blue-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Saisissez votre réponse..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
