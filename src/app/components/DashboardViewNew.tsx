import React, { useEffect, useState } from 'react';
import { MetricsCard } from './MetricsCard';
import { KanbanBoard } from './KanbanBoard';
import { apiBaseUrl } from '../utils/supabase/info';

interface Metrics {
  rdvAujourdHui: number;
  rdvCetteSemaine: number;
  tachesAujourdHui: number;
  caTotal: number;
  mailsATraiter: number;
  suiviDossiers: number;
}

export const DashboardViewNew: React.FC<{ token?: string; onClientClick: (clientId: string) => void }> = ({
  token,
  onClientClick
}) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, [token]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/make-server-cac859af/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('❌ Erreur chargement metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-lg">Chargement du tableau de bord...</div>;

  return (
    <div className="w-full">
      {/* 6 CARDS DE MÉTRIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricsCard
          icon="📞"
          title="RDV Aujourd'hui"
          value={metrics?.rdvAujourdHui || 0}
          color="blue"
          onClick={() => console.log('RDV Auj')}
        />
        <MetricsCard
          icon="📅"
          title="RDV Cette Semaine"
          value={metrics?.rdvCetteSemaine || 0}
          color="blue"
          onClick={() => console.log('RDV Sem')}
        />
        <MetricsCard
          icon="📋"
          title="Tâches Aujourd'hui"
          value={metrics?.tachesAujourdHui || 0}
          color="purple"
          onClick={() => console.log('Taches')}
        />
        <MetricsCard
          icon="💰"
          title="Chiffre d'Affaires"
          value={`${(metrics?.caTotal || 0).toLocaleString()} €`}
          color="green"
          onClick={() => console.log('CA')}
        />
        <MetricsCard
          icon="📧"
          title="Mails à Traiter"
          value={metrics?.mailsATraiter || 0}
          color="orange"
          onClick={() => console.log('Mails')}
        />
        <MetricsCard
          icon="📋"
          title="Suivi Dossiers"
          value={metrics?.suiviDossiers || 0}
          color="teal"
          onClick={() => console.log('Dossiers')}
        />
      </div>

      {/* KANBAN BOARD */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pipeline par Statut</h2>
        <KanbanBoard token={token} onClientClick={onClientClick} />
      </div>
    </div>
  );
};
