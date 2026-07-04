/**
 * 🎯 COMPOSANT - PANEL RECOMMANDATIONS INTELLIGENTES
 * 
 * Affichage des recommandations patrimoniales avec simulations
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Euro,
  Calendar,
  Lightbulb,
  Shield,
  Home,
  Users,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import type { RapportRecommandations, Recommandation } from '../services/recommandationsService';
import {
  getCategorieColor,
  getCategorieEmoji,
  getPrioriteColor,
  getPrioriteLabel,
  getScoreColor,
  formatEuros,
  formatPourcentage,
} from '../services/recommandationsService';

interface RecommandationsPanelProps {
  rapport: RapportRecommandations;
  loading?: boolean;
  onRefresh?: () => void;
}

export function RecommandationsPanel({ rapport, loading = false, onRefresh }: RecommandationsPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filtreCategorie, setFiltreCategorie] = useState<string>('all');
  const [filtrePriorite, setFiltrePriorite] = useState<string>('all');

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filtrer les recommandations
  const recommandationsFiltrees = rapport.recommandations.filter((rec) => {
    if (filtreCategorie !== 'all' && rec.categorie !== filtreCategorie) return false;
    if (filtrePriorite !== 'all' && rec.priorite !== filtrePriorite) return false;
    return true;
  });

  // Statistiques par catégorie
  const categories = Array.from(new Set(rapport.recommandations.map((r) => r.categorie)));

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Recommandations Intelligentes
            </h3>
            <p className="text-purple-100 text-sm mt-1">
              {rapport.totalRecommandations} recommandation(s) personnalisée(s)
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          )}
        </div>

        {/* Métriques clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="w-5 h-5" />
              <span className="text-sm text-purple-100">Gain potentiel</span>
            </div>
            <p className="text-2xl font-bold">{formatEuros(rapport.gainFiscalPotentielAnnuel)}/an</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-sm text-purple-100">Score optimisation</span>
            </div>
            <p className="text-2xl font-bold">{rapport.scoreOptimisation}/100</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm text-purple-100">Immédiates</span>
            </div>
            <p className="text-2xl font-bold">{rapport.recommandationsImmédiates}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm text-purple-100">Court terme</span>
            </div>
            <p className="text-2xl font-bold">{rapport.recommandationsCourtTerme}</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
          <select
            value={filtreCategorie}
            onChange={(e) => setFiltreCategorie(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Toutes</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getCategorieEmoji(cat as any)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
          <select
            value={filtrePriorite}
            onChange={(e) => setFiltrePriorite(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Toutes</option>
            <option value="immediate">🔴 Immédiate</option>
            <option value="court_terme">🟠 Court terme</option>
            <option value="moyen_terme">🔵 Moyen terme</option>
            <option value="long_terme">⚪ Long terme</option>
          </select>
        </div>

        <div className="ml-auto flex items-end">
          <p className="text-sm text-gray-600">
            {recommandationsFiltrees.length} / {rapport.totalRecommandations} affichée(s)
          </p>
        </div>
      </div>

      {/* Liste des recommandations */}
      {recommandationsFiltrees.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucune recommandation ne correspond aux filtres</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommandationsFiltrees.map((rec) => (
            <RecommandationCard
              key={rec.id}
              recommandation={rec}
              expanded={expandedIds.has(rec.id)}
              onToggle={() => toggleExpand(rec.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// CARTE RECOMMANDATION
// ============================================

interface RecommandationCardProps {
  recommandation: Recommandation;
  expanded: boolean;
  onToggle: () => void;
}

function RecommandationCard({ recommandation: rec, expanded, onToggle }: RecommandationCardProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
      {/* En-tête cliquable */}
      <button
        onClick={onToggle}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Titre et badges */}
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{getCategorieEmoji(rec.categorie)}</span>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900">{rec.titre}</h4>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategorieColor(rec.categorie)}`}>
                {rec.categorie.charAt(0).toUpperCase() + rec.categorie.slice(1)}
              </span>

              <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getPrioriteColor(rec.priorite)}`}>
                {getPrioriteLabel(rec.priorite)}
              </span>

              <span className={`text-xs px-3 py-1 rounded-full font-medium bg-gray-100 ${getScoreColor(rec.scorePertinence)}`}>
                ⭐ {rec.scorePertinence}/10
              </span>

              {rec.conditionsRemplies && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  Conditions remplies
                </span>
              )}
            </div>

            {/* Gain fiscal si simulation */}
            {rec.simulation && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <Euro className="w-4 h-4" />
                  Gain: {formatEuros(rec.simulation.gainFiscalAnnuel)}/an
                </div>
                <div className="text-gray-600">
                  Sur 10 ans: {formatEuros(rec.simulation.gainFiscal10ans)}
                </div>
              </div>
            )}
          </div>

          {/* Icône expand */}
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Détails expandables */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-200 pt-6 bg-gray-50">
          {/* Conditions requises */}
          <div className="mb-6">
            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Conditions requises
            </h5>
            <ul className="space-y-2">
              {rec.conditionsRequises.map((cond, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span className="text-gray-700">{cond}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Avantages */}
          <div className="mb-6">
            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Avantages
            </h5>
            <ul className="space-y-2">
              {rec.avantages.map((av, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">+</span>
                  <span className="text-gray-700">{av}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risques */}
          {rec.risques.length > 0 && (
            <div className="mb-6">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Risques et points d'attention
              </h5>
              <ul className="space-y-2">
                {rec.risques.map((risque, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">⚠</span>
                    <span className="text-gray-700">{risque}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Simulation financière */}
          {rec.simulation && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Simulation financière
              </h5>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Gain annuel</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatEuros(rec.simulation.gainFiscalAnnuel)}
                  </p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Gain 10 ans</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatEuros(rec.simulation.gainFiscal10ans)}
                  </p>
                </div>

                <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs text-gray-600 mb-1">Gain 20 ans</p>
                  <p className="text-lg font-bold text-indigo-700">
                    {formatEuros(rec.simulation.gainFiscal20ans)}
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Gain 30 ans</p>
                  <p className="text-lg font-bold text-purple-700">
                    {formatEuros(rec.simulation.gainFiscal30ans)}
                  </p>
                </div>
              </div>

              {/* Coût de mise en place */}
              {rec.simulation.coutMiseEnPlace > 0 && (
                <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">Coût de mise en place</p>
                  <p className="text-lg font-bold text-orange-700">
                    {formatEuros(rec.simulation.coutMiseEnPlace)}
                  </p>
                  {rec.simulation.rentabiliteAnnuelle !== undefined && (
                    <p className="text-xs text-gray-600 mt-1">
                      ROI: {formatPourcentage(rec.simulation.rentabiliteAnnuelle)}
                    </p>
                  )}
                </div>
              )}

              {/* Hypothèses */}
              {rec.simulation.hypotheses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Hypothèses de simulation :</p>
                  <ul className="space-y-1">
                    {rec.simulation.hypotheses.map((hyp, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                        <span>•</span>
                        <span>{hyp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
