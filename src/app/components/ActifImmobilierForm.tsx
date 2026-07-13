import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ActifImmobilierType, RegimeFiscal, ActifImmobilier } from '../types/client';
import type { FamilyInfo } from './client-detail/types';
import { DetentionBiensFields } from './client-detail/DetentionBiensFields';
import { RegimeFiscalField } from './client-detail/RegimeFiscalField';

interface ActifImmobilierFormProps {
  onAdd: (actif: Omit<ActifImmobilier, 'id' | 'color'>) => void;
  onCancel: () => void;
  familyInfo: FamilyInfo;
  clientName: string;
}

export function ActifImmobilierForm({ onAdd, onCancel, familyInfo, clientName }: ActifImmobilierFormProps) {
  const [type, setType] = useState<ActifImmobilierType>('Résidence principale');
  const [name, setName] = useState('');
  const [dateAcquisition, setDateAcquisition] = useState('');
  const [prixAcquisition, setPrixAcquisition] = useState(0);
  const [valeurActuelle, setValeurActuelle] = useState(0);
  const [regimeFiscal, setRegimeFiscal] = useState<RegimeFiscal>('micro');
  const [autresPrecision, setAutresPrecision] = useState('');
  const [loyerAnnuel, setLoyerAnnuel] = useState(0);
  
  // 🆕 Champs pour la détention des biens
  const [proprietaire, setProprietaire] = useState<'client' | 'conjoint' | 'indivision'>('client');
  const [natureAcquisition, setNatureAcquisition] = useState<'achat' | 'donation' | 'succession'>('achat');
  const [beneficiaire, setBeneficiaire] = useState<'client' | 'conjoint'>('client');
  
  // 🆕 Régime fiscal immobilier
  const [regimeFiscalImmobilier, setRegimeFiscalImmobilier] = useState<string>('aucun');

  const needsRegimeFiscal = type === 'Location meublée';
  const needsAutresPrecision = type === 'Autres';
  const needsLoyerAnnuel = type === 'Location nue' || type === 'Location meublée' || type === 'SCPI' || type === 'Terrain';

  const conjointName = familyInfo.spouse?.firstName && familyInfo.spouse?.lastName
    ? `${familyInfo.spouse.firstName} ${familyInfo.spouse.lastName}`
    : undefined;

  const handleSubmit = () => {
    if (!name || !dateAcquisition || prixAcquisition <= 0 || valeurActuelle <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (needsAutresPrecision && !autresPrecision) {
      alert('Veuillez préciser le type d\'actif immobilier');
      return;
    }

    const actif: Omit<ActifImmobilier, 'id' | 'color'> = {
      type,
      name,
      value: valeurActuelle,
      dateAcquisition,
      prixAcquisition,
      valeurActuelle,
      ...(needsRegimeFiscal && { regimeFiscal }),
      ...(needsAutresPrecision && { autresPrecision }),
      ...(needsLoyerAnnuel && { loyerAnnuel }),
      
      // 📅 TRAÇABILITÉ : Auto-générer la date de saisie
      dateSaisie: new Date().toISOString(),
      
      // 🏠 Régime fiscal immobilier
      regimeFiscal: regimeFiscalImmobilier,
      
      // 👩‍❤️‍👨 DÉTENTION DES BIENS
      ...(familyInfo.maritalStatus === 'Marié(e)' && { proprietaire }),
      ...(familyInfo.maritalStatus === 'Marié(e)' && { natureAcquisition }),
      ...(familyInfo.maritalStatus === 'Marié(e)' && (natureAcquisition === 'donation' || natureAcquisition === 'succession') && { beneficiaire }),
    };

    onAdd(actif);
  };

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Ajouter un actif immobilier</h4>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Type d'actif */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type d'actif immobilier *
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ActifImmobilierType)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
        >
          <option value="Résidence principale">Résidence principale</option>
          <option value="Résidence secondaire">Résidence secondaire</option>
          <option value="Location nue">Location nue</option>
          <option value="Location meublée">Location meublée</option>
          <option value="Terrain">Terrain</option>
          <option value="SCPI">SCPI</option>
          <option value="Autres">Autres</option>
        </select>
      </div>

      {/* Précision pour "Autres" */}
      {needsAutresPrecision && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Précisez le type *
          </label>
          <input
            type="text"
            value={autresPrecision}
            onChange={(e) => setAutresPrecision(e.target.value)}
            placeholder="Ex: Parking, Cave, etc."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>
      )}

      {/* Régime fiscal pour location meublée */}
      {needsRegimeFiscal && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Régime fiscal *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="micro"
                checked={regimeFiscal === 'micro'}
                onChange={(e) => setRegimeFiscal(e.target.value as RegimeFiscal)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-700">Micro</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="réel"
                checked={regimeFiscal === 'réel'}
                onChange={(e) => setRegimeFiscal(e.target.value as RegimeFiscal)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-700">Réel</span>
            </label>
          </div>
        </div>
      )}

      {/* Loyer annuel pour certains types */}
      {needsLoyerAnnuel && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loyer annuel (€) *
          </label>
          <input
            type="number"
            value={loyerAnnuel}
            onChange={(e) => setLoyerAnnuel(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
          />
        </div>
      )}

      {/* Nom / Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom / Description *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Appartement Paris 15ème"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Date d'acquisition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date d'acquisition *
        </label>
        <input
          type="date"
          value={dateAcquisition}
          onChange={(e) => setDateAcquisition(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Prix d'acquisition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prix d'acquisition (€) *
        </label>
        <input
          type="number"
          value={prixAcquisition}
          onChange={(e) => setPrixAcquisition(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Valeur actuelle estimée */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Valeur actuelle estimée (€) *
        </label>
        <input
          type="number"
          value={valeurActuelle}
          onChange={(e) => setValeurActuelle(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Régime fiscal immobilier */}
      <RegimeFiscalField
        value={regimeFiscalImmobilier}
        onChange={setRegimeFiscalImmobilier}
        actifType={type}
      />

      {/* Détention des biens */}
      {familyInfo.maritalStatus === 'Marié(e)' && (
        <DetentionBiensFields
          familyInfo={familyInfo}
          dateAcquisition={dateAcquisition}
          proprietaire={proprietaire}
          natureAcquisition={natureAcquisition}
          beneficiaire={beneficiaire}
          onProprietaireChange={setProprietaire}
          onNatureAcquisitionChange={setNatureAcquisition}
          onBeneficiaireChange={setBeneficiaire}
          clientName={clientName}
          conjointName={conjointName}
        />
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
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter</span>
        </button>
      </div>
    </div>
  );
}
