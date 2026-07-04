import { useState } from 'react';
import { Info, Plus, X } from 'lucide-react';

interface RegimeFiscalFieldProps {
  value?: string;
  onChange: (value: string) => void;
  actifType?: string; // Type de l'actif immobilier (pour filtrer les régimes disponibles)
}

// 🔧 Déplacer la constante avant le composant pour éviter TDZ
const regimesFiscauxDisponibles = [
  { value: 'aucun', label: 'Aucun dispositif fiscal', icon: '🚫' },
  { value: 'pinel', label: 'Pinel', icon: '🏢', description: 'Réduction d\'impôt locatif neuf' },
  { value: 'malraux', label: 'Malraux', icon: '🏛️', description: 'Rénovation patrimoine historique' },
  { value: 'deficit_foncier', label: 'Déficit foncier', icon: '🔧', description: 'Travaux déductibles' },
  { value: 'lmnp', label: 'LMNP', icon: '🏠', description: 'Location meublée non professionnelle' },
  { value: 'lmp', label: 'LMP', icon: '💼', description: 'Location meublée professionnelle' },
  { value: 'monument_historique', label: 'Monument historique', icon: '🏰', description: 'Déficit sans plafond' },
  { value: 'denormandie', label: 'Denormandie', icon: '🏘️', description: 'Réduction d\'impôt ancien à rénover' },
  { value: 'censi_bouvard', label: 'Censi-Bouvard', icon: '🏥', description: 'Résidences services' },
  { value: 'girardin', label: 'Girardin', icon: '🏝���', description: 'Investissement Outre-mer' },
];

export function RegimeFiscalField({ value, onChange, actifType }: RegimeFiscalFieldProps) {
  const [showAutreInput, setShowAutreInput] = useState(
    value && !regimesFiscauxDisponibles.find((r) => r.value === value)
  );
  const [autreRegime, setAutreRegime] = useState(
    value && !regimesFiscauxDisponibles.find((r) => r.value === value) ? value : ''
  );

  const handleRegimeChange = (newValue: string) => {
    if (newValue === 'autre') {
      setShowAutreInput(true);
    } else {
      setShowAutreInput(false);
      onChange(newValue);
    }
  };

  const handleAutreRegimeSubmit = () => {
    if (autreRegime.trim()) {
      onChange(autreRegime.trim());
      setShowAutreInput(false);
    }
  };

  const getSelectedRegime = () => {
    return regimesFiscauxDisponibles.find((r) => r.value === value);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Régime fiscal applicable
        </label>
        <select
          value={value || 'aucun'}
          onChange={(e) => handleRegimeChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {regimesFiscauxDisponibles.map((regime) => (
            <option key={regime.value} value={regime.value}>
              {regime.icon} {regime.label}
            </option>
          ))}
          <option value="autre">➕ Autre (à préciser)</option>
        </select>
      </div>

      {/* Description du régime sélectionné */}
      {getSelectedRegime() && getSelectedRegime()?.description && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <strong>{getSelectedRegime()?.label}</strong>
            <p className="mt-0.5">{getSelectedRegime()?.description}</p>
          </div>
        </div>
      )}

      {/* Input pour "Autre" régime fiscal */}
      {showAutreInput && (
        <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Préciser le régime fiscal
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={autreRegime}
              onChange={(e) => setAutreRegime(e.target.value)}
              placeholder="Ex: Zone franche urbaine, ..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAutreRegimeSubmit}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowAutreInput(false);
                setAutreRegime('');
                onChange('aucun');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Affichage du régime "autre" personnalisé */}
      {!showAutreInput && value && !regimesFiscauxDisponibles.find((r) => r.value === value) && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-800">Régime personnalisé :</span>
            <span className="text-sm text-green-700">{value}</span>
          </div>
          <button
            onClick={() => {
              setShowAutreInput(true);
              setAutreRegime(value);
            }}
            className="text-green-600 hover:text-green-700 text-xs underline"
          >
            Modifier
          </button>
        </div>
      )}

      {/* Info complémentaire */}
      <div className="text-xs text-gray-500 italic">
        💡 Cette information est exploitée par l'IA pour optimiser les recommandations fiscales
      </div>
    </div>
  );
}