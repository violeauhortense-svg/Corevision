import { useState, useEffect } from 'react';
import { X, TrendingUp, Calculator, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { findRegle } from './BaseConnaissanceIA';
import type { RegleFiscale } from '../types/optimisation';
import { 
  optimiserRemuneration, 
  type DonneesEntreprise, 
  type DonneesFoyer, 
  type ResultatOptimisation 
} from '../utils/optimisationRemuneration';

interface OptimisationRemunerationModalProps {
  entreprise: {
    id: string;
    nom: string;
    formeJuridique: string;
    capital?: number;
    compteCourant?: number;
    regimeFiscal?: string;
    exercices?: Array<{
      annee: string;
      ca?: number;
      resultat?: number;
      remuneration?: number;
      dividendes?: number;
    }>;
  };
  foyerData?: {
    autresRevenus?: number;
    nbParts?: number;
  };
  onClose: () => void;
  onApply?: (remuneration: number, dividendes: number) => void;
}

export function OptimisationRemunerationModal({ 
  entreprise, 
  foyerData,
  onClose, 
  onApply 
}: OptimisationRemunerationModalProps) {
  // Récupérer automatiquement les données du dernier exercice
  const dernierExercice = entreprise.exercices?.[entreprise.exercices.length - 1];
  
  const [resultatAvantRemuneration, setResultatAvantRemuneration] = useState(
    dernierExercice?.resultat || 0
  );
  const [typeDirigeant, setTypeDirigeant] = useState('');
  const [regimeFiscal, setRegimeFiscal] = useState<'IS' | 'IR'>(
    entreprise.regimeFiscal?.toUpperCase() === 'IR' ? 'IR' : 'IS'
  );
  const [autresRevenus, setAutresRevenus] = useState(foyerData?.autresRevenus || 0);
  const [nbParts, setNbParts] = useState(foyerData?.nbParts || 1);
  const [primes, setPrimes] = useState(0);
  
  const [resultat, setResultat] = useState<ResultatOptimisation | null>(null);
  const [regle, setRegle] = useState<RegleFiscale | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Options de type de dirigeant selon la forme juridique
  const getTypesDirigeants = () => {
    if (!entreprise.formeJuridique) {
      return ['Gérant', 'Président', 'Associé'];
    }
    const forme = entreprise.formeJuridique.toUpperCase();
    if (forme.includes('SARL') || forme.includes('EURL')) {
      return ['Gérant majoritaire', 'Gérant minoritaire'];
    } else if (forme.includes('SAS') || forme.includes('SASU')) {
      return ['Président'];
    } else if (forme.includes('SCI')) {
      return ['Associé'];
    } else if (forme.includes('EI')) {
      return ['Entrepreneur individuel'];
    }
    return ['Gérant', 'Président', 'Associé'];
  };

  // Chercher la règle fiscale correspondante
  useEffect(() => {
    if (typeDirigeant) {
      const regleTrouvee = findRegle(entreprise.formeJuridique, typeDirigeant);
      setRegle(regleTrouvee || null);
      if (!regleTrouvee) {
        toast.error('Aucune règle fiscale trouvée pour ce statut. Vérifiez la base de connaissance IA.');
      }
    }
  }, [typeDirigeant, entreprise.formeJuridique]);

  // Lancer l'optimisation
  const handleOptimiser = () => {
    if (!regle) {
      toast.error('Veuillez sélectionner un type de dirigeant valide');
      return;
    }

    if (resultatAvantRemuneration <= 0) {
      toast.error('Le résultat avant rémunération doit être supérieur à 0');
      return;
    }

    setIsCalculating(true);

    try {
      const donneesEntreprise: DonneesEntreprise = {
        resultatAvantRemuneration,
        capital: entreprise.capital || 0,
        compteCourant: entreprise.compteCourant || 0,
        primes,
        statutJuridique: entreprise.formeJuridique,
        typeDirigeant,
        regimeFiscal,
      };

      const donneesFoyer: DonneesFoyer = {
        autresRevenus,
        nbParts,
      };

      const resultatOptimisation = optimiserRemuneration(donneesEntreprise, donneesFoyer, regle);
      setResultat(resultatOptimisation);
      toast.success('Optimisation calculée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      toast.error('Erreur lors du calcul de l\'optimisation');
    } finally {
      setIsCalculating(false);
    }
  };

  // Appliquer le scénario optimal
  const handleApply = () => {
    if (!resultat) return;
    
    if (onApply) {
      onApply(resultat.scenarioOptimal.remuneration, resultat.scenarioOptimal.dividendes);
    }
    toast.success('Scénario appliqué !');
    onClose();
  };

  const formatEuro = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(montant);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Optimisation Rémunération / Dividendes</h2>
              <p className="text-purple-100 text-sm">{entreprise.nom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations et explications */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">🎯 Objectif</p>
              <p>
                Cet outil calcule la répartition optimale entre rémunération et dividendes pour maximiser 
                le revenu net de votre foyer en tenant compte de toutes les charges fiscales et sociales.
              </p>
            </div>
          </div>

          {/* Formulaire de saisie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne 1 : Entreprise */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">📊 Données entreprise</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Résultat avant rémunération (€) *
                </label>
                <input
                  type="number"
                  value={resultatAvantRemuneration}
                  onChange={(e) => setResultatAvantRemuneration(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Résultat de l'exercice avant toute rémunération
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de dirigeant *
                </label>
                <select
                  value={typeDirigeant}
                  onChange={(e) => setTypeDirigeant(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Sélectionner...</option>
                  {getTypesDirigeants().map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Régime fiscal *
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="IS"
                      checked={regimeFiscal === 'IS'}
                      onChange={(e) => setRegimeFiscal(e.target.value as 'IS' | 'IR')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">IS</span>
                  </label>
                  <label className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="IR"
                      checked={regimeFiscal === 'IR'}
                      onChange={(e) => setRegimeFiscal(e.target.value as 'IS' | 'IR')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">IR</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primes d'émission (€)
                </label>
                <input
                  type="number"
                  value={primes}
                  onChange={(e) => setPrimes(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pour le calcul du plafond dividendes TNS
                </p>
              </div>
            </div>

            {/* Colonne 2 : Foyer */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">🏠 Données foyer</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autres revenus du foyer (€)
                </label>
                <input
                  type="number"
                  value={autresRevenus}
                  onChange={(e) => setAutresRevenus(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Salaires, pensions, autres revenus imposables
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de parts fiscales
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={nbParts}
                  onChange={(e) => setNbParts(parseFloat(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Célibataire: 1 / Couple: 2 / + 0.5 par enfant
                </p>
              </div>

              {/* Info règle fiscale */}
              {regle && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium text-green-900 mb-2">✅ Règle fiscale identifiée</p>
                  <div className="text-xs text-green-800 space-y-1">
                    <p>• Cotisations sociales: {regle.cotisationsSociales}%</p>
                    <p>• Régime: {regle.regimeIS ? 'IS' : 'IR'}</p>
                    {regle.pfuApplicable && <p>• PFU: {regle.tauxPFU}%</p>}
                    {regle.plafondDividendesTNS && (
                      <p>• Plafond TNS: {regle.plafondDividendesTNS}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bouton d'optimisation */}
          <div className="flex justify-center">
            <button
              onClick={handleOptimiser}
              disabled={isCalculating || !regle || resultatAvantRemuneration <= 0}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg font-semibold"
            >
              <Sparkles className="w-6 h-6" />
              {isCalculating ? 'Calcul en cours...' : 'Optimiser'}
            </button>
          </div>

          {/* Résultats */}
          {resultat && (
            <div className="space-y-6 mt-8 pt-6 border-t-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Scénario optimal
              </h3>

              {/* Carte principale */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Rémunération</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatEuro(resultat.scenarioOptimal.remuneration)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Dividendes</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatEuro(resultat.scenarioOptimal.dividendes)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Revenu net foyer</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatEuro(resultat.scenarioOptimal.revenuNetFoyer)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600 mb-1">Taux prélèvement</p>
                    <p className="text-xl font-bold text-orange-600">
                      {resultat.scenarioOptimal.tauxPrelevementGlobal.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Détails */}
                <div className="bg-white rounded-lg p-4 mt-4">
                  <p className="font-semibold text-gray-900 mb-3">Détails du calcul:</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Charges sociales:</span>
                      <span className="font-semibold">{formatEuro(resultat.scenarioOptimal.chargesSociales)}</span>
                    </div>
                    {resultat.scenarioOptimal.is > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">IS:</span>
                        <span className="font-semibold">{formatEuro(resultat.scenarioOptimal.is)}</span>
                      </div>
                    )}
                    {resultat.scenarioOptimal.pfu > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">PFU:</span>
                        <span className="font-semibold">{formatEuro(resultat.scenarioOptimal.pfu)}</span>
                      </div>
                    )}
                    {resultat.scenarioOptimal.cotisationsTNSDividendes > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cotis. TNS dividendes:</span>
                        <span className="font-semibold">{formatEuro(resultat.scenarioOptimal.cotisationsTNSDividendes)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommandations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-3">💡 Recommandations:</p>
                <ul className="space-y-2">
                  {resultat.recommandations.map((reco, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{reco}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton d'application */}
              {onApply && (
                <div className="flex justify-center">
                  <button
                    onClick={handleApply}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg font-semibold"
                  >
                    Appliquer ce scénario
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}