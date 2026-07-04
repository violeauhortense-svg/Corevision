import { useState } from 'react';
import { Edit, Heart, Users, Baby, Plus, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { ClientData, FamilyInfo } from './types';

interface FoyerTabProps {
  clientData: ClientData;
  familyInfo: FamilyInfo;
  onUpdateFamily: (family: FamilyInfo) => void;
}

export function FoyerTab({ clientData, familyInfo, onUpdateFamily }: FoyerTabProps) {
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [localFamilyInfo, setLocalFamilyInfo] = useState<FamilyInfo>(familyInfo);

  // Fonction pour calculer l'âge à partir d'une date de naissance
  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Ajuster si l'anniversaire n'est pas encore passé cette année
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Fonction pour sauvegarder la composition du foyer
  const saveFamily = () => {
    const now = new Date().toISOString();
    const updatedFamily = {
      ...localFamilyInfo,
      dateCreation: localFamilyInfo.dateCreation || now,
      dateModification: now,
      dateSaisie: localFamilyInfo.dateSaisie || now,
    };
    onUpdateFamily(updatedFamily);
    setIsEditingFamily(false);
    toast.success('Composition du foyer mise à jour');
  };

  // Fonction pour ajouter un enfant
  const addChild = () => {
    const newChild = {
      id: `child-${Date.now()}`,
      firstName: '',
      lastName: '',
      birthDate: '',
      dependent: true,
      isChargeFiscale: true,
      isChildOfClient: true,
      isChildOfSpouse: false,
      majorationPartFiscale: false,
    };
    setLocalFamilyInfo({
      ...localFamilyInfo,
      children: [...localFamilyInfo.children, newChild],
    });
  };

  // Fonction pour supprimer un enfant
  const removeChild = (id: string) => {
    setLocalFamilyInfo({
      ...localFamilyInfo,
      children: localFamilyInfo.children.filter((child) => child.id !== id),
    });
  };

  // Calcul des parts fiscales
  const calculateFiscalParts = () => {
    let parts = 1; // Client

    // Conjoint (marié ou pacsé)
    if (localFamilyInfo.maritalStatus === 'Marié(e)' || localFamilyInfo.maritalStatus === 'Pacsé(e)') {
      parts += 1;
    }

    // Enfants
    const dependentChildren = localFamilyInfo.children.filter(
      (child) => child.dependent && child.isChargeFiscale
    );
    if (dependentChildren.length === 1) {
      parts += 0.5;
    } else if (dependentChildren.length === 2) {
      parts += 1;
    } else if (dependentChildren.length >= 3) {
      parts += 1 + (dependentChildren.length - 2);
    }

    // Majorations
    if (clientData.majorationPartFiscale) {
      parts += 0.5;
    }
    if (localFamilyInfo.spouse?.majorationPartFiscale) {
      parts += 0.5;
    }
    localFamilyInfo.children.forEach((child) => {
      if (child.majorationPartFiscale && child.isChargeFiscale) {
        parts += 0.5;
      }
    });

    return parts;
  };

  const fiscalParts = calculateFiscalParts();

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton édition */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-gray-900">Composition du foyer</h3>
        {!isEditingFamily && (
          <button
            onClick={() => setIsEditingFamily(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        )}
        {isEditingFamily && (
          <div className="flex gap-2">
            <button
              onClick={saveFamily}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
            <button
              onClick={() => {
                setLocalFamilyInfo(familyInfo);
                setIsEditingFamily(false);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Situation matrimoniale */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-6 h-6 text-pink-600" />
          <h4 className="text-lg font-semibold text-gray-900">Situation matrimoniale</h4>
        </div>

        {!isEditingFamily ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Statut :</span>
              <span className="font-medium text-gray-900">{localFamilyInfo.maritalStatus}</span>
            </div>
            {(localFamilyInfo.maritalStatus === 'Marié(e)' || localFamilyInfo.maritalStatus === 'Pacsé(e)') && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">R��gime :</span>
                  <span className="font-medium text-gray-900">{localFamilyInfo.regimeMatrimonial}</span>
                </div>
                {localFamilyInfo.maritalStatus === 'Marié(e)' && localFamilyInfo.dateMarriage && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Date de mariage :</span>
                    <span className="font-medium text-gray-900">
                      {new Date(localFamilyInfo.dateMarriage).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {localFamilyInfo.maritalStatus === 'Pacsé(e)' && localFamilyInfo.datePacs && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Date de PACS :</span>
                    <span className="font-medium text-gray-900">
                      {new Date(localFamilyInfo.datePacs).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </>
            )}
            
            {/* 📅 TRAÇABILITÉ */}
            {(familyInfo.dateCreation || familyInfo.dateModification || familyInfo.dateSaisie) && (
              <div className="pt-3 mt-3 border-t border-pink-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">📅 Traçabilité</p>
                {familyInfo.dateCreation && (
                  <div className="text-xs text-gray-500">
                    ✏️ Créé le : {new Date(familyInfo.dateCreation).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(familyInfo.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {familyInfo.dateModification && (
                  <div className="text-xs text-gray-500">
                    🔄 Modifié le : {new Date(familyInfo.dateModification).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(familyInfo.dateModification).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {/* Afficher dateSaisie seulement si dateCreation et dateModification n'existent pas (legacy) */}
                {!familyInfo.dateCreation && !familyInfo.dateModification && familyInfo.dateSaisie && (
                  <div className="text-xs text-gray-500">
                    💾 Dernière mise à jour : {new Date(familyInfo.dateSaisie).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(familyInfo.dateSaisie).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut marital</label>
              <select
                value={localFamilyInfo.maritalStatus}
                onChange={(e) => setLocalFamilyInfo({ ...localFamilyInfo, maritalStatus: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="Célibataire">Célibataire</option>
                <option value="Marié(e)">Marié(e)</option>
                <option value="Pacsé(e)">Pacsé(e)</option>
                <option value="Divorcé(e)">Divorcé(e)</option>
                <option value="Veuf(ve)">Veuf(ve)</option>
              </select>
            </div>

            {(localFamilyInfo.maritalStatus === 'Marié(e)' || localFamilyInfo.maritalStatus === 'Pacsé(e)') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Régime matrimonial</label>
                <select
                  value={localFamilyInfo.regimeMatrimonial}
                  onChange={(e) => setLocalFamilyInfo({ ...localFamilyInfo, regimeMatrimonial: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="Communauté réduite aux acquêts">Communauté réduite aux acquêts</option>
                  <option value="Communauté universelle">Communauté universelle</option>
                  <option value="Séparation de biens">Séparation de biens</option>
                  <option value="Participation aux acquêts">Participation aux acquêts</option>
                </select>
              </div>
            )}
            
            {localFamilyInfo.maritalStatus === 'Marié(e)' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de mariage
                  <span className="text-xs text-gray-500 ml-2">(importante pour la détention des biens)</span>
                </label>
                <input
                  type="date"
                  value={localFamilyInfo.dateMarriage || ''}
                  onChange={(e) => setLocalFamilyInfo({ ...localFamilyInfo, dateMarriage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {localFamilyInfo.maritalStatus === 'Pacsé(e)' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de PACS
                  <span className="text-xs text-gray-500 ml-2">(importante pour la détention des biens)</span>
                </label>
                <input
                  type="date"
                  value={localFamilyInfo.datePacs || ''}
                  onChange={(e) => setLocalFamilyInfo({ ...localFamilyInfo, datePacs: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conjoint */}
      {(localFamilyInfo.maritalStatus === 'Marié(e)' || localFamilyInfo.maritalStatus === 'Pacsé(e)') && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">Conjoint</h4>
          </div>

          {!isEditingFamily ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Nom :</span>
                <p className="font-medium text-gray-900">{localFamilyInfo.spouse.firstName} {localFamilyInfo.spouse.lastName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Date de naissance :</span>
                <p className="font-medium text-gray-900">
                  {localFamilyInfo.spouse.birthDate ? new Date(localFamilyInfo.spouse.birthDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Profession :</span>
                <p className="font-medium text-gray-900">{localFamilyInfo.spouse.profession || 'Non renseignée'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email :</span>
                <p className="font-medium text-gray-900">{localFamilyInfo.spouse.email || 'Non renseigné'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={localFamilyInfo.spouse.firstName}
                  onChange={(e) =>
                    setLocalFamilyInfo({
                      ...localFamilyInfo,
                      spouse: { ...localFamilyInfo.spouse, firstName: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={localFamilyInfo.spouse.lastName}
                  onChange={(e) =>
                    setLocalFamilyInfo({
                      ...localFamilyInfo,
                      spouse: { ...localFamilyInfo.spouse, lastName: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={localFamilyInfo.spouse.birthDate}
                  onChange={(e) =>
                    setLocalFamilyInfo({
                      ...localFamilyInfo,
                      spouse: { ...localFamilyInfo.spouse, birthDate: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                <input
                  type="text"
                  value={localFamilyInfo.spouse.profession}
                  onChange={(e) =>
                    setLocalFamilyInfo({
                      ...localFamilyInfo,
                      spouse: { ...localFamilyInfo.spouse, profession: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={localFamilyInfo.spouse.email}
                  onChange={(e) =>
                    setLocalFamilyInfo({
                      ...localFamilyInfo,
                      spouse: { ...localFamilyInfo.spouse, email: e.target.value },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFamilyInfo.spouse.majorationPartFiscale}
                    onChange={(e) =>
                      setLocalFamilyInfo({
                        ...localFamilyInfo,
                        spouse: { ...localFamilyInfo.spouse, majorationPartFiscale: e.target.checked },
                      })
                    }
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-green-600">
                      + 0,5 part fiscale (majoration)
                    </span>
                    <p className="text-xs text-gray-500">Invalidité, ancien combattant, etc.</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enfants */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Baby className="w-6 h-6 text-purple-600" />
            <h4 className="text-lg font-semibold text-gray-900">Enfants ({localFamilyInfo.children.length})</h4>
          </div>
          {isEditingFamily && (
            <button
              onClick={addChild}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un enfant</span>
            </button>
          )}
        </div>

        {localFamilyInfo.children.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Baby className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun enfant renseigné</p>
            {isEditingFamily && <p className="text-sm mt-1">Cliquez sur "Ajouter un enfant" pour commencer</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {localFamilyInfo.children.map((child, index) => (
              <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                {!isEditingFamily ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Nom :</span>
                      <p className="font-medium text-gray-900">{child.firstName} {child.lastName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Date de naissance :</span>
                      <p className="font-medium text-gray-900">
                        {child.birthDate ? (
                          <>
                            {new Date(child.birthDate).toLocaleDateString('fr-FR')}
                            {calculateAge(child.birthDate) !== null && (
                              <span className="ml-2 text-purple-600 font-semibold">
                                ({calculateAge(child.birthDate)} ans)
                              </span>
                            )}
                          </>
                        ) : (
                          'Non renseignée'
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Statut :</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {child.isChargeFiscale && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Charge fiscale</span>
                        )}
                        {child.isChildOfClient && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Enfant du client</span>
                        )}
                        {child.isChildOfSpouse && (
                          <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">Enfant du conjoint</span>
                        )}
                        {child.majorationPartFiscale && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Majoration +0,5</span>
                        )}
                        {!child.isChargeFiscale && !child.isChildOfClient && !child.isChildOfSpouse && !child.majorationPartFiscale && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Aucun statut</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Enfant {index + 1}</span>
                      <button
                        onClick={() => removeChild(child.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input
                          type="text"
                          value={child.firstName}
                          onChange={(e) => {
                            const updatedChildren = [...localFamilyInfo.children];
                            updatedChildren[index] = { ...child, firstName: e.target.value };
                            setLocalFamilyInfo({ ...localFamilyInfo, children: updatedChildren });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input
                          type="text"
                          value={child.lastName}
                          onChange={(e) => {
                            const updatedChildren = [...localFamilyInfo.children];
                            updatedChildren[index] = { ...child, lastName: e.target.value };
                            setLocalFamilyInfo({ ...localFamilyInfo, children: updatedChildren });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input
                          type="date"
                          value={child.birthDate}
                          onChange={(e) => {
                            const updatedChildren = [...localFamilyInfo.children];
                            updatedChildren[index] = { ...child, birthDate: e.target.value };
                            setLocalFamilyInfo({ ...localFamilyInfo, children: updatedChildren });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={child.isChargeFiscale || false}
                            onChange={(e) => {
                              const updatedChildren = [...localFamilyInfo.children];
                              updatedChildren[index] = { ...child, isChargeFiscale: e.target.checked };
                              setLocalFamilyInfo({ ...localFamilyInfo, children: updatedChildren });
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900">À charge fiscalement</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={child.isChildOfClient || false}
                            onChange={(e) => {
                              const updatedChildren = [...localFamilyInfo.children];
                              updatedChildren[index] = { ...child, isChildOfClient: e.target.checked };
                              setLocalFamilyInfo({ ...localFamilyInfo, children: updatedChildren });
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900">Enfant du client</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={child.isChildOfSpouse || false}
                            onChange={(e) => {
                              const updatedChildren = [...localFamilyInfo.children];
                              updatedChildren[index] = { ...child, isChildOfSpouse: e.target.checked };
                              setLocalFamilyInfo({ ...localFamilyInfo, children: updatedChildren });
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900">Enfant du conjoint</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={child.majorationPartFiscale || false}
                            onChange={(e) => {
                              const updatedChildren = [...localFamilyInfo.children];
                              updatedChildren[index] = { ...child, majorationPartFiscale: e.target.checked };
                              setLocalFamilyInfo({ ...localFamilyInfo, children: updatedChildren });
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900">Majoration +0,5 part fiscale</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Traçabilité */}
        {!isEditingFamily && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div>
                {familyInfo.dateCreation && (
                  <p>Créé le: {new Date(familyInfo.dateCreation).toLocaleDateString('fr-FR')}</p>
                )}
                {familyInfo.dateModification && (
                  <p>Modifié le: {new Date(familyInfo.dateModification).toLocaleDateString('fr-FR')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}