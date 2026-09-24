import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { clientAPI } from '../services/api';
import { STATUS_LABELS, STATUS_COLORS, VENDEUR_LABELS, formatEuro } from './client-detail/RecommandationsModule';
import type { AuditRecommendation, AuditRecommendationStatus } from './client-detail/types';

interface RecommandationsGlobalViewProps {
  onNavigateToClient: (clientId: string) => void;
}

interface RecoWithClient extends AuditRecommendation {
  clientId: string;
  clientName: string;
}

// Ordre du pipeline plutôt qu'alphabétique - "Refusée" en dernier car c'est
// un état terminal qui ne représente plus une opportunité active.
const STATUS_ORDER: AuditRecommendationStatus[] = [
  'proposee',
  'acceptee',
  'en_cours',
  'acte_finalise',
  'termine',
  'refusee',
];

export function RecommandationsGlobalView({ onNavigateToClient }: RecommandationsGlobalViewProps) {
  const [loading, setLoading] = useState(true);
  const [recos, setRecos] = useState<RecoWithClient[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const clients = await clientAPI.getAll();
      const all: RecoWithClient[] = [];
      (clients || []).forEach((c: any) => {
        (c.auditRecommendations || []).forEach((r: AuditRecommendation) => {
          all.push({
            ...r,
            clientId: c.id,
            clientName: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client sans nom',
          });
        });
      });
      setRecos(all);
    } catch (err) {
      console.error('❌ Erreur chargement recommandations globales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: recos
      .filter((r) => r.status === status)
      .sort((a, b) => new Date(b.updatedDate || b.createdDate).getTime() - new Date(a.updatedDate || a.createdDate).getTime()),
  })).filter((g) => g.items.length > 0);

  const totalCA = recos.filter((r) => r.status !== 'refusee').reduce((sum, r) => sum + (r.chiffreAffaires || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* En-tête + CA total */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-7 h-7" />
              Recommandations
            </h1>
            <p className="text-emerald-100 text-sm mt-1">Toutes les recommandations, tous clients confondus</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">CA potentiel (hors refusées)</p>
              <p className="text-3xl font-bold">{formatEuro(totalCA)}</p>
            </div>
            <button
              onClick={load}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0"
              title="Rafraîchir"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {recos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          Aucune recommandation enregistrée pour le moment
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ status, items }) => {
            const groupCA = items.reduce((sum, r) => sum + (r.chiffreAffaires || 0), 0);
            return (
              <div key={status} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className={`px-5 py-3 border-b flex items-center justify-between ${STATUS_COLORS[status]}`}>
                  <span className="font-semibold">{STATUS_LABELS[status]} ({items.length})</span>
                  {status !== 'refusee' && <span className="font-bold">{formatEuro(groupCA)}</span>}
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((r) => (
                    <button
                      key={`${r.clientId}-${r.id}`}
                      onClick={() => onNavigateToClient(r.clientId)}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{r.title}</span>
                          <span className="text-xs text-blue-600 font-medium">→ {r.clientName}</span>
                        </div>
                        {r.detail && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.detail}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-gray-500">
                          {r.venduPar && <span>{VENDEUR_LABELS[r.venduPar]}</span>}
                          <span>
                            {new Date(r.updatedDate || r.createdDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">{formatEuro(r.chiffreAffaires)}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
