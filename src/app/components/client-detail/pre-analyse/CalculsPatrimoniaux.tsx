import { BarChart3 } from 'lucide-react';
import { formatEuro } from './utils';
import type { CalculsPatrimoniauxData, ImpositionData } from './types';

interface CalculsPatrimoniauxProps {
  calculs: CalculsPatrimoniauxData;
  impositionData: ImpositionData;
}

export function CalculsPatrimoniaux({ calculs, impositionData }: CalculsPatrimoniauxProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        2️⃣ Calculs Patrimoniaux
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Patrimoine Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatEuro(calculs.patrimoineTotal)}</p>
        </div>
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Actifs Financiers</p>
          <p className="text-2xl font-bold text-blue-600">{formatEuro(calculs.totalActifsFinanciers)}</p>
          <p className="text-xs text-gray-500">{calculs.partFinancier.toFixed(1)}% du total</p>
        </div>
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Immobilier</p>
          <p className="text-2xl font-bold text-orange-600">{formatEuro(calculs.totalImmobilier)}</p>
          <p className="text-xs text-gray-500">{calculs.partImmobilier.toFixed(1)}% du total</p>
        </div>
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Passifs</p>
          <p className="text-2xl font-bold text-red-600">{formatEuro(calculs.totalPassifs)}</p>
          <p className="text-xs text-gray-500">Taux: {calculs.tauxEndettement.toFixed(1)}%</p>
        </div>
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Revenus Annuels</p>
          <p className="text-2xl font-bold text-green-600">{formatEuro(calculs.totalRevenus)}</p>
        </div>
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Impôts Annuels</p>
          <p className="text-2xl font-bold text-purple-600">{formatEuro(calculs.impotTotal)}</p>
          <p className="text-xs text-gray-500">Pression: {calculs.pressionFiscale.toFixed(1)}%</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              IR: {formatEuro(impositionData.impotRevenu || 0)} • 
              PS: {formatEuro(calculs.prelevementsSociaux)} • 
              IFI: {formatEuro(impositionData.ifi || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Graphique répartition */}
      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Répartition du patrimoine</p>
        <div className="h-8 flex rounded-lg overflow-hidden border-2 border-gray-300">
          <div 
            className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${calculs.partFinancier}%` }}
          >
            {calculs.partFinancier > 15 && `${calculs.partFinancier.toFixed(0)}%`}
          </div>
          <div 
            className="bg-orange-500 flex items-center justify-center text-white text-xs font-bold"
            style={{ width: `${calculs.partImmobilier}%` }}
          >
            {calculs.partImmobilier > 15 && `${calculs.partImmobilier.toFixed(0)}%`}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Financier</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-xs text-gray-600">Immobilier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
