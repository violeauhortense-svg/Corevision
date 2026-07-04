import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Mail, Send, Inbox, MessageSquare, FileText } from 'lucide-react';
import { MailTemplatesTab } from './MailTemplatesTab';
import { MailConversationsTab } from './MailConversationsTab';
import { MailInboxTab } from './MailInboxTab';
import { MailInternalTab } from './MailInternalTab';
import { MailStatsHeader } from './MailStatsHeader';
import type { MailStats } from '../../types/mail';

export function MailsView() {
  const [stats, setStats] = useState<MailStats>({
    totalSent: 0,
    totalReceived: 0,
    unreadCount: 0,
    openRate: 0,
    responseRate: 0,
    avgResponseTime: 0,
    templatesUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Implémenter l'appel API pour récupérer les statistiques
      // Pour le moment, données de démonstration
      setStats({
        totalSent: 124,
        totalReceived: 89,
        unreadCount: 7,
        openRate: 68.5,
        responseRate: 45.2,
        avgResponseTime: 4.3,
        templatesUsed: 32,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques mail:', error);
    } finally {
      setLoading(false);
    }
  };

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
                Hub Communication
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez tous vos échanges clients et équipe
              </p>
            </div>
          </div>
        </div>

        {/* Stats Header */}
        <MailStatsHeader stats={stats} loading={loading} />

        {/* Tabs */}
        <Card className="mt-6 shadow-xl border-gray-200">
          <Tabs defaultValue="conversations" className="w-full">
            <div className="border-b border-gray-200 bg-gray-50 px-6">
              <TabsList className="bg-transparent border-none gap-2">
                <TabsTrigger
                  value="conversations"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Conversations Clients
                </TabsTrigger>
                <TabsTrigger
                  value="inbox"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 relative"
                >
                  <Inbox className="w-4 h-4 mr-2" />
                  Boîte de réception
                  {stats.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {stats.unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Templates
                </TabsTrigger>
                <TabsTrigger
                  value="internal"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Messagerie Interne
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="conversations" className="mt-0">
                <MailConversationsTab onStatsUpdate={loadStats} />
              </TabsContent>

              <TabsContent value="inbox" className="mt-0">
                <MailInboxTab onStatsUpdate={loadStats} />
              </TabsContent>

              <TabsContent value="templates" className="mt-0">
                <MailTemplatesTab />
              </TabsContent>

              <TabsContent value="internal" className="mt-0">
                <MailInternalTab />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
