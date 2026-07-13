import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { formatEuro } from './utils';
import type { PatrimoineItem } from '../types';

interface PyramideNiveauData {
  nom: string;
  description: string;
  montantActuel: number;
  pourcentageActuel: number;
  pourcentageCible: number;
  couleur: string;
  items: string[];
}

interface PyramidePatrimonialeNewProps {
  actifsFinanciers: PatrimoineItem[];
  immobilier: PatrimoineItem[];
  patrimoineTotal: number;
  revenusAnnuels: number;
}

/**
 * 🆕 PYRAMIDE PATRIMONIALE MÉTIER
 * Structure complète selon les standards CGP
 * Bas → Haut : RP → Épargne précaution → Fonds euros → Structuré → Alternatifs
 */
export function PyramidePatrimonialeNew({
  actifsFinanciers,
  immobilier,
  patrimoineTotal,
  revenusAnnuels,
}: PyramidePatrimonialeNewProps) {
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // ========================================
  // 🧮 CLASSIFICATION AUTOMATIQUE DES ACTIFS
  // ========================================

  // 1️⃣ Résidence principale
  const residencePrincipale = immobilier.find(
    (bien) => bien.category === 'residence-principale' || bien.category === 'residence_principale'
  );
  const montantRP = residencePrincipale?.value || 0;

  // 2️⃣ Épargne de précaution (Livret A, LDDS, Cash)
  const epargnePrecaution = actifsFinanciers.filter(
    (actif) =>
      actif.category === 'livret-a' ||
      actif.category === 'livret_a' ||
      actif.category === 'ldds' ||
      actif.category === 'lep' ||
      actif.category === 'compte-courant' ||
      actif.category === 'compte_courant' ||
      actif.name?.toLowerCase().includes('livret') ||
      actif.name?.toLowerCase().includes('cash')
  );
  const montantPrecaution = epargnePrecaution.reduce((sum, a) => sum + a.value, 0);

  // 3️⃣ Fonds en euros (assurance-vie sécurisée)
  const fondsEuros = actifsFinanciers.filter(
    (actif) =>
      actif.category === 'fonds-euros' ||
      actif.category === 'fonds_euros' ||
      (actif.category === 'assurance-vie' || actif.category === 'assurance_vie') && actif.name?.toLowerCase().includes('fonds euro')
  );
  const montantFondsEuros = fondsEuros.reduce((sum, a) => sum + a.value, 0);

  // 4️⃣ Bloc structuré - subdivisé en 3 catégories
  // 4a. Bourse (Actions, ETF, Obligations, PEA, CTO)
  const bourse = actifsFinanciers.filter(
    (actif) =>
      actif.category === 'actions' ||
      actif.category === 'obligations' ||
      actif.category === 'etf' ||
      actif.category === 'pea' ||
      actif.category === 'cto' ||
      actif.name?.toLowerCase().includes('action') ||
      actif.name?.toLowerCase().includes('etf') ||
      actif.name?.toLowerCase().includes('obligation')
  );
  const montantBourse = bourse.reduce((sum, a) => sum + a.value, 0);

  // 4b. Immobilier locatif (Direct, SCPI, Fonds immobiliers)
  const immobilierLocatif = [
    ...immobilier.filter(
      (bien) =>
        bien.category === 'locatif' ||
        bien.category === 'locatif_nu' ||
        bien.category === 'locatif_meuble' ||
        bien.category === 'investissement' ||
        bien.category === 'scpi' ||
        bien.category === 'sci'
    ),
    ...actifsFinanciers.filter(
      (actif) =>
        actif.category === 'scpi' ||
        actif.name?.toLowerCase().includes('scpi') ||
        actif.name?.toLowerCase().includes('immobilier')
    ),
  ];
  const montantImmobilier = immobilierLocatif.reduce((sum, i) => sum + i.value, 0);

  // 4c. Private Equity (Non coté)
  const privateEquity = actifsFinanciers.filter(
    (actif) =>
      actif.category === 'private-equity' ||
      actif.category === 'private_equity' ||
      actif.name?.toLowerCase().includes('private equity') ||
      actif.name?.toLowerCase().includes('non coté')
  );
  const montantPrivateEquity = privateEquity.reduce((sum, a) => sum + a.value, 0);

  const montantStructure = montantBourse + montantImmobilier + montantPrivateEquity;

  // 5️⃣ Alternatifs (Crypto, Or, Crowdfunding)
  const alternatifs = actifsFinanciers.filter(
    (actif) =>
      actif.category === 'crypto' ||
      actif.category === 'or' ||
      actif.category === 'crowdfunding' ||
      actif.name?.toLowerCase().includes('crypto') ||
      actif.name?.toLowerCase().includes('bitcoin') ||
      actif.name?.toLowerCase().includes('or') ||
      actif.name?.toLowerCase().includes('crowdfunding')
  );
  const montantAlternatifs = alternatifs.reduce((sum, a) => sum + a.value, 0);

  // Total patrimoine (hors RP pour les calculs de répartition)
  const patrimoineHorsRP = patrimoineTotal - montantRP;

  // ========================================
  // 📊 CALCUL OBJECTIFS ET CIBLES
  // ========================================

  // Épargne de précaution : 3 à 6 mois de revenus
  const objectifPrecautionMin = (revenusAnnuels / 12) * 3;
  const objectifPrecautionMax = (revenusAnnuels / 12) * 6;

  // Répartition cible (en % du patrimoine hors RP)
  const pourcentageCible = {
    precaution: 10, // 10% en liquidités sécurisées
    fondsEuros: 20, // 20% amortisseur
    bourse: 30, // 30% actions/ETF/obligations
    immobilier: 25, // 25% immobilier locatif
    privateEquity: 10, // 10% non coté
    alternatifs: 5, // 5% actifs opportunistes
  };

  // Calculs des pourcentages actuels
  const calcPourcentage = (montant: number) =>
    patrimoineHorsRP > 0 ? (montant / patrimoineHorsRP) * 100 : 0;

  // ========================================
  // 🏛️ STRUCTURE DE LA PYRAMIDE (bas → haut)
  // ========================================

  const niveauxPyramide: PyramideNiveauData[] = [
    // 5️⃣ SOMMET : Alternatifs
    {
      nom: '5. Alternatifs',
      description: 'Crypto, Or, Matières premières, Crowdfunding',
      montantActuel: montantAlternatifs,
      pourcentageActuel: calcPourcentage(montantAlternatifs),
      pourcentageCible: pourcentageCible.alternatifs,
      couleur: 'from-amber-500 to-orange-400',
      items: alternatifs.map((a) => `${a.name}: ${formatEuro(a.value)}`),
    },
    // 4️⃣ Bloc structuré (subdivisé)
    {
      nom: '4c. Private Equity',
      description: 'Non coté',
      montantActuel: montantPrivateEquity,
      pourcentageActuel: calcPourcentage(montantPrivateEquity),
      pourcentageCible: pourcentageCible.privateEquity,
      couleur: 'from-indigo-600 to-indigo-400',
      items: privateEquity.map((a) => `${a.name}: ${formatEuro(a.value)}`),
    },
    {
      nom: '4b. Immobilier',
      description: 'Direct, SCPI, Fonds immobiliers',
      montantActuel: montantImmobilier,
      pourcentageActuel: calcPourcentage(montantImmobilier),
      pourcentageCible: pourcentageCible.immobilier,
      couleur: 'from-teal-600 to-teal-400',
      items: immobilierLocatif.map((i) => `${i.name}: ${formatEuro(i.value)}`),
    },
    {
      nom: '4a. Bourse',
      description: 'Actions, ETF, Obligations, PEA, CTO',
      montantActuel: montantBourse,
      pourcentageActuel: calcPourcentage(montantBourse),
      pourcentageCible: pourcentageCible.bourse,
      couleur: 'from-purple-600 to-purple-400',
      items: bourse.map((a) => `${a.name}: ${formatEuro(a.value)}`),
    },
    // 3️⃣ Fonds euros
    {
      nom: '3. Fonds en euros',
      description: 'Assurance-vie sécurisée (amortisseur)',
      montantActuel: montantFondsEuros,
      pourcentageActuel: calcPourcentage(montantFondsEuros),
      pourcentageCible: pourcentageCible.fondsEuros,
      couleur: 'from-blue-600 to-blue-400',
      items: fondsEuros.map((a) => `${a.name}: ${formatEuro(a.value)}`),
    },
    // 2️⃣ Épargne de précaution
    {
      nom: '2. Épargne de précaution',
      description: `Livret A, LDDS, Cash (Objectif: ${formatEuro(objectifPrecautionMin)} - ${formatEuro(objectifPrecautionMax)})`,
      montantActuel: montantPrecaution,
      pourcentageActuel: calcPourcentage(montantPrecaution),
      pourcentageCible: pourcentageCible.precaution,
      couleur: 'from-cyan-600 to-cyan-400',
      items: epargnePrecaution.map((a) => `${a.name}: ${formatEuro(a.value)}`),
    },
    // 1️⃣ BASE : Résidence principale
    {
      nom: '1. Résidence principale',
      description: 'Base structurante (actif non productif)',
      montantActuel: montantRP,
      pourcentageActuel: 0, // Hors calcul de répartition
      pourcentageCible: 0, // Hors calcul de répartition
      couleur: 'from-emerald-700 to-emerald-500',
      items: residencePrincipale ? [`${residencePrincipale.name}: ${formatEuro(montantRP)}`] : ['Non renseignée'],
    },
  ];

  // ========================================
  // 🎨 RENDU VISUEL
  // ========================================

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-purple-600" />
        5️⃣ Pyramide Patrimoniale
      </h3>

      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white mb-4">
        <p className="text-sm text-blue-100">
          Structuration du patrimoine selon les principes CGP • Comparaison Actuel vs Cible
        </p>
      </div>

      {/* Patrimoine total */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Patrimoine total</div>
          <div className="text-2xl font-bold text-gray-900">{formatEuro(patrimoineTotal)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Résidence principale</div>
          <div className="text-2xl font-bold text-emerald-600">{formatEuro(montantRP)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Patrimoine hors RP</div>
          <div className="text-2xl font-bold text-blue-600">{formatEuro(patrimoineHorsRP)}</div>
        </div>
      </div>

      {/* Alerte épargne de précaution */}
      {montantPrecaution < objectifPrecautionMin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900">⚠️ Épargne de précaution insuffisante</div>
            <div className="text-sm text-amber-700 mt-1">
              Vous avez {formatEuro(montantPrecaution)}, objectif recommandé : {formatEuro(objectifPrecautionMin)} - {formatEuro(objectifPrecautionMax)} (3 à 6 mois de revenus)
            </div>
          </div>
        </div>
      )}

      {/* Pyramide visuelle */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-2">
        {niveauxPyramide.map((niveau, index) => {
          const ecart = niveau.pourcentageActuel - niveau.pourcentageCible;
          const isDesequilibre = niveau.pourcentageCible > 0 && Math.abs(ecart) > 5;
          const largeurBase = 100;
          const largeurNiveau = largeurBase - index * 10; // Réduction progressive pour effet pyramide

          return (
            <div key={niveau.nom} className="relative">
              {/* Barre niveau pyramide */}
              <div
                className="relative mx-auto rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                style={{ width: `${largeurNiveau}%` }}
                onClick={() => setShowDetails(showDetails === niveau.nom ? null : niveau.nom)}
              >
                {/* Barre de progression actuelle */}
                <div
                  className={`h-16 bg-gradient-to-r ${niveau.couleur} flex items-center justify-between px-4 relative`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{niveau.nom}</div>
                    <div className="text-xs text-white/80">{niveau.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{formatEuro(niveau.montantActuel)}</div>
                    <div className="text-xs text-white/90">
                      {niveau.pourcentageCible > 0 ? (
                        <>
                          {niveau.pourcentageActuel.toFixed(1)}% / {niveau.pourcentageCible}%
                          {isDesequilibre && (
                            ecart > 0 ? (
                              <TrendingUp className="inline w-3 h-3 ml-1 text-green-300" />
                            ) : (
                              <TrendingDown className="inline w-3 h-3 ml-1 text-red-300" />
                            )
                          )}
                        </>
                      ) : (
                        'Base structurante'
                      )}
                    </div>
                  </div>
                </div>

                {/* Indicateur de déséquilibre */}
                {isDesequilibre && (
                  <div
                    className={`absolute top-0 right-0 w-2 h-full ${
                      ecart > 0 ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                )}
              </div>

              {/* Détails au clic */}
              {showDetails === niveau.nom && niveau.items.length > 0 && (
                <div className="mt-2 mx-auto bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ width: `${largeurNiveau}%` }}>
                  <div className="text-sm font-semibold text-gray-700 mb-2">📋 Actifs dans ce niveau :</div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {niveau.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {niveau.pourcentageCible > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        <strong>Analyse :</strong>{' '}
                        {ecart > 5
                          ? `✅ Sur-allocation de ${ecart.toFixed(1)}% par rapport à la cible`
                          : ecart < -5
                          ? `⚠️ Sous-allocation de ${Math.abs(ecart).toFixed(1)}% par rapport à la cible`
                          : '✓ Répartition conforme à la cible'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-2">💡 Interprétation de la pyramide :</p>
            <ul className="space-y-1 text-blue-800">
              <li>• <strong>Base</strong> : Résidence principale (sécurité, non productif)</li>
              <li>• <strong>Niveau 2</strong> : Épargne de précaution (3-6 mois de revenus)</li>
              <li>• <strong>Niveau 3</strong> : Fonds euros (amortisseur sécurisé)</li>
              <li>• <strong>Niveau 4</strong> : Actifs structurés (Bourse, Immobilier, Private Equity)</li>
              <li>• <strong>Sommet</strong> : Alternatifs (actifs opportunistes à risque)</li>
            </ul>
            <p className="mt-3 text-xs text-blue-700">
              👉 Cliquez sur un niveau pour voir le détail des actifs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
