import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import type { MailConversation, MailMessage } from '../../types/mail';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (conversation: MailConversation) => void;
}

export function NewConversationModal({ open, onClose, onSave }: NewConversationModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setSubject('');
    setBody('');
  };

  const handleSave = () => {
    if (!clientName.trim() || !clientEmail.trim() || !subject.trim() || !body.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const message: MailMessage = {
      id: `m${Date.now()}`,
      conversationId: Date.now().toString(),
      from: 'conseiller@corevision.fr',
      to: [clientEmail.trim()],
      subject: subject.trim(),
      body: body.trim(),
      isHtml: false,
      sentAt: new Date().toISOString(),
      direction: 'sent',
      read: true,
    };

    const conversation: MailConversation = {
      id: Date.now().toString(),
      clientId: `client_${Date.now()}`,
      clientName: clientName.trim(),
      subject: subject.trim(),
      lastMessageDate: message.sentAt,
      unreadCount: 0,
      status: 'ouvert',
      tags: [],
      messages: [message],
    };

    onSave(conversation);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">
                Nom du client <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <Label htmlFor="clientEmail">
                Email du client <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="jean.dupont@email.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject">
              Objet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Présentation de nos services"
            />
          </div>

          <div>
            <Label htmlFor="body">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Bonjour M. Dupont,&#10;&#10;..."
              rows={8}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
              Envoyer et créer la conversation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
