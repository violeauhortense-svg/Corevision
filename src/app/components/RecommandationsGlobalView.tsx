import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, RefreshCw, Filter, RotateCcw } from 'lucide-react';
import { clientAPI } from '../services/api';
import { STATUS_LABELS, STATUS_COLORS, STATUS_SUBLABELS, SERVICE_LABELS, VENDEUR_LABELS, formatEuro } from './client-detail/RecommandationsModule';
import type { AuditRecommendation, AuditRecommendationStatus, AuditRecommendationService } from './client-detail/types';

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
  // Filtrage par statut et par service - multi-sélection (aucune case
  // cochée = pas de filtre sur cette dimension).
  const [statusFilter, setStatusFilter] = useState<Set<AuditRecommendationStatus>>(new Set());
  const [serviceFilter, setServiceFilter] = useState<Set<AuditRecommendationService>>(new Set());

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

  const toggleStatusFilter = (status: AuditRecommendationStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const toggleServiceFilter = (service: AuditRecommendationService) => {
    setServiceFilter((prev) => {
      const next = new Set(prev);
      next.has(service) ? next.delete(service) : next.add(service);
      return next;
    });
  };

  const resetFilters = () => {
    setStatusFilter(new Set());
    setServiceFilter(new Set());
  };

  const filtersActive = statusFilter.size > 0 || serviceFilter.size > 0;

  const filteredRecos = recos.filter((r) => {
    if (statusFilter.size > 0 && !statusFilter.has(r.status)) return false;
    if (serviceFilter.size > 0 && (!r.service || !serviceFilter.has(r.service))) return false;
    return true;
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: filteredRecos
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

      {/* Filtres par statut et par service */}
      {recos.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Filter className="w-4 h-4" />
              Filtres
            </div>
            {filtersActive && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((status) => {
                const count = recos.filter((r) => r.status === status).length;
                const active = statusFilter.has(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    disabled={count === 0}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      STATUS_SUBLABELS[status] ? 'flex flex-col items-start leading-tight py-1' : ''
                    } ${
                      active
                        ? `${STATUS_COLORS[status]} ring-2 ring-offset-1 ring-emerald-500`
                        : count === 0
                        ? STATUS_COLORS[status]
                        : `${STATUS_COLORS[status]} opacity-60 hover:opacity-100`
                    }`}
                  >
                    <span>{STATUS_LABELS[status]} ({count})</span>
                    {STATUS_SUBLABELS[status] && (
                      <span className="text-[10px] font-normal opacity-75">{STATUS_SUBLABELS[status]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Service</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SERVICE_LABELS) as AuditRecommendationService[]).map((service) => {
                const count = recos.filter((r) => r.service === service).length;
                const active = serviceFilter.has(service);
                return (
                  <button
                    key={service}
                    onClick={() => toggleServiceFilter(service)}
                    disabled={count === 0}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      active
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300 ring-2 ring-offset-1 ring-emerald-500'
                        : count === 0
                        ? 'bg-indigo-50 text-indigo-400 border-indigo-100'
                        : 'bg-indigo-100 text-indigo-700 border-indigo-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {SERVICE_LABELS[service]} ({count})
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1.5 italic">
              Le service n'est renseigné qu'à partir du statut « Acceptée » - les recommandations encore « Proposée » n'apparaîtront pas dans ce filtre.
            </p>
          </div>
        </div>
      )}

      {recos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          Aucune recommandation enregistrée pour le moment
        </div>
      ) : filteredRecos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          <Filter className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="mb-2">Aucune recommandation ne correspond aux filtres</p>
          <button onClick={resetFilters} className="text-sm text-emerald-700 hover:underline font-medium">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ status, items }) => {
            const groupCA = items.reduce((sum, r) => sum + (r.chiffreAffaires || 0), 0);
            return (
              <div key={status} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className={`px-5 py-3 border-b flex items-center justify-between ${STATUS_COLORS[status]}`}>
                  <span className="flex items-baseline gap-2">
                    <span className="font-semibold">{STATUS_LABELS[status]} ({items.length})</span>
                    {STATUS_SUBLABELS[status] && (
                      <span className="text-xs font-normal opacity-75">{STATUS_SUBLABELS[status]}</span>
                    )}
                  </span>
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
                          {r.service && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-300 font-medium">
                              {SERVICE_LABELS[r.service]}
                            </span>
                          )}
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
