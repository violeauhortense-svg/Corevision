import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { ArrowLeft, Send, Paperclip, User, Calendar, Tag, Archive, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { MailConversation, MailMessage, ConversationStatus } from '../../types/mail';

interface ConversationDetailProps {
  conversation: MailConversation;
  onBack: () => void;
  onUpdate: (conversation: MailConversation) => void;
}

const STATUS_COLORS: Record<ConversationStatus, string> = {
  ouvert: 'bg-green-100 text-green-800',
  en_attente: 'bg-yellow-100 text-yellow-800',
  resolu: 'bg-blue-100 text-blue-800',
  archive: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<ConversationStatus, string> = {
  ouvert: 'Ouvert',
  en_attente: 'En attente',
  resolu: 'Résolu',
  archive: 'Archivé',
};

export function ConversationDetail({ conversation, onBack, onUpdate }: ConversationDetailProps) {
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    try {
      setSending(true);

      const newMessage: MailMessage = {
        id: `m${Date.now()}`,
        conversationId: conversation.id,
        from: 'conseiller@corevision.fr',
        to: [conversation.messages[0]?.from || 'client@email.com'],
        subject: `RE: ${conversation.subject}`,
        body: replyBody,
        isHtml: false,
        sentAt: new Date().toISOString(),
        direction: 'sent',
        read: true,
        linkedClientId: conversation.clientId,
      };

      const updatedConversation: MailConversation = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        lastMessageDate: newMessage.sentAt,
      };

      onUpdate(updatedConversation);
      setReplyBody('');
      toast.success('Message envoyé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = (newStatus: ConversationStatus) => {
    const updatedConversation: MailConversation = {
      ...conversation,
      status: newStatus,
    };
    onUpdate(updatedConversation);
    toast.success(`Statut changé en "${STATUS_LABELS[newStatus]}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{conversation.clientName}</h2>
              <p className="text-gray-600">{conversation.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-12">
            <Badge className={STATUS_COLORS[conversation.status]}>
              {STATUS_LABELS[conversation.status]}
            </Badge>
            {conversation.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions de statut */}
        <div className="flex gap-2">
          {conversation.status !== 'resolu' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('resolu')}
              className="text-blue-600 hover:text-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Résolu
            </Button>
          )}
          {conversation.status !== 'archive' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('archive')}
              className="text-gray-600 hover:text-gray-700"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archiver
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {conversation.messages.map((message, index) => (
          <Card
            key={message.id}
            className={`p-6 ${
              message.direction === 'sent'
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    message.direction === 'sent' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {message.direction === 'sent' ? 'Vous' : conversation.clientName}
                  </p>
                  <p className="text-xs text-gray-500">{message.from}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDateTime(message.sentAt)}</span>
              </div>
            </div>

            {index > 0 && (
              <p className="text-sm font-medium text-gray-700 mb-2">{message.subject}</p>
            )}

            <p className="text-gray-900 whitespace-pre-wrap">{message.body}</p>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {message.attachments.map((attachment) => (
                  <Badge key={attachment.id} variant="outline" className="cursor-pointer">
                    <Paperclip className="w-3 h-3 mr-1" />
                    {attachment.name}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Formulaire de réponse */}
      {conversation.status !== 'archive' && (
        <Card className="p-6 border-2 border-blue-200 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Répondre</h3>
          <div className="space-y-4">
            <Textarea
              placeholder="Saisissez votre réponse..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={6}
              className="resize-none"
            />

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <Paperclip className="w-4 h-4 mr-2" />
                Joindre un fichier
              </Button>

              <Button
                onClick={handleSendReply}
                disabled={sending || !replyBody.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
