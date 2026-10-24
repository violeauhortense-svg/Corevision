import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, RefreshCw, Filter, RotateCcw, Users, X } from 'lucide-react';
import { clientAPI } from '../services/api';
import { STATUS_LABELS, STATUS_COLORS, STATUS_SUBLABELS, SERVICE_LABELS, VENDEUR_LABELS, formatEuro } from './client-detail/RecommandationsModule';
import type { AuditRecommendation, AuditRecommendationStatus, AuditRecommendationService, AuditRecommendationVendeur } from './client-detail/types';

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

// Un CA "Proposée" n'est ni signé ni envoyé, "Refusée" est une
// opportunité perdue - aucun des deux ne doit compter dans un total de
// chiffre d'affaires, seulement à partir d'"Acceptée".
function countsTowardCA(status: AuditRecommendationStatus): boolean {
  return status !== 'refusee' && status !== 'proposee';
}

type DateFilterField = 'createdDate' | 'acceptedDate' | 'paymentDate' | 'signatureDate';

const DATE_FIELD_LABELS: Record<DateFilterField, string> = {
  createdDate: 'Date de création',
  acceptedDate: "Date d'acceptation",
  paymentDate: 'Date de règlement',
  signatureDate: 'Date de signature',
};

export function RecommandationsGlobalView({ onNavigateToClient }: RecommandationsGlobalViewProps) {
  const [loading, setLoading] = useState(true);
  const [recos, setRecos] = useState<RecoWithClient[]>([]);
  // Filtrage par statut et par service - multi-sélection (aucune case
  // cochée = pas de filtre sur cette dimension).
  const [statusFilter, setStatusFilter] = useState<Set<AuditRecommendationStatus>>(new Set());
  const [serviceFilter, setServiceFilter] = useState<Set<AuditRecommendationService>>(new Set());
  const [showSynthese, setShowSynthese] = useState(false);
  const [syntheseMode, setSyntheseMode] = useState<'statut' | 'service'>('statut');
  // Filtre par date dans la synthèse - sur un ou plusieurs champs à la
  // fois (création, acceptation, règlement, signature : une recommandation
  // correspond dès qu'AU MOINS UN des champs cochés tombe dans la plage),
  // plage du/au, les deux bornes optionnelles.
  const [syntheseDateFields, setSyntheseDateFields] = useState<Set<DateFilterField>>(new Set());
  const [syntheseDateFrom, setSyntheseDateFrom] = useState('');
  const [syntheseDateTo, setSyntheseDateTo] = useState('');

  const toggleSyntheseDateField = (field: DateFilterField) => {
    setSyntheseDateFields((prev) => {
      const next = new Set(prev);
      next.has(field) ? next.delete(field) : next.add(field);
      return next;
    });
  };

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

  const totalCA = recos.filter((r) => countsTowardCA(r.status)).reduce((sum, r) => sum + (r.chiffreAffaires || 0), 0);

  // Synthèse CA par personne (venduPar) - calculée sur filteredRecos pour
  // que le cumul reflète les filtres statut/service déjà choisis plutôt
  // que de repartir de tout le portefeuille à chaque fois, puis affinée
  // par la plage de date de la synthèse elle-même. "Refusée" et
  // "Proposée" ne comptent pour aucun CA (opportunité perdue / pas encore
  // signée ni envoyée) mais restent visibles en nombre pour ne pas faire
  // disparaître ces lignes silencieusement.
  const syntheseDateActive = (syntheseDateFrom || syntheseDateTo) && syntheseDateFields.size > 0;
  const matchesDateRange = (value: string) => {
    const time = new Date(value).getTime();
    if (syntheseDateFrom && time < new Date(syntheseDateFrom).getTime()) return false;
    if (syntheseDateTo && time > new Date(syntheseDateTo).getTime() + 86400000 - 1) return false;
    return true;
  };
  const synthRecos = filteredRecos.filter((r) => {
    if (!syntheseDateActive) return true;
    // Une recommandation correspond dès qu'AU MOINS UN des champs cochés
    // a une valeur dans la plage - les champs cochés sans valeur pour
    // cette recommandation sont simplement ignorés, pas excluants à eux
    // seuls.
    return [...syntheseDateFields].some((field) => {
      const value = r[field];
      return Boolean(value) && matchesDateRange(value as string);
    });
  });

  const UNASSIGNED = '__unassigned__';
  const vendeurKeys = [...(Object.keys(VENDEUR_LABELS) as AuditRecommendationVendeur[]), UNASSIGNED];
  const syntheseParPersonne = vendeurKeys
    .map((v) => {
      const items = synthRecos.filter((r) => (r.venduPar || UNASSIGNED) === v);
      if (items.length === 0) return null;
      const totalCA = items.filter((r) => countsTowardCA(r.status)).reduce((s, r) => s + (r.chiffreAffaires || 0), 0);
      const byStatus = STATUS_ORDER.map((status) => {
        const statusItems = items.filter((r) => r.status === status);
        return {
          status,
          count: statusItems.length,
          ca: statusItems.reduce((s, r) => s + (r.chiffreAffaires || 0), 0),
        };
      }).filter((g) => g.count > 0);
      const byService = (Object.keys(SERVICE_LABELS) as AuditRecommendationService[])
        .map((service) => {
          const serviceItems = items.filter((r) => r.service === service && countsTowardCA(r.status));
          return {
            service,
            count: serviceItems.length,
            ca: serviceItems.reduce((s, r) => s + (r.chiffreAffaires || 0), 0),
          };
        })
        .filter((g) => g.count > 0);
      return { vendeur: v, count: items.length, totalCA, byStatus, byService };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => b.totalCA - a.totalCA);

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
              <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">CA (à partir d'Acceptée)</p>
              <p className="text-3xl font-bold">{formatEuro(totalCA)}</p>
            </div>
            <button
              onClick={() => setShowSynthese(true)}
              disabled={filteredRecos.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Users className="w-4 h-4" />
              Synthèse CA par personne
            </button>
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
                  {countsTowardCA(status) && <span className="font-bold">{formatEuro(groupCA)}</span>}
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
                        </div>

                        {(r.acceptedDate || r.paymentDate || r.signatureDate) && (
                          <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-gray-500">
                            {r.acceptedDate && <span>✅ Acceptée le {new Date(r.acceptedDate).toLocaleDateString('fr-FR')}</span>}
                            {r.paymentDate && <span>💶 Réglée le {new Date(r.paymentDate).toLocaleDateString('fr-FR')}</span>}
                            {r.signatureDate && <span>✍️ Signée le {new Date(r.signatureDate).toLocaleDateString('fr-FR')}</span>}
                          </div>
                        )}
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

      {/* Synthèse CA par personne - calculée sur filteredRecos, donc sur
          les mêmes filtres statut/service que la liste en dessous. */}
      {showSynthese && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Synthèse CA par personne
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {filtersActive
                    ? 'Sur les recommandations correspondant aux filtres actifs ci-dessous'
                    : 'Sur l\'ensemble des recommandations'}
                  {' '}(CA à partir d'Acceptée uniquement)
                </p>
              </div>
              <button onClick={() => setShowSynthese(false)} className="p-1 hover:bg-white/20 rounded-lg shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bascule statut/service - l'un ou l'autre, pas les deux empilés */}
            <div className="px-5 pt-4 flex items-center gap-2">
              <button
                onClick={() => setSyntheseMode('statut')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  syntheseMode === 'statut' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Par statut
              </button>
              <button
                onClick={() => setSyntheseMode('service')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  syntheseMode === 'service' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Par service
              </button>
            </div>

            {/* Filtre par date - un ou plusieurs champs à la fois (une
                recommandation correspond dès qu'UN des champs cochés tombe
                dans la plage), plage du/au optionnelle */}
            <div className="px-5 pt-3">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Date(s)</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DATE_FIELD_LABELS) as DateFilterField[]).map((f) => {
                  const active = syntheseDateFields.has(f);
                  return (
                    <button
                      key={f}
                      onClick={() => toggleSyntheseDateField(f)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 ring-2 ring-offset-1 ring-emerald-500'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {DATE_FIELD_LABELS[f]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-5 pt-3 flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Du</label>
                <input
                  type="date"
                  value={syntheseDateFrom}
                  onChange={(e) => setSyntheseDateFrom(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Au</label>
                <input
                  type="date"
                  value={syntheseDateTo}
                  onChange={(e) => setSyntheseDateTo(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              {(syntheseDateFields.size > 0 || syntheseDateFrom || syntheseDateTo) && (
                <button
                  onClick={() => { setSyntheseDateFields(new Set()); setSyntheseDateFrom(''); setSyntheseDateTo(''); }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium pb-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser la date
                </button>
              )}
            </div>
            {syntheseDateFrom || syntheseDateTo ? (
              syntheseDateFields.size === 0 ? (
                <p className="px-5 pt-1.5 text-xs text-amber-600 italic">
                  Coche au moins une date ci-dessus pour appliquer la plage.
                </p>
              ) : (
                <p className="px-5 pt-1.5 text-xs text-gray-400 italic">
                  Une recommandation est incluse dès qu'une des dates cochées tombe dans la plage.
                </p>
              )
            ) : null}

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {syntheseParPersonne.map(({ vendeur, count, totalCA, byStatus, byService }) => (
                <div key={vendeur} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {vendeur === UNASSIGNED ? '❓ Non attribué' : VENDEUR_LABELS[vendeur as AuditRecommendationVendeur]}
                      <span className="text-gray-400 font-normal text-sm ml-2">({count})</span>
                    </span>
                    <span className="font-bold text-emerald-700">{formatEuro(totalCA)}</span>
                  </div>
                  <div className="p-4">
                    {syntheseMode === 'statut' ? (
                      <div className="space-y-1.5">
                        {byStatus.map(({ status, count, ca }) => (
                          <div key={status} className="flex items-center justify-between text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}>
                              {STATUS_LABELS[status]} ({count})
                            </span>
                            <span className="font-medium text-gray-900">
                              {countsTowardCA(status) ? formatEuro(ca) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : byService.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Aucun service renseigné</p>
                    ) : (
                      <div className="space-y-1.5">
                        {byService.map(({ service, count, ca }) => (
                          <div key={service} className="flex items-center justify-between text-sm">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-300">
                              {SERVICE_LABELS[service]} ({count})
                            </span>
                            <span className="font-medium text-gray-900">{formatEuro(ca)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Total {(filtersActive || syntheseDateActive) ? 'filtré' : ''} ({synthRecos.length} recommandation{synthRecos.length > 1 ? 's' : ''})
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {formatEuro(synthRecos.filter((r) => countsTowardCA(r.status)).reduce((s, r) => s + (r.chiffreAffaires || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
