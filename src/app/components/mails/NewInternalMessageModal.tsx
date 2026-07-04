import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { InternalMessage, MessagePriority } from '../../types/mail';

interface NewInternalMessageModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (message: InternalMessage) => void;
  currentUserId: string;
}

const PRIORITY_OPTIONS: { value: MessagePriority; label: string }[] = [
  { value: 'low', label: 'Faible' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
];

// TODO: Récupérer depuis l'API
const TEAM_MEMBERS = [
  { id: 'admin@corevision.fr', name: 'Administrateur' },
  { id: 'conseiller2@corevision.fr', name: 'Sophie Martin' },
  { id: 'conseiller3@corevision.fr', name: 'Pierre Durand' },
];

export function NewInternalMessageModal({
  open,
  onClose,
  onSave,
  currentUserId,
}: NewInternalMessageModalProps) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<MessagePriority>('normal');

  const resetForm = () => {
    setRecipient('');
    setSubject('');
    setBody('');
    setPriority('normal');
  };

  const handleSave = () => {
    if (!recipient || !subject.trim() || !body.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const recipientMember = TEAM_MEMBERS.find((m) => m.id === recipient);

    const message: InternalMessage = {
      id: `im${Date.now()}`,
      from: currentUserId,
      fromName: 'Vous',
      to: [recipient],
      toNames: [recipientMember?.name || recipient],
      subject: subject.trim(),
      body: body.trim(),
      sentAt: new Date().toISOString(),
      read: true, // L'expéditeur l'a déjà "lu"
      priority,
    };

    onSave(message);
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
          <DialogTitle>Nouveau message interne</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient">
                Destinataire <span className="text-red-500">*</span>
              </Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un collègue" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_MEMBERS.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">
                Priorité <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as MessagePriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              placeholder="Ex: Question sur un dossier client"
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
              placeholder="Bonjour,&#10;&#10;..."
              rows={8}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-pink-600">
              Envoyer le message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
