import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, MessageSquare, User, Calendar, Tag, Plus, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { ConversationDetail } from './ConversationDetail';
import { NewConversationModal } from './NewConversationModal';
import type { MailConversation, ConversationStatus } from '../../types/mail';

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

interface MailConversationsTabProps {
  onStatsUpdate: () => void;
}

export function MailConversationsTab({ onStatsUpdate }: MailConversationsTabProps) {
  const [conversations, setConversations] = useState<MailConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<MailConversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ConversationStatus | 'all'>('all');
  const [selectedConversation, setSelectedConversation] = useState<MailConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newConversationModal, setNewConversationModal] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchTerm, selectedStatus]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API
      // Pour le moment, conversations de démonstration
      const demoConversations: MailConversation[] = [
        {
          id: '1',
          clientId: 'client1',
          clientName: 'Jean Dupont',
          subject: 'Question sur audit patrimonial',
          lastMessageDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          unreadCount: 2,
          status: 'ouvert',
          tags: ['audit', 'urgent'],
          messages: [
            {
              id: 'm1',
              conversationId: '1',
              from: 'jean.dupont@email.com',
              to: ['conseiller@corevision.fr'],
              subject: 'Question sur audit patrimonial',
              body: 'Bonjour, j\'aimerais avoir plus d\'informations sur le déroulement de l\'audit patrimonial.',
              isHtml: false,
              sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              direction: 'received',
              read: true,
              linkedClientId: 'client1',
            },
            {
              id: 'm2',
              conversationId: '1',
              from: 'conseiller@corevision.fr',
              to: ['jean.dupont@email.com'],
              subject: 'RE: Question sur audit patrimonial',
              body: 'Bonjour M. Dupont, avec plaisir ! L\'audit patrimonial se déroule en 3 étapes...',
              isHtml: false,
              sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              direction: 'sent',
              read: true,
              linkedClientId: 'client1',
            },
          ],
        },
        {
          id: '2',
          clientId: 'client2',
          clientName: 'Marie Martin',
          subject: 'Recommandations investissement',
          lastMessageDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          status: 'en_attente',
          tags: ['investissement'],
          messages: [
            {
              id: 'm3',
              conversationId: '2',
              from: 'conseiller@corevision.fr',
              to: ['marie.martin@email.com'],
              subject: 'Vos recommandations d\'investissement',
              body: 'Bonjour Mme Martin, suite à notre entretien, voici mes recommandations...',
              isHtml: false,
              sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              direction: 'sent',
              read: true,
              linkedClientId: 'client2',
            },
          ],
        },
        {
          id: '3',
          clientId: 'client3',
          clientName: 'Pierre Bernard',
          subject: 'Documents complémentaires',
          lastMessageDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          status: 'resolu',
          tags: ['documents'],
          messages: [
            {
              id: 'm4',
              conversationId: '3',
              from: 'pierre.bernard@email.com',
              to: ['conseiller@corevision.fr'],
              subject: 'Documents complémentaires',
              body: 'Voici les documents que vous m\'avez demandés.',
              isHtml: false,
              sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              direction: 'received',
              read: true,
              linkedClientId: 'client3',
            },
          ],
        },
      ];

      setConversations(demoConversations);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      toast.error('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = conversations;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === selectedStatus);
    }

    // Trier par date (plus récent en premier)
    filtered.sort(
      (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );

    setFilteredConversations(filtered);
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

  const handleConversationClick = (conversation: MailConversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = (conversation: MailConversation) => {
    setConversations([conversation, ...conversations]);
    setNewConversationModal(false);
    toast.success('Conversation créée avec succès');
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

  if (selectedConversation) {
    return (
      <ConversationDetail
        conversation={selectedConversation}
        onBack={() => setSelectedConversation(null)}
        onUpdate={(updated) => {
          setConversations(conversations.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedConversation(updated);
          onStatsUpdate();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setNewConversationModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedStatus('all')}
        >
          Tous ({conversations.length})
        </Badge>
        {Object.entries(STATUS_LABELS).map(([key, label]) => {
          const count = conversations.filter((c) => c.status === key).length;
          return (
            <Badge
              key={key}
              variant={selectedStatus === key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedStatus(key as ConversationStatus)}
            >
              {label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Liste des conversations */}
      {filteredConversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune conversation trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedStatus !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez une nouvelle conversation avec un client'}
          </p>
          {!searchTerm && selectedStatus === 'all' && (
            <Button
              onClick={() => setNewConversationModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle conversation
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{conversation.clientName}</h3>
                        <Badge className={STATUS_COLORS[conversation.status]}>
                          {STATUS_LABELS[conversation.status]}
                        </Badge>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white">
                            {conversation.unreadCount} nouveau{conversation.unreadCount > 1 ? 'x' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{conversation.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 ml-12">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(conversation.lastMessageDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>{conversation.messages.length} messages</span>
                    </div>
                    {conversation.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {conversation.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal nouvelle conversation */}
      <NewConversationModal
        open={newConversationModal}
        onClose={() => setNewConversationModal(false)}
        onSave={handleNewConversation}
      />
    </div>
  );
}
