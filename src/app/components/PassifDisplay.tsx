import { Calendar, TrendingDown, CreditCard, DollarSign } from 'lucide-react';
import type { PatrimoineItem } from './client-detail/types';

interface PassifDisplayProps {
  passif: PatrimoineItem;
}

export function PassifDisplay({ passif }: PassifDisplayProps) {
  const formatEuro = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getTypeLabel = (typePassif: string | undefined) => {
    const types: Record<string, string> = {
      'pret_immobilier': 'Prêt immobilier',
      'immobilier': 'Crédit immobilier',
      'credit_consommation': 'Crédit à la consommation',
      'consommation': 'Crédit à la consommation',
      'lld': 'Location longue durée',
      'pret_etudiant': 'Prêt étudiant',
      'autre': 'Autre',
    };
    return types[typePassif || ''] || typePassif || 'Non spécifié';
  };

  const hasDetailsComplete = passif.capitalInitial && passif.tauxEmprunt && passif.dateDebut && passif.nombreEcheances;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{passif.name || 'Sans nom'}</p>
            <p className="text-sm text-gray-500">{getTypeLabel(passif.typePassif)}</p>
            {passif.linkedActifName && (
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                <span>🏠</span> Lié à: {passif.linkedActifName}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Capital restant dû</p>
          <p className="text-2xl font-bold text-red-700">
            {formatEuro(passif.value)}
          </p>
        </div>
      </div>

      {/* Détails complets si disponibles */}
      {hasDetailsComplete ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-600 font-medium">Capital initial</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatEuro(passif.capitalInitial)}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-600 font-medium">Taux d'emprunt</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {passif.tauxEmprunt?.toFixed(2)}% {passif.typeTaux && `(${passif.typeTaux})`}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-600 font-medium">Mensualité</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatEuro(passif.mensualite)}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-xs text-gray-600 font-medium">Période</p>
                </div>
                <p className="text-sm text-gray-900">
                  Du {formatDate(passif.dateDebut)} au {formatDate(passif.dateFin)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Durées</p>
                <div className="flex gap-3 text-sm text-gray-900">
                  <span>
                    Initiale: <strong>{passif.dureeInitiale || Math.ceil((passif.nombreEcheances || 0) / 12)} ans</strong>
                  </span>
                  {passif.dureeRestante !== undefined && (
                    <span className="text-orange-600">
                      Restante: <strong>{passif.dureeRestante} ans</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded p-2">
                <p className="text-xs text-gray-600 mb-1">Échéances totales</p>
                <p className="font-semibold text-gray-900">{passif.nombreEcheances} mois</p>
              </div>
              {passif.echeancesRestantes !== undefined && (
                <div className="bg-orange-50 border border-orange-200 rounded p-2">
                  <p className="text-xs text-orange-700 mb-1">Échéances restantes</p>
                  <p className="font-semibold text-orange-900">{passif.echeancesRestantes} mois</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ℹ️ Détails incomplets. Modifiez ce passif pour renseigner toutes les informations.
          </p>
        </div>
      )}
    </div>
  );
}
