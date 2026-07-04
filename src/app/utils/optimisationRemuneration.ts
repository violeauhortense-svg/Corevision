import type { 
  RegleFiscale,
  DonneesEntreprise,
  DonneesFoyer,
  ScenarioOptimisation,
  ResultatOptimisation
} from '../types/optimisation';

// Ré-exporter les types pour compatibilité
export type {
  DonneesEntreprise,
  DonneesFoyer,
  ScenarioOptimisation,
  ResultatOptimisation
} from '../types/optimisation';

/**
 * Calcule l'impôt sur le revenu selon le barème progressif
 */
function calculerIR(revenuImposable: number, nbParts: number): number {
  const quotientFamilial = revenuImposable / nbParts;
  
  // Barème 2024 (à ajuster selon l'année)
  const tranches = [
    { limite: 10777, taux: 0 },
    { limite: 27478, taux: 0.11 },
    { limite: 78570, taux: 0.30 },
    { limite: 168994, taux: 0.41 },
    { limite: Infinity, taux: 0.45 },
  ];

  let impot = 0;
  let revenuRestant = quotientFamilial;
  let limitePrecedente = 0;

  for (const tranche of tranches) {
    if (revenuRestant <= 0) break;
    
    const montantTranche = Math.min(revenuRestant, tranche.limite - limitePrecedente);
    impot += montantTranche * tranche.taux;
    revenuRestant -= montantTranche;
    limitePrecedente = tranche.limite;
  }

  return impot * nbParts;
}

/**
 * Calcule le plafond de dividendes exonérés de cotisations TNS
 */
function calculerPlafondDividendesTNS(
  capital: number,
  compteCourant: number,
  primes: number
): number {
  return (capital + compteCourant + primes) * 0.10;
}

/**
 * Calcule un scénario de rémunération/dividendes
 */
function calculerScenario(
  remuneration: number,
  entreprise: DonneesEntreprise,
  foyer: DonneesFoyer,
  regle: RegleFiscale
): ScenarioOptimisation {
  const details: string[] = [];
  
  // 1. Charges sociales sur la rémunération
  const chargesSociales = remuneration * (regle.cotisationsSociales / 100);
  details.push(`Rémunération brute: ${formatEuro(remuneration)}`);
  details.push(`Charges sociales (${regle.cotisationsSociales}%): ${formatEuro(chargesSociales)}`);
  
  // 2. Résultat après rémunération et charges
  const resultatApresRemuneration = entreprise.resultatAvantRemuneration - remuneration - chargesSociales;
  details.push(`Résultat après rémunération: ${formatEuro(resultatApresRemuneration)}`);
  
  // 3. IS (si applicable)
  let is = 0;
  let resultatNet = resultatApresRemuneration;
  
  if (regle.regimeIS && entreprise.regimeFiscal === 'IS') {
    // Taux réduit jusqu'à 42 500 €
    const partieIS15 = Math.min(resultatApresRemuneration, 42500);
    const partieIS25 = Math.max(0, resultatApresRemuneration - 42500);
    is = (partieIS15 * regle.tauxIS15 / 100) + (partieIS25 * regle.tauxIS25 / 100);
    resultatNet = resultatApresRemuneration - is;
    details.push(`IS (${regle.tauxIS15}% + ${regle.tauxIS25}%): ${formatEuro(is)}`);
  }
  
  // 4. Dividendes disponibles
  const dividendes = Math.max(0, resultatNet);
  details.push(`Dividendes disponibles: ${formatEuro(dividendes)}`);
  
  // 5. Cotisations TNS sur dividendes (si applicable)
  let cotisationsTNSDividendes = 0;
  if (regle.plafondDividendesTNS) {
    const plafond = calculerPlafondDividendesTNS(
      entreprise.capital || 0,
      entreprise.compteCourant || 0,
      entreprise.primes || 0
    );
    const dividendesSoumis = Math.max(0, dividendes - plafond);
    cotisationsTNSDividendes = dividendesSoumis * (regle.cotisationsSociales / 100);
    
    if (dividendesSoumis > 0) {
      details.push(`Dividendes au-delà du plafond (${formatEuro(plafond)}): ${formatEuro(dividendesSoumis)}`);
      details.push(`Cotisations TNS sur dividendes: ${formatEuro(cotisationsTNSDividendes)}`);
    }
  }
  
  // 6. PFU sur dividendes (si applicable)
  let pfu = 0;
  if (regle.pfuApplicable && dividendes > 0) {
    pfu = dividendes * (regle.tauxPFU / 100);
    details.push(`PFU sur dividendes (${regle.tauxPFU}%): ${formatEuro(pfu)}`);
  }
  
  // 7. Revenu net du foyer
  let revenuNetFoyer = 0;
  
  if (entreprise.regimeFiscal === 'IS') {
    // En IS: rémunération nette + dividendes nets
    const remunerationNette = remuneration - chargesSociales;
    const dividendesNets = dividendes - cotisationsTNSDividendes - pfu;
    
    // IR sur la rémunération
    const revenuImposable = remuneration + foyer.autresRevenus;
    const ir = calculerIR(revenuImposable, foyer.nbParts);
    
    revenuNetFoyer = remunerationNette + dividendesNets - ir + foyer.autresRevenus;
    details.push(`IR sur rémunération: ${formatEuro(ir)}`);
  } else {
    // En IR: tout le résultat est imposable
    const revenuImposable = entreprise.resultatAvantRemuneration + foyer.autresRevenus;
    const ir = calculerIR(revenuImposable, foyer.nbParts);
    revenuNetFoyer = entreprise.resultatAvantRemuneration - chargesSociales - ir;
    details.push(`IR sur résultat total: ${formatEuro(ir)}`);
  }
  
  details.push(`Revenu net du foyer: ${formatEuro(revenuNetFoyer)}`);
  
  // 8. Taux de prélèvement global
  const prelevementsTotal = chargesSociales + is + pfu + cotisationsTNSDividendes;
  const tauxPrelevementGlobal = entreprise.resultatAvantRemuneration > 0
    ? (prelevementsTotal / entreprise.resultatAvantRemuneration) * 100
    : 0;
  
  return {
    remuneration,
    dividendes,
    chargesSociales,
    is,
    pfu,
    cotisationsTNSDividendes,
    revenuNetFoyer,
    tauxPrelevementGlobal,
    details,
  };
}

/**
 * Optimise la répartition rémunération/dividendes
 */
export function optimiserRemuneration(
  entreprise: DonneesEntreprise,
  foyer: DonneesFoyer,
  regle: RegleFiscale
): ResultatOptimisation {
  const scenarios: ScenarioOptimisation[] = [];
  const recommandations: string[] = [];
  
  // Générer plusieurs scénarios
  const step = Math.max(5000, Math.floor(entreprise.resultatAvantRemuneration / 20));
  
  for (let remuneration = 0; remuneration <= entreprise.resultatAvantRemuneration; remuneration += step) {
    const scenario = calculerScenario(remuneration, entreprise, foyer, regle);
    scenarios.push(scenario);
  }
  
  // Scénario 100% rémunération
  scenarios.push(calculerScenario(entreprise.resultatAvantRemuneration, entreprise, foyer, regle));
  
  // Trouver le scénario optimal (revenu net maximal)
  const scenarioOptimal = scenarios.reduce((best, current) =>
    current.revenuNetFoyer > best.revenuNetFoyer ? current : best
  );
  
  // Générer des recommandations
  if (scenarioOptimal.remuneration === 0) {
    recommandations.push('💡 Privilégier les dividendes : pas de rémunération recommandée');
    recommandations.push('✅ Permet de minimiser les cotisations sociales');
  } else if (scenarioOptimal.remuneration === entreprise.resultatAvantRemuneration) {
    recommandations.push('💡 Privilégier la rémunération : 100% en salaire/gérance');
    recommandations.push('✅ Permet de cotiser pour la retraite et la protection sociale');
  } else {
    recommandations.push('💡 Stratégie mixte recommandée');
    recommandations.push(`✅ Rémunération optimale : ${formatEuro(scenarioOptimal.remuneration)}`);
    recommandations.push(`✅ Dividendes optimaux : ${formatEuro(scenarioOptimal.dividendes)}`);
  }
  
  // Recommandations spécifiques selon le régime
  if (regle.plafondDividendesTNS && scenarioOptimal.cotisationsTNSDividendes > 0) {
    recommandations.push('⚠️ Attention : une partie des dividendes est soumise aux cotisations TNS');
    recommandations.push('Envisager d\'augmenter la rémunération ou de capitaliser dans l\'entreprise');
  }
  
  if (scenarioOptimal.tauxPrelevementGlobal > 50) {
    recommandations.push('⚠️ Taux de prélèvement global élevé (> 50%)');
    recommandations.push('Envisager des optimisations fiscales complémentaires');
  }
  
  return {
    scenarioOptimal,
    scenariosCompares: scenarios.sort((a, b) => b.revenuNetFoyer - a.revenuNetFoyer).slice(0, 5),
    recommandations,
  };
}

function formatEuro(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(montant);
}