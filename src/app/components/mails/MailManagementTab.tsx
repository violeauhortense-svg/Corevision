import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Search,
  Mail,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Save,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAutoSave } from '../../hooks/useAutoSave';
import { ReplyModal } from './ReplyModal';
import type { MailMessage, MailProcessingStatus } from '../../types/mail';

interface MailManagementTabProps {
  onStatsUpdate: () => void;
}

const PROCESSING_STATUS_CONFIG: Record<MailProcessingStatus, { label: string; color: string; icon: any }> = {
  a_traiter: { label: 'À traiter', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Clock },
  a_valider_gl: { label: 'À valider GL', color: 'bg-yellow-100 text-yellow-800', icon: MessageSquare },
  valide_gl: { label: 'Validé GL', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  termine: { label: 'Terminé', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 },
};

const TABS: Array<{ id: string; label: string; filter: (m: MailMessage) => boolean }> = [
  {
    id: 'clients',
    label: 'Conversation Client',
    filter: (m) => m.direction === 'received' && m.processingStatus !== 'termine',
  },
  {
    id: 'interne',
    label: 'Interne/Externe',
    filter: (m) => m.direction === 'sent' && m.processingStatus !== 'termine',
  },
  {
    id: 'archive',
    label: 'Archive',
    filter: (m) => m.processingStatus === 'termine',
  },
  {
    id: 'appels',
    label: 'Appels',
    filter: (m) => m.linkedTaskId !== undefined && m.processingStatus !== 'termine',
  },
];

interface MailWithProcessing extends MailMessage {
  processingStatus: MailProcessingStatus;
  processingNotes: string;
  processingAssignedTo: string;
  lastModifiedAt: string;
  isAutoSaving?: boolean;
}

export function MailManagementTab({ onStatsUpdate }: MailManagementTabProps) {
  const [mails, setMails] = useState<MailWithProcessing[]>([]);
  const [filteredMails, setFilteredMails] = useState<MailWithProcessing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedMail, setSelectedMail] = useState<MailWithProcessing | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoSavingIds, setAutoSavingIds] = useState<Set<string>>(new Set());
  const [replyModalOpen, setReplyModalOpen] = useState(false);

  useEffect(() => {
    loadMails();
  }, []);

  useEffect(() => {
    filterMails();
  }, [mails, searchTerm, activeTab]);

  const loadMails = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API
      const demoMails: MailWithProcessing[] = [
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
          processingStatus: 'a_traiter',
          processingNotes: '',
          processingAssignedTo: 'user@corevision.fr',
          lastModifiedAt: new Date().toISOString(),
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
          processingStatus: 'en_cours',
          processingNotes: 'Vérification des documents en cours',
          processingAssignedTo: 'user@corevision.fr',
          lastModifiedAt: new Date().toISOString(),
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
          processingStatus: 'termine',
          processingNotes: 'Traitement terminé',
          processingAssignedTo: 'user@corevision.fr',
          lastModifiedAt: new Date().toISOString(),
        },
      ];

      setMails(demoMails);
    } catch (error) {
      console.error('Erreur lors du chargement des mails:', error);
      toast.error('Impossible de charger les mails');
    } finally {
      setLoading(false);
    }
  };

  const filterMails = () => {
    const tab = TABS.find((t) => t.id === activeTab);
    if (!tab) return;

    let filtered = mails.filter(tab.filter);

    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    setFilteredMails(filtered);
  };

  const handleAutoSave = async (updatedMail: MailWithProcessing) => {
    try {
      setAutoSavingIds((prev) => new Set([...prev, updatedMail.id]));
      // TODO: Implémenter l'appel API pour sauvegarder
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulation d'appel API

      setMails((prev) => prev.map((m) => (m.id === updatedMail.id ? updatedMail : m)));

      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde automatique:', error);
      return false;
    } finally {
      setAutoSavingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(updatedMail.id);
        return newSet;
      });
    }
  };

  const handleStatusChange = (mail: MailWithProcessing, status: MailProcessingStatus) => {
    const updated = {
      ...mail,
      processingStatus: status,
      lastModifiedAt: new Date().toISOString(),
    };
    if (selectedMail?.id === mail.id) {
      setSelectedMail(updated);
    }
    handleAutoSave(updated);
  };

  const handleNotesChange = (mail: MailWithProcessing, notes: string) => {
    const updated = {
      ...mail,
      processingNotes: notes,
      lastModifiedAt: new Date().toISOString(),
      isAutoSaving: true,
    };
    setSelectedMail(updated);
    handleAutoSave(updated);
  };

  const handleSendReply = async (reply: Partial<MailMessage>) => {
    if (!selectedMail) return;

    try {
      // TODO: Implémenter l'appel API pour envoyer le mail via Outlook
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulation

      const updated = {
        ...selectedMail,
        processingStatus: 'en_cours' as MailProcessingStatus,
        lastModifiedAt: new Date().toISOString(),
      };

      await handleAutoSave(updated);
      setReplyModalOpen(false);
      onStatsUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
      toast.error('Impossible d\'envoyer la réponse');
    }
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
    }
    return date.toLocaleDateString('fr-FR');
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

  if (selectedMail) {
    const config = PROCESSING_STATUS_CONFIG[selectedMail.processingStatus];
    const StatusIcon = config.icon;

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedMail(null)} className="-ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>

        <div className="grid grid-cols-3 gap-6">
          {/* Détails du mail */}
          <div className="col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMail.subject}</h2>
                    <p className="text-gray-600 mt-1">{selectedMail.from}</p>
                  </div>
                  <Badge className={config.color}>
                    <StatusIcon className="w-3 h-3 mr-2" />
                    {config.label}
                  </Badge>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4 mr-2 inline" />
                    {formatDate(selectedMail.sentAt)}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMail.body}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notes avec sauvegarde automatique */}
            <Card className="p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Notes de traitement</h3>
                {autoSavingIds.has(selectedMail.id) && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin">
                      <Clock className="w-4 h-4" />
                    </div>
                    Sauvegarde...
                  </div>
                )}
                {!autoSavingIds.has(selectedMail.id) && selectedMail.lastModifiedAt && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Sauvegardé
                  </div>
                )}
              </div>
              <Textarea
                placeholder="Ajoutez vos notes sur le traitement de ce mail..."
                value={selectedMail.processingNotes}
                onChange={(e) => handleNotesChange(selectedMail, e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Les modifications sont sauvegardées automatiquement
              </p>
            </Card>
          </div>

          {/* Panel latéral - États et actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">État du traitement</h3>
              <div className="space-y-2">
                {Object.entries(PROCESSING_STATUS_CONFIG).map(([status, { label, color }]) => (
                  <Button
                    key={status}
                    variant={selectedMail.processingStatus === status ? 'default' : 'outline'}
                    className={`w-full justify-start ${
                      selectedMail.processingStatus === status ? 'bg-blue-600' : ''
                    }`}
                    onClick={() => handleStatusChange(selectedMail, status as MailProcessingStatus)}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${color.split(' ')[0]}`}></span>
                    {label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Assigné à</p>
                  <p className="text-gray-900 font-medium">{selectedMail.processingAssignedTo}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dernier modification</p>
                  <p className="text-gray-900 font-medium">{formatDate(selectedMail.lastModifiedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="text-gray-900 font-medium">
                    {selectedMail.direction === 'received' ? 'Reçu' : 'Envoyé'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Bouton de réponse */}
            {selectedMail.direction === 'received' && selectedMail.processingStatus !== 'termine' && (
              <Button
                onClick={() => setReplyModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Répondre au client
              </Button>
            )}
          </div>
        </div>

        {/* Modal de réponse */}
        <ReplyModal
          open={replyModalOpen}
          onClose={() => setReplyModalOpen(false)}
          originalMail={selectedMail}
          onSend={handleSendReply}
        />
      </div>
    );
  }

  const totalCount = filteredMails.length;
  const aTraiterCount = filteredMails.filter((m) => m.processingStatus === 'a_traiter').length;
  const enCoursCount = filteredMails.filter((m) => m.processingStatus === 'en_cours').length;

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
              {mails.filter(tab.filter).length}
            </span>
          </button>
        ))}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">À traiter</p>
              <p className="text-2xl font-bold text-gray-900">{aTraiterCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{enCoursCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des mails */}
      {filteredMails.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun mail trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Aucun mail ne correspond à votre recherche' : 'Aucun mail dans cette catégorie'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredMails.map((mail) => {
            const config = PROCESSING_STATUS_CONFIG[mail.processingStatus];
            const StatusIcon = config.icon;

            return (
              <Card
                key={mail.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedMail(mail)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{mail.subject}</h3>
                      <Badge className={config.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{mail.from}</p>
                    <p className="text-sm text-gray-500 truncate line-clamp-1">{mail.processingNotes || mail.body.substring(0, 80)}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(mail.sentAt)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
