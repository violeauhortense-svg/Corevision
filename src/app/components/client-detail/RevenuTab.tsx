import { useState } from 'react';
import { Plus, Edit, Trash2, Euro, Users, Save, X, TrendingUp, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import type { RevenuItem, ImpositionData, FamilyInfo } from './types';
import { RevenusImpositionForm } from '../RevenusImpositionForm';

interface RevenusTabProps {
  revenus: RevenuItem[];
  imposition: ImpositionData;
  familyInfo: FamilyInfo;
  onUpdateRevenus: (revenus: RevenuItem[]) => void;
  onUpdateImposition: (imposition: ImpositionData, revenus: RevenuItem[]) => void;
  clientData?: any;
  patrimoineImmobilierNet?: number;
  totalLoyersNus?: number;
  totalLoyersMeubles?: number;
}

export function RevenusTab({
  revenus,
  imposition,
  familyInfo,
  onUpdateRevenus,
  onUpdateImposition,
  clientData,
  patrimoineImmobilierNet = 0,
  totalLoyersNus = 0,
  totalLoyersMeubles = 0,
}: RevenusTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Mapper les types d'imposition entre les deux formats
  const mappedImposition = {
    traitementsSalairesPensions: imposition.traitementsSalairesPensions || 0,
    revenusTNS: imposition.revenusTNS || 0,
    locationsMeublesNonPro: imposition.locationsMeublesNonPro || 0,
    locationsMeublesRegime: imposition.locationsMeublesNonProType || 'micro',
    revenusValeursMobilieres: imposition.reveusValeursCapitauxMobiliers || 0,
    plusValueMobiliere: imposition.plusValueMobiliere || 0,
    revenusFonciers: imposition.revenusFonciers || 0,
    nombreParts: imposition.nombreParts || 1,
    trancheMarginaleTMI: parseInt(imposition.tmi || '0'),
    impotSurRevenu: imposition.impotRevenu || 0,
    prelevementsSociaux: imposition.prelevementsSociaux || 0, // 🔥 NOUVEAU
    IFI: imposition.ifi || 0,
    traitementsSalairesPensionsModifieeManuellement: false,
    revenusTNSModifieeManuellement: false,
    locationsMeublesModifieeManuellement: imposition.locationsMeublesNonProModifiedManually || false,
    revenusFonciersModifies: imposition.revenusFonciersModifiedManually || false,
    justificationTraitementsSalairesPensions: '',
    justificationRevenusTNS: '',
    justificationLocationsMeubles: imposition.locationsMeublesNonProJustification || '',
    justificationRevenusFonciers: imposition.revenusFonciersJustification || '',
  };

  // Mapper familyInfo vers le format attendu
  const mappedFamilyInfo = {
    ...familyInfo,
    clientMajoration: clientData?.majorationPartFiscale || false,
    spouse: familyInfo.spouse ? {
      ...familyInfo.spouse,
      majoration: familyInfo.spouse.majorationPartFiscale || false,
    } : undefined,
    children: familyInfo.children?.map((child: any) => ({
      ...child,
      aChargeFiscalement: child.isChargeFiscale || false,
      majoration: child.majorationPartFiscale || false,
    })) || [],
  };

  const handleSave = (updatedRevenus: RevenuItem[], updatedImposition: any) => {
    const now = new Date().toISOString();

    // Ajouter traçabilité aux revenus
    const revenusWithTracing = updatedRevenus.map(rev => ({
      ...rev,
      dateCreation: rev.dateCreation || now,
      dateModification: now,
    }));

    // Mapper retour vers le format original
    const mappedBack: ImpositionData = {
      traitementsSalairesPensions: updatedImposition.traitementsSalairesPensions,
      revenusTNS: updatedImposition.revenusTNS,
      locationsMeublesNonPro: updatedImposition.locationsMeublesNonPro,
      locationsMeublesNonProType: updatedImposition.locationsMeublesRegime,
      reveusValeursCapitauxMobiliers: updatedImposition.revenusValeursMobilieres,
      plusValueMobiliere: updatedImposition.plusValueMobiliere,
      revenusFonciers: updatedImposition.revenusFonciers,
      nombreParts: updatedImposition.nombreParts,
      tmi: updatedImposition.trancheMarginaleTMI.toString() as any,
      impotRevenu: updatedImposition.impotSurRevenu,
      prelevementsSociaux: updatedImposition.prelevementsSociaux,
      ifi: updatedImposition.IFI,
      locationsMeublesNonProModifiedManually: updatedImposition.locationsMeublesModifieeManuellement,
      locationsMeublesNonProJustification: updatedImposition.justificationLocationsMeubles,
      revenusFonciersModifiedManually: updatedImposition.revenusFonciersModifies,
      revenusFonciersJustification: updatedImposition.justificationRevenusFonciers,
      dateCreation: imposition.dateCreation || now,
      dateModification: now,
    };

    onUpdateRevenus(revenusWithTracing);
    onUpdateImposition(mappedBack, revenusWithTracing);
    toast.success('✅ Revenus et imposition mis à jour');
  };

  return (
    <div className="space-y-6">
      {/* Bouton modifier en haut à droite */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isEditing 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-5 h-5" />
              <span>Mode lecture</span>
            </>
          ) : (
            <>
              <Edit className="w-5 h-5" />
              <span>Modifier</span>
            </>
          )}
        </button>
      </div>

      {/* Composant RevenusImpositionForm */}
      <RevenusImpositionForm
        revenus={revenus}
        imposition={mappedImposition}
        onSave={handleSave}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        familyInfo={mappedFamilyInfo}
        patrimoineImmobilierNet={patrimoineImmobilierNet}
        clientData={clientData}
        totalLoyersNus={totalLoyersNus}
        totalLoyersMeubles={totalLoyersMeubles}
      />
    </div>
  );
}