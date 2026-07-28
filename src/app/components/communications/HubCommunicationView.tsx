import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  MessageSquare,
  ArrowLeftRight,
  Archive,
  Phone,
  Search,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { HubMail, CallToHandle, HubTab, HubStats } from '../../types/mail';

export function HubCommunicationView() {
  const [mails, setMails] = useState<HubMail[]>([]);
  const [calls, setCalls] = useState<CallToHandle[]>([]);
  const [selectedMail, setSelectedMail] = useState<HubMail | null>(null);
  const [activeTab, setActiveTab] = useState<HubTab>('conversation_client');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<HubStats>({
    conversation_client: 0,
    interne_externe: 0,
    archive: 0,
    appels: 0,
    a_traiter: 0,
    en_cours: 0,
    a_valider_gl: 0,
    valide_gl: 0,
    unread: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par des vrais appels API
      // GET /api/hub/mails
      // GET /api/hub/calls

      const demoMails: HubMail[] = [
        {
          id: 'mail-1',
          messageId: 'outlook-123',
          threadId: 'thread-chiffrage',
          from: 'pierre.dubois@co.fr',
          fromName: 'Pierre Dubois',
          to: ['contact@prudentia.fr'],
          subject: 'Demande de chiffrage initial',
          body: 'Bonjour,\n\nJe souhaite un chiffrage pour la mise en place des structures de hold. Pouvez-vous me proposer un premier devis?\n\nCordialement,\nPierre Dubois',
          isHtml: false,
          bodyPreview: 'Je souhaite un chiffrage pour la mise en place...',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          direction: 'received',
          read: false,
          clientId: 'client-123',
          clientName: 'Pierre Dubois (SARL Dubois)',
          clientEmail: 'pierre.dubois@co.fr',
          hubTab: 'conversation_client',
          traitementStatus: 'a_traiter',
          attachments: [
            {
              id: 'attach-1',
              name: 'Situation_actuelle.xlsx',
              size: 1220000,
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              url: '/downloads/Situation_actuelle.xlsx',
            },
          ],
          notes: [],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          importedFrom: 'outlook',
        },
        {
          id: 'mail-2',
          messageId: 'outlook-124',
          threadId: 'thread-chiffrage',
          from: 'contact@prudentia.fr',
          to: ['pierre.dubois@co.fr'],
          subject: 'Re: Demande de chiffrage initial',
          body: 'Bonjour Pierre,\n\nMerci pour votre demande. Nous vous proposons deux approches...\n\nCordialement,\nL\'équipe',
          isHtml: false,
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          direction: 'sent',
          read: true,
          clientId: 'client-123',
          clientName: 'Pierre Dubois (SARL Dubois)',
          hubTab: 'conversation_client',
          traitementStatus: 'en_cours',
          attachments: [],
          notes: [
            {
              id: 'note-1',
              content: 'Vérifier les conditions MEP avec le GL',
              createdBy: 'user@prudentia.fr',
              createdByName: 'Vous',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          importedFrom: 'outlook',
        },
      ];

      const demoCalls: CallToHandle[] = [
        {
          id: 'call-1',
          clientName: 'Marie Bernard',
          clientPhone: '+33 6 12 34 56 78',
          subject: 'Suivi audit patrimonial',
          reason: 'Validation des recommandations',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'urgent',
          status: 'pending',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setMails(demoMails);
      setCalls(demoCalls);
      updateStats(demoMails, demoCalls);
    } catch (error) {
      console.error('Erreur chargement Hub Communication:', error);
      toast.error('Impossible de charger les communications');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (mailsList: HubMail[], callsList: CallToHandle[]) => {
    setStats({
      conversation_client: mailsList.filter((m) => m.hubTab === 'conversation_client').length,
      interne_externe: mailsList.filter((m) => m.hubTab === 'interne_externe').length,
      archive: mailsList.filter((m) => m.hubTab === 'archive').length,
      appels: callsList.length,
      a_traiter: mailsList.filter((m) => m.traitementStatus === 'a_traiter').length,
      en_cours: mailsList.filter((m) => m.traitementStatus === 'en_cours').length,
      a_valider_gl: mailsList.filter((m) => m.traitementStatus === 'a_valider_gl').length,
      valide_gl: mailsList.filter((m) => m.traitementStatus === 'valide_gl').length,
      unread: mailsList.filter((m) => !m.read).length,
    });
  };

  const getFilteredMails = (): HubMail[] => {
    let filtered = mails.filter((m) => m.hubTab === activeTab);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.subject.toLowerCase().includes(term) ||
          m.body.toLowerCase().includes(term) ||
          m.from.toLowerCase().includes(term) ||
          m.clientName?.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `Il y a ${hours}h`;
    } else if (days === 1) {
      return 'Hier';
    }
    return date.toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'a_traiter':
        return 'bg-gray-100 text-gray-800';
      case 'en_cours':
        return 'bg-blue-100 text-blue-800';
      case 'a_valider_gl':
        return 'bg-yellow-100 text-yellow-800';
      case 'valide_gl':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      a_traiter: '📥 À traiter',
      en_cours: '🔵 En cours',
      a_valider_gl: '🟡 À valider GL',
      valide_gl: '🟢 Validé GL',
      termine: '✅ Terminé',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  const filteredMails = getFilteredMails();

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💬 Hub Communication
              </h1>
              <p className="text-gray-600 mt-1">Centralisez tous vos emails, appels et communications clients</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-xs text-gray-600 mb-1">À traiter</p>
            <p className="text-2xl font-bold text-red-600">{stats.a_traiter}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-600 mb-1">En cours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.en_cours}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-600 mb-1">À valider GL</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.a_valider_gl}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-600 mb-1">Non lus</p>
            <p className="text-2xl font-bold text-purple-600">{stats.unread}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="shadow-xl border-gray-200">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HubTab)} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50 px-6">
              <TabsList className="bg-transparent border-none gap-2">
                <TabsTrigger
                  value="conversation_client"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Conversation Client
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-full">
                    {stats.conversation_client}
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="interne_externe"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Interne/Externe
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-full">
                    {stats.interne_externe}
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="archive"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-full">
                    {stats.archive}
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="appels"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appels à traiter
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-full">
                    {stats.appels}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher dans les mails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Mail List */}
              <TabsContent value="conversation_client" className="mt-0">
                {filteredMails.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun mail trouvé</h3>
                    <p className="text-gray-600">
                      {searchTerm
                        ? 'Aucun mail ne correspond à votre recherche'
                        : 'Vous n\'avez aucun mail de client'}
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {filteredMails.map((mail) => (
                      <Card
                        key={mail.id}
                        className="p-4 cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setSelectedMail(mail)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold truncate ${!mail.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {mail.subject}
                              </p>
                              <Badge className={getStatusColor(mail.traitementStatus)}>
                                {getStatusLabel(mail.traitementStatus)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{mail.from}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {mail.bodyPreview || mail.body.substring(0, 80)}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(mail.sentAt)}</p>
                            {!mail.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Autres onglets à compléter */}
              <TabsContent value="interne_externe" className="mt-0">
                <p className="text-gray-600">Section à compléter</p>
              </TabsContent>

              <TabsContent value="archive" className="mt-0">
                <p className="text-gray-600">Section à compléter</p>
              </TabsContent>

              <TabsContent value="appels" className="mt-0">
                {calls.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun appel à traiter</h3>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {calls.map((call) => (
                      <Card key={call.id} className="p-4 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{call.clientName}</p>
                              <Badge
                                className={
                                  call.priority === 'urgent'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {call.priority === 'urgent' ? '🔴 Urgent' : '🟢 Normal'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{call.subject}</p>
                            <p className="text-xs text-gray-500 mt-1">{call.clientPhone}</p>
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(call.dueDate)}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
