import { TrendingUp, Calculator, Euro, PieChart } from 'lucide-react';
import type { CalculIRResult } from './types';

interface StatistiquesHeaderProps {
  totalRevenus: number;
  totalImpots: number;
  revenuNetApresImpots: number;
  tauxImpositionGlobal: number;
  nombrePartsCalcule: number;
  calculIRStable: CalculIRResult | null;
  trancheMarginaleTMI: number;
}

export function StatistiquesHeader({
  totalRevenus,
  totalImpots,
  revenuNetApresImpots,
  tauxImpositionGlobal,
  nombrePartsCalcule,
  calculIRStable,
  trancheMarginaleTMI,
}: StatistiquesHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium text-blue-900">Revenus totaux</p>
        </div>
        <p className="text-2xl font-bold text-blue-900">{totalRevenus.toLocaleString('fr-FR')} €</p>
        <p className="text-xs text-blue-700 mt-1">{(totalRevenus / 12).toLocaleString('fr-FR')} € /mois</p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium text-red-900">Impôts totaux</p>
        </div>
        <p className="text-2xl font-bold text-red-900">{totalImpots.toLocaleString('fr-FR')} €</p>
        <p className="text-xs text-red-700 mt-1">{tauxImpositionGlobal.toFixed(1)}% des revenus</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Euro className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium text-green-900">Revenu net après impôts</p>
        </div>
        <p className="text-2xl font-bold text-green-900">{revenuNetApresImpots.toLocaleString('fr-FR')} €</p>
        <p className="text-xs text-green-700 mt-1">{(revenuNetApresImpots / 12).toLocaleString('fr-FR')} € /mois</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium text-purple-900">TMI</p>
        </div>
        <p className="text-2xl font-bold text-purple-900">
          {calculIRStable ? calculIRStable.TMI : trancheMarginaleTMI}%
        </p>
        <p className="text-xs text-purple-700 mt-1">{nombrePartsCalcule} parts fiscales</p>
        {calculIRStable && Math.abs(trancheMarginaleTMI - calculIRStable.TMI) > 0.1 && (
          <p className="text-xs text-orange-600 mt-1">⏳ Sync...</p>
        )}
      </div>
    </div>
  );
}
