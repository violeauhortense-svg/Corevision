import { Wallet, TrendingUp, Building2, PiggyBank, AlertTriangle } from 'lucide-react';
import { formatEuro } from './utils';

interface CapaciteEpargneProps {
  totalRevenus: number;
  impotTotal: number;
  chargesAnnuelles: number;
  typeClient: 'particulier' | 'professionnel';
  // Pour les professionnels
  chiffreAffaires?: number;
  chargesExploitation?: number;
  stockMoyen?: number;
  creancesClients?: number;
  dettesFournisseurs?: number;
}

interface AnalyseEpargne {
  revenuDisponible: number;
  capaciteEpargne: number;
  tauxEpargne: number;
  recommandation: string;
  details: {
    besoins?: number;
    envies?: number;
    epargne?: number;
  } | {
    bfr?: number;
    tresorerie?: number;
  };
}

export function CapaciteEpargne({
  totalRevenus,
  impotTotal,
  chargesAnnuelles,
  typeClient,
  chiffreAffaires = 0,
  chargesExploitation = 0,
  stockMoyen = 0,
  creancesClients = 0,
  dettesFournisseurs = 0,
}: CapaciteEpargneProps) {

  // 🏠 ANALYSE PARTICULIER - Méthode 50/30/20
  const analyseParticulier = (): AnalyseEpargne => {
    const revenuDisponible = totalRevenus - impotTotal - chargesAnnuelles;
    
    // Méthode 50/30/20
    const besoins = revenuDisponible * 0.50; // 50% besoins essentiels
    const envies = revenuDisponible * 0.30;   // 30% envies/loisirs
    const epargne = revenuDisponible * 0.20;  // 20% épargne
    
    const tauxEpargne = totalRevenus > 0 ? (epargne / totalRevenus) * 100 : 0;
    
    let recommandation = '';
    if (tauxEpargne >= 20) {
      recommandation = 'Excellent ! Capacité d\'épargne optimale selon la règle 50/30/20';
    } else if (tauxEpargne >= 15) {
      recommandation = 'Bonne capacité d\'épargne, mais peut être améliorée';
    } else if (tauxEpargne >= 10) {
      recommandation = 'Capacité d\'épargne moyenne, revue du budget recommandée';
    } else {
      recommandation = 'Capacité d\'épargne faible, optimisation urgente nécessaire';
    }
    
    return {
      revenuDisponible,
      capaciteEpargne: epargne,
      tauxEpargne,
      recommandation,
      details: { besoins, envies, epargne },
    };
  };

  // 🏢 ANALYSE PROFESSIONNEL - Via BFR
  const analyseProfessionnel = (): AnalyseEpargne => {
    // BFR = Stocks + Créances clients - Dettes fournisseurs
    const bfr = stockMoyen + creancesClients - dettesFournisseurs;
    
    // Résultat d'exploitation simplifié
    const resultatExploitation = chiffreAffaires - chargesExploitation;
    
    // Trésorerie disponible = Résultat - BFR - Impôts
    const tresorerie = resultatExploitation - bfr - impotTotal;
    
    // Capacité d'épargne/investissement = trésorerie disponible
    const capaciteEpargne = Math.max(0, tresorerie);
    
    const tauxEpargne = chiffreAffaires > 0 ? (capaciteEpargne / chiffreAffaires) * 100 : 0;
    
    let recommandation = '';
    if (bfr < 0) {
      recommandation = 'BFR négatif : excellente situation de trésorerie !';
    } else if (bfr > resultatExploitation * 0.3) {
      recommandation = 'BFR élevé : optimisation du cycle d\'exploitation nécessaire';
    } else {
      recommandation = 'BFR maîtrisé : bonne gestion du cycle d\'exploitation';
    }
    
    return {
      revenuDisponible: resultatExploitation,
      capaciteEpargne,
      tauxEpargne,
      recommandation,
      details: { bfr, tresorerie },
    };
  };

  const analyse = typeClient === 'particulier' ? analyseParticulier() : analyseProfessionnel();

  // Niveau de capacité d'épargne
  const niveau = analyse.tauxEpargne >= 20 ? 'excellent' :
                 analyse.tauxEpargne >= 15 ? 'bon' :
                 analyse.tauxEpargne >= 10 ? 'moyen' : 'faible';

  const couleurNiveau = niveau === 'excellent' ? 'green' :
                        niveau === 'bon' ? 'blue' :
                        niveau === 'moyen' ? 'orange' : 'red';

  const couleurNiveauClasses = {
    excellent: 'text-green-600 border-green-300 from-green-50 bg-green-50 border-green-500',
    bon: 'text-blue-600 border-blue-300 from-blue-50 bg-blue-50 border-blue-500',
    moyen: 'text-orange-600 border-orange-300 from-orange-50 bg-orange-50 border-orange-500',
    faible: 'text-red-600 border-red-300 from-red-50 bg-red-50 border-red-500',
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-600" />
            4️⃣ Capacité d'Épargne
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {typeClient === 'particulier' ? 'Analyse selon la méthode 50/30/20' : 'Analyse via BFR professionnel'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Niveau</p>
          <span className={`text-lg font-bold uppercase ${niveau === 'excellent' ? 'text-green-600' :
                          niveau === 'bon' ? 'text-blue-600' :
                          niveau === 'moyen' ? 'text-orange-600' : 'text-red-600'}`}>
            {niveau}
          </span>
        </div>
      </div>

      {/* Synthèse principale */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">
              {typeClient === 'particulier' ? 'Revenu disponible' : 'Résultat exploitation'}
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatEuro(analyse.revenuDisponible)}</p>
        </div>

        <div className="border-2 border-green-300 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Capacité d'épargne</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatEuro(analyse.capaciteEpargne)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatEuro(analyse.capaciteEpargne / 12)} / mois
          </p>
        </div>

        <div className={`border-2 rounded-lg p-4 bg-gradient-to-br to-white ${
          niveau === 'excellent' ? 'border-green-300 from-green-50' :
          niveau === 'bon' ? 'border-blue-300 from-blue-50' :
          niveau === 'moyen' ? 'border-orange-300 from-orange-50' : 'border-red-300 from-red-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📊</span>
            <p className="text-sm text-gray-600">Taux d'épargne</p>
          </div>
          <p className={`text-3xl font-bold ${
            niveau === 'excellent' ? 'text-green-600' :
            niveau === 'bon' ? 'text-blue-600' :
            niveau === 'moyen' ? 'text-orange-600' : 'text-red-600'
          }`}>
            {analyse.tauxEpargne.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Détail selon le type */}
      {typeClient === 'particulier' && 'besoins' in analyse.details ? (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            📋 Répartition selon la règle 50/30/20
          </h4>
          
          {/* Visualisation 50/30/20 */}
          <div className="space-y-3">
            {/* Besoins essentiels - 50% */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">🏠 Besoins essentiels (50%)</span>
                <span className="text-sm font-bold text-gray-900">{formatEuro(analyse.details.besoins)}</span>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-white text-sm font-bold" style={{ width: '50%' }}>
                  Logement, alimentation, santé
                </div>
              </div>
            </div>

            {/* Envies - 30% */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">🎭 Envies & Loisirs (30%)</span>
                <span className="text-sm font-bold text-gray-900">{formatEuro(analyse.details.envies)}</span>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center text-white text-sm font-bold" style={{ width: '30%' }}>
                  Loisirs, vacances, shopping
                </div>
              </div>
            </div>

            {/* Épargne - 20% */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">💰 Épargne & Investissement (20%)</span>
                <span className="text-sm font-bold text-green-600">{formatEuro(analyse.details.epargne)}</span>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-center text-white text-sm font-bold" style={{ width: '20%' }}>
                  Épargne, placements, retraite
                </div>
              </div>
            </div>
          </div>

          {/* Graphique circulaire simplifié */}
          <div className="flex items-center gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="h-6 flex rounded-full overflow-hidden border-2 border-gray-300">
                <div className="bg-red-500" style={{ width: '50%' }} title="Besoins: 50%"></div>
                <div className="bg-orange-500" style={{ width: '30%' }} title="Envies: 30%"></div>
                <div className="bg-green-600" style={{ width: '20%' }} title="Épargne: 20%"></div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>30%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>20%</span>
              </div>
            </div>
          </div>
        </div>
      ) : 'bfr' in analyse.details ? (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            🏢 Analyse du Besoin en Fonds de Roulement (BFR)
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
              <p className="text-xs text-gray-600 mb-1">Stock moyen</p>
              <p className="text-lg font-bold text-gray-900">{formatEuro(stockMoyen)}</p>
            </div>
            <div className="border border-green-200 rounded-lg p-3 bg-green-50">
              <p className="text-xs text-gray-600 mb-1">Créances clients</p>
              <p className="text-lg font-bold text-gray-900">{formatEuro(creancesClients)}</p>
            </div>
            <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
              <p className="text-xs text-gray-600 mb-1">Dettes fournisseurs</p>
              <p className="text-lg font-bold text-gray-900">{formatEuro(dettesFournisseurs)}</p>
            </div>
          </div>

          <div className="border-2 border-purple-300 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">BFR Total</p>
                <p className="text-2xl font-bold text-purple-600">{formatEuro(analyse.details.bfr)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Trésorerie disponible</p>
                <p className={`text-2xl font-bold ${analyse.details.tresorerie >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEuro(analyse.details.tresorerie)}
                </p>
              </div>
            </div>
          </div>

          {/* Formule BFR */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-sm">
            <p className="font-mono text-gray-700">
              <strong>BFR</strong> = Stock ({formatEuro(stockMoyen)}) + Créances ({formatEuro(creancesClients)}) - Dettes ({formatEuro(dettesFournisseurs)})
            </p>
            <p className="font-mono text-purple-600 font-bold mt-2">
              = {formatEuro(analyse.details.bfr)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Recommandation */}
      <div className={`mt-6 border-l-4 p-4 rounded-r-lg ${
        niveau === 'excellent' ? 'border-green-500 bg-green-50' :
        niveau === 'bon' ? 'border-blue-500 bg-blue-50' :
        niveau === 'moyen' ? 'border-orange-500 bg-orange-50' : 'border-red-500 bg-red-50'
      }`}>
        <div className="flex items-start gap-3">
          {niveau === 'excellent' || niveau === 'bon' ? (
            <div className="text-2xl">✅</div>
          ) : (
            <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              niveau === 'moyen' ? 'text-orange-600' : 'text-red-600'
            }`} />
          )}
          <div>
            <h4 className={`font-semibold mb-1 ${
              niveau === 'excellent' ? 'text-green-900' :
              niveau === 'bon' ? 'text-blue-900' :
              niveau === 'moyen' ? 'text-orange-900' : 'text-red-900'
            }`}>
              {niveau === 'excellent' ? '🎉 Situation excellente' :
               niveau === 'bon' ? '👍 Bonne situation' :
               niveau === 'moyen' ? '⚠️ Situation à améliorer' :
               '🚨 Situation critique'}
            </h4>
            <p className={`text-sm ${
              niveau === 'excellent' ? 'text-green-800' :
              niveau === 'bon' ? 'text-blue-800' :
              niveau === 'moyen' ? 'text-orange-800' : 'text-red-800'
            }`}>{analyse.recommandation}</p>
            
            {/* Actions recommandées */}
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold text-gray-700">Actions recommandées :</p>
              {typeClient === 'particulier' ? (
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Automatiser l'épargne dès réception des revenus</li>
                  <li>• Viser minimum {formatEuro(totalRevenus * 0.20)} d'épargne annuelle (20%)</li>
                  <li>• Diversifier entre épargne de précaution et investissement</li>
                </ul>
              ) : (
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Optimiser les délais de paiement clients et fournisseurs</li>
                  <li>• Réduire le stock dormant si possible</li>
                  <li>• Constituer une réserve de trésorerie de sécurité</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}