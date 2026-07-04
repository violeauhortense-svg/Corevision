import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Inbox, Mail, MailOpen, Archive, Trash2, User, Calendar, Paperclip, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { MailMessage } from '../../types/mail';

interface MailInboxTabProps {
  onStatsUpdate: () => void;
}

export function MailInboxTab({ onStatsUpdate }: MailInboxTabProps) {
  const [emails, setEmails] = useState<MailMessage[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<MailMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedEmail, setSelectedEmail] = useState<MailMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, filter]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API
      // Pour le moment, emails de démonstration
      const demoEmails: MailMessage[] = [
        {
          id: 'e1',
          conversationId: '1',
          from: 'jean.dupont@email.com',
          to: ['conseiller@corevision.fr'],
          subject: 'Question urgente sur mon assurance-vie',
          body: 'Bonjour,\n\nJ\'ai une question urgente concernant mon contrat d\'assurance-vie. Pouvez-vous me rappeler ?\n\nCordialement,\nJean Dupont',
          isHtml: false,
          sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          direction: 'received',
          read: false,
        },
        {
          id: 'e2',
          conversationId: '2',
          from: 'sophie.martin@email.com',
          to: ['conseiller@corevision.fr'],
          subject: 'Documents complémentaires',
          body: 'Bonjour,\n\nVoici les documents que vous m\'avez demandés en pièces jointes.\n\nCordialement,\nSophie Martin',
          isHtml: false,
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          direction: 'received',
          read: false,
          attachments: [
            {
              id: 'a1',
              name: 'avis_imposition_2023.pdf',
              size: 245000,
              mimeType: 'application/pdf',
              url: '#',
            },
            {
              id: 'a2',
              name: 'releve_bancaire.pdf',
              size: 180000,
              mimeType: 'application/pdf',
              url: '#',
            },
          ],
        },
        {
          id: 'e3',
          conversationId: '3',
          from: 'pierre.bernard@email.com',
          to: ['conseiller@corevision.fr'],
          subject: 'Remerciements',
          body: 'Bonjour,\n\nJe tenais à vous remercier pour votre accompagnement de qualité. Je suis très satisfait des recommandations que vous m\'avez faites.\n\nCordialement,\nPierre Bernard',
          isHtml: false,
          sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          direction: 'received',
          read: true,
        },
        {
          id: 'e4',
          conversationId: '4',
          from: 'marie.dubois@email.com',
          to: ['conseiller@corevision.fr'],
          subject: 'Demande de rendez-vous',
          body: 'Bonjour,\n\nJe souhaiterais prendre rendez-vous pour faire un point sur ma situation patrimoniale. Seriez-vous disponible cette semaine ?\n\nCordialement,\nMarie Dubois',
          isHtml: false,
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          direction: 'received',
          read: false,
        },
      ];

      setEmails(demoEmails);
    } catch (error) {
      console.error('Erreur lors du chargement des emails:', error);
      toast.error('Impossible de charger les emails');
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    let filtered = emails;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'unread') {
      filtered = filtered.filter((e) => !e.read);
    } else if (filter === 'read') {
      filtered = filtered.filter((e) => e.read);
    }

    // Trier par date (plus récent en premier)
    filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    setFilteredEmails(filtered);
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
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const handleMarkAsRead = (emailId: string) => {
    setEmails(emails.map((e) => (e.id === emailId ? { ...e, read: true } : e)));
    toast.success('Email marqué comme lu');
    onStatsUpdate();
  };

  const handleMarkAsUnread = (emailId: string) => {
    setEmails(emails.map((e) => (e.id === emailId ? { ...e, read: false } : e)));
    toast.success('Email marqué comme non lu');
    onStatsUpdate();
  };

  const handleArchive = (emailId: string) => {
    setEmails(emails.filter((e) => e.id !== emailId));
    toast.success('Email archivé');
    onStatsUpdate();
  };

  const handleDelete = (emailId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet email ?')) {
      return;
    }
    setEmails(emails.filter((e) => e.id !== emailId));
    toast.success('Email supprimé');
    onStatsUpdate();
  };

  const handleEmailClick = (email: MailMessage) => {
    setSelectedEmail(email);
    if (!email.read) {
      handleMarkAsRead(email.id);
    }
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

  if (selectedEmail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedEmail(null)} className="-ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la boîte de réception
        </Button>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedEmail.from}</p>
                <p className="text-sm text-gray-500">{formatDate(selectedEmail.sentAt)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedEmail.read ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsUnread(selectedEmail.id)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Marquer non lu
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsRead(selectedEmail.id)}
                >
                  <MailOpen className="w-4 h-4 mr-2" />
                  Marquer lu
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleArchive(selectedEmail.id)}
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(selectedEmail.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedEmail.subject}</h2>

          <div className="prose max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">{selectedEmail.body}</p>
          </div>

          {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Pièces jointes ({selectedEmail.attachments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEmail.attachments.map((attachment) => (
                  <Badge
                    key={attachment.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 px-3 py-2"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <p className="font-medium">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1000).toFixed(0)} Ko
                      </p>
                    </div>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const unreadCount = emails.filter((e) => !e.read).length;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher dans la boîte de réception..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Badge
          variant={filter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('all')}
        >
          Tous ({emails.length})
        </Badge>
        <Badge
          variant={filter === 'unread' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('unread')}
        >
          Non lus ({unreadCount})
        </Badge>
        <Badge
          variant={filter === 'read' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setFilter('read')}
        >
          Lus ({emails.length - unreadCount})
        </Badge>
      </div>

      {/* Liste des emails */}
      {filteredEmails.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Boîte de réception vide</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all'
              ? 'Aucun email ne correspond à vos critères'
              : 'Vous n\'avez aucun nouvel email'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredEmails.map((email) => (
            <Card
              key={email.id}
              className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                !email.read ? 'bg-blue-50 border-blue-200 border-l-4' : 'border-l-4 border-transparent'
              }`}
              onClick={() => handleEmailClick(email)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${!email.read ? 'bg-blue-500' : 'bg-gray-400'}`}>
                    {!email.read ? (
                      <Mail className="w-4 h-4 text-white" />
                    ) : (
                      <MailOpen className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold truncate ${!email.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {email.from}
                      </p>
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm mb-1 truncate ${!email.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {email.subject}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{email.body.substring(0, 100)}...</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(email.sentAt)}</p>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleArchive(email.id)}
                      className="h-8 w-8 p-0"
                      title="Archiver"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(email.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}