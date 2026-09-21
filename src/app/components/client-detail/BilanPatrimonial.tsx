import { X, FileText } from 'lucide-react';
import type { ClientData, FamilyInfo, PatrimoineItem, RevenuItem, ImpositionData, Objectif } from './types';

interface BilanPatrimonialProps {
  clientData: ClientData;
  familyInfo: FamilyInfo;
  actifsFinanciers: PatrimoineItem[];
  immobilier: PatrimoineItem[];
  passifs: PatrimoineItem[];
  revenus: RevenuItem[];
  imposition: ImpositionData;
  objectifs: Objectif[];
  onClose: () => void;
}

const CATEGORIE_LABELS: Record<string, string> = {
  salarie_non_cadre: 'Salarié non cadre',
  salarie_cadre: 'Salarié cadre',
  gerant_sarl_majoritaire: 'Gérant SARL Majoritaire (TNS)',
  gerant_sarl_minoritaire: 'Gérant SARL Minoritaire (TAS)',
  president_sas: 'Président/DG de SAS',
  auto_entrepreneur: 'Auto-Entrepreneur',
  fonctionnaire_cat_a: 'Fonctionnaire Cat A',
  fonctionnaire_autre: 'Fonctionnaire autre catégorie',
  fonctionnaire_collectivite: 'Fonctionnaire collectivité territoriale',
  retraite: 'Retraité',
  interimaire: 'Intérimaire',
  cdd: 'CDD',
  intermittent: 'Intermittent du spectacle',
  dividende: 'Dividende',
};

function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  if (isNaN(bd.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const monthDiff = today.getMonth() - bd.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) {
    age--;
  }
  return age;
}

export function BilanPatrimonial({
  clientData,
  familyInfo,
  actifsFinanciers,
  immobilier,
  passifs,
  revenus,
  imposition,
  objectifs,
  onClose,
}: BilanPatrimonialProps) {
  const calculateTotal = (items: PatrimoineItem[]) => items.reduce((sum, item) => sum + (item.value || 0), 0);

  const totalActifsFinanciers = calculateTotal(actifsFinanciers || []);
  const totalActifsImmobiliers = calculateTotal(immobilier || []);
  const totalPassifs = calculateTotal(passifs || []);
  const patrimoineNet = totalActifsFinanciers + totalActifsImmobiliers - totalPassifs;

  const totalRevenus = (revenus || []).reduce((sum, r) => sum + (r.montantAnnuel || 0), 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);

  const clientAge = calculateAge(clientData?.birthDate);
  const spouse = familyInfo?.spouse;
  const spouseAge = calculateAge(spouse?.birthDate);
  const children = familyInfo?.children || [];
  const objectifsInclus = (objectifs || []).filter((o) => o.included);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Bilan Patrimonial - {clientData.firstName} {clientData.lastName}</h2>
              <p className="text-blue-100 text-sm">
                Document de synthèse - {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1 : COMPOSITION DU FOYER */}
          <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              👥 1. COMPOSITION DU FOYER
            </h3>

            {(familyInfo?.maritalStatus || familyInfo?.regimeMatrimonial) && (
              <div className="bg-white rounded-lg border-2 border-pink-200 p-5 mb-4 shadow-sm">
                <h4 className="font-semibold text-pink-900 mb-4 flex items-center gap-2">
                  💑 Régime matrimonial
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {familyInfo?.maritalStatus && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Situation familiale</p>
                      <p className="font-semibold text-gray-900">{familyInfo.maritalStatus}</p>
                    </div>
                  )}
                  {familyInfo?.regimeMatrimonial && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Régime matrimonial</p>
                      <p className="font-semibold text-gray-900">{familyInfo.regimeMatrimonial}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* CLIENT PRINCIPAL */}
              <div className="bg-white rounded-lg border-2 border-blue-300 p-5 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                    {clientData.firstName?.charAt(0)}{clientData.lastName?.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        👤 CLIENT PRINCIPAL
                      </span>
                      {clientData.majorationPartFiscale && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                          ⭐ Majoration
                        </span>
                      )}
                      {clientAge !== null && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {clientAge} ans
                        </span>
                      )}
                    </div>

                    <h4 className="text-xl font-bold text-gray-900 mb-3">
                      {clientData.firstName} {clientData.lastName}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {clientData.birthDate && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">🎂 Date de naissance :</span>
                          <span className="font-medium text-gray-900">{clientData.birthDate}</span>
                        </div>
                      )}
                      {clientData.activite && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">💼 Activité :</span>
                          <span className="font-medium text-gray-900">{clientData.activite}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">✉️ Email :</span>
                        <span className="font-medium text-gray-900">{clientData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📱 Téléphone :</span>
                        <span className="font-medium text-gray-900">{clientData.phone}</span>
                      </div>
                      {clientData.address && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <span className="text-gray-500">🏠 Adresse :</span>
                          <span className="font-medium text-gray-900">{clientData.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONJOINT */}
              {spouse && spouse.firstName && (
                <div className="bg-white rounded-lg border-2 border-pink-300 p-5 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                      {spouse.firstName?.charAt(0)}{spouse.lastName?.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-bold">
                          💑 CONJOINT
                        </span>
                        {spouse.majorationPartFiscale && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                            ⭐ Majoration
                          </span>
                        )}
                        {spouseAge !== null && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded text-xs font-semibold">
                            {spouseAge} ans
                          </span>
                        )}
                      </div>

                      <h4 className="text-xl font-bold text-gray-900 mb-3">
                        {spouse.firstName} {spouse.lastName}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {spouse.birthDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">🎂 Date de naissance :</span>
                            <span className="font-medium text-gray-900">{spouse.birthDate}</span>
                          </div>
                        )}
                        {spouse.profession && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">💼 Profession :</span>
                            <span className="font-medium text-gray-900">{spouse.profession}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ENFANTS */}
              {children.map((enfant, index) => {
                const age = calculateAge(enfant.birthDate);
                let lienParente = '';
                if (enfant.isChildOfClient && enfant.isChildOfSpouse) {
                  lienParente = 'Enfant commun';
                } else if (enfant.isChildOfClient) {
                  lienParente = 'Enfant du client';
                } else if (enfant.isChildOfSpouse) {
                  lienParente = 'Enfant du conjoint';
                }

                return (
                  <div key={enfant.id || index} className="bg-white rounded-lg border-2 border-green-300 p-5 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                        {enfant.firstName?.charAt(0)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                            👶 ENFANT {index + 1}
                          </span>
                          {age !== null && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {age} an{age > 1 ? 's' : ''}
                            </span>
                          )}
                          {enfant.isChargeFiscale && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                              💰 À charge fiscalement
                            </span>
                          )}
                          {enfant.majorationPartFiscale && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                              ⭐ Majoration
                            </span>
                          )}
                        </div>

                        <h4 className="text-xl font-bold text-gray-900 mb-3">
                          {enfant.firstName}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {enfant.birthDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">🎂 Date de naissance :</span>
                              <span className="font-medium text-gray-900">{enfant.birthDate}</span>
                            </div>
                          )}
                          {lienParente && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">👨‍👩‍👧 Lien de parenté :</span>
                              <span className="font-medium text-gray-900">{lienParente}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2 : PATRIMOINE */}
          <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              💰 2. PATRIMOINE
            </h3>

            <div className="bg-white p-4 rounded-lg border border-green-300 mb-4">
              <h4 className="font-semibold text-green-800 mb-3">📊 Vue d'ensemble</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Actifs financiers</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(totalActifsFinanciers)}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-1">Actifs immobiliers</p>
                  <p className="text-lg font-bold text-purple-900">{formatCurrency(totalActifsImmobiliers)}</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-xs text-red-600 font-medium mb-1">Passifs</p>
                  <p className="text-lg font-bold text-red-900">{formatCurrency(totalPassifs)}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded border-2 border-green-400">
                  <p className="text-xs text-green-600 font-medium mb-1">PATRIMOINE NET</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(patrimoineNet)}</p>
                </div>
              </div>
            </div>

            {actifsFinanciers && actifsFinanciers.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <h4 className="font-semibold text-green-800 mb-3">💳 Actifs financiers</h4>
                <div className="space-y-2">
                  {actifsFinanciers.map((actif) => (
                    <div key={actif.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{actif.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(actif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {immobilier && immobilier.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <h4 className="font-semibold text-green-800 mb-3">🏠 Actifs immobiliers</h4>
                <div className="space-y-2">
                  {immobilier.map((actif) => (
                    <div key={actif.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{actif.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(actif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {passifs && passifs.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3">📉 Passifs (Dettes)</h4>
                <div className="space-y-2">
                  {passifs.map((passif) => (
                    <div key={passif.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm text-gray-700">{passif.name}</span>
                      <span className="text-sm font-semibold text-red-900">{formatCurrency(passif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3 : REVENUS ET IMPOSITION */}
          <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              💼 3. REVENUS ET IMPOSITION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenus */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">💵 Revenus annuels</h4>
                {revenus && revenus.length > 0 ? (
                  <div className="space-y-2">
                    {revenus.map((r) => (
                      <div key={r.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {CATEGORIE_LABELS[r.categorie] || r.categorie} ({r.beneficiaireNom})
                        </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(r.montantAnnuel)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-purple-200">
                      <span className="font-semibold text-purple-900">Total</span>
                      <span className="font-bold text-purple-900">{formatCurrency(totalRevenus)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun revenu renseigné</p>
                )}
              </div>

              {/* Imposition */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">📊 Situation fiscale</h4>
                <div className="space-y-3">
                  {imposition?.impotRevenu ? (
                    <div>
                      <span className="text-xs text-gray-600">Impôt sur le revenu</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(imposition.impotRevenu)}</p>
                    </div>
                  ) : null}
                  {imposition?.tmi && (
                    <div>
                      <span className="text-xs text-gray-600">Tranche Marginale d'Imposition</span>
                      <p className="text-lg font-semibold text-purple-900">{imposition.tmi} %</p>
                    </div>
                  )}
                  {imposition?.prelevementsSociaux ? (
                    <div>
                      <span className="text-xs text-gray-600">Prélèvements sociaux</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(imposition.prelevementsSociaux)}</p>
                    </div>
                  ) : null}
                  {imposition?.ifi ? (
                    <div>
                      <span className="text-xs text-gray-600">IFI</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(imposition.ifi)}</p>
                    </div>
                  ) : null}
                  {imposition?.nombreParts && (
                    <div>
                      <span className="text-xs text-gray-600">Nombre de parts fiscales</span>
                      <p className="text-lg font-semibold text-gray-900">{imposition.nombreParts}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 : OBJECTIFS */}
          <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
            <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
              🎯 4. OBJECTIFS PATRIMONIAUX
            </h3>

            {objectifsInclus.length > 0 ? (
              <div className="space-y-3">
                {objectifsInclus.map((objectif, index) => (
                  <div
                    key={objectif.id || index}
                    className="bg-white p-4 rounded-lg border border-orange-200"
                  >
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-900">
                          {objectif.category}
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">
                          {objectif.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 ml-3 shrink-0">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded whitespace-nowrap">
                          ✓ Inclus
                        </span>
                        {objectif.mandatory && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded whitespace-nowrap">
                            ⚠️ Obligatoire
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-orange-200 text-center text-gray-500">
                Aucun objectif patrimonial retenu
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
