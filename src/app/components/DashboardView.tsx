import React, { useEffect, useState } from 'react';
import { MetricsCard } from './MetricsCard';
import { KanbanBoard } from './KanbanBoard';
import { apiBaseUrl } from '../utils/supabase/info';

// Force rebuild - Cache bust

interface Metrics {
  rdvAujourdHui: number;
  rdvCetteSemaine: number;
  tachesAujourdHui: number;
  caTotal: number;
  mailsATraiter: number;
  suiviDossiers: number;
}

interface DashboardViewProps {
  session: any;
}

export function DashboardView({ session }: DashboardViewProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const token = session?.access_token || localStorage.getItem('auth_token');
      const response = await fetch(`${apiBaseUrl}/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">✅ NOUVEAU DASHBOARD - JUILLET 2026</h2>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre pipeline client (8-statuts)</p>
      </div>

      {/* 6 CARDS DE MÉTRIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricsCard
          icon="📞"
          title="RDV Aujourd'hui"
          value={metrics?.rdvAujourdHui || 0}
          color="blue"
        />
        <MetricsCard
          icon="📅"
          title="RDV Cette Semaine"
          value={metrics?.rdvCetteSemaine || 0}
          color="blue"
        />
        <MetricsCard
          icon="📋"
          title="Tâches Aujourd'hui"
          value={metrics?.tachesAujourdHui || 0}
          color="purple"
        />
        <MetricsCard
          icon="💰"
          title="Chiffre d'Affaires"
          value={`${(metrics?.caTotal || 0).toLocaleString()} €`}
          color="green"
        />
        <MetricsCard
          icon="📧"
          title="Mails à Traiter"
          value={metrics?.mailsATraiter || 0}
          color="orange"
        />
        <MetricsCard
          icon="📊"
          title="Suivi Dossiers"
          value={metrics?.suiviDossiers || 0}
          color="teal"
        />
      </div>

      {/* KANBAN BOARD */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pipeline par Statut</h2>
        <KanbanBoard
          token={session?.access_token || localStorage.getItem('auth_token')}
          onClientClick={(clientId) => console.log('Click client:', clientId)}
        />
      </div>
    </div>
  );
}
