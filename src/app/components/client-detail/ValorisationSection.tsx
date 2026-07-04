import { DollarSign, Edit3, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ValorisationSectionProps {
  entreprise: any;
  valorisation: any;
  params: any;
  totalActif: number;
  totalPassif: number;
  formatEuro: (value: number) => string;
  updateValorisationParams: (entrepriseId: string, params: any) => void;
  updateAjustementValorisation: (entrepriseId: string, ajustement: any) => void;
}

export function ValorisationSection({
  entreprise,
  valorisation,
  params,
  totalActif,
  totalPassif,
  formatEuro,
  updateValorisationParams,
  updateAjustementValorisation,
}: ValorisationSectionProps) {
  const isSCI = entreprise.statutJuridique === 'SCI';
  
  // Valeurs par défaut si pas d'ajustement
  const ajustement = entreprise.ajustementValorisation || {
    immobilisationsCorporelles: entreprise.actifs.immobilisationsCorporelles,
    immobilisationsIncorporelles: entreprise.actifs.immobilisationsIncorporelles,
    immobilisationsFinancieres: entreprise.actifs.immobilisationsFinancieres,
    sourceValorisation: 'non-specifie',
    commentaire: ''
  };

  // Données pour le graphique
  const chartData = [
    { name: 'Patrimoniale', value: valorisation.valeurPatrimoniale, fill: '#3b82f6' },
    { name: 'Rentabilité', value: valorisation.valeurRentabilite, fill: '#10b981' },
    { name: 'Rendement', value: valorisation.valeurRendement, fill: '#f59e0b' },
    { name: 'Comparative', value: valorisation.valeurComparative, fill: '#8b5cf6' },
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 border-t-2 border-gray-200 space-y-6">
      {/* Message informatif */}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
        <p className="text-sm text-emerald-900">
          <strong>Valorisation automatique</strong> basée sur les données financières de l'entreprise.
          {isSCI && <span className="ml-2 text-emerald-700">(Pondération SCI : 2/3 patrimoniale + 1/3 rentabilité)</span>}
        </p>
      </div>

      {/* Ajustement des immobilisations pour valorisation */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Edit3 className="w-5 h-5 text-blue-700" />
          <h5 className="font-bold text-blue-900">Ajustement des immobilisations pour la valorisation</h5>
        </div>
        
        {valorisation.ajustementApplique && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-semibold">Ajustement actif</p>
              <p className="text-xs text-yellow-700">Les valeurs ci-dessous sont utilisées pour le calcul de la valeur patrimoniale au lieu des valeurs comptables.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Immobilisations corporelles
            </label>
            <div className="relative">
              <input
                type="number"
                value={ajustement.immobilisationsCorporelles || 0}
                onChange={(e) => updateAjustementValorisation(entreprise.id, {
                  ...ajustement,
                  immobilisationsCorporelles: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white"
              />
              {entreprise.actifs.immobilisationsCorporelles !== ajustement.immobilisationsCorporelles && (
                <span className="text-xs text-blue-600 mt-1 block">
                  Comptable: {formatEuro(entreprise.actifs.immobilisationsCorporelles)}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Immobilisations incorporelles
            </label>
            <div className="relative">
              <input
                type="number"
                value={ajustement.immobilisationsIncorporelles || 0}
                onChange={(e) => updateAjustementValorisation(entreprise.id, {
                  ...ajustement,
                  immobilisationsIncorporelles: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white"
              />
              {entreprise.actifs.immobilisationsIncorporelles !== ajustement.immobilisationsIncorporelles && (
                <span className="text-xs text-blue-600 mt-1 block">
                  Comptable: {formatEuro(entreprise.actifs.immobilisationsIncorporelles)}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Immobilisations financières
            </label>
            <div className="relative">
              <input
                type="number"
                value={ajustement.immobilisationsFinancieres || 0}
                onChange={(e) => updateAjustementValorisation(entreprise.id, {
                  ...ajustement,
                  immobilisationsFinancieres: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white"
              />
              {entreprise.actifs.immobilisationsFinancieres !== ajustement.immobilisationsFinancieres && (
                <span className="text-xs text-blue-600 mt-1 block">
                  Comptable: {formatEuro(entreprise.actifs.immobilisationsFinancieres)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Source de la valorisation
            </label>
            <select
              value={ajustement.sourceValorisation || 'non-specifie'}
              onChange={(e) => updateAjustementValorisation(entreprise.id, {
                ...ajustement,
                sourceValorisation: e.target.value as 'client' | 'tiers' | 'non-specifie'
              })}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white"
            >
              <option value="non-specifie">Non spécifiée</option>
              <option value="client">Indiquée par le client</option>
              <option value="tiers">Justifiée par un tiers (expert, notaire...)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Commentaire (optionnel)
            </label>
            <input
              type="text"
              value={ajustement.commentaire || ''}
              onChange={(e) => updateAjustementValorisation(entreprise.id, {
                ...ajustement,
                commentaire: e.target.value
              })}
              placeholder="Ex: Estimation notaire 2024"
              className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white"
            />
          </div>
        </div>

        {/* Affichage de la source si sélectionnée */}
        {ajustement.sourceValorisation !== 'non-specifie' && (
          <div className="mt-3 bg-white border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              {ajustement.sourceValorisation === 'tiers' ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                  ✓ Valorisée par un tiers
                </span>
              ) : (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold">
                  ⓘ Valeur déclarée par le client
                </span>
              )}
              {ajustement.commentaire && (
                <span className="text-xs text-gray-600 italic">— {ajustement.commentaire}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Moyennes calculées */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 mb-1">Résultat net moyen (3 ans)</p>
          <p className="text-lg font-bold text-blue-900">{formatEuro(valorisation.resultatMoyen)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-700 mb-1">Dividendes moyens (3 ans)</p>
          <p className="text-lg font-bold text-purple-900">{formatEuro(valorisation.dividendesMoyens)}</p>
        </div>
      </div>

      {/* Tableau des méthodes de valorisation */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Méthode</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Calcul</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Paramètres</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. Valeur patrimoniale */}
            <tr className="border-t border-gray-200 bg-blue-50">
              <td className="px-4 py-3 font-medium text-blue-900">1. Patrimoniale</td>
              <td className="px-4 py-3 text-gray-700">Actif - Passif</td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {valorisation.ajustementApplique ? (
                  <>
                    <span className="font-semibold text-blue-700">Actif ajusté: {formatEuro(valorisation.totalActifAjuste)}</span><br/>
                    <span className="text-gray-500">Actif comptable: {formatEuro(totalActif)}</span><br/>
                    Passif: {formatEuro(totalPassif)}
                  </>
                ) : (
                  <>
                    Actif: {formatEuro(totalActif)}<br/>
                    Passif: {formatEuro(totalPassif)}
                  </>
                )}
              </td>
              <td className="px-4 py-3 text-right font-bold text-blue-900">
                {formatEuro(valorisation.valeurPatrimoniale)}
              </td>
            </tr>

            {/* 2. Valeur de rentabilité */}
            <tr className="border-t border-gray-200 bg-green-50">
              <td className="px-4 py-3 font-medium text-green-900">2. Rentabilité</td>
              <td className="px-4 py-3 text-gray-700">Résultat × Multiple</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={params.multipleRentabilite || 5}
                  onChange={(e) => updateValorisationParams(entreprise.id, { multipleRentabilite: parseFloat(e.target.value) || 5 })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-xs text-gray-600 ml-1">× {formatEuro(valorisation.resultatMoyen)}</span>
              </td>
              <td className="px-4 py-3 text-right font-bold text-green-900">
                {formatEuro(valorisation.valeurRentabilite)}
              </td>
            </tr>

            {/* 3. Valeur de rendement */}
            <tr className="border-t border-gray-200 bg-orange-50">
              <td className="px-4 py-3 font-medium text-orange-900">3. Rendement</td>
              <td className="px-4 py-3 text-gray-700">Dividendes / Taux</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0.01"
                  max="0.20"
                  step="0.01"
                  value={params.tauxRendement || 0.05}
                  onChange={(e) => updateValorisationParams(entreprise.id, { tauxRendement: parseFloat(e.target.value) || 0.05 })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-xs text-gray-600 ml-1">({(params.tauxRendement * 100).toFixed(1)}%)</span>
              </td>
              <td className="px-4 py-3 text-right font-bold text-orange-900">
                {formatEuro(valorisation.valeurRendement)}
              </td>
            </tr>

            {/* 4. Valeur comparative */}
            <tr className="border-t border-gray-200 bg-purple-50">
              <td className="px-4 py-3 font-medium text-purple-900">4. Comparative</td>
              <td className="px-4 py-3 text-gray-700">EBITDA × Multiple</td>
              <td className="px-4 py-3 flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  value={params.ebitda || 0}
                  onChange={(e) => updateValorisationParams(entreprise.id, { ebitda: parseFloat(e.target.value) || 0 })}
                  placeholder="EBITDA"
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-xs text-gray-600">×</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={params.multipleSectoriel || 8}
                  onChange={(e) => updateValorisationParams(entreprise.id, { multipleSectoriel: parseFloat(e.target.value) || 8 })}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </td>
              <td className="px-4 py-3 text-right font-bold text-purple-900">
                {formatEuro(valorisation.valeurComparative)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Valeur finale */}
      <div className="bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-400 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-700 mb-1">
              {isSCI ? (
                'Valorisation finale (2/3 patrimoniale + 1/3 rentabilité)'
              ) : (
                'Valorisation finale (30% patrimoniale + 40% rentabilité + 30% comparative)'
              )}
            </p>
            <p className="text-4xl font-bold text-emerald-900">{formatEuro(valorisation.valeurFinale)}</p>
          </div>
          <DollarSign className="w-16 h-16 text-emerald-600 opacity-50" />
        </div>
      </div>

      {/* Graphique comparatif */}
      {chartData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-4">Comparaison des méthodes</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatEuro(value as number)} />
              <Bar dataKey="value" fill="#10b981">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Notes explicatives */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h6 className="font-semibold text-gray-900 mb-2 text-sm">📝 Notes méthodologiques</h6>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• <strong>Patrimoniale :</strong> Valorisation basée sur l'actif net (Actif - Passif)</li>
          <li>• <strong>Rentabilité :</strong> Capitalisation du résultat net moyen sur 3 ans</li>
          <li>• <strong>Rendement :</strong> Actualisation des dividendes moyens</li>
          <li>• <strong>Comparative :</strong> Méthode des multiples (EBITDA × secteur)</li>
          {isSCI && <li className="text-emerald-700">• <strong>SCI :</strong> Pondération spécifique 2/3 patrimoniale + 1/3 rentabilité</li>}
        </ul>
      </div>
    </div>
  );
}
