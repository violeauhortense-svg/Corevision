import React, { useEffect, useState } from 'react';
import { apiBaseUrl } from '../utils/api/info';

const STATUSES = [
  'Prospect',
  'Découverte',
  'Simulation',
  'Lettre Mission',
  'Rapport/Audit',
  'Suivi MEP',
  'Suivi CSP',
  'Arbitrage'
];

const COLORS = [
  'bg-gray-50 border-gray-300',
  'bg-blue-50 border-blue-300',
  'bg-pink-50 border-pink-300',
  'bg-green-50 border-green-300',
  'bg-orange-50 border-orange-300',
  'bg-gray-100 border-gray-400',
  'bg-green-100 border-green-400',
  'bg-yellow-50 border-yellow-300'
];

interface KanbanClient {
  id: string;
  nom: string;
  email: string;
  taskCount: number;
  dateNextRdv?: string;
  tauxCA: number;
}

interface KanbanColumn {
  count: number;
  actions: number;
  clients: KanbanClient[];
}

export const KanbanBoard: React.FC<{ token?: string; onClientClick: (clientId: string) => void }> = ({
  token,
  onClientClick
}) => {
  const [kanban, setKanban] = useState<Record<string, KanbanColumn>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKanban();
    const interval = setInterval(loadKanban, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, [token]);

  const loadKanban = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/dashboard/kanban`, {
        headers: {
          'Authorization': `Bearer ${token || getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setKanban(data);
      }
    } catch (err) {
      console.error('❌ Erreur chargement kanban:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Chargement du Kanban...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {STATUSES.map((status, idx) => {
        const column = kanban[status];
        const colorClass = COLORS[idx];

        return (
          <div
            key={status}
            className={`border-2 ${colorClass} rounded-lg p-4 min-h-96`}
          >
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-gray-800">{column?.count || 0}</div>
              <div className="text-sm font-semibold text-gray-600">{status}</div>
              <div className="text-xs text-gray-500">{column?.actions || 0} actions</div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {column?.clients?.map(client => (
                <div
                  key={client.id}
                  onClick={() => onClientClick(client.id)}
                  className="bg-white rounded-md p-2 border border-gray-200 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="font-semibold text-xs text-gray-800 line-clamp-1">{client.nom}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{client.email}</div>
                  {client.taskCount > 0 && (
                    <div className="text-xs font-bold text-blue-600 mt-1">📋 {client.taskCount} tâches</div>
                  )}
                  {client.tauxCA > 0 && (
                    <div className="text-xs text-green-600">💰 {client.tauxCA.toLocaleString()} €</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
