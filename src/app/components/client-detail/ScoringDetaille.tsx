import { useState, useMemo } from 'react';
import { Edit2, Save, X, PieChart, Shield, DollarSign, Droplet, Clock, Heart, Gift } from 'lucide-react';

interface ScoringDetailleProps {
  partImmobilier: number;
  partFinancier: number;
  tauxEndettement: number;
  pressionFiscale: number;
  ratioLiquidite: number;
  patrimoineNet: number;
  totalRevenus: number;
  impositionIR: number;
  impositionIFI: number;
  nombreAssuranceVie: number;
}

interface ScorePonderation {
  label: string;
  value: number;
  weight: number;
}

interface ScoreDetail {
  value: number;
  sousIndicateurs: ScorePonderation[];
  explication: string;
  niveau: 'faible' | 'moyen' | 'élevé';
}

export function ScoringDetaille({
  partImmobilier,
  partFinancier,
  tauxEndettement,
  pressionFiscale,
  ratioLiquidite,
  patrimoineNet,
  totalRevenus,
  impositionIR,
  impositionIFI,
  nombreAssuranceVie,
}: ScoringDetailleProps) {
  const [editingPonderations, setEditingPonderations] = useState(false);
  const [ponderations, setPonderations] = useState({
    diversification: { immobilier: 0.4, actionsConcentrees: 0.3, alternatifs: 0.3 },
    risque: { endettement: 0.4, concentration: 0.3, volatilite: 0.3 },
    fiscalite: { ir: 0.3, ifi: 0.3, plusValues: 0.2, instrumentsFiscaux: 0.2 },
    liquidite: { ratioLiquidite: 1.0 },
    retraite: { ratioRevenus: 1.0 },
    protection: { couvertureBesoins: 1.0 },
    transmission: { fiscalSuccession: 0.5, risqueConflits: 0.5 },
  });

  // ===== CALCULS DES SCORES DÉTAILLÉS =====
  const scoresDetails = useMemo((): Record<string, ScoreDetail> => {
    // 1️⃣ DIVERSIFICATION
    const pénalitéImmobilier = Math.min(100, (partImmobilier / 100) * 100);
    const actionsConcentrées = partFinancier > 70 ? 70 : 0; // Estimation simple
    const alternatifs = 0; // Pas de données pour les actifs alternatifs
    
    const scoreDiversification = Math.max(0, 100 - (
      ponderations.diversification.immobilier * pénalitéImmobilier +
      ponderations.diversification.actionsConcentrees * actionsConcentrées +
      ponderations.diversification.alternatifs * alternatifs
    ));
    
    let explDiversification = '';
    if (scoreDiversification >= 75) {
      explDiversification = `Score élevé : le portefeuille est bien diversifié avec ${partFinancier.toFixed(0)}% d'actifs financiers et ${partImmobilier.toFixed(0)}% d'immobilier. Bonne répartition des risques.`;
    } else if (scoreDiversification >= 50) {
      explDiversification = `Score moyen : la diversification peut être améliorée. ${partImmobilier > 60 ? `L'immobilier représente ${partImmobilier.toFixed(0)}% du patrimoine, ce qui est élevé.` : `Certaines classes d'actifs sont sous-représentées.`}`;
    } else {
      explDiversification = `Score faible : concentration excessive ${partImmobilier > 70 ? `sur l'immobilier (${partImmobilier.toFixed(0)}%)` : partFinancier > 70 ? `sur les actifs financiers (${partFinancier.toFixed(0)}%)` : ''}. Risque de volatilité important en cas de choc sur cette classe d'actifs.`;
    }

    // 2️⃣ RISQUE
    const pénalitéEndettement = Math.min(100, tauxEndettement);
    const concentrationActifs = partImmobilier > 70 || partFinancier > 70 ? 70 : 30;
    const volatilité = 50; // Estimation par défaut
    
    const scoreRisqueInverse = Math.max(0, 100 - (
      ponderations.risque.endettement * pénalitéEndettement +
      ponderations.risque.concentration * concentrationActifs +
      ponderations.risque.volatilite * (volatilité / 100) * 100
    ));
    
    let explRisque = '';
    if (scoreRisqueInverse >= 75) {
      explRisque = `Score élevé : le patrimoine présente un profil de risque maîtrisé avec un taux d'endettement de ${tauxEndettement.toFixed(1)}% et une bonne diversification.`;
    } else if (scoreRisqueInverse >= 50) {
      explRisque = `Score moyen : certains risques sont présents. ${tauxEndettement > 30 ? `L'endettement de ${tauxEndettement.toFixed(1)}% nécessite une surveillance.` : 'La concentration sur certaines classes d\'actifs augmente l\'exposition aux risques.'}`;
    } else {
      explRisque = `Score faible : risque important ${tauxEndettement > 50 ? `lié à un fort endettement (${tauxEndettement.toFixed(1)}%)` : 'lié à une forte concentration'}. Vulnérabilité en cas de choc de marché ou de hausse des taux.`;
    }

    // 3️⃣ FISCALITÉ
    const pénalitéIR = totalRevenus > 0 ? Math.min(100, (impositionIR / totalRevenus) * 100 * 2.5) : 0; // Normalisé avec protection division par zéro
    const pénalitéIFI = patrimoineNet > 0 ? Math.min(100, (impositionIFI / patrimoineNet) * 100 * 10) : 0; // Normalisé avec protection
    const plusValuesNonOptimisées = 30; // Estimation par défaut
    const absenceInstrumentsFiscaux = nombreAssuranceVie === 0 ? 80 : 20;
    
    const scoreFiscalite = Math.max(0, 100 - (
      ponderations.fiscalite.ir * pénalitéIR +
      ponderations.fiscalite.ifi * pénalitéIFI +
      ponderations.fiscalite.plusValues * plusValuesNonOptimisées +
      ponderations.fiscalite.instrumentsFiscaux * absenceInstrumentsFiscaux
    ));
    
    let explFiscalite = '';
    if (scoreFiscalite >= 75) {
      explFiscalite = `Score élevé : la fiscalité est bien optimisée. Pression fiscale de ${pressionFiscale.toFixed(1)}% ${nombreAssuranceVie > 0 ? 'avec des enveloppes fiscales en place.' : '.'}`;
    } else if (scoreFiscalite >= 50) {
      explFiscalite = `Score moyen : des opportunités d'optimisation existent. ${pressionFiscale > 20 ? `La pression fiscale de ${pressionFiscale.toFixed(1)}% peut être réduite.` : ''} ${nombreAssuranceVie === 0 ? 'Absence d\'assurance-vie pour optimiser la fiscalité.' : ''}`;
    } else {
      explFiscalite = `Score faible : fiscalité excessive avec une pression de ${pressionFiscale.toFixed(1)}%. ${nombreAssuranceVie === 0 ? 'Aucune enveloppe fiscale (assurance-vie, PEA...) détectée.' : ''} Optimisation urgente nécessaire.`;
    }

    // 4️⃣ LIQUIDITÉ
    const scoreLiquidite = Math.min(100, ratioLiquidite * 3); // Normalisé pour que 33% = 100
    
    let explLiquidite = '';
    if (scoreLiquidite >= 75) {
      explLiquidite = `Score élevé : excellente liquidité avec ${ratioLiquidite.toFixed(1)}% d'actifs financiers. Capacité à faire face aux imprévus et saisir des opportunités.`;
    } else if (scoreLiquidite >= 50) {
      explLiquidite = `Score moyen : liquidité correcte (${ratioLiquidite.toFixed(1)}%) mais peut être améliorée. Recommandé : 20-30% minimum d'actifs liquides.`;
    } else {
      explLiquidite = `Score faible : manque de liquidité avec seulement ${ratioLiquidite.toFixed(1)}% d'actifs financiers. Difficulté à mobiliser des fonds rapidement en cas de besoin.`;
    }

    // 5️⃣ RETRAITE
    const reveusRetraiteProjetes = totalRevenus * 0.5; // Estimation simplifiée
    const besoinsRetraite = totalRevenus * 0.7; // Estimation 70% des revenus actuels
    const ratioRetraite = besoinsRetraite > 0 ? (reveusRetraiteProjetes / besoinsRetraite) * 100 : 50;
    const scoreRetraite = Math.min(100, ratioRetraite);
    
    let explRetraite = '';
    if (scoreRetraite >= 75) {
      explRetraite = `Score élevé : préparation solide pour la retraite. Les revenus projetés couvrent largement les besoins estimés.`;
    } else if (scoreRetraite >= 50) {
      explRetraite = `Score moyen : préparation partielle pour la retraite. Des compléments pourraient être nécessaires pour maintenir le niveau de vie.`;
    } else {
      explRetraite = `Score faible : préparation insuffisante pour la retraite. Les revenus projetés ne couvriront pas les besoins. Constitution d'épargne retraite urgente.`;
    }

    // 6️⃣ PROTECTION FAMILIALE
    const couvertureAssurances = nombreAssuranceVie > 0 ? 70 : 30;
    const liquiditéUrgence = ratioLiquidite > 20 ? 80 : 40;
    const scoreProtection = (couvertureAssurances + liquiditéUrgence) / 2;
    
    let explProtection = '';
    if (scoreProtection >= 75) {
      explProtection = `Score élevé : bonne protection familiale avec ${nombreAssuranceVie} assurance(s)-vie et ${ratioLiquidite.toFixed(1)}% de liquidités disponibles.`;
    } else if (scoreProtection >= 50) {
      explProtection = `Score moyen : protection partielle. ${nombreAssuranceVie === 0 ? 'Absence d\'assurance-vie.' : ''} ${ratioLiquidite < 20 ? 'Manque de liquidités pour faire face aux imprévus.' : ''}`;
    } else {
      explProtection = `Score faible : protection familiale insuffisante. ${nombreAssuranceVie === 0 ? 'Aucune assurance-vie.' : ''} ${ratioLiquidite < 10 ? 'Très peu de liquidités disponibles.' : ''} Vulnérabilité importante.`;
    }

    // 7️⃣ TRANSMISSION
    const potentielFiscal = patrimoineNet > 1000000 ? 60 : patrimoineNet > 500000 ? 40 : 20;
    const risqueConflits = nombreAssuranceVie === 0 ? 70 : 30;
    const scoreTransmission = Math.max(0, 100 - (
      ponderations.transmission.fiscalSuccession * potentielFiscal +
      ponderations.transmission.risqueConflits * risqueConflits
    ));
    
    let explTransmission = '';
    if (scoreTransmission >= 75) {
      explTransmission = `Score élevé : stratégie de transmission bien préparée avec des dispositifs en place pour optimiser la succession.`;
    } else if (scoreTransmission >= 50) {
      explTransmission = `Score moyen : transmission partiellement préparée. ${patrimoineNet > 500000 ? 'Des optimisations fiscales restent possibles.' : ''} ${nombreAssuranceVie === 0 ? 'Envisager une assurance-vie pour optimiser.' : ''}`;
    } else {
      explTransmission = `Score faible : transmission non préparée. Sur un patrimoine de ${(patrimoineNet / 1000).toFixed(0)}k€, les droits de succession seront importants. ${nombreAssuranceVie === 0 ? 'Aucun dispositif de transmission optimisé détecté.' : ''} Mise en place urgente d'une stratégie.`;
    }

    return {
      diversification: {
        value: Math.round(scoreDiversification),
        sousIndicateurs: [
          { label: 'Part immobilier', value: pénalitéImmobilier, weight: ponderations.diversification.immobilier },
          { label: 'Actions concentrées', value: actionsConcentrées, weight: ponderations.diversification.actionsConcentrees },
          { label: 'Actifs alternatifs', value: alternatifs, weight: ponderations.diversification.alternatifs },
        ],
        explication: explDiversification,
        niveau: scoreDiversification >= 75 ? 'élevé' : scoreDiversification >= 50 ? 'moyen' : 'faible',
      },
      risque: {
        value: Math.round(scoreRisqueInverse),
        sousIndicateurs: [
          { label: 'Endettement', value: pénalitéEndettement, weight: ponderations.risque.endettement },
          { label: 'Concentration', value: concentrationActifs, weight: ponderations.risque.concentration },
          { label: 'Volatilité', value: volatilité, weight: ponderations.risque.volatilite },
        ],
        explication: explRisque,
        niveau: scoreRisqueInverse >= 75 ? 'élevé' : scoreRisqueInverse >= 50 ? 'moyen' : 'faible',
      },
      fiscalite: {
        value: Math.round(scoreFiscalite),
        sousIndicateurs: [
          { label: 'Impôt sur le revenu', value: pénalitéIR, weight: ponderations.fiscalite.ir },
          { label: 'IFI', value: pénalitéIFI, weight: ponderations.fiscalite.ifi },
          { label: 'Plus-values non optimisées', value: plusValuesNonOptimisées, weight: ponderations.fiscalite.plusValues },
          { label: 'Absence instruments fiscaux', value: absenceInstrumentsFiscaux, weight: ponderations.fiscalite.instrumentsFiscaux },
        ],
        explication: explFiscalite,
        niveau: scoreFiscalite >= 75 ? 'élevé' : scoreFiscalite >= 50 ? 'moyen' : 'faible',
      },
      liquidite: {
        value: Math.round(scoreLiquidite),
        sousIndicateurs: [
          { label: 'Ratio de liquidité', value: ratioLiquidite, weight: ponderations.liquidite.ratioLiquidite },
        ],
        explication: explLiquidite,
        niveau: scoreLiquidite >= 75 ? 'élevé' : scoreLiquidite >= 50 ? 'moyen' : 'faible',
      },
      retraite: {
        value: Math.round(scoreRetraite),
        sousIndicateurs: [
          { label: 'Ratio revenus projetés / besoins', value: ratioRetraite, weight: ponderations.retraite.ratioRevenus },
        ],
        explication: explRetraite,
        niveau: scoreRetraite >= 75 ? 'élevé' : scoreRetraite >= 50 ? 'moyen' : 'faible',
      },
      protection: {
        value: Math.round(scoreProtection),
        sousIndicateurs: [
          { label: 'Couverture besoins familiaux', value: scoreProtection, weight: ponderations.protection.couvertureBesoins },
        ],
        explication: explProtection,
        niveau: scoreProtection >= 75 ? 'élevé' : scoreProtection >= 50 ? 'moyen' : 'faible',
      },
      transmission: {
        value: Math.round(scoreTransmission),
        sousIndicateurs: [
          { label: 'Potentiel fiscal succession', value: potentielFiscal, weight: ponderations.transmission.fiscalSuccession },
          { label: 'Risque conflits', value: risqueConflits, weight: ponderations.transmission.risqueConflits },
        ],
        explication: explTransmission,
        niveau: scoreTransmission >= 75 ? 'élevé' : scoreTransmission >= 50 ? 'moyen' : 'faible',
      },
    };
  }, [
    partImmobilier,
    partFinancier,
    tauxEndettement,
    pressionFiscale,
    ratioLiquidite,
    patrimoineNet,
    totalRevenus,
    impositionIR,
    impositionIFI,
    nombreAssuranceVie,
    ponderations,
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-300';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  const getNiveauBadge = (niveau: 'faible' | 'moyen' | 'élevé') => {
    if (niveau === 'élevé') return 'bg-green-100 text-green-800 border-green-300';
    if (niveau === 'moyen') return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Fonction helper pour garantir que les valeurs ne sont pas NaN
  const safeNumber = (value: number): number => {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  };

  const scoresList = [
    { key: 'diversification', label: 'Diversification', icon: PieChart, data: scoresDetails.diversification },
    { key: 'risque', label: 'Risque', icon: Shield, data: scoresDetails.risque },
    { key: 'fiscalite', label: 'Fiscalité', icon: DollarSign, data: scoresDetails.fiscalite },
    { key: 'liquidite', label: 'Liquidité', icon: Droplet, data: scoresDetails.liquidite },
    { key: 'retraite', label: 'Retraite', icon: Clock, data: scoresDetails.retraite },
    { key: 'protection', label: 'Protection', icon: Heart, data: scoresDetails.protection },
    { key: 'transmission', label: 'Transmission', icon: Gift, data: scoresDetails.transmission },
  ];

  return (
    <div className="space-y-6">
      {/* Bouton d'édition des pondérations */}
      <div className="flex justify-end">
        <button
          onClick={() => setEditingPonderations(!editingPonderations)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          {editingPonderations ? <><Save className="w-4 h-4" /> Sauvegarder</> : <><Edit2 className="w-4 h-4" /> Modifier pondérations</>}
        </button>
      </div>

      {/* Grille des scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scoresList.map(({ key, label, icon: Icon, data }) => (
          <div key={key} className={`border-2 rounded-xl p-5 ${getScoreColor(data.value)}`}>
            {/* En-tête du score */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6" />
                <div>
                  <h4 className="font-bold text-lg">{label}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getNiveauBadge(data.niveau)}`}>
                    {data.niveau.toUpperCase()}
                  </span>
                </div>
              </div>
              <span className="text-4xl font-bold">{data.value}</span>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full ${data.value >= 75 ? 'bg-green-500' : data.value >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${data.value}%` }}
              ></div>
            </div>

            {/* Explication */}
            <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-4">
              <p className="text-sm">{data.explication}</p>
            </div>

            {/* Sous-indicateurs */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Sous-indicateurs :</p>
              {data.sousIndicateurs.map((si, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span>{si.label}</span>
                  <div className="flex items-center gap-2">
                    {editingPonderations ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={safeNumber(si.weight)}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          setPonderations((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key as keyof typeof prev],
                              [si.label.toLowerCase().replace(/[^a-z]/g, '')]: newValue,
                            },
                          }));
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    ) : (
                      <span className="opacity-60">({safeNumber(si.weight).toFixed(2)})</span>
                    )}
                    <span className="font-semibold">{safeNumber(si.value).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}