import { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LABFTQuestionnaireProps {
  clientData: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface LABFTData {
  // RISQUES CLIENTS
  activiteProfessionnelle: string;
  origineFonds: string;
  objectifRelation: string;
  montantOperations: string;
  
  // PRODUITS ET ALIMENTATION
  produitsUtilises: string[];
  modeAlimentation: string;
  
  // PAYS/ZONE GÉOGRAPHIQUE
  paysResidence: string;
  paysOrigineCapitaux: string;
  paysOperations: string;
  
  // RISQUES OPÉRATIONNELS
  contactFrequence: string;
  complexiteOperation: string;
  
  // INTERMÉDIAIRE
  agitCommeIntermediaire: boolean;
  beneficiaireEffectif: string;
  
  // ÉVALUATION GLOBALE
  risqueClient: 'faible' | 'moyen' | 'élevé';
  risqueProduit: 'faible' | 'moyen' | 'élevé';
  risqueGeographique: 'faible' | 'moyen' | 'élevé';
  risqueGlobal: 'faible' | 'moyen' | 'élevé';
  
  // DÉCISION
  decision: 'accepter' | 'refuser' | 'complément';
  commentaires: string;
}

export function LABFTQuestionnaire({ clientData, onClose, onSave }: LABFTQuestionnaireProps) {
  // Pré-remplissage automatique basé sur les données client
  const [formData, setFormData] = useState<LABFTData>({
    activiteProfessionnelle: 'salarié', // À déduire des données client
    origineFonds: 'salaires',
    objectifRelation: 'conseil patrimonial',
    montantOperations: clientData.patrimoine ? 
      (parseInt(clientData.patrimoine.replace(/[^0-9]/g, '')) > 500000 ? 'supérieur 150k' : 'inférieur 150k') 
      : 'inférieur 150k',
    
    produitsUtilises: ['assurance-vie'],
    modeAlimentation: 'virement',
    
    paysResidence: 'France',
    paysOrigineCapitaux: 'France',
    paysOperations: 'France',
    
    contactFrequence: 'régulier',
    complexiteOperation: 'simple',
    
    agitCommeIntermediaire: false,
    beneficiaireEffectif: `${clientData.firstName} ${clientData.lastName}`,
    
    // Évaluation automatique basée sur le patrimoine
    risqueClient: 'faible',
    risqueProduit: 'faible',
    risqueGeographique: 'faible',
    risqueGlobal: 'faible',
    
    decision: 'accepter',
    commentaires: '',
  });

  const handleSave = () => {
    onSave(formData);
    toast.success('✅ Questionnaire LAB-FT enregistré');
    onClose();
  };

  const getRisqueColor = (risque: 'faible' | 'moyen' | 'élevé') => {
    switch (risque) {
      case 'faible': return 'bg-green-100 border-green-300 text-green-800';
      case 'moyen': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'élevé': return 'bg-red-100 border-red-300 text-red-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Questionnaire LAB-FT</h2>
              <p className="text-indigo-100 text-sm">Lutte Anti-Blanchiment et Financement du Terrorisme</p>
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
          {/* Client Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Informations Client</h3>
            <p className="text-sm text-blue-800">
              <strong>Nom :</strong> {clientData.firstName} {clientData.lastName}<br />
              <strong>Patrimoine :</strong> {clientData.patrimoine || 'Non renseigné'}
            </p>
          </div>

          {/* SECTION 1 : RISQUES CLIENTS */}
          <div className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">1. RISQUES CLIENTS</h3>
            
            <div className="space-y-4">
              {/* Activité professionnelle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Activité professionnelle du client
                </label>
                <select
                  value={formData.activiteProfessionnelle}
                  onChange={(e) => setFormData({ ...formData, activiteProfessionnelle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="salarié">Salarié (secteur privé/public)</option>
                  <option value="profession libérale">Profession libérale</option>
                  <option value="chef entreprise">Chef d'entreprise</option>
                  <option value="retraité">Retraité</option>
                  <option value="sans emploi">Sans emploi</option>
                  <option value="activité risque">Activité à risque (casino, bijouterie, etc.)</option>
                </select>
              </div>

              {/* Origine des fonds */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Origine des fonds
                </label>
                <select
                  value={formData.origineFonds}
                  onChange={(e) => setFormData({ ...formData, origineFonds: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="salaires">Salaires / Retraite</option>
                  <option value="revenus professionnels">Revenus professionnels</option>
                  <option value="patrimoine">Revenus du patrimoine</option>
                  <option value="héritage">Héritage / Donation</option>
                  <option value="cession actifs">Cession d'actifs</option>
                  <option value="gains jeux">Gains aux jeux</option>
                  <option value="origine inconnue">Origine inconnue/suspecte</option>
                </select>
              </div>

              {/* Montant des opérations */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Montant des opérations envisagées
                </label>
                <select
                  value={formData.montantOperations}
                  onChange={(e) => setFormData({ ...formData, montantOperations: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="inférieur 10k">Inférieur à 10 000 €</option>
                  <option value="10k-50k">Entre 10 000 € et 50 000 €</option>
                  <option value="50k-150k">Entre 50 000 € et 150 000 €</option>
                  <option value="supérieur 150k">Supérieur à 150 000 €</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2 : PRODUITS ET ALIMENTATION */}
          <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <h3 className="text-xl font-bold text-purple-900 mb-4">2. PRODUITS ET MODES D'ALIMENTATION</h3>
            
            <div className="space-y-4">
              {/* Produits utilisés */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Produits utilisés (plusieurs choix possibles)
                </label>
                <div className="space-y-2">
                  {['assurance-vie', 'PER', 'compte-titres', 'SCPI', 'immobilier', 'produits complexes'].map(produit => (
                    <label key={produit} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.produitsUtilises.includes(produit)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, produitsUtilises: [...formData.produitsUtilises, produit] });
                          } else {
                            setFormData({ ...formData, produitsUtilises: formData.produitsUtilises.filter(p => p !== produit) });
                          }
                        }}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{produit}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mode d'alimentation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mode d'alimentation des fonds
                </label>
                <select
                  value={formData.modeAlimentation}
                  onChange={(e) => setFormData({ ...formData, modeAlimentation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="virement">Virement bancaire</option>
                  <option value="chèque">Chèque</option>
                  <option value="espèces">Espèces (vigilance renforcée)</option>
                  <option value="transfert international">Transfert international</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3 : ZONE GÉOGRAPHIQUE */}
          <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-xl font-bold text-blue-900 mb-4">3. PAYS / ZONE GÉOGRAPHIQUE</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pays de résidence
                </label>
                <input
                  type="text"
                  value={formData.paysResidence}
                  onChange={(e) => setFormData({ ...formData, paysResidence: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pays d'origine des capitaux
                </label>
                <input
                  type="text"
                  value={formData.paysOrigineCapitaux}
                  onChange={(e) => setFormData({ ...formData, paysOrigineCapitaux: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4 : INTERMÉDIAIRE */}
          <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <h3 className="text-xl font-bold text-green-900 mb-4">4. LE CLIENT AGIT-IL COMME INTERMÉDIAIRE ?</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.agitCommeIntermediaire}
                  onChange={(e) => setFormData({ ...formData, agitCommeIntermediaire: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Le client agit pour le compte d'un tiers (bénéficiaire effectif)
                </label>
              </div>

              {formData.agitCommeIntermediaire && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Identification du bénéficiaire effectif
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiaireEffectif}
                    onChange={(e) => setFormData({ ...formData, beneficiaireEffectif: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nom et prénom du bénéficiaire effectif"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5 : ÉVALUATION GLOBALE DES RISQUES */}
          <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="text-xl font-bold text-gray-900 mb-4">5. ÉVALUATION GLOBALE DES RISQUES</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Risque Client */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Risque Client
                </label>
                <div className="flex gap-2">
                  {(['faible', 'moyen', 'élevé'] as const).map(niveau => (
                    <button
                      key={niveau}
                      onClick={() => setFormData({ ...formData, risqueClient: niveau })}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-colors ${
                        formData.risqueClient === niveau 
                          ? getRisqueColor(niveau) 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      {niveau.charAt(0).toUpperCase() + niveau.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risque Produit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Risque Produit
                </label>
                <div className="flex gap-2">
                  {(['faible', 'moyen', 'élevé'] as const).map(niveau => (
                    <button
                      key={niveau}
                      onClick={() => setFormData({ ...formData, risqueProduit: niveau })}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-colors ${
                        formData.risqueProduit === niveau 
                          ? getRisqueColor(niveau) 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      {niveau.charAt(0).toUpperCase() + niveau.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risque Géographique */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Risque Géographique
                </label>
                <div className="flex gap-2">
                  {(['faible', 'moyen', 'élevé'] as const).map(niveau => (
                    <button
                      key={niveau}
                      onClick={() => setFormData({ ...formData, risqueGeographique: niveau })}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-colors ${
                        formData.risqueGeographique === niveau 
                          ? getRisqueColor(niveau) 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      {niveau.charAt(0).toUpperCase() + niveau.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risque Global */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🎯 Risque Global
                </label>
                <div className="flex gap-2">
                  {(['faible', 'moyen', 'élevé'] as const).map(niveau => (
                    <button
                      key={niveau}
                      onClick={() => setFormData({ ...formData, risqueGlobal: niveau })}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 font-bold transition-colors ${
                        formData.risqueGlobal === niveau 
                          ? getRisqueColor(niveau) 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      {niveau.charAt(0).toUpperCase() + niveau.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6 : DÉCISION */}
          <div className="border-2 border-indigo-300 rounded-lg p-6 bg-indigo-50">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">6. DÉCISION</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Décision finale
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, decision: 'accepter' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      formData.decision === 'accepter'
                        ? 'bg-green-100 border-green-500 text-green-900'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    ✅ Accepter la relation
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, decision: 'refuser' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      formData.decision === 'refuser'
                        ? 'bg-red-100 border-red-500 text-red-900'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    ❌ Refuser la relation
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, decision: 'complément' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      formData.decision === 'complément'
                        ? 'bg-orange-100 border-orange-500 text-orange-900'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    ⚠️ Complément d'information
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Commentaires / Mesures de vigilance
                </label>
                <textarea
                  value={formData.commentaires}
                  onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Notes additionnelles, mesures de vigilance renforcées si nécessaire..."
                />
              </div>
            </div>
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
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Enregistrer le LAB-FT
          </button>
        </div>
      </div>
    </div>
  );
}
