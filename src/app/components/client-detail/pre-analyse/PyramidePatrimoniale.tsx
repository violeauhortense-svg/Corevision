import { TrendingUp, Target, AlertCircle } from 'lucide-react';
import { formatEuro } from './utils';

interface EtagePatrimoine {
  nom: string;
  description: string;
  actuel: number;
  cible: number;
  couleur: string;
  icon: string;
}

interface PyramidePatrimonialeProps {
  patrimoineTotal: number;
  liquidites: number;
  revenusPatrimoine: number;
  croissance: number;
  transmission: number;
}

export function PyramidePatrimoniale({
  patrimoineTotal,
  liquidites,
  revenusPatrimoine,
  croissance,
  transmission,
}: PyramidePatrimonialeProps) {
  
  // Calcul des répartitions actuelles (%)
  const pourcentageActuel = {
    liquidites: patrimoineTotal > 0 ? (liquidites / patrimoineTotal) * 100 : 0,
    revenus: patrimoineTotal > 0 ? (revenusPatrimoine / patrimoineTotal) * 100 : 0,
    croissance: patrimoineTotal > 0 ? (croissance / patrimoineTotal) * 100 : 0,
    transmission: patrimoineTotal > 0 ? (transmission / patrimoineTotal) * 100 : 0,
  };

  // Répartition cible recommandée (%)
  const pourcentageCible = {
    liquidites: 20,  // Base de sécurité
    revenus: 30,     // Génération de revenus
    croissance: 35,  // Développement patrimoine
    transmission: 15, // Optimisation transmission
  };

  const etages: EtagePatrimoine[] = [
    {
      nom: '🏔️ Transmission',
      description: 'Assurance-vie, donation, démembrement',
      actuel: pourcentageActuel.transmission,
      cible: pourcentageCible.transmission,
      couleur: 'from-purple-600 to-purple-400',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      nom: '🌱 Croissance',
      description: 'Actions, immobilier locatif, SCPI',
      actuel: pourcentageActuel.croissance,
      cible: pourcentageCible.croissance,
      couleur: 'from-green-600 to-green-400',
      icon: '📈',
    },
    {
      nom: '💰 Revenus',
      description: 'Obligations, SCPI, immobilier loué',
      actuel: pourcentageActuel.revenus,
      cible: pourcentageCible.revenus,
      couleur: 'from-blue-600 to-blue-400',
      icon: '💵',
    },
    {
      nom: '💧 Liquidités',
      description: 'Livrets, comptes courants, fonds euros',
      actuel: pourcentageActuel.liquidites,
      cible: pourcentageCible.liquidites,
      couleur: 'from-cyan-600 to-cyan-400',
      icon: '💧',
    },
  ];

  // Calcul écart global
  const ecartTotal = etages.reduce((sum, etage) => 
    sum + Math.abs(etage.actuel - etage.cible), 0
  );

  const qualiteAllocation = ecartTotal < 20 ? 'Excellente' : 
                           ecartTotal < 40 ? 'Bonne' : 
                           ecartTotal < 60 ? 'À améliorer' : 'À restructurer';

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            🏛️ Pyramide Patrimoniale
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Répartition stratégique du patrimoine par étage
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Qualité allocation</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-lg font-bold ${
              qualiteAllocation === 'Excellente' ? 'text-green-600' :
              qualiteAllocation === 'Bonne' ? 'text-blue-600' :
              qualiteAllocation === 'À améliorer' ? 'text-orange-600' : 'text-red-600'
            }`}>
              {qualiteAllocation}
            </span>
            {qualiteAllocation !== 'Excellente' && (
              <AlertCircle className="w-5 h-5 text-orange-600" />
            )}
          </div>
        </div>
      </div>

      {/* Pyramide visuelle */}
      <div className="space-y-2 mb-6">
        {etages.map((etage, index) => {
          const largeur = 100 - (index * 15); // Pyramide décroissante
          const ecart = etage.actuel - etage.cible;
          const ecartFormate = ecart > 0 ? `+${ecart.toFixed(1)}%` : `${ecart.toFixed(1)}%`;
          
          return (
            <div key={etage.nom} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{etage.nom}</span>
                <span className="text-xs text-gray-500">{etage.description}</span>
              </div>
              
              <div className="flex items-center gap-3" style={{ paddingLeft: `${(100 - largeur) / 2}%` }}>
                {/* Barre actuelle */}
                <div className="flex-1">
                  <div className="relative h-12 rounded-lg overflow-hidden border-2 border-gray-300">
                    <div 
                      className={`h-full bg-gradient-to-r ${etage.couleur} flex items-center justify-center transition-all duration-500`}
                      style={{ width: `${etage.actuel}%` }}
                    >
                      {etage.actuel > 5 && (
                        <span className="text-white font-bold text-sm">
                          {etage.actuel.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {/* Ligne cible */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-red-500 opacity-70"
                      style={{ left: `${etage.cible}%` }}
                      title={`Cible: ${etage.cible}%`}
                    >
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                        <Target className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="text-gray-600">
                      Actuel: <span className="font-semibold">{etage.actuel.toFixed(1)}%</span>
                    </span>
                    <span className={`font-semibold ${
                      Math.abs(ecart) < 5 ? 'text-green-600' :
                      Math.abs(ecart) < 10 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      Écart: {ecartFormate}
                    </span>
                    <span className="text-gray-600">
                      Cible: <span className="font-semibold">{etage.cible}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tableau récapitulatif */}
      <div className="border-t-2 border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Répartition détaillée</h4>
        <div className="grid grid-cols-4 gap-3">
          {etages.map((etage) => {
            const montantActuel = (etage.actuel / 100) * patrimoineTotal;
            const montantCible = (etage.cible / 100) * patrimoineTotal;
            const ajustement = montantCible - montantActuel;
            
            return (
              <div key={etage.nom} className="border border-gray-200 rounded-lg p-3">
                <div className="text-2xl mb-1">{etage.icon}</div>
                <p className="text-xs font-medium text-gray-700 mb-2">{etage.nom.replace(/[🏔️🌱💰💧]/g, '').trim()}</p>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-gray-600">Actuel:</span>
                    <p className="font-bold text-gray-900">{formatEuro(montantActuel)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cible:</span>
                    <p className="font-semibold text-blue-600">{formatEuro(montantCible)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ajustement:</span>
                    <p className={`font-semibold ${
                      ajustement > 0 ? 'text-green-600' : ajustement < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {ajustement > 0 ? '+' : ''}{formatEuro(ajustement)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommandations rapides */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          💡 Actions prioritaires
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          {etages
            .filter(e => Math.abs(e.actuel - e.cible) > 5)
            .sort((a, b) => Math.abs(b.actuel - b.cible) - Math.abs(a.actuel - a.cible))
            .slice(0, 3)
            .map(etage => {
              const action = etage.actuel < etage.cible ? 'Renforcer' : 'Réduire';
              return (
                <li key={etage.nom} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">→</span>
                  <span>
                    <strong>{action}</strong> l'étage <strong>{etage.nom.replace(/[🏔️🌱💰💧]/g, '').trim()}</strong> 
                    {' '}({etage.actuel.toFixed(1)}% → {etage.cible}%)
                  </span>
                </li>
              );
            })}
          {etages.filter(e => Math.abs(e.actuel - e.cible) > 5).length === 0 && (
            <li className="text-green-700">✅ Allocation proche de l'optimal</li>
          )}
        </ul>
      </div>
    </div>
  );
}
