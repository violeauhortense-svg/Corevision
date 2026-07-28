import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  MessageSquare,
  ArrowLeftRight,
  Archive,
  Phone,
  Search,
  Mail,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { toast } from 'sonner';
import { hubCommunicationAPI } from '../../services/hubCommunicationAPI';
import { MailDetailPanel } from './MailDetailPanel';
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

  useEffect(() => {
    if (searchTerm) {
      searchMails();
    } else {
      loadMailsByTab(activeTab);
    }
  }, [activeTab, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Charger les mails et les stats
      await loadMailsByTab('conversation_client');
      // Charger les appels
      await loadCalls();
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadMailsByTab = async (tab: HubTab) => {
    try {
      const result = await hubCommunicationAPI.getMailsByTab(tab, 50, 0);
      setMails(result.mails);
      setStats(result.stats);
    } catch (error) {
      console.error('Erreur chargement mails:', error);
      toast.error('Impossible de charger les mails');
    }
  };

  const loadCalls = async () => {
    try {
      const result = await hubCommunicationAPI.getCalls(undefined, 50, 0);
      setCalls(result.calls);
    } catch (error) {
      console.error('Erreur chargement appels:', error);
      toast.error('Impossible de charger les appels');
    }
  };

  const searchMails = async () => {
    if (!searchTerm.trim()) {
      loadMailsByTab(activeTab);
      return;
    }

    try {
      const results = await hubCommunicationAPI.searchMails(searchTerm, activeTab, 50);
      setMails(results);
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast.error('Erreur lors de la recherche');
    }
  };

  const handleMailUpdate = async (mail: HubMail) => {
    try {
      // Actualiser les données après modification
      await loadMailsByTab(activeTab);
      setSelectedMail(mail);
      toast.success('Mail mis à jour');
    } catch (error) {
      console.error('Erreur update:', error);
      toast.error('Erreur lors de la mise à jour');
    }
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du Hub Communication...</p>
        </div>
      </div>
    );
  }

  const filteredMails = mails;

  return (
    <>
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
                <TabsContent value={activeTab} className="mt-0">
                  {filteredMails.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun mail trouvé</h3>
                      <p className="text-gray-600">
                        {searchTerm
                          ? 'Aucun mail ne correspond à votre recherche'
                          : 'Vous n\'avez aucun mail dans cette catégorie'}
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
                              <p className="text-sm text-gray-500 truncate">{mail.body.substring(0, 80)}</p>
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

                {/* Calls */}
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

      {/* Mail Detail Panel */}
      {selectedMail && (
        <MailDetailPanel
          mail={selectedMail}
          onClose={() => setSelectedMail(null)}
          onUpdate={handleMailUpdate}
        />
      )}
    </>
  );
}
