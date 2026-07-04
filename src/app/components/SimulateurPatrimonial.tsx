import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

interface ParametresSimulation {
  montage_id: string;
  capital_initial: number;
  apport_annuel?: number;
  taux_rendement_annuel: number;
  duree_annees: number;
  tranche_marginale_ir: number;
  taux_ps?: number;
  age_client?: number;
  nombre_enfants?: number;
  patrimoine_net?: number;
  abattement_applicable?: number;
  taux_reduction_impot?: number;
  exoneration_apres_annees?: number;
  frais_gestion_annuels?: number;
  frais_entree?: number;
  frais_sortie?: number;
}

interface FluxAnnuel {
  annee: number;
  capital_debut: number;
  apport: number;
  rendement_brut: number;
  frais_gestion: number;
  rendement_net_frais: number;
  fiscalite: number;
  rendement_net_final: number;
  capital_fin: number;
  capital_cumule: number;
}

interface ResultatSimulation {
  montage: any;
  parametres: ParametresSimulation;
  capital_final: number;
  total_investis: number;
  plus_value: number;
  rendement_global: number;
  taux_rendement_annuel_moyen: number;
  total_fiscalite: number;
  economie_fiscale_vs_bareme?: number;
  flux_annuels: FluxAnnuel[];
  horizon_optimal: number;
  seuil_rentabilite: number;
  date_simulation: string;
}

interface ComparaisonScenarios {
  scenarios: ResultatSimulation[];
  meilleur_scenario_id: string;
  tableau_comparatif: {
    montage: string;
    capital_final: number;
    plus_value: number;
    rendement_annuel_moyen: number;
    total_fiscalite: number;
  }[];
}

export function SimulateurPatrimonial() {
  const [montages, setMontages] = useState<any[]>([]);
  const [montageSelectionne, setMontageSelectionne] = useState<string>('');
  const [parametres, setParametres] = useState<ParametresSimulation | null>(null);
  const [simulation, setSimulation] = useState<ResultatSimulation | null>(null);
  const [comparaison, setComparaison] = useState<ComparaisonScenarios | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'simple' | 'comparaison'>('simple');

  useEffect(() => {
    chargerMontages();
  }, []);

  const chargerMontages = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/montages-patrimoniaux?statut=actif`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMontages(data.montages || []);
      }
    } catch (error) {
      console.error('Erreur chargement montages:', error);
    }
  };

  const chargerParametresDefaut = async (montageId: string) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/simulateur-patrimonial/parametres-defaut/${montageId}?capital=100000&duree=10&tranche=30`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setParametres(data.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const handleMontageChange = (montageId: string) => {
    setMontageSelectionne(montageId);
    setSimulation(null);
    chargerParametresDefaut(montageId);
  };

  const lancerSimulation = async () => {
    if (!parametres) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/simulateur-patrimonial/simuler`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            parametres,
            sauvegarder: false,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSimulation(data.simulation);
        setComparaison(null);
      }
    } catch (error) {
      console.error('Erreur simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const comparerScenarios = async () => {
    if (!parametres) return;

    setLoading(true);
    try {
      // Créer 3 scénarios : pessimiste, réaliste, optimiste
      const scenarios = [
        {
          ...parametres,
          taux_rendement_annuel: parametres.taux_rendement_annuel * 0.5,
        },
        parametres,
        {
          ...parametres,
          taux_rendement_annuel: parametres.taux_rendement_annuel * 1.5,
        },
      ];

      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/simulateur-patrimonial/comparer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ scenarios }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComparaison(data.comparaison);
        setSimulation(null);
      }
    } catch (error) {
      console.error('Erreur comparaison:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            📊 Simulateur Patrimonial
          </h1>
          <p className="text-slate-600">
            Simulations financières et comparaison de montages patrimoniaux
          </p>
        </div>

        {/* Mode selection */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setMode('simple')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              mode === 'simple'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Simulation Simple
          </button>
          <button
            onClick={() => setMode('comparaison')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              mode === 'comparaison'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Comparaison de Scénarios
          </button>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            ⚙️ Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sélection du montage */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Montage patrimonial
              </label>
              <select
                value={montageSelectionne}
                onChange={(e) => handleMontageChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {montages.map((m) => (
                  <option key={m.montage_id} value={m.montage_id}>
                    {m.nom_montage}
                  </option>
                ))}
              </select>
            </div>

            {parametres && (
              <>
                {/* Capital initial */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Capital initial (€)
                  </label>
                  <input
                    type="number"
                    value={parametres.capital_initial}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        capital_initial: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Durée (années)
                  </label>
                  <input
                    type="number"
                    value={parametres.duree_annees}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        duree_annees: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Rendement annuel */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rendement annuel (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={parametres.taux_rendement_annuel}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        taux_rendement_annuel: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tranche marginale IR */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tranche marginale IR (%)
                  </label>
                  <input
                    type="number"
                    value={parametres.tranche_marginale_ir}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        tranche_marginale_ir: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Apport annuel */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apport annuel (€) - optionnel
                  </label>
                  <input
                    type="number"
                    value={parametres.apport_annuel || 0}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        apport_annuel: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={mode === 'simple' ? lancerSimulation : comparerScenarios}
              disabled={!parametres || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading
                ? 'Calcul en cours...'
                : mode === 'simple'
                ? '▶️ Lancer la simulation'
                : '📊 Comparer les scénarios'}
            </button>
          </div>
        </div>

        {/* Résultats - Simulation simple */}
        {mode === 'simple' && simulation && (
          <div className="space-y-6">
            {/* Synthèse */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-6">
                📈 {simulation.montage.nom_montage}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Capital Final</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(simulation.capital_final)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Plus-value</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(simulation.plus_value)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">
                    Rendement Annuel Moyen
                  </p>
                  <p className="text-3xl font-bold">
                    {formatPercent(simulation.taux_rendement_annuel_moyen)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Fiscalité Totale</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(simulation.total_fiscalite)}
                  </p>
                </div>
              </div>

              {simulation.economie_fiscale_vs_bareme !== undefined && (
                <div className="mt-4 p-4 bg-white/10 rounded-xl">
                  <p className="text-sm text-blue-100 mb-1">
                    Économie fiscale vs barème progressif
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(simulation.economie_fiscale_vs_bareme)}
                  </p>
                </div>
              )}
            </div>

            {/* Graphique d'évolution du capital */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                📈 Évolution du capital sur{' '}
                {simulation.parametres.duree_annees} ans
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={simulation.flux_annuels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="annee"
                    label={{ value: 'Années', position: 'insideBottom', offset: -5 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    label={{ value: 'Capital (€)', angle: -90, position: 'insideLeft' }}
                    stroke="#64748b"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="capital_fin"
                    name="Capital"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="capital_cumule"
                    name="Investi"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique de décomposition des flux */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                💰 Décomposition des flux annuels
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={simulation.flux_annuels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="annee" stroke="#64748b" />
                  <YAxis
                    stroke="#64748b"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="rendement_brut" name="Rendement brut" fill="#10b981" />
                  <Bar dataKey="fiscalite" name="Fiscalité" fill="#ef4444" />
                  <Bar
                    dataKey="rendement_net_final"
                    name="Rendement net"
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tableau détaillé */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                📋 Tableau détaillé des flux
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Année
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Capital début
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Rendement brut
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Fiscalité
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Rendement net
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Capital fin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.flux_annuels.map((flux) => (
                      <tr
                        key={flux.annee}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {flux.annee}
                        </td>
                        <td className="text-right py-3 px-4 text-slate-600">
                          {formatCurrency(flux.capital_debut)}
                        </td>
                        <td className="text-right py-3 px-4 text-green-600 font-medium">
                          {formatCurrency(flux.rendement_brut)}
                        </td>
                        <td className="text-right py-3 px-4 text-red-600 font-medium">
                          -{formatCurrency(flux.fiscalite)}
                        </td>
                        <td className="text-right py-3 px-4 text-blue-600 font-medium">
                          {formatCurrency(flux.rendement_net_final)}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-slate-900">
                          {formatCurrency(flux.capital_fin)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Résultats - Comparaison de scénarios */}
        {mode === 'comparaison' && comparaison && (
          <div className="space-y-6">
            {/* Tableau comparatif */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                🔀 Comparaison des scénarios
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Scénario
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Capital Final
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Plus-value
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Rendement Annuel
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Fiscalité
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparaison.scenarios.map((scenario, index) => {
                      const labels = ['Pessimiste', 'Réaliste', 'Optimiste'];
                      const colors = [
                        'text-red-600',
                        'text-blue-600',
                        'text-green-600',
                      ];
                      const bgColors = ['bg-red-50', 'bg-blue-50', 'bg-green-50'];

                      return (
                        <tr
                          key={index}
                          className={`border-b border-slate-100 ${bgColors[index]}`}
                        >
                          <td className={`py-4 px-4 font-bold ${colors[index]}`}>
                            {labels[index]}
                            <span className="block text-sm font-normal text-slate-600">
                              {formatPercent(
                                scenario.parametres.taux_rendement_annuel
                              )}{' '}
                              /an
                            </span>
                          </td>
                          <td className="text-right py-4 px-4 font-semibold text-slate-900">
                            {formatCurrency(scenario.capital_final)}
                          </td>
                          <td
                            className={`text-right py-4 px-4 font-semibold ${colors[index]}`}
                          >
                            {formatCurrency(scenario.plus_value)}
                          </td>
                          <td className="text-right py-4 px-4 font-medium text-slate-700">
                            {formatPercent(scenario.taux_rendement_annuel_moyen)}
                          </td>
                          <td className="text-right py-4 px-4 text-red-600">
                            {formatCurrency(scenario.total_fiscalite)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Graphique comparatif */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                📊 Comparaison de l'évolution du capital
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="annee"
                    type="number"
                    domain={[
                      0,
                      comparaison.scenarios[0].parametres.duree_annees,
                    ]}
                    stroke="#64748b"
                  />
                  <YAxis
                    stroke="#64748b"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    data={comparaison.scenarios[0].flux_annuels}
                    type="monotone"
                    dataKey="capital_fin"
                    name="Pessimiste"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    data={comparaison.scenarios[1].flux_annuels}
                    type="monotone"
                    dataKey="capital_fin"
                    name="Réaliste"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                  <Line
                    data={comparaison.scenarios[2].flux_annuels}
                    type="monotone"
                    dataKey="capital_fin"
                    name="Optimiste"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
