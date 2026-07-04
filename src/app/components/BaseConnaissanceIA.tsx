import { useState, useEffect } from 'react';
import { Brain, Edit2, Save, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { RegleFiscale } from '../types/optimisation';

// Ré-exporter le type pour compatibilité
export type { RegleFiscale } from '../types/optimisation';

interface BaseConnaissanceIAProps {
  onUpdate?: (regles: RegleFiscale[]) => void;
  storageKey?: string;
}

const REGLES_PAR_DEFAUT: RegleFiscale[] = [
  {
    id: 'sarl-gerant-majoritaire',
    statutJuridique: 'SARL',
    typeDirigeant: 'Gérant majoritaire',
    cotisationsSociales: 45,
    plafondDividendesTNS: '10% du capital + CCA + primes',
    pfuApplicable: true,
    tauxPFU: 30,
    regimeIS: true,
    tauxIS15: 15,
    tauxIS25: 25,
    notes: 'Au-delà du plafond, les dividendes sont soumis aux cotisations TNS (≈45%)'
  },
  {
    id: 'sarl-gerant-minoritaire',
    statutJuridique: 'SARL',
    typeDirigeant: 'Gérant minoritaire',
    cotisationsSociales: 65,
    pfuApplicable: true,
    tauxPFU: 30,
    regimeIS: true,
    tauxIS15: 15,
    tauxIS25: 25,
    notes: 'Assimilé salarié : cotisations sociales ≈65% du brut, dividendes soumis PFU 30%'
  },
  {
    id: 'sas-president',
    statutJuridique: 'SAS',
    typeDirigeant: 'Président',
    cotisationsSociales: 75,
    pfuApplicable: true,
    tauxPFU: 30,
    regimeIS: true,
    tauxIS15: 15,
    tauxIS25: 25,
    notes: 'Assimilé salarié : cotisations sociales ≈75% du brut, dividendes soumis PFU 30%'
  },
  {
    id: 'eurl-gerant',
    statutJuridique: 'EURL',
    typeDirigeant: 'Gérant',
    cotisationsSociales: 45,
    plafondDividendesTNS: '10% du capital + CCA + primes',
    pfuApplicable: true,
    tauxPFU: 30,
    regimeIS: true,
    tauxIS15: 15,
    tauxIS25: 25,
    notes: 'TNS : même régime que SARL gérant majoritaire'
  },
  {
    id: 'sci-is',
    statutJuridique: 'SCI',
    typeDirigeant: 'Associé',
    cotisationsSociales: 0,
    pfuApplicable: true,
    tauxPFU: 30,
    regimeIS: true,
    tauxIS15: 15,
    tauxIS25: 25,
    notes: 'SCI à l\'IS : revenus fonciers imposés comme dividendes (PFU 30% ou barème IR)'
  },
  {
    id: 'sci-ir',
    statutJuridique: 'SCI',
    typeDirigeant: 'Associé',
    cotisationsSociales: 0,
    pfuApplicable: false,
    tauxPFU: 30,
    regimeIS: false,
    tauxIS15: 0,
    tauxIS25: 0,
    notes: 'SCI à l\'IR : résultat directement imposable au foyer (revenus fonciers)'
  },
  {
    id: 'ei',
    statutJuridique: 'EI',
    typeDirigeant: 'Entrepreneur individuel',
    cotisationsSociales: 45,
    pfuApplicable: false,
    tauxPFU: 0,
    regimeIS: false,
    tauxIS15: 0,
    tauxIS25: 0,
    notes: 'Résultat imposé directement au barème IR, cotisations TNS sur le résultat'
  },
];

export function BaseConnaissanceIA({ onUpdate, storageKey = 'crm_base_connaissance_ia' }: BaseConnaissanceIAProps) {
  const [regles, setRegles] = useState<RegleFiscale[]>(REGLES_PAR_DEFAUT);
  const [editingRegle, setEditingRegle] = useState<RegleFiscale | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Charger les règles depuis le localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRegles(parsed);
      } catch (error) {
        console.error('Erreur lors du chargement de la base de connaissance:', error);
      }
    }
  }, [storageKey]);

  // Sauvegarder les règles dans le localStorage
  const saveRegles = (newRegles: RegleFiscale[]) => {
    setRegles(newRegles);
    localStorage.setItem(storageKey, JSON.stringify(newRegles));
    if (onUpdate) {
      onUpdate(newRegles);
    }
    toast.success('Base de connaissance mise à jour');
  };

  // Ouvrir l'édition d'une règle
  const startEdit = (regle: RegleFiscale) => {
    setEditingRegle({ ...regle });
    setIsEditing(true);
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingRegle(null);
    setIsEditing(false);
  };

  // Sauvegarder une règle modifiée
  const saveEdit = () => {
    if (!editingRegle) return;

    const newRegles = regles.map(r => 
      r.id === editingRegle.id ? editingRegle : r
    );
    saveRegles(newRegles);
    setIsEditing(false);
    setEditingRegle(null);
  };

  // Réinitialiser aux valeurs par défaut
  const resetToDefault = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les règles aux valeurs par défaut ?')) {
      saveRegles(REGLES_PAR_DEFAUT);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Base de connaissance IA</h2>
              <p className="text-sm text-gray-600">Règles fiscales et sociales pour l'optimisation</p>
            </div>
          </div>
          <button
            onClick={resetToDefault}
            className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
          >
            Réinitialiser
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">💡 À quoi sert cette base ?</p>
            <p>
              Cette base de connaissance contient toutes les règles fiscales et sociales nécessaires pour 
              calculer l'optimisation de la rémunération et des dividendes. Vous pouvez modifier ces règles 
              pour les adapter aux évolutions législatives.
            </p>
          </div>
        </div>
      </div>

      {/* Liste des règles */}
      <div className="grid grid-cols-1 gap-4">
        {regles.map((regle) => (
          <div key={regle.id} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {regle.statutJuridique} - {regle.typeDirigeant}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      {regle.regimeIS ? 'Régime IS' : 'Régime IR'}
                    </span>
                    {regle.pfuApplicable && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        PFU {regle.tauxPFU}%
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(regle)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Cotisations sociales</p>
                  <p className="text-lg font-bold text-gray-900">{regle.cotisationsSociales}%</p>
                </div>
                {regle.regimeIS && (
                  <>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">IS (&le; 42 500 €)</p>
                      <p className="text-lg font-bold text-gray-900">{regle.tauxIS15}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">IS (&gt; 42 500 €)</p>
                      <p className="text-lg font-bold text-gray-900">{regle.tauxIS25}%</p>
                    </div>
                  </>
                )}
                {regle.pfuApplicable && (
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">PFU dividendes</p>
                    <p className="text-lg font-bold text-gray-900">{regle.tauxPFU}%</p>
                  </div>
                )}
              </div>

              {regle.plafondDividendesTNS && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-800 font-medium mb-1">⚠️ Plafond dividendes TNS</p>
                  <p className="text-sm text-orange-900">{regle.plafondDividendesTNS}</p>
                </div>
              )}

              {regle.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-medium mb-1">📝 Notes</p>
                  <p className="text-sm text-gray-700">{regle.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'édition */}
      {isEditing && editingRegle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Modifier la règle : {editingRegle.statutJuridique} - {editingRegle.typeDirigeant}
              </h3>
              <button
                onClick={cancelEdit}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Cotisations sociales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cotisations sociales (%)
                </label>
                <input
                  type="number"
                  value={editingRegle.cotisationsSociales}
                  onChange={(e) => setEditingRegle({ ...editingRegle, cotisationsSociales: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  step="0.1"
                />
              </div>

              {/* Plafond dividendes TNS */}
              {editingRegle.plafondDividendesTNS !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plafond dividendes TNS
                  </label>
                  <input
                    type="text"
                    value={editingRegle.plafondDividendesTNS}
                    onChange={(e) => setEditingRegle({ ...editingRegle, plafondDividendesTNS: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {/* PFU */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingRegle.pfuApplicable}
                    onChange={(e) => setEditingRegle({ ...editingRegle, pfuApplicable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">PFU applicable</span>
                </label>
                {editingRegle.pfuApplicable && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taux PFU (%)</label>
                    <input
                      type="number"
                      value={editingRegle.tauxPFU}
                      onChange={(e) => setEditingRegle({ ...editingRegle, tauxPFU: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                      step="0.1"
                    />
                  </div>
                )}
              </div>

              {/* IS */}
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={editingRegle.regimeIS}
                    onChange={(e) => setEditingRegle({ ...editingRegle, regimeIS: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Régime IS</span>
                </label>
                {editingRegle.regimeIS && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taux IS &le; 42 500 € (%)
                      </label>
                      <input
                        type="number"
                        value={editingRegle.tauxIS15}
                        onChange={(e) => setEditingRegle({ ...editingRegle, tauxIS15: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taux IS &gt; 42 500 € (%)
                      </label>
                      <input
                        type="number"
                        value={editingRegle.tauxIS25}
                        onChange={(e) => setEditingRegle({ ...editingRegle, tauxIS25: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                        step="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editingRegle.notes || ''}
                  onChange={(e) => setEditingRegle({ ...editingRegle, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  rows={3}
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour récupérer les règles
export function getReglesFiscales(storageKey = 'crm_base_connaissance_ia'): RegleFiscale[] {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Erreur lors du chargement de la base de connaissance:', error);
    }
  }
  return REGLES_PAR_DEFAUT;
}

// Fonction utilitaire pour trouver une règle spécifique
export function findRegle(statutJuridique: string, typeDirigeant: string, storageKey = 'crm_base_connaissance_ia'): RegleFiscale | undefined {
  const regles = getReglesFiscales(storageKey);
  return regles.find(r => 
    r.statutJuridique.toLowerCase() === statutJuridique.toLowerCase() &&
    r.typeDirigeant.toLowerCase().includes(typeDirigeant.toLowerCase())
  );
}