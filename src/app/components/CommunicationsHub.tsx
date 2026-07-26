import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { Mail, Archive, Clock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { communicationsAPI } from '../services/communicationsAPI';
import { toast } from 'sonner';

interface Communication {
  id: string;
  source: string;
  category: 'conversation_client' | 'interne' | 'archive' | 'en_attente';
  status: 'à_traiter' | 'traité' | 'terminé';
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  updatedAt: string;
  attachments?: any[];
  tags?: string[];
}

interface Hub {
  conversation_client: Communication[];
  interne: Communication[];
  archive: Communication[];
  en_attente: Communication[];
  stats: {
    totalReceived: number;
    unread: number;
    toProcess: number;
    processed: number;
    archived: number;
  };
}

const categoryLabels: Record<string, string> = {
  conversation_client: '💬 Conversations Clients',
  interne: '🏢 Interne',
  archive: '📦 Archives',
  en_attente: '⏳ En Attente',
};

const statusLabels: Record<string, string> = {
  à_traiter: '🔴 À Traiter',
  traité: '🟡 Traité',
  terminé: '✅ Terminé',
};

export function CommunicationsHub() {
  const [hub, setHub] = useState<Hub | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'conversation_client' | 'interne' | 'archive' | 'en_attente'>('en_attente');

  useEffect(() => {
    loadHub();
  }, []);

  const loadHub = async () => {
    try {
      setLoading(true);
      const response = await communicationsAPI.getHub();
      setHub(response.hub);
    } catch (error) {
      console.error('❌ Erreur chargement hub:', error);
      toast.error('Impossible de charger le hub');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClient = async (commId: string, clientId: string, clientName: string) => {
    try {
      await communicationsAPI.assignMailToClient(commId, clientId, clientName);
      toast.success(`Mail assigné à ${clientName}`);
      loadHub();
    } catch (error) {
      console.error('❌ Erreur assignation:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const handleArchive = async (commId: string, clientId?: string) => {
    try {
      await communicationsAPI.archiveMailToClientHistory(commId, clientId || '');
      toast.success('Mail archivé');
      loadHub();
    } catch (error) {
      console.error('❌ Erreur archivage:', error);
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const handleComplete = async (commId: string) => {
    try {
      await communicationsAPI.completeMail(commId);
      toast.success('Mail marqué comme terminé');
      loadHub();
    } catch (error) {
      console.error('❌ Erreur completion:', error);
      toast.error('Erreur lors de la completion');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="text-center">
          <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Chargement du hub...</p>
        </div>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erreur lors du chargement du hub</p>
          <button
            onClick={loadHub}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Réessayer
          </button>
        </Card>
      </div>
    );
  }

  const currentMails = hub[selectedCategory] || [];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Hub Communication</h1>
          </div>
          <p className="text-gray-600">Gérez vos communications par catégorie</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{hub.stats.totalReceived}</div>
            <div className="text-xs text-gray-600">Total reçus</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{hub.stats.toProcess}</div>
            <div className="text-xs text-gray-600">À traiter</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{hub.stats.processed}</div>
            <div className="text-xs text-gray-600">Traités</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{hub.stats.archived}</div>
            <div className="text-xs text-gray-600">Archivés</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{hub.stats.unread}</div>
            <div className="text-xs text-gray-600">Non lus</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="en_attente" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                onClick={() => setSelectedCategory(key as any)}
                className="text-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => (
            <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
              <div className="space-y-4">
                {currentMails.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun mail dans cette catégorie</p>
                  </Card>
                ) : (
                  currentMails.map((mail) => (
                    <Card
                      key={mail.id}
                      className={`p-4 border-l-4 hover:shadow-lg transition ${
                        mail.status === 'à_traiter'
                          ? 'border-l-red-500 bg-red-50'
                          : mail.status === 'traité'
                          ? 'border-l-yellow-500 bg-yellow-50'
                          : 'border-l-green-500 bg-green-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{mail.subject}</h3>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {mail.source}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">De: {mail.from}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(mail.receivedAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {mail.status === 'à_traiter' && (
                            <>
                              <button
                                onClick={() => handleComplete(mail.id)}
                                className="p-2 hover:bg-green-200 rounded text-green-600"
                                title="Marquer comme traité"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {categoryKey !== 'archive' && (
                            <button
                              onClick={() => handleArchive(mail.id)}
                              className="p-2 hover:bg-gray-200 rounded text-gray-600"
                              title="Archiver"
                            >
                              <Archive className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{mail.body}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {mail.status === 'à_traiter' && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                              🔴 À traiter
                            </span>
                          )}
                          {mail.status === 'traité' && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                              🟡 Traité
                            </span>
                          )}
                          {mail.status === 'terminé' && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              ✅ Terminé
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
