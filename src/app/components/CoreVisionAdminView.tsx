import { useState } from 'react';
import { Package, Clock, CheckCircle, Loader2, RefreshCw, Trash2, Eye, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { CoreVisionAdminDetailModal } from './CoreVisionAdminDetailModal';
import { useCoreVision } from '../hooks/useCoreVision';
import type { CoreVisionOrder } from '../services/corevisionService';

export function CoreVisionAdminView() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<CoreVisionOrder | null>(null);
  
  // 🎯 NOUVEAU : Utilisation du hook centralisé
  const { 
    orders, 
    loading, 
    error, 
    fromCache, 
    refresh, 
    updateOrder, 
    deleteOrder 
  } = useCoreVision();

  // 🐛 DEBUG : Afficher ce qui est chargé

  // Afficher les erreurs
  if (error && orders.length === 0) {
    toast.error(error);
  }

  const updateOrderStatus = async (
    orderId: string, 
    status: 'pending' | 'in_progress' | 'completed', 
    notes?: string
  ) => {
    try {
      const updated = await updateOrder(orderId, {
        status,
        adminNotes: notes,
      });

      if (updated) {
        toast.success('✅ Statut mis à jour');
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('❌ Erreur lors de la mise à jour');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;

    try {
      const success = await deleteOrder(orderId);

      if (success) {
        toast.success('✅ Commande supprimée');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('❌ Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            <Loader2 className="w-3 h-3 animate-spin" />
            En cours
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Terminé
          </span>
        );
      default:
        return null;
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            Commandes CoreVision
          </h2>
          <p className="text-gray-600 mt-2">Gérez toutes les demandes des CGP</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`p-6 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-xl'
              : 'bg-white border-2 border-gray-200 hover:border-purple-300'
          }`}
        >
          <p className={`text-sm mb-1 ${filter === 'all' ? 'text-purple-100' : 'text-gray-600'}`}>
            Total
          </p>
          <p className="text-4xl font-bold">{stats.total}</p>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`p-6 rounded-xl transition-all ${
            filter === 'pending'
              ? 'bg-orange-500 text-white shadow-xl'
              : 'bg-white border-2 border-gray-200 hover:border-orange-300'
          }`}
        >
          <p className={`text-sm mb-1 ${filter === 'pending' ? 'text-orange-100' : 'text-gray-600'}`}>
            En attente
          </p>
          <p className="text-4xl font-bold">{stats.pending}</p>
        </button>

        <button
          onClick={() => setFilter('in_progress')}
          className={`p-6 rounded-xl transition-all ${
            filter === 'in_progress'
              ? 'bg-blue-500 text-white shadow-xl'
              : 'bg-white border-2 border-gray-200 hover:border-blue-300'
          }`}
        >
          <p className={`text-sm mb-1 ${filter === 'in_progress' ? 'text-blue-100' : 'text-gray-600'}`}>
            En cours
          </p>
          <p className="text-4xl font-bold">{stats.in_progress}</p>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`p-6 rounded-xl transition-all ${
            filter === 'completed'
              ? 'bg-green-500 text-white shadow-xl'
              : 'bg-white border-2 border-gray-200 hover:border-green-300'
          }`}
        >
          <p className={`text-sm mb-1 ${filter === 'completed' ? 'text-green-100' : 'text-gray-600'}`}>
            Terminés
          </p>
          <p className="text-4xl font-bold">{stats.completed}</p>
        </button>
      </div>

      {/* Liste des commandes */}
      {filteredOrders.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Aucune commande CoreVision pour le moment'
              : `Aucune commande avec le statut "${filter}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{order.clientName}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      CGP: {order.cgpName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.validatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                    }}
                    className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.orderId)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Objectifs */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  📋 Objectifs ({order.objectifs.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.objectifs.slice(0, 3).map((obj: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {obj.categorie}
                    </span>
                  ))}
                  {order.objectifs.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      +{order.objectifs.length - 3} autres
                    </span>
                  )}
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex gap-2 mt-4">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.orderId, 'in_progress')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Démarrer le traitement
                  </button>
                )}
                {order.status === 'in_progress' && (
                  <button
                    onClick={() => updateOrderStatus(order.orderId, 'completed')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Marquer comme terminé
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails */}
      {selectedOrder && (
        <CoreVisionAdminDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={refresh}
        />
      )}
    </div>
  );
}
