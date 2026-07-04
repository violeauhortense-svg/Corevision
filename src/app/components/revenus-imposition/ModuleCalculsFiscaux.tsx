import { Calculator, TrendingUp, Euro, PieChart, Eye } from 'lucide-react';
import type { CalculIRResult, CalculPSResult, CalculIFIResult } from './types';

interface ModuleCalculsFiscauxProps {
  calculIRDisplay: CalculIRResult | null;
  calculPSDisplay: CalculPSResult | null;
  calculIFIDisplay: CalculIFIResult | null;
  onShowDetailModal: () => void;
}

export function ModuleCalculsFiscaux({
  calculIRDisplay,
  calculPSDisplay,
  calculIFIDisplay,
  onShowDetailModal,
}: ModuleCalculsFiscauxProps) {
  if (!calculIRDisplay) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-white" />
          <h3 className="text-xl font-bold text-white">💰 Calculs Fiscaux Automatiques</h3>
        </div>
        <button
          onClick={onShowDetailModal}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-medium backdrop-blur-sm border border-white/30"
        >
          <Eye className="w-4 h-4" />
          Voir les détails complets
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Impôt sur le Revenu */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Impôt sur le Revenu</h4>
                <p className="text-xs text-gray-600">Barème progressif 2026 (1ère tranche : 11 600 €)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{(calculIRDisplay?.impotFinal ?? 0).toLocaleString('fr-FR')} €</p>
              <p className="text-xs text-gray-600 mt-1">
                soit {((calculIRDisplay?.impotFinal ?? 0) / 12).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € /mois
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-blue-100">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Revenu imposable</p>
              <p className="text-lg font-bold text-gray-900">{calculIRDisplay.revenuImposable.toLocaleString('fr-FR')} €</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">TMI</p>
              <p className="text-lg font-bold text-purple-600">{calculIRDisplay.TMI.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Taux moyen</p>
              <p className="text-lg font-bold text-indigo-600">{calculIRDisplay.tauxMoyenImposition.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Prélèvements Sociaux */}
        {calculPSDisplay && calculPSDisplay.prelevementsSociauxTotal > 0 && (
          <div className="bg-white rounded-lg border-2 border-green-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Euro className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Prélèvements Sociaux</h4>
                  <p className="text-xs text-gray-600">CSG + CRDS + PS (17,2%)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{calculPSDisplay.prelevementsSociauxTotal.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          </div>
        )}

        {/* IFI */}
        {calculIFIDisplay && calculIFIDisplay.ifiFinal > 0 && (
          <div className="bg-white rounded-lg border-2 border-amber-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">IFI</h4>
                  <p className="text-xs text-gray-600">Impôt sur la Fortune Immobilière</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-600">{calculIFIDisplay.ifiFinal.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
