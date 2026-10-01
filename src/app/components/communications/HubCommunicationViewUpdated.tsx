import { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  RefreshCw,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { hubCommunicationAPI } from '../../services/hubCommunicationAPI';
import { MailDetailPanel } from './MailDetailPanel';
import { groupMailsIntoThreads, threadKeyFor } from '../../utils/mailThreading';
import type { HubMail, CallToHandle, HubTab, HubStats } from '../../types/mail';

export function HubCommunicationView() {
  const [mails, setMails] = useState<HubMail[]>([]);
  const [calls, setCalls] = useState<CallToHandle[]>([]);
  const [selectedMail, setSelectedMail] = useState<HubMail | null>(null);
  // Autres messages du même fil de discussion que selectedMail (même sujet,
  // même correspondant) - affichés dans MailDetailPanel comme un sélecteur
  // permettant de passer de l'un à l'autre sans fermer le panneau.
  const [threadSiblings, setThreadSiblings] = useState<HubMail[]>([]);
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
  const [autoMatching, setAutoMatching] = useState(false);
  const [syncingMails, setSyncingMails] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  // Cartouches de tri par client (onglet Conversation Client uniquement) -
  // un client par cartouche, seulement s'il a au moins un mail "à
  // traiter" ; cliquer dessus affiche tous ses mails, tous statuts
  // confondus, parmi ceux déjà chargés.
  const [untreatedClients, setUntreatedClients] = useState<{ clientId: string; clientName: string; count: number }[]>([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      searchMails();
    } else {
      loadMailsByTab(activeTab);
    }
    setSelectedClientFilter(null);
    if (activeTab === 'conversation_client') {
      loadUntreatedClients();
    } else {
      setUntreatedClients([]);
    }
  }, [activeTab, searchTerm]);

  const loadUntreatedClients = async () => {
    try {
      const clients = await hubCommunicationAPI.getUntreatedClients();
      setUntreatedClients(clients);
    } catch (error) {
      console.error('Erreur chargement cartouches clients:', error);
    }
  };

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

  const loadMailsByTab = async (tab: HubTab): Promise<HubMail[]> => {
    try {
      const result = await hubCommunicationAPI.getMailsByTab(tab, 50, 0);
      setMails(result.mails);
      setStats(result.stats);
      return result.mails;
    } catch (error) {
      console.error('Erreur chargement mails:', error);
      toast.error('Impossible de charger les mails');
      return [];
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

  const handleAutoMatch = async () => {
    setAutoMatching(true);
    try {
      const { scanned, matched } = await hubCommunicationAPI.autoMatchClients();
      if (matched > 0) {
        toast.success(`${matched} mail${matched > 1 ? 's' : ''} identifié${matched > 1 ? 's' : ''} et déplacé${matched > 1 ? 's' : ''} vers Conversation Client`);
      } else {
        toast.info(scanned > 0 ? 'Aucun client identifié parmi les mails restants' : 'Rien à identifier');
      }
      await loadMailsByTab(activeTab);
      if (activeTab === 'conversation_client') {
        await loadUntreatedClients();
      }
    } catch (error) {
      console.error('Erreur identification automatique:', error);
      toast.error('Erreur lors de l\'identification automatique');
    } finally {
      setAutoMatching(false);
    }
  };

  // Parle au bridge local (launcher.bat) tournant sur CET ordinateur -
  // 127.0.0.1 désigne toujours la machine qui exécute ce navigateur,
  // jamais un autre poste. Ne fonctionne que si le bridge y est démarré.
  const handleForceSync = async () => {
    setSyncingMails(true);
    try {
      const response = await fetch('http://127.0.0.1:5001/sync', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const mailsSynced = result?.results?.mails?.sent ?? 0;
      toast.success(
        mailsSynced > 0
          ? `${mailsSynced} nouveau${mailsSynced > 1 ? 'x' : ''} mail${mailsSynced > 1 ? 's' : ''} synchronisé${mailsSynced > 1 ? 's' : ''}`
          : 'Synchro terminée, rien de nouveau'
      );
      await loadMailsByTab(activeTab);
      if (activeTab === 'conversation_client') {
        await loadUntreatedClients();
      }
    } catch (error) {
      console.error('Erreur synchro bridge:', error);
      toast.error('Bridge introuvable sur cet ordinateur - lance launcher.bat puis réessaie');
    } finally {
      setSyncingMails(false);
    }
  };

  // Récupération complète ponctuelle (ex: nouvelle boîte mail à importer
  // intégralement) - 210 jours (~7 mois) couvre large, le surplus ne coûte
  // rien (Outlook ne retourne que ce qui existe réellement) et le backend
  // dédoublonne via duplicateKey donc aucun risque à la relancer.
  const handleFullBackfill = async () => {
    setBackfilling(true);
    toast.info('Récupération complète en cours - ça peut prendre plusieurs minutes...');
    try {
      const response = await fetch('http://127.0.0.1:5001/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycles: ['mails'], days_back: 210 }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const mailsSynced = result?.results?.mails?.sent ?? 0;
      toast.success(`Récupération complète terminée : ${mailsSynced} mail${mailsSynced > 1 ? 's' : ''} importé${mailsSynced > 1 ? 's' : ''}`);
      await loadMailsByTab(activeTab);
      if (activeTab === 'conversation_client') {
        await loadUntreatedClients();
      }
    } catch (error) {
      console.error('Erreur récupération complète:', error);
      toast.error('Bridge introuvable sur cet ordinateur - lance launcher.bat puis réessaie');
    } finally {
      setBackfilling(false);
    }
  };

  const toggleClientFilter = (clientId: string) => {
    setSelectedClientFilter((prev) => (prev === clientId ? null : clientId));
  };

  const handleMailUpdate = async (mail: HubMail) => {
    try {
      // Actualiser les données après modification
      const freshMails = await loadMailsByTab(activeTab);
      if (activeTab === 'conversation_client') {
        await loadUntreatedClients();
      }
      setSelectedMail(mail);
      // Le fil (statuts, éventuelle nouvelle réponse) peut avoir changé -
      // on le recalcule sur les données fraîches pour garder le panneau
      // synchronisé sans le fermer.
      const key = threadKeyFor(mail);
      setThreadSiblings(freshMails.filter((m) => threadKeyFor(m) === key));
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

  const filteredMails = selectedClientFilter
    ? mails.filter((m) => m.clientId === selectedClientFilter)
    : mails;

  const threads = useMemo(() => groupMailsIntoThreads(filteredMails), [filteredMails]);

  // Ouvre un fil : sélectionne en priorité le message encore "à traiter"
  // le plus ancien (celui qui a vraiment besoin d'attention), sinon le
  // plus récent du fil.
  const handleOpenThread = (thread: (typeof threads)[number]) => {
    const untreated = thread.messages.find((m) => m.traitementStatus === 'a_traiter');
    setSelectedMail(untreated || thread.latest);
    setThreadSiblings(thread.messages);
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
                    Interne
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
                <div className="mb-6 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher dans les mails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handleForceSync}
                    disabled={syncingMails}
                    variant="outline"
                    className="shrink-0 gap-2"
                    title="Récupérer les nouveaux mails depuis le bridge lancé sur cet ordinateur (launcher.bat)"
                  >
                    {syncingMails ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Forcer la synchro mails
                  </Button>
                  <Button
                    onClick={handleFullBackfill}
                    disabled={backfilling}
                    variant="outline"
                    className="shrink-0 gap-2"
                    title="Récupérer tout l'historique disponible (~7 mois) d'un coup - utile une fois, par ex. pour une nouvelle boîte mail"
                  >
                    {backfilling ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <History className="w-4 h-4" />
                    )}
                    Récupération complète
                  </Button>
                  {activeTab === 'interne_externe' && (
                    <Button
                      onClick={handleAutoMatch}
                      disabled={autoMatching}
                      variant="outline"
                      className="shrink-0 gap-2"
                      title="Identifier automatiquement le client de ces mails (email ou nom trouvé)"
                    >
                      {autoMatching ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Identifier les clients
                    </Button>
                  )}
                </div>

                {/* Cartouches de tri par client - Conversation Client uniquement,
                    une par client ayant au moins un mail "à traiter" */}
                {activeTab === 'conversation_client' && untreatedClients.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {untreatedClients.map((client) => {
                      const active = selectedClientFilter === client.clientId;
                      return (
                        <button
                          key={client.clientId}
                          onClick={() => toggleClientFilter(client.clientId)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {client.clientName} ({client.count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Mail List */}
                <TabsContent value={activeTab} className="mt-0">
                  {threads.length === 0 ? (
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
                      {threads.map((thread) => {
                        const mail = thread.latest;
                        const hasUnread = thread.messages.some((m) => !m.read);
                        return (
                          <Card
                            key={thread.key}
                            className="p-4 cursor-pointer hover:shadow-lg transition-all"
                            onClick={() => handleOpenThread(thread)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {mail.subject}
                                  </p>
                                  <Badge className={getStatusColor(thread.status)}>
                                    {getStatusLabel(thread.status)}
                                  </Badge>
                                  {thread.count > 1 && (
                                    <span className="shrink-0 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                                      {thread.count} messages
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{mail.from}</p>
                                <p className="text-sm text-gray-500 truncate">{mail.body.substring(0, 80)}</p>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(mail.sentAt)}</p>
                                {hasUnread && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 ml-auto"></div>}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
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
          siblings={threadSiblings}
          onSelectSibling={setSelectedMail}
          onClose={() => {
            setSelectedMail(null);
            setThreadSiblings([]);
          }}
          onUpdate={handleMailUpdate}
        />
      )}
    </>
  );
}
