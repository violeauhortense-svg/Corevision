import { useState } from 'react';
import { Calendar, Clock, Gift, DollarSign, TrendingUp, Edit2, Save } from 'lucide-react';
import { formatEuro } from './utils';
import type { Simulation, SimulationParams } from './types';

interface SimulationsProjectionsProps {
  simulations: Simulation[];
  simulationParams: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
}

export function SimulationsProjections({ 
  simulations, 
  simulationParams, 
  onParamsChange 
}: SimulationsProjectionsProps) {
  const [editingSimulation, setEditingSimulation] = useState(false);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          5️⃣ Simulations et Projections
        </h3>
        <button
          onClick={() => setEditingSimulation(!editingSimulation)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {editingSimulation ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {editingSimulation ? 'Sauvegarder' : 'Modifier paramètres'}
        </button>
      </div>

      {/* Paramètres de simulation */}
      {editingSimulation && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-6">
          <p className="font-semibold text-indigo-900 mb-3">⚙️ Paramètres de simulation</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-gray-700 block mb-1">Inflation (%)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.inflation}
                onChange={(e) => onParamsChange({...simulationParams, inflation: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1">Rdt Immobilier (%)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.rendementImmobilier}
                onChange={(e) => onParamsChange({...simulationParams, rendementImmobilier: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1">Rdt Financier (%)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.rendementFinancier}
                onChange={(e) => onParamsChange({...simulationParams, rendementFinancier: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1">Croissance revenus (%)</label>
              <input
                type="number"
                step="0.1"
                value={simulationParams.croissanceRevenus}
                onChange={(e) => onParamsChange({...simulationParams, croissanceRevenus: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1">Taux imposition (%)</label>
              <input
                type="number"
                step="1"
                value={simulationParams.tauxImposition}
                onChange={(e) => onParamsChange({...simulationParams, tauxImposition: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Projections */}
      <div className="space-y-4">
        {simulations.map((sim) => (
          <div key={sim.annees} className="border-2 border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-lg text-gray-900 mb-4">
              📅 Projection à {sim.annees} ans
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Retraite */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-gray-700">Retraite</p>
                </div>
                <p className="text-sm font-bold text-purple-900">{formatEuro(sim.retraite.capital)}</p>
                <p className="text-xs text-gray-600">Rente: {formatEuro(sim.retraite.rente)}/an</p>
              </div>

              {/* Succession */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-gray-700">Succession</p>
                </div>
                <p className="text-sm font-bold text-blue-900">{formatEuro(sim.succession.patrimoine)}</p>
                <p className="text-xs text-red-600">Droits: {formatEuro(sim.succession.droits)}</p>
              </div>

              {/* Fiscalité */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-medium text-gray-700">Fiscalité</p>
                </div>
                <p className="text-sm font-bold text-orange-900">{formatEuro(sim.fiscalite.impotAnnuel)}/an</p>
                <p className="text-xs text-gray-600">Cumulé: {formatEuro(sim.fiscalite.impotCumule)}</p>
              </div>

              {/* Performance */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-gray-700">Performance</p>
                </div>
                <p className="text-sm font-bold text-green-900">{formatEuro(sim.performance.patrimoineAvecRendement)}</p>
                <p className="text-xs text-green-600">Gain net: {formatEuro(sim.performance.gainNet)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
