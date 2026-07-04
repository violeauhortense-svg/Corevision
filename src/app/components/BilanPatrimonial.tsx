import { X, Save, FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface BilanPatrimonialProps {
  clientData: any;
  patrimoineData: any;
  revenusData: any;
  objectifsData: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function BilanPatrimonial({ 
  clientData, 
  patrimoineData, 
  revenusData, 
  objectifsData,
  onClose, 
  onSave 
}: BilanPatrimonialProps) {
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const bilanData = {
      clientData,
      patrimoineData,
      revenusData,
      objectifsData,
      notes,
      dateGeneration: new Date().toISOString(),
    };
    onSave(bilanData);
  };

  // Calculer le total du patrimoine
  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.value || 0), 0);
  };

  const totalActifsFinanciers = calculateTotal(patrimoineData.actifsFinanciers || []);
  const totalActifsImmobiliers = calculateTotal(patrimoineData.actifsImmobiliers || []);
  const totalPassifs = calculateTotal(patrimoineData.passifs || []);
  const patrimoineNet = totalActifsFinanciers + totalActifsImmobiliers - totalPassifs;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)} %`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Bilan Patrimonial Récapitulatif</h2>
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
          {/* SECTION 1 : INFORMATIONS FOYER */}
          <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              👥 1. COMPOSITION DU FOYER
            </h3>

            {/* Régime matrimonial et situation familiale */}
            <div className="bg-white rounded-lg border-2 border-pink-200 p-5 mb-4 shadow-sm">
              <h4 className="font-semibold text-pink-900 mb-4 flex items-center gap-2">
                💑 Régime matrimonial
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Situation familiale</p>
                  <p className="font-semibold text-gray-900">{clientData.maritalStatus || 'Non renseignée'}</p>
                </div>
                {clientData.regimeMatrimonial && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Régime matrimonial</p>
                    <p className="font-semibold text-gray-900">{clientData.regimeMatrimonial}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Membres du foyer - TOUS au même niveau */}
            <div className="space-y-3">
              {/* CLIENT PRINCIPAL */}
              <div className="bg-white rounded-lg border-2 border-blue-300 p-5 shadow-md">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                    {clientData.firstName?.charAt(0)}{clientData.lastName?.charAt(0)}
                  </div>
                  
                  {/* Infos */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        👤 CLIENT PRINCIPAL
                      </span>
                      {clientData.clientMajoration && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                          ⭐ Majoration
                        </span>
                      )}
                      {/* Âge du client */}
                      {(clientData.dateOfBirth || clientData.birthDate) && (() => {
                        const birthDate = new Date(clientData.dateOfBirth || clientData.birthDate);
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                        return (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {age} ans
                          </span>
                        );
                      })()}
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-900 mb-3">
                      {clientData.firstName} {clientData.lastName}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {(clientData.dateOfBirth || clientData.birthDate) && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">🎂 Date de naissance :</span>
                          <span className="font-medium text-gray-900">{clientData.dateOfBirth || clientData.birthDate}</span>
                        </div>
                      )}
                      {(clientData.placeOfBirth || clientData.birthPlace) && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📍 Lieu de naissance :</span>
                          <span className="font-medium text-gray-900">{clientData.placeOfBirth || clientData.birthPlace}</span>
                        </div>
                      )}
                      {clientData.profession && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">💼 Profession :</span>
                          <span className="font-medium text-gray-900">{clientData.profession}</span>
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
                      <div className="flex items-center gap-2 md:col-span-2">
                        <span className="text-gray-500">🏠 Adresse :</span>
                        <span className="font-medium text-gray-900">
                          {clientData.address}
                          {clientData.postalCode && clientData.city && (
                            <>, {clientData.postalCode} {clientData.city}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONJOINT */}
              {clientData.conjoint && clientData.conjoint.prenom && (
                <div className="bg-white rounded-lg border-2 border-pink-300 p-5 shadow-md">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                      {clientData.conjoint.prenom?.charAt(0)}{clientData.conjoint.nom?.charAt(0)}
                    </div>
                    
                    {/* Infos */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-bold">
                          💑 CONJOINT
                        </span>
                        {clientData.conjoint.majoration && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                            ⭐ Majoration
                          </span>
                        )}
                        {/* Âge du conjoint */}
                        {clientData.conjoint.dateNaissance && (() => {
                          const birthDate = new Date(clientData.conjoint.dateNaissance);
                          const today = new Date();
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const monthDiff = today.getMonth() - birthDate.getMonth();
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          return (
                            <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded text-xs font-semibold">
                              {age} ans
                            </span>
                          );
                        })()}
                      </div>
                      
                      <h4 className="text-xl font-bold text-gray-900 mb-3">
                        {clientData.conjoint.prenom} {clientData.conjoint.nom}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {clientData.conjoint.dateNaissance && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">🎂 Date de naissance :</span>
                            <span className="font-medium text-gray-900">{clientData.conjoint.dateNaissance}</span>
                          </div>
                        )}
                        {clientData.conjoint.profession && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">💼 Profession :</span>
                            <span className="font-medium text-gray-900">{clientData.conjoint.profession}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ENFANTS */}
              {clientData.enfants && clientData.enfants.length > 0 && clientData.enfants.map((enfant: any, index: number) => {
                // Calculer l'âge
                let age = null;
                if (enfant.dateNaissance) {
                  const birthDate = new Date(enfant.dateNaissance);
                  const today = new Date();
                  age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                }

                // Déterminer le lien de parenté
                let lienParente = '';
                if (enfant.enfantDuClient && enfant.enfantDuConjoint) {
                  lienParente = 'Enfant commun';
                } else if (enfant.enfantDuClient) {
                  lienParente = 'Enfant du client';
                } else if (enfant.enfantDuConjoint) {
                  lienParente = 'Enfant du conjoint';
                }

                return (
                  <div key={index} className="bg-white rounded-lg border-2 border-green-300 p-5 shadow-md">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                        {enfant.prenom?.charAt(0)}
                      </div>
                      
                      {/* Infos */}
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
                          {enfant.aChargeFiscalement && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                              💰 À charge fiscalement
                            </span>
                          )}
                          {enfant.majoration && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                              ⭐ Majoration
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-xl font-bold text-gray-900 mb-3">
                          {enfant.prenom}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {enfant.dateNaissance && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">🎂 Date de naissance :</span>
                              <span className="font-medium text-gray-900">{enfant.dateNaissance}</span>
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

            {/* Vue d'ensemble */}
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

            {/* Actifs financiers */}
            {patrimoineData.actifsFinanciers && patrimoineData.actifsFinanciers.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <h4 className="font-semibold text-green-800 mb-3">💳 Actifs financiers</h4>
                <div className="space-y-2">
                  {patrimoineData.actifsFinanciers.map((actif: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{actif.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(actif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actifs immobiliers */}
            {patrimoineData.actifsImmobiliers && patrimoineData.actifsImmobiliers.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <h4 className="font-semibold text-green-800 mb-3">🏠 Actifs immobiliers</h4>
                <div className="space-y-2">
                  {patrimoineData.actifsImmobiliers.map((actif: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{actif.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(actif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Passifs */}
            {patrimoineData.passifs && patrimoineData.passifs.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3">📉 Passifs (Dettes)</h4>
                <div className="space-y-2">
                  {patrimoineData.passifs.map((passif: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
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
                <div className="space-y-3">
                  {revenusData.revenusSalaries && (
                    <div>
                      <span className="text-xs text-gray-600">Salaires</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(revenusData.revenusSalaries)}</p>
                    </div>
                  )}
                  {revenusData.revenusIndependants && (
                    <div>
                      <span className="text-xs text-gray-600">Revenus indépendants</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(revenusData.revenusIndependants)}</p>
                    </div>
                  )}
                  {revenusData.revenus && (
                    <div>
                      <span className="text-xs text-gray-600">Autres revenus</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(revenusData.revenus)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Imposition */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">📊 Situation fiscale</h4>
                <div className="space-y-3">
                  {revenusData.rfr && (
                    <div>
                      <span className="text-xs text-gray-600">Revenu Fiscal de Référence</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(revenusData.rfr)}</p>
                    </div>
                  )}
                  {revenusData.tmi && (
                    <div>
                      <span className="text-xs text-gray-600">Tranche Marginale d'Imposition</span>
                      <p className="text-lg font-semibold text-purple-900">{formatPercentage(revenusData.tmi)}</p>
                    </div>
                  )}
                  {revenusData.tef && (
                    <div>
                      <span className="text-xs text-gray-600">Taux Effectif d'Imposition</span>
                      <p className="text-lg font-semibold text-gray-900">{formatPercentage(revenusData.tef)}</p>
                    </div>
                  )}
                  {revenusData.nbParts && (
                    <div>
                      <span className="text-xs text-gray-600">Nombre de parts fiscales</span>
                      <p className="text-lg font-semibold text-gray-900">{revenusData.nbParts}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Parts fiscales détaillées */}
            {revenusData.detailParts && (
              <div className="bg-white p-4 rounded-lg border border-purple-200 mt-4">
                <h4 className="font-semibold text-purple-800 mb-3">🔢 Détail des parts fiscales</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Déclarant 1 :</strong> {revenusData.detailParts.declarant1} part(s)</p>
                  {revenusData.detailParts.declarant2 > 0 && (
                    <p><strong>Déclarant 2 :</strong> {revenusData.detailParts.declarant2} part(s)</p>
                  )}
                  {revenusData.detailParts.enfants > 0 && (
                    <p><strong>Enfants :</strong> {revenusData.detailParts.enfants} part(s)</p>
                  )}
                  <p className="pt-2 border-t border-purple-200 mt-2">
                    <strong>TOTAL :</strong> {revenusData.nbParts} part(s)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4 : OBJECTIFS */}
          <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
            <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
              🎯 4. OBJECTIFS PATRIMONIAUX
            </h3>

            {objectifsData && objectifsData.filter((obj: any) => obj.inclus).length > 0 ? (
              <div className="space-y-3">
                {objectifsData.filter((obj: any) => obj.inclus).map((objectif: any, index: number) => (
                  <div 
                    key={objectif.id || index} 
                    className="bg-white p-4 rounded-lg border border-orange-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-900">
                          {objectif.categorie}
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">
                          {objectif.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 ml-3">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded whitespace-nowrap">
                          ✓ Inclus
                        </span>
                        {objectif.obligatoire && (
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

          {/* SECTION 5 : NOTES COMPLÉMENTAIRES */}
          <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📝 5. NOTES ET COMMENTAIRES
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Ajoutez des notes, observations ou recommandations complémentaires concernant ce bilan patrimonial..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Enregistrer le Bilan
          </button>
        </div>
      </div>
    </div>
  );
}