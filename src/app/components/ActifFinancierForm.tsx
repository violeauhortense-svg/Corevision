import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ActifFinancierType, ClauseBeneficiaire, ActifFinancier } from '../types/client';
import type { FamilyInfo } from './client-detail/types';
import { DetentionBiensFields } from './client-detail/DetentionBiensFields';

interface ActifFinancierFormProps {
  onAdd: (actif: Omit<ActifFinancier, 'id' | 'color'>) => void;
  onCancel: () => void;
  familyInfo: FamilyInfo;
  clientName: string;
}

// Liste des supports qui n'ont PAS besoin de date d'ouverture
const SUPPORTS_SANS_DATE = ['Livret A', 'LDDS', 'LEP', 'Livret jeune', 'Compte courant'];

// Liste des supports avec clause bénéficiaire
const SUPPORTS_AVEC_CLAUSE = ['Assurance-vie', 'PER', 'PERCO'];

export function ActifFinancierForm({ onAdd, onCancel, familyInfo, clientName }: ActifFinancierFormProps) {
  const [type, setType] = useState<ActifFinancierType>('Livret A');
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [dateOuverture, setDateOuverture] = useState('');
  const [clauseBeneficiaire, setClauseBeneficiaire] = useState<ClauseBeneficiaire>('standard');
  const [clausePersonnalisee, setClausePersonnalisee] = useState('');
  
  // 🆕 Champs pour la détention des biens
  const [proprietaire, setProprietaire] = useState<'client' | 'conjoint' | 'indivision'>('client');
  const [natureAcquisition, setNatureAcquisition] = useState<'achat' | 'donation' | 'succession'>('achat');
  const [beneficiaire, setBeneficiaire] = useState<'client' | 'conjoint'>('client');

  const needsDateOuverture = !SUPPORTS_SANS_DATE.includes(type);
  const needsClauseBeneficiaire = SUPPORTS_AVEC_CLAUSE.includes(type);

  const conjointName = familyInfo.spouse?.firstName && familyInfo.spouse?.lastName
    ? `${familyInfo.spouse.firstName} ${familyInfo.spouse.lastName}`
    : undefined;

  const handleSubmit = () => {
    if (!name || value <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (needsDateOuverture && !dateOuverture) {
      alert('La date d\'ouverture est obligatoire pour ce type de support');
      return;
    }

    if (needsClauseBeneficiaire && clauseBeneficiaire === 'personnalisée' && !clausePersonnalisee) {
      alert('Veuillez rédiger la clause bénéficiaire personnalisée');
      return;
    }

    const actif: Omit<ActifFinancier, 'id' | 'color'> = {
      type,
      name,
      value,
      ...(needsDateOuverture && { dateOuverture }),
      ...(needsClauseBeneficiaire && {
        clauseBeneficiaire,
        ...(clauseBeneficiaire === 'personnalisée' && { clausePersonnalisee }),
      }),
      
      // 📅 TRAÇABILITÉ : Auto-générer la date de saisie
      dateSaisie: new Date().toISOString(),
      
      // 👩‍❤️‍👨 DÉTENTION DES BIENS
      ...(familyInfo.maritalStatus === 'Marié(e)' && { proprietaire }),
      ...(familyInfo.maritalStatus === 'Marié(e)' && { natureAcquisition }),
      ...(familyInfo.maritalStatus === 'Marié(e)' && (natureAcquisition === 'donation' || natureAcquisition === 'succession') && { beneficiaire }),
    };

    onAdd(actif);
  };

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Ajouter un actif financier</h4>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Type de support */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de support *
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ActifFinancierType)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="Livret A">Livret A</option>
          <option value="LDDS">LDDS</option>
          <option value="LEP">LEP</option>
          <option value="PEL">PEL</option>
          <option value="CEL">CEL</option>
          <option value="Livret jeune">Livret jeune</option>
          <option value="Compte courant">Compte courant</option>
          <option value="CTO">CTO</option>
          <option value="PEA">PEA</option>
          <option value="PER">PER</option>
          <option value="PERCO">PERCO</option>
          <option value="Assurance-vie">Assurance-vie</option>
          <option value="PEE">PEE</option>
          <option value="Plan Épargne Avenir">Plan Épargne Avenir</option>
          <option value="Crypto">Crypto</option>
          <option value="Préfon">Préfon</option>
        </select>
      </div>

      {/* Nom du support */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom / Établissement *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Livret A Crédit Agricole"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Valeur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Valeur (€) *
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Date d'ouverture (conditionnel) */}
      {needsDateOuverture && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'ouverture du support *
          </label>
          <input
            type="date"
            value={dateOuverture}
            onChange={(e) => setDateOuverture(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Clause bénéficiaire (conditionnel) */}
      {needsClauseBeneficiaire && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clause bénéficiaire
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="standard"
                  checked={clauseBeneficiaire === 'standard'}
                  onChange={(e) => setClauseBeneficiaire(e.target.value as ClauseBeneficiaire)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Clause bénéficiaire standard</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="personnalisée"
                  checked={clauseBeneficiaire === 'personnalisée'}
                  onChange={(e) => setClauseBeneficiaire(e.target.value as ClauseBeneficiaire)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Clause bénéficiaire personnalisée</span>
              </label>
            </div>
          </div>

          {clauseBeneficiaire === 'personnalisée' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rédaction de la clause personnalisée *
              </label>
              <textarea
                value={clausePersonnalisee}
                onChange={(e) => setClausePersonnalisee(e.target.value)}
                rows={4}
                placeholder="Saisissez la clause bénéficiaire personnalisée..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Détention des biens (conditionnel) */}
      {familyInfo.maritalStatus === 'Marié(e)' && (
        <DetentionBiensFields
          familyInfo={familyInfo}
          dateAcquisition={dateOuverture}
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter</span>
        </button>
      </div>
    </div>
  );
}
