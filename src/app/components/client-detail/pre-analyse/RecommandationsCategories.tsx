import { AlertTriangle, Wrench, Target, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Probleme } from './types';

interface Recommandation {
  id: string;
  categorie: 'urgent' | 'optimisation' | 'strategique';
  titre: string;
  description: string;
  impact: string;
  actionsSuggerees: string[];
  problemeId?: string;
}

interface RecommandationsCategoriesProps {
  problemes: Probleme[];
  patrimoineNet: number;
  pressionFiscale: number;
  tauxEndettement: number;
  ratioLiquidite: number;
  partImmobilier: number;
  partFinancier: number;
}

/**
 * 🆕 SYSTÈME DE RECOMMANDATIONS CATÉGORISÉES
 * 3 niveaux : Urgent ⚠️ / Optimisation 🔧 / Stratégique 🎯
 */
export function RecommandationsCategories({
  problemes,
  patrimoineNet,
  pressionFiscale,
  tauxEndettement,
  ratioLiquidite,
  partImmobilier,
  partFinancier,
}: RecommandationsCategoriesProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['urgent', 'optimisation', 'strategique'])
  );

  const toggleCategory = (categorie: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categorie)) {
      newExpanded.delete(categorie);
    } else {
      newExpanded.add(categorie);
    }
    setExpandedCategories(newExpanded);
  };

  // ========================================
  // 🧮 GÉNÉRATION DES RECOMMANDATIONS
  // ========================================

  const recommandations: Recommandation[] = [];

  // 🔥 URGENT : Problèmes critiques à corriger immédiatement
  problemes
    .filter((pb) => pb.severite === 'high')
    .forEach((pb) => {
      recommandations.push({
        id: `urgent-pb-${pb.id}`,
        categorie: 'urgent',
        titre: pb.titre,
        description: pb.description,
        impact: pb.impact,
        actionsSuggerees: [
          'Rendez-vous urgent avec votre CGP',
          'Établir un plan d\'action sous 15 jours',
          'Priorisation maximale de ce point',
        ],
        problemeId: pb.id,
      });
    });

  // Autres cas urgents (hors problèmes détectés)
  if (ratioLiquidite < 10 && !problemes.some(p => p.id.includes('liquidite'))) {
    recommandations.push({
      id: 'urgent-liquidite-critique',
      categorie: 'urgent',
      titre: '🚨 Liquidités critiques',
      description: `Vous disposez de seulement ${ratioLiquidite.toFixed(1)}% d'actifs liquides, ce qui est largement insuffisant pour faire face aux imprévus.`,
      impact: 'Risque de difficultés financières immédiates en cas d\'imprévu (santé, emploi, dépenses urgentes)',
      actionsSuggerees: [
        'Constituer une épargne de précaution (3 à 6 mois de revenus)',
        'Réduire l\'immobilier ou les actifs peu liquides',
        'Ouvrir un Livret A et/ou LDDS',
      ],
    });
  }

  if (tauxEndettement > 60 && !problemes.some(p => p.id.includes('endettement'))) {
    recommandations.push({
      id: 'urgent-endettement-eleve',
      categorie: 'urgent',
      titre: '⚠️ Endettement excessif',
      description: `Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% est très élevé et vulnérable à une hausse des taux.`,
      impact: 'Risque de défaut en cas de hausse des taux ou de baisse de revenus',
      actionsSuggerees: [
        'Renégociation des crédits immobiliers',
        'Remboursement anticipé partiel des dettes',
        'Éviter tout nouvel endettement',
      ],
    });
  }

  // 🔧 OPTIMISATION : Améliorations à moyen terme
  problemes
    .filter((pb) => pb.severite === 'medium')
    .forEach((pb) => {
      recommandations.push({
        id: `optim-pb-${pb.id}`,
        categorie: 'optimisation',
        titre: pb.titre,
        description: pb.description,
        impact: pb.impact,
        actionsSuggerees: [
          'Planifier une action dans les 3 à 6 mois',
          'Évaluer les solutions disponibles',
          'Mettre en place un suivi régulier',
        ],
        problemeId: pb.id,
      });
    });

  // Autres cas d'optimisation
  if (pressionFiscale > 25 && pressionFiscale <= 35) {
    recommandations.push({
      id: 'optim-fiscalite-ameliorable',
      categorie: 'optimisation',
      titre: '💰 Fiscalité optimisable',
      description: `Votre pression fiscale de ${pressionFiscale.toFixed(1)}% peut être réduite grâce à des outils d'optimisation.`,
      impact: 'Potentiel d\'économies fiscales de 5 000 € à 20 000 € par an selon le patrimoine',
      actionsSuggerees: [
        'Ouvrir ou alimenter une assurance-vie (fiscalité avantageuse après 8 ans)',
        'Utiliser un PEA pour les placements actions (exonération après 5 ans)',
        'Étudier les dispositifs de défiscalisation (Pinel, Malraux, FIP/FCPI)',
        'Optimiser la répartition des revenus entre conjoints',
      ],
    });
  }

  if (partImmobilier > 60 && partImmobilier <= 75) {
    recommandations.push({
      id: 'optim-diversification-immo',
      categorie: 'optimisation',
      titre: '📊 Diversification à améliorer',
      description: `Votre patrimoine est concentré à ${partImmobilier.toFixed(0)}% sur l'immobilier. Une diversification permettrait de réduire le risque.`,
      impact: 'Réduction de la volatilité du patrimoine et amélioration du rendement potentiel',
      actionsSuggerees: [
        'Investir progressivement sur les marchés financiers (actions, ETF)',
        'Envisager des SCPI pour de l\'immobilier diversifié',
        'Utiliser l\'assurance-vie en unités de compte',
        'Allocation cible recommandée : 60% immobilier, 40% financier',
      ],
    });
  }

  if (ratioLiquidite >= 10 && ratioLiquidite < 20) {
    recommandations.push({
      id: 'optim-liquidite-faible',
      categorie: 'optimisation',
      titre: '💧 Liquidités insuffisantes',
      description: `Avec ${ratioLiquidite.toFixed(1)}% d'actifs liquides, votre capacité à faire face aux imprévus est limitée.`,
      impact: 'Difficulté à mobiliser des fonds rapidement sans pénalités',
      actionsSuggerees: [
        'Porter les liquidités à 20-30% du patrimoine',
        'Diversifier entre livrets réglementés et fonds euros',
        'Maintenir 3 à 6 mois de revenus en épargne de précaution',
      ],
    });
  }

  // 🎯 STRATÉGIQUE : Opportunités à long terme
  problemes
    .filter((pb) => pb.severite === 'low')
    .forEach((pb) => {
      recommandations.push({
        id: `strat-pb-${pb.id}`,
        categorie: 'strategique',
        titre: pb.titre,
        description: pb.description,
        impact: pb.impact,
        actionsSuggerees: [
          'Planifier sur 1 à 3 ans',
          'Réflexion stratégique à mener',
          'Anticiper les évolutions futures',
        ],
        problemeId: pb.id,
      });
    });

  // Autres cas stratégiques
  if (patrimoineNet > 1000000) {
    recommandations.push({
      id: 'strat-transmission-patrimoine',
      categorie: 'strategique',
      titre: '👨‍👩‍👧‍👦 Stratégie de transmission',
      description: `Avec un patrimoine de ${(patrimoineNet / 1000).toFixed(0)}k€, une stratégie de transmission permettrait d'optimiser la succession.`,
      impact: 'Économies fiscales potentielles de 50 000 € à 500 000 € selon la structure mise en place',
      actionsSuggerees: [
        'Donation en pleine propriété ou démembrement',
        'Optimisation avec assurance-vie (abattements spécifiques)',
        'Holding patrimoniale pour les actifs professionnels',
        'Pacte Dutreil pour la transmission d\'entreprise',
        'Bilan successoral complet avec un notaire',
      ],
    });
  }

  if (patrimoineNet > 500000 && patrimoineNet <= 1000000) {
    recommandations.push({
      id: 'strat-private-equity',
      categorie: 'strategique',
      titre: '📈 Diversification Private Equity',
      description: 'Votre niveau de patrimoine permet d\'accéder au Private Equity pour améliorer la performance à long terme.',
      impact: 'Potentiel de surperformance de 3 à 5% par an vs actions cotées (sur 5-10 ans)',
      actionsSuggerees: [
        'Explorer les FCPR et FCPI (réduction d\'ISR possible)',
        'Envisager des fonds de Private Equity accessibles (ticket min. 10-50k€)',
        'Allocation cible : 5 à 10% du patrimoine financier',
        'Horizon d\'investissement : minimum 7-10 ans',
      ],
    });
  }

  if (pressionFiscale < 15) {
    recommandations.push({
      id: 'strat-croissance-patrimoniale',
      categorie: 'strategique',
      titre: '🚀 Stratégie de croissance',
      description: `Votre situation fiscale favorable (${pressionFiscale.toFixed(1)}%) permet d'adopter une stratégie de croissance patrimoniale.`,
      impact: 'Potentiel de croissance accélérée du patrimoine sur 10-20 ans',
      actionsSuggerees: [
        'Augmenter l\'exposition aux actions (ETF World, PEA)',
        'Investir dans l\'immobilier locatif (effet de levier)',
        'Maximiser les versements en assurance-vie',
        'Viser un rendement global de 5-7% par an',
      ],
    });
  }

  // Grouper par catégorie
  const urgentes = recommandations.filter((r) => r.categorie === 'urgent');
  const optimisations = recommandations.filter((r) => r.categorie === 'optimisation');
  const strategiques = recommandations.filter((r) => r.categorie === 'strategique');

  // ========================================
  // 🎨 RENDU VISUEL
  // ========================================

  const renderCategorie = (
    categorie: 'urgent' | 'optimisation' | 'strategique',
    titre: string,
    description: string,
    icon: React.ReactNode,
    couleurBg: string,
    couleurBorder: string,
    couleurTexte: string,
    items: Recommandation[]
  ) => {
    const isExpanded = expandedCategories.has(categorie);

    return (
      <div className={`border-2 ${couleurBorder} rounded-xl overflow-hidden`}>
        {/* Header cliquable */}
        <button
          onClick={() => toggleCategory(categorie)}
          className={`w-full ${couleurBg} ${couleurTexte} p-5 flex items-center justify-between hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-3">
            {icon}
            <div className="text-left">
              <h3 className="text-xl font-bold">{titre}</h3>
              <p className="text-sm opacity-90 mt-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold bg-white bg-opacity-30 px-4 py-1 rounded-full">
              {items.length}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-6 h-6" />
            ) : (
              <ChevronDown className="w-6 h-6" />
            )}
          </div>
        </button>

        {/* Contenu dépliable */}
        {isExpanded && (
          <div className="bg-white p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">Aucune recommandation dans cette catégorie</p>
              </div>
            ) : (
              items.map((reco) => (
                <div
                  key={reco.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{reco.titre}</h4>
                  <p className="text-sm text-gray-700 mb-3">{reco.description}</p>

                  {/* Impact */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">💡 Impact attendu :</p>
                    <p className="text-xs text-blue-800">{reco.impact}</p>
                  </div>

                  {/* Actions suggérées */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-900 mb-2">
                      ✅ Actions suggérées :
                    </p>
                    <ul className="space-y-1">
                      {reco.actionsSuggerees.map((action, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-indigo-600" />
        7️⃣ Recommandations
      </h3>

      {/* Résumé rapide */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-3xl font-bold text-red-600">{urgentes.length}</div>
          <div className="text-sm text-red-700 font-medium">Actions urgentes</div>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
          <Wrench className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-3xl font-bold text-orange-600">{optimisations.length}</div>
          <div className="text-sm text-orange-700 font-medium">Optimisations</div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
          <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-3xl font-bold text-blue-600">{strategiques.length}</div>
          <div className="text-sm text-blue-700 font-medium">Actions stratégiques</div>
        </div>
      </div>

      {/* Catégories de recommandations */}
      <div className="space-y-4">
        {/* 🔥 URGENT */}
        {renderCategorie(
          'urgent',
          '🔥 Actions Urgentes',
          'Problèmes critiques à traiter immédiatement (0-15 jours)',
          <AlertTriangle className="w-7 h-7" />,
          'bg-red-600',
          'border-red-600',
          'text-white',
          urgentes
        )}

        {/* 🔧 OPTIMISATION */}
        {renderCategorie(
          'optimisation',
          '🔧 Optimisations',
          'Améliorations à moyen terme (3-6 mois)',
          <Wrench className="w-7 h-7" />,
          'bg-orange-500',
          'border-orange-500',
          'text-white',
          optimisations
        )}

        {/* 🎯 STRATÉGIQUE */}
        {renderCategorie(
          'strategique',
          '🎯 Actions Stratégiques',
          'Opportunités à long terme (1-3 ans)',
          <Target className="w-7 h-7" />,
          'bg-blue-600',
          'border-blue-600',
          'text-white',
          strategiques
        )}
      </div>
    </div>
  );
}
