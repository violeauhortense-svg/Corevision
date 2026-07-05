import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Mail, Phone, Euro, X, Trash2 } from 'lucide-react';
import { ClientDetailView } from './client-detail';
import { toast } from 'sonner';
import { useClients } from '../hooks/useClients';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  patrimoine?: number;
  statut: string;
  date_creation?: string;
  createdAt?: string;
  conseiller_id?: string;
}

interface ClientsViewProps {
  session: any;
  selectedClientId?: string | null;
  openTasksTab?: boolean;
}

export function ClientsView({ session, selectedClientId: initialClientId, openTasksTab }: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  // 🎯 NOUVEAU : Utilisation du hook centralisé
  const { 
    clients, 
    loading, 
    error, 
    fromCache, 
    refresh, 
    createClient, 
    deleteClient 
  } = useClients();
  
  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    statut: 'Prospect',
  });
  const [submitting, setSubmitting] = useState(false);

  // Afficher un indicateur si les données viennent du cache
  useEffect(() => {
    if (fromCache && clients.length > 0) {
      console.log('💾 Clients chargés depuis le cache');
    }
  }, [fromCache, clients]);

  // Afficher les erreurs
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      // 🎯 NOUVEAU : Utilisation du service centralisé
      const newClient = await createClient({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        statut: formData.statut,
      });

      if (newClient) {
        toast.success(`✅ Client ${newClient.prenom} ${newClient.nom} créé avec succès`);
        setShowCreateModal(false);
        setFormData({
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          statut: 'Prospect',
        });
        // Rafraîchir pour être sûr d'avoir les dernières données
        await refresh();
        // Ouvrir directement la fiche client
        setSelectedClientId(newClient.id);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la création du client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = () => {
    if (!clientToDelete) return;

    try {
      // 🎯 NOUVEAU : Utilisation du service centralisé
      deleteClient(clientToDelete.id);
      
      setClientToDelete(null);
      
      toast.success(`✅ Client ${clientToDelete.prenom} ${clientToDelete.nom} supprimé avec succès`);
      console.log(`🗑️ Client ${clientToDelete.id} et ses données associées supprimés`);
    } catch (error) {
      console.error('Erreur suppression client:', error);
      toast.error('Erreur lors de la suppression du client');
    }
  };

  const filteredClients = clients.filter((client) =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'R0 - Prospect': return 'bg-gray-100 text-gray-700';
      case 'R0-R1 - Découverte': return 'bg-blue-100 text-blue-700';
      case 'R1 - Audit patrimonial': return 'bg-indigo-100 text-indigo-700';
      case 'R1-R2 - Stratégie définie': return 'bg-purple-100 text-purple-700';
      case 'R2 - Recommandation proposée': return 'bg-green-100 text-green-700';
      case 'Rsuivi - Suivi patrimonial': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (selectedClientId) {
    return <ClientDetailView clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />; // Fixed: Removed invalid props
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900">Clients</h2>
        <p className="text-gray-600 mt-2">Gestion de votre portefeuille client</p>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5" />
            <span>Filtrer</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
            <span>Nouveau client</span>
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {clients.length === 0 ? 'Aucun client' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 mb-6">
              {clients.length === 0 
                ? 'Commencez par créer votre premier client' 
                : 'Aucun client ne correspond à votre recherche'}
            </p>
            {clients.length === 0 && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Créer mon premier client</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nom</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Patrimoine</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dernier contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{client.prenom} {client.nom}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{client.telephone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Euro className="w-4 h-4" />
                        <span className="font-medium">{client.patrimoine?.toLocaleString('fr-FR')} €</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.statut)}`}>
                        {client.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.date_creation || client.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedClientId(client.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Voir détails
                        </button>
                        <button
                          onClick={() => setClientToDelete(client)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Nouveau client</h3>
              <button 
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors" 
                onClick={() => setShowCreateModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jean.dupont@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut initial</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Découverte">Découverte</option>
                  <option value="Simulation">Simulation chiffrée</option>
                  <option value="Lettre Mission">Lettre de mission</option>
                  <option value="Rapport/Audit">Rapport/Audit</option>
                  <option value="Suivi MEP">Suivi MEP</option>
                  <option value="Suivi CSP">Suivi CSP</option>
                  <option value="Arbitrage">Arbitrage de rémunération</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </span>
                  ) : (
                    'Créer le client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Supprimer le client</h3>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-900">
                Vous êtes sur le point de supprimer le client <strong>{clientToDelete.prenom} {clientToDelete.nom}</strong>.
              </p>
              <p className="text-sm text-red-800 mt-2">
                Toutes les données associées seront supprimées : tâches, documents, patrimoine, revenus, etc.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteClient}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}