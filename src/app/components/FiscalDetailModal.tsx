import { X, Info, TrendingUp, Calculator } from 'lucide-react';
import type { DetailCalculIR, DetailCalculPS, DetailCalculIFI } from '../services/fiscalCalculatorDynamic';

// Fonctions utilitaires pour le formatage
const formatEuro = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatPourcentage = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
};

interface FiscalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculIR: DetailCalculIR | null;
  calculPS: DetailCalculPS | null;
  calculIFI: DetailCalculIFI | null;
}

export function FiscalDetailModal({
  isOpen,
  onClose,
  calculIR,
  calculPS,
  calculIFI,
}: FiscalDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Détail des Calculs Fiscaux</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* IMPÔT SUR LE REVENU */}
          {calculIR && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900">
                  Impôt sur le Revenu (IR)
                </h3>
              </div>

              {/* Étape 1 : Revenus bruts */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">📊 Étape 1 : Revenus Bruts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total des revenus bruts</span>
                    <span className="font-bold">{formatEuro(calculIR.revenuBrut)}</span>
                  </div>
                </div>
              </div>

              {/* Étape 2 : Abattement */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">💰 Étape 2 : Abattement 10%</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Abattement de 10% (plafonné à 13 522€)</span>
                    <span className="font-bold text-green-600">- {formatEuro(calculIR.abattement10)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="font-semibold">Revenu net imposable</span>
                    <span className="font-bold">{formatEuro(calculIR.revenuImposable)}</span>
                  </div>
                </div>
              </div>

              {/* Étape 3 : Quotient familial */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">👨‍👩‍👧‍👦 Étape 3 : Quotient Familial</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Nombre de parts fiscales</span>
                    <span className="font-bold">{calculIR.nombreParts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quotient familial ({formatEuro(calculIR.revenuImposable)} ÷ {calculIR.nombreParts})</span>
                    <span className="font-bold">{formatEuro(calculIR.quotientFamilial)}</span>
                  </div>
                </div>
              </div>

              {/* Étape 4 : Barème progressif */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">📈 Étape 4 : Application du Barème Progressif</h4>
                <div className="space-y-3">
                  {calculIR.tranchesDetail.map((tranche, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-blue-900">
                          Tranche {tranche.tranche} : {formatPourcentage(tranche.taux * 100)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatEuro(tranche.min)} → {tranche.max ? formatEuro(tranche.max) : '∞'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Montant dans la tranche</span>
                        <span className="font-medium">{formatEuro(tranche.montantTranche)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Impôt sur cette tranche</span>
                        <span className="font-bold text-blue-600">{formatEuro(tranche.impotTranche)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t-2 border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Impôt sur quotient familial</span>
                    <span className="font-bold text-lg">{formatEuro(calculIR.impotAvantDecote / calculIR.nombreParts)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>× {calculIR.nombreParts} parts</span>
                    <span className="font-bold text-blue-600">{formatEuro(calculIR.impotAvantDecote)}</span>
                  </div>
                </div>
              </div>

              {/* Étape 5 : Décote */}
              {calculIR.decote > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">✨ Étape 5 : Décote</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Décote appliquée (faibles revenus)</span>
                      <span className="font-bold text-green-600">- {formatEuro(calculIR.decote)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Résultat final */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                <h4 className="font-bold text-xl mb-4">🎯 Résultat Final</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-lg">
                    <span>Impôt sur le revenu annuel</span>
                    <span className="font-bold text-2xl">{formatEuro(calculIR.impotFinal)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/20 pt-3">
                    <span>TMI (Tranche Marginale d'Imposition)</span>
                    <span className="font-bold text-xl">{formatPourcentage(calculIR.TMI)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taux moyen d'imposition</span>
                    <span className="font-bold">{formatPourcentage(calculIR.tauxMoyen)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRÉLÈVEMENTS SOCIAUX */}
          {calculPS && calculPS.total > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-green-200">
                <Info className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">
                  Prélèvements Sociaux
                </h3>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">💰 Assiette de calcul</h4>
                <div className="text-sm mb-4">
                  <p className="text-gray-700">
                    Les prélèvements sociaux s'appliquent sur les revenus du patrimoine
                    (revenus fonciers, revenus mobiliers, plus-values).
                  </p>
                </div>
                <div className="flex justify-between">
                  <span>Base de calcul</span>
                  <span className="font-bold">{formatEuro(calculPS.assiette)}</span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-green-900 mb-3">📊 Détail des prélèvements</h4>
                
                <div className="bg-white p-3 rounded border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">CSG (Contribution Sociale Généralisée)</span>
                      <span className="text-xs text-gray-600 ml-2">{formatPourcentage(calculPS.CSG.taux * 100)}</span>
                    </div>
                    <span className="font-bold text-green-600">{formatEuro(calculPS.CSG.montant)}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">CRDS (Contribution au Remboursement de la Dette Sociale)</span>
                      <span className="text-xs text-gray-600 ml-2">{formatPourcentage(calculPS.CRDS.taux * 100)}</span>
                    </div>
                    <span className="font-bold text-green-600">{formatEuro(calculPS.CRDS.montant)}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Prélèvement de solidarité</span>
                      <span className="text-xs text-gray-600 ml-2">{formatPourcentage(calculPS.prelevementSolidarite.taux * 100)}</span>
                    </div>
                    <span className="font-bold text-green-600">{formatEuro(calculPS.prelevementSolidarite.montant)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">Total Prélèvements Sociaux</span>
                  <span className="font-bold text-2xl">{formatEuro(calculPS.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* IFI */}
          {calculIFI && calculIFI.ifiFinal > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-200">
                <Info className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-bold text-purple-900">
                  IFI (Impôt sur la Fortune Immobilière)
                </h3>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-3">🏠 Patrimoine immobilier net taxable</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Patrimoine immobilier net</span>
                    <span className="font-bold">{formatEuro(calculIFI.patrimoineNetTaxable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seuil d'imposition</span>
                    <span className="font-bold text-gray-600">{formatEuro(800000)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-purple-200">
                    <span className="font-semibold">Assiette taxable</span>
                    <span className="font-bold">{formatEuro(calculIFI.assiette - 800000)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-purple-900 mb-3">📈 Barème IFI</h4>
                {calculIFI.tranchesDetail.map((tranche, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-purple-900">
                        Tranche {tranche.tranche} : {formatPourcentage(tranche.taux * 100)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatEuro(tranche.min)} → {tranche.max ? formatEuro(tranche.max) : '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Montant dans la tranche</span>
                      <span className="font-medium">{formatEuro(tranche.montantTranche)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IFI sur cette tranche</span>
                      <span className="font-bold text-purple-600">{formatEuro(tranche.ifiTranche)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">IFI Total</span>
                  <span className="font-bold text-2xl">{formatEuro(calculIFI.ifiFinal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Note de bas de page */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
            <p className="text-yellow-800">
              <strong>📌 Note :</strong> Ces calculs sont basés sur les barèmes fiscaux 2026 et constituent une estimation.
              Pour un calcul précis et personnalisé, consultez un conseiller fiscal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
