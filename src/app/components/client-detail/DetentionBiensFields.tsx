import { Info } from 'lucide-react';
import type { FamilyInfo } from './types';
import { getDetentionContext } from '../../utils/detentionBiens';

interface DetentionBiensFieldsProps {
  familyInfo: FamilyInfo;
  dateAcquisition?: string;
  proprietaire?: 'client' | 'conjoint' | 'indivision';
  natureAcquisition?: 'achat' | 'donation' | 'succession';
  beneficiaire?: 'client' | 'conjoint';
  onProprietaireChange: (value: 'client' | 'conjoint' | 'indivision') => void;
  onNatureAcquisitionChange: (value: 'achat' | 'donation' | 'succession') => void;
  onBeneficiaireChange: (value: 'client' | 'conjoint') => void;
  clientName: string;
  conjointName?: string;
}

export function DetentionBiensFields({
  familyInfo,
  dateAcquisition,
  proprietaire,
  natureAcquisition,
  beneficiaire,
  onProprietaireChange,
  onNatureAcquisitionChange,
  onBeneficiaireChange,
  clientName,
  conjointName,
}: DetentionBiensFieldsProps) {
  const context = getDetentionContext(familyInfo, dateAcquisition);

  // Ne rien afficher si pas marié
  if (familyInfo.maritalStatus !== 'Marié(e)') {
    return null;
  }

  const conjointLabel = conjointName || familyInfo.spouse?.firstName || 'Conjoint';

  return (
    <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-purple-800">
          <strong>Détention juridique du bien</strong>
          <p className="mt-1">{context.help}</p>
        </div>
      </div>

      {/* Champ Propriétaire (régime séparatiste ou avant mariage) */}
      {context.showProprietaire && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Propriétaire du bien *
          </label>
          <select
            value={proprietaire || ''}
            onChange={(e) =>
              onProprietaireChange(e.target.value as 'client' | 'conjoint' | 'indivision')
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Sélectionner...</option>
            <option value="client">{clientName}</option>
            <option value="conjoint">{conjointLabel}</option>
            <option value="indivision">Indivision</option>
          </select>
        </div>
      )}

      {/* Champ Nature d'acquisition (régime communautaire après mariage) */}
      {context.showNatureAcquisition && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nature de l'acquisition *
          </label>
          <select
            value={natureAcquisition || ''}
            onChange={(e) =>
              onNatureAcquisitionChange(e.target.value as 'achat' | 'donation' | 'succession')
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Sélectionner...</option>
            <option value="achat">Achat (bien commun)</option>
            <option value="donation">Donation (bien propre)</option>
            <option value="succession">Succession (bien propre)</option>
          </select>
        </div>
      )}

      {/* Champ Bénéficiaire (si donation ou succession) */}
      {context.showBeneficiaire &&
        (natureAcquisition === 'donation' || natureAcquisition === 'succession') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bénéficiaire *
            </label>
            <select
              value={beneficiaire || ''}
              onChange={(e) => onBeneficiaireChange(e.target.value as 'client' | 'conjoint')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">Sélectionner...</option>
              <option value="client">{clientName}</option>
              <option value="conjoint">{conjointLabel}</option>
            </select>
          </div>
        )}

      {/* Résumé de la qualification juridique */}
      {(proprietaire || natureAcquisition) && (
        <div className="pt-2 border-t border-purple-200">
          <div className="text-xs text-gray-600">
            <strong>Qualification :</strong>{' '}
            {proprietaire === 'client' && `Bien propre de ${clientName}`}
            {proprietaire === 'conjoint' && `Bien propre de ${conjointLabel}`}
            {proprietaire === 'indivision' && 'Bien en indivision'}
            {natureAcquisition === 'achat' && 'Bien commun (acquis par achat après mariage)'}
            {natureAcquisition === 'donation' &&
              beneficiaire &&
              `Bien propre de ${beneficiaire === 'client' ? clientName : conjointLabel} (donation)`}
            {natureAcquisition === 'succession' &&
              beneficiaire &&
              `Bien propre de ${beneficiaire === 'client' ? clientName : conjointLabel} (succession)`}
          </div>
        </div>
      )}
    </div>
  );
}
