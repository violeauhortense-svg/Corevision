import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type { Passif, ActifImmobilier } from '../types/client';
import { calculerDateFin, calculerCapitalRestantDu, calculerMensualite } from '../utils/passifCalculations';

interface PassifFormProps {
  actifsImmobiliers: ActifImmobilier[];
  onAdd: (passif: Omit<Passif, 'id' | 'color'>) => void;
  onCancel: () => void;
}

export function PassifForm({ actifsImmobiliers, onAdd, onCancel }: PassifFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'immobilier' | 'lld' | 'consommation'>('immobilier');
  const [linkedActifId, setLinkedActifId] = useState('');
  const [capitalInitial, setCapitalInitial] = useState(0);
  const [tauxEmprunt, setTauxEmprunt] = useState(0);
  const [typeTaux, setTypeTaux] = useState<'fixe' | 'variable'>('fixe');
  const [dateDebut, setDateDebut] = useState('');
  const [nombreEcheances, setNombreEcheances] = useState(0);

  // Calculs automatiques
  const [dateFin, setDateFin] = useState('');
  const [capitalRestantDu, setCapitalRestantDu] = useState(0);
  const [mensualite, setMensualite] = useState(0);
  const [dureeRestante, setDureeRestante] = useState(0);
  const [echeancesRestantes, setEcheancesRestantes] = useState(0);

  // Mettre à jour les calculs automatiques
  useEffect(() => {
    if (dateDebut && nombreEcheances > 0) {
      const newDateFin = calculerDateFin(dateDebut, nombreEcheances);
      setDateFin(newDateFin);
      
      // Calcul des échéances et durée restantes
      const dateDebutObj = new Date(dateDebut);
      const dateActuelle = new Date();
      const moisEcoules = Math.max(0, Math.floor((dateActuelle.getTime() - dateDebutObj.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
      const echeancesRest = Math.max(0, nombreEcheances - moisEcoules);
      setEcheancesRestantes(echeancesRest);
      setDureeRestante(Math.ceil(echeancesRest / 12));
    }

    if (capitalInitial > 0 && nombreEcheances > 0 && dateDebut) {
      const tauxDecimal = tauxEmprunt / 100;
      const crd = calculerCapitalRestantDu(capitalInitial, tauxDecimal, nombreEcheances, dateDebut);
      setCapitalRestantDu(crd);

      const mens = calculerMensualite(capitalInitial, tauxDecimal, nombreEcheances);
      setMensualite(mens);
    }
  }, [capitalInitial, tauxEmprunt, dateDebut, nombreEcheances]);

  const handleSubmit = () => {
    if (!name || capitalInitial <= 0 || !dateDebut || nombreEcheances <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const linkedActif = actifsImmobiliers.find(a => a.id === linkedActifId);
    const dureeInitiale = Math.ceil(nombreEcheances / 12);

    const passif: Omit<Passif, 'id' | 'color'> = {
      name,
      value: capitalRestantDu,
      type,
      ...(linkedActifId && {
        linkedActifId,
        linkedActifName: linkedActif?.name,
      }),
      capitalInitial,
      tauxEmprunt,
      typeTaux,
      dateDebut,
      nombreEcheances,
      dateFin,
      capitalRestantDu,
      mensualite,
      dureeInitiale,
      dureeRestante,
      echeancesRestantes,
    };

    onAdd(passif);
  };

  return (
    <div className="bg-white border border-red-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Ajouter un passif</h4>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Type de passif */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de passif *
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'immobilier' | 'lld' | 'consommation')}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
        >
          <option value="immobilier">Crédit immobilier</option>
          <option value="lld">Location longue durée (LLD)</option>
          <option value="consommation">Crédit à la consommation</option>
        </select>
      </div>

      {/* Liaison avec un actif immobilier (pour crédits immobiliers) */}
      {type === 'immobilier' && actifsImmobiliers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lié à un actif immobilier (optionnel)
          </label>
          <select
            value={linkedActifId}
            onChange={(e) => setLinkedActifId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
          >
            <option value="">-- Aucun --</option>
            {actifsImmobiliers.map((actif) => (
              <option key={actif.id} value={actif.id}>
                {actif.name} ({actif.type})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Nom du passif */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom / Description *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'lld' ? 'Ex: LLD Peugeot 3008' : 'Ex: Prêt immobilier Crédit Agricole'}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Capital initial */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Capital initial (€) *
        </label>
        <input
          type="number"
          value={capitalInitial}
          onChange={(e) => setCapitalInitial(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Taux d'emprunt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Taux d'emprunt annuel (%) *
        </label>
        <input
          type="number"
          step="0.01"
          value={tauxEmprunt}
          onChange={(e) => setTauxEmprunt(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Type de taux */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de taux *
        </label>
        <select
          value={typeTaux}
          onChange={(e) => setTypeTaux(e.target.value as 'fixe' | 'variable')}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
        >
          <option value="fixe">Fixe</option>
          <option value="variable">Variable</option>
        </select>
      </div>

      {/* Date de début */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de début de l'emprunt *
        </label>
        <input
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Nombre d'échéances */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre d'échéances (mois) *
        </label>
        <input
          type="number"
          value={nombreEcheances}
          onChange={(e) => setNombreEcheances(parseInt(e.target.value) || 0)}
          placeholder="0"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Calculs automatiques */}
      {dateFin && capitalRestantDu >= 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h5 className="text-sm font-semibold text-blue-900">📊 Calculs automatiques</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Date de fin:</p>
              <p className="font-semibold text-gray-900">{new Date(dateFin).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-gray-600">Mensualité:</p>
              <p className="font-semibold text-gray-900">{mensualite.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Capital restant dû:</p>
              <p className="font-semibold text-gray-900 text-lg">{capitalRestantDu.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div>
              <p className="text-gray-600">Durée restante:</p>
              <p className="font-semibold text-gray-900">{dureeRestante} ans</p>
            </div>
            <div>
              <p className="text-gray-600">Échéances restantes:</p>
              <p className="font-semibold text-gray-900">{echeancesRestantes} mois</p>
            </div>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter</span>
        </button>
      </div>
    </div>
  );
}