import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Send, MessageCircle, AlertCircle, User, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { NewInternalMessageModal } from './NewInternalMessageModal';
import type { InternalMessage, MessagePriority } from '../../types/mail';

const PRIORITY_COLORS: Record<MessagePriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const PRIORITY_LABELS: Record<MessagePriority, string> = {
  low: 'Faible',
  normal: 'Normal',
  high: 'Important',
  urgent: 'Urgent',
};

export function MailInternalTab() {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<InternalMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'sent'>('all');
  const [loading, setLoading] = useState(true);
  const [newMessageModal, setNewMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null);

  const currentUserId = 'conseiller@corevision.fr'; // TODO: Récupérer depuis le contexte d'authentification

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, filter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API
      // Pour le moment, messages de démonstration
      const demoMessages: InternalMessage[] = [
        {
          id: 'im1',
          from: 'admin@corevision.fr',
          fromName: 'Administrateur',
          to: ['conseiller@corevision.fr'],
          toNames: ['Vous'],
          subject: 'Mise à jour des barèmes fiscaux',
          body: 'Bonjour,\n\nLes barèmes fiscaux 2026 ont été mis à jour dans le système. Merci de vérifier vos calculs pour les nouveaux clients.\n\nCordialement,\nL\'équipe admin',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high',
        },
        {
          id: 'im2',
          from: 'conseiller2@corevision.fr',
          fromName: 'Sophie Martin',
          to: ['conseiller@corevision.fr'],
          toNames: ['Vous'],
          subject: 'Partage d\'expérience - Client Jean Dupont',
          body: 'Salut,\n\nJ\'ai vu que tu travailles avec Jean Dupont. J\'ai eu un cas similaire la semaine dernière, je peux te partager mon approche si ça t\'intéresse.\n\nSophie',
          sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'normal',
          linkedClientId: 'client1',
          linkedClientName: 'Jean Dupont',
        },
        {
          id: 'im3',
          from: 'conseiller@corevision.fr',
          fromName: 'Vous',
          to: ['admin@corevision.fr'],
          toNames: ['Administrateur'],
          subject: 'Question sur CoreVision',
          body: 'Bonjour,\n\nJ\'ai une question concernant la nouvelle fonctionnalité CoreVision. Pouvez-vous m\'appeler quand vous avez un moment ?\n\nMerci',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'normal',
        },
      ];

      setMessages(demoMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages internes:', error);
      toast.error('Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'unread') {
      filtered = filtered.filter((m) => !m.read && m.to.includes(currentUserId));
    } else if (filter === 'sent') {
      filtered = filtered.filter((m) => m.from === currentUserId);
    }

    // Trier par date (plus récent en premier)
    filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    setFilteredMessages(filtered);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `Il y a ${minutes}min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else if (hours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const handleMessageClick = (message: InternalMessage) => {
    if (!message.read && message.to.includes(currentUserId)) {
      // Marquer comme lu
      setMessages(messages.map((m) => (m.id === message.id ? { ...m, read: true } : m)));
    }
    setSelectedMessage(message);
  };

  const handleNewMessage = (message: InternalMessage) => {
    setMessages([message, ...messages]);
    setNewMessageModal(false);
    toast.success('Message envoyé avec succès');
  };

  const handleReply = (originalMessage: InternalMessage) => {
    // TODO: Implémenter la réponse avec pré-remplissage
    setNewMessageModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (selectedMessage) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedMessage(null)} className="-ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux messages
        </Button>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{selectedMessage.fromName}</p>
                  <Badge className={PRIORITY_COLORS[selectedMessage.priority]}>
                    {PRIORITY_LABELS[selectedMessage.priority]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedMessage.from === currentUserId ? 'Vous' : selectedMessage.from}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(selectedMessage.sentAt)}</p>
              </div>
            </div>

            {selectedMessage.from !== currentUserId && (
              <Button onClick={() => handleReply(selectedMessage)}>
                <Send className="w-4 h-4 mr-2" />
                Répondre
              </Button>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedMessage.subject}</h2>

          {selectedMessage.linkedClientName && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <User className="w-4 h-4 inline mr-2" />
                Lié au client : <strong>{selectedMessage.linkedClientName}</strong>
              </p>
            </div>
          )}

          <div className="prose max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.body}</p>
          </div>
        </Card>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.read && m.to.includes(currentUserId)).length;
  const sentCount = messages.filter((m) => m.from === currentUserId).length;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un message interne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setNewMessageModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
        >
          <Send className="w-4 h-4 mr-2" />
          Nouveau message
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Badge
          variant={filter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('all')}
        >
          Tous ({messages.length})
        </Badge>
        <Badge
          variant={filter === 'unread' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('unread')}
        >
          Non lus ({unreadCount})
        </Badge>
        <Badge
          variant={filter === 'sent' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('sent')}
        >
          Envoyés ({sentCount})
        </Badge>
      </div>

      {/* Liste des messages */}
      {filteredMessages.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun message trouvé</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filter !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez une conversation avec vos collègues'}
          </p>
          {!searchTerm && filter === 'all' && (
            <Button
              onClick={() => setNewMessageModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Nouveau message
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredMessages.map((message) => {
            const isFromMe = message.from === currentUserId;
            const isUnread = !message.read && message.to.includes(currentUserId);

            return (
              <Card
                key={message.id}
                className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                  isUnread ? 'bg-purple-50 border-purple-200 border-l-4' : 'border-l-4 border-transparent'
                }`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${isUnread ? 'bg-purple-500' : 'bg-gray-400'}`}>
                      {isFromMe ? (
                        <Send className="w-4 h-4 text-white" />
                      ) : (
                        <MessageCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {isFromMe ? `À: ${message.toNames.join(', ')}` : message.fromName}
                        </p>
                        <Badge className={PRIORITY_COLORS[message.priority]}>
                          {PRIORITY_LABELS[message.priority]}
                        </Badge>
                      </div>
                      <p className={`text-sm mb-1 truncate ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {message.subject}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{message.body.substring(0, 100)}...</p>
                      {message.linkedClientName && (
                        <p className="text-xs text-blue-600 mt-1">
                          <User className="w-3 h-3 inline mr-1" />
                          {message.linkedClientName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(message.sentAt)}</p>
                    {message.priority === 'urgent' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal nouveau message */}
      <NewInternalMessageModal
        open={newMessageModal}
        onClose={() => setNewMessageModal(false)}
        onSave={handleNewMessage}
        currentUserId={currentUserId}
      />
    </div>
  );
}