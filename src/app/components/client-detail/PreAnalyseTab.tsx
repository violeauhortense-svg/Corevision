import { useState, useMemo } from 'react';
import { PieChart } from 'lucide-react';
import type { PatrimoineItem, RevenuItem, ImpositionData } from './types';
import { ScoringDetaille } from './ScoringDetaille';
import { calculerPrelevementsSociaux, type RevenuFiscal } from '../../services/fiscalCalculatorDynamic';

// Import des modules
import { ProfilsClient } from './pre-analyse/ProfilsClient';
import { CalculsPatrimoniaux } from './pre-analyse/CalculsPatrimoniaux';
import { ProblemesDetectes } from './pre-analyse/ProblemesDetectes';
// 🔥 SUPPRIMÉ : SimulationsProjections (selon consigne 3.4)
// import { SimulationsProjections } from './pre-analyse/SimulationsProjections';
import { PyramidePatrimonialeNew } from './pre-analyse/PyramidePatrimonialeNew'; // 🆕 Nouvelle pyramide
import { CapaciteEpargne } from './pre-analyse/CapaciteEpargne';
import { RecommandationsCategories } from './pre-analyse/RecommandationsCategories'; // 🆕 Recommandations catégorisées
import { formatEuro } from './pre-analyse/utils';
import type {
  PreAnalyseTabProps,
  Profil,
  Score,
  Probleme,
  CalculsPatrimoniauxData,
  SimulationParams,
  Simulation,
} from './pre-analyse/types';

export function PreAnalyseTab({
  clientId,
  clientName,
  actifsFinanciers,
  immobilier,
  passifs,
  revenus,
  impositionData,
  onUpdate
}: PreAnalyseTabProps) {
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    inflation: 2,
    rendementImmobilier: 3,
    rendementFinancier: 5,
    croissanceRevenus: 2,
    tauxImposition: parseFloat(impositionData.tmi || '30'),
  });

  // ===== CALCULS PATRIMONIAUX =====
  const calculs = useMemo((): CalculsPatrimoniauxData => {
    // Protection contre les valeurs non-tableaux
    const actifsFinanciersArray = Array.isArray(actifsFinanciers) ? actifsFinanciers : [];
    const immobilierArray = Array.isArray(immobilier) ? immobilier : [];
    const passifsArray = Array.isArray(passifs) ? passifs : [];
    const revenusArray = Array.isArray(revenus) ? revenus : [];
    
    const totalActifsFinanciers = actifsFinanciersArray.reduce((sum, a) => sum + (a.value || 0), 0);
    const totalImmobilier = immobilierArray.reduce((sum, i) => sum + (i.value || 0), 0);
    const totalPassifs = passifsArray.reduce((sum, p) => sum + (p.value || 0), 0);
    const patrimoineNet = totalActifsFinanciers + totalImmobilier - totalPassifs;
    const patrimoineTotal = totalActifsFinanciers + totalImmobilier;

    // 💰 TOTAL REVENUS : Utiliser UNIQUEMENT impositionData (source de vérité fiscale)
    // ⚠️ Ne PAS utiliser revenusArray pour éviter les doublons
    const totalRevenus = 
      (impositionData.traitementsSalairesPensions || 0)
      + (impositionData.revenusTNS || 0) 
      + (impositionData.revenusFonciers || 0)
      + (impositionData.locationsMeublesNonPro || 0)
      + (impositionData.reveusValeursCapitauxMobiliers || 0)
      + (impositionData.plusValueMobiliere || 0);
    
    // 💸 CALCUL PRÉLÈVEMENTS SOCIAUX (17,2% sur revenus du patrimoine)
    let prelevementsSociaux = 0;
    try {
      const revenusFiscal: RevenuFiscal = {
        revenusFonciers: impositionData.revenusFonciers || 0,
        revenus: {
          interetsTaxables: impositionData.reveusValeursCapitauxMobiliers || 0,
          dividendes: 0,
          autresRevenus: 0,
        },
        plusValueMobiliere: impositionData.plusValueMobiliere || 0,
      };
      
      const calculPS = calculerPrelevementsSociaux(revenusFiscal);
      prelevementsSociaux = calculPS?.total || 0;
    } catch (error) {
      console.error('⚠️ Erreur calcul PS dans PreAnalyse:', error);
      // Calcul de secours : 17,2% sur revenus du patrimoine
      prelevementsSociaux = ((impositionData.revenusFonciers || 0) + 
                            (impositionData.reveusValeursCapitauxMobiliers || 0) + 
                            (impositionData.plusValueMobiliere || 0)) * 0.172;
    }
    
    // 💰 TOTAL IMPÔTS : IR + PS + IFI
    const impotTotal = (impositionData.impotRevenu || 0) + prelevementsSociaux + (impositionData.ifi || 0);
    
    const chargesAnnuelles = passifsArray.reduce((sum, p) => sum + ((p.value || 0) * 0.04), 0); // Estimation 4%

    const calculsData: CalculsPatrimoniauxData = {
      patrimoineNet,
      patrimoineTotal,
      totalActifsFinanciers,
      totalImmobilier,
      totalPassifs,
      totalRevenus,
      chargesAnnuelles,
      tauxEndettement: patrimoineTotal > 0 ? (totalPassifs / patrimoineTotal) * 100 : 0,
      partImmobilier: patrimoineTotal > 0 ? (totalImmobilier / patrimoineTotal) * 100 : 0,
      partFinancier: patrimoineTotal > 0 ? (totalActifsFinanciers / patrimoineTotal) * 100 : 0,
      liquidite: totalActifsFinanciers,
      impotTotal,
      prelevementsSociaux,
      pressionFiscale: totalRevenus > 0 ? (impotTotal / totalRevenus) * 100 : 0,
      rendementGlobal: patrimoineNet > 0 ? (totalRevenus / patrimoineNet) * 100 : 0,
    };
    
    // 🔍 Log pour debug imposition et revenus
    console.log('📊 PreAnalyse - Calculs détaillés:', {
      revenus: {
        traitementsSalaires: impositionData.traitementsSalairesPensions,
        revenusTNS: impositionData.revenusTNS,
        revenusFonciers: impositionData.revenusFonciers,
        locationsMeubles: impositionData.locationsMeublesNonPro,
        RVCM: impositionData.reveusValeursCapitauxMobiliers,
        plusValues: impositionData.plusValueMobiliere,
        totalRevenus,
      },
      imposition: {
        impotRevenu: impositionData.impotRevenu,
        prelevementsSociaux,
        ifi: impositionData.ifi,
        impotTotal,
        pressionFiscale: totalRevenus > 0 ? (impotTotal / totalRevenus) * 100 : 0,
      }
    });
    
    return calculsData;
  }, [actifsFinanciers, immobilier, passifs, revenus, impositionData]);

  // ===== CALCULS POUR PYRAMIDE PATRIMONIALE =====
  const pyramideData = useMemo(() => {
    const actifsFinanciersArray = Array.isArray(actifsFinanciers) ? actifsFinanciers : [];
    
    // Liquidités : livrets, comptes courants, fonds euros
    const liquidites = actifsFinanciersArray
      .filter(a => ['livret', 'compte-courant'].includes(a.category) || 
                   (a.category === 'assurance-vie' && a.name?.toLowerCase().includes('fonds euro')))
      .reduce((sum, a) => sum + (a.value || 0), 0);
    
    // Revenus : obligations, SCPI, immobilier locatif
    const revenusPatrimoine = actifsFinanciersArray
      .filter(a => ['obligation', 'scpi'].includes(a.category))
      .reduce((sum, a) => sum + (a.value || 0), 0) +
      (Array.isArray(immobilier) ? immobilier : [])
        .filter(i => i.locataire && i.locataire !== 'Non loué')
        .reduce((sum, i) => sum + (i.value || 0), 0);
    
    // Croissance : actions, immobilier non loué, PEA, etc.
    const croissance = actifsFinanciersArray
      .filter(a => ['action', 'pea', 'pee', 'crypto'].includes(a.category))
      .reduce((sum, a) => sum + (a.value || 0), 0) +
      (Array.isArray(immobilier) ? immobilier : [])
        .filter(i => !i.locataire || i.locataire === 'Non loué')
        .reduce((sum, i) => sum + (i.value || 0), 0);
    
    // Transmission : assurance-vie (hors fonds euros), démembrement
    const transmission = actifsFinanciersArray
      .filter(a => a.category === 'assurance-vie' && !a.name?.toLowerCase().includes('fonds euro'))
      .reduce((sum, a) => sum + (a.value || 0), 0);
    
    return {
      liquidites,
      revenusPatrimoine,
      croissance,
      transmission,
    };
  }, [actifsFinanciers, immobilier]);

  // ===== PROFILS =====
  const profils = useMemo((): Profil => {
    const { pressionFiscale, patrimoineNet, partImmobilier } = calculs;
    
    // Profil fiscal
    let profilFiscal = 'Optimisé';
    if (pressionFiscale > 40) profilFiscal = 'Très lourdement fiscalisé';
    else if (pressionFiscale > 30) profilFiscal = 'Lourdement fiscalisé';
    else if (pressionFiscale > 20) profilFiscal = 'Moyennement fiscalisé';
    else if (pressionFiscale > 10) profilFiscal = 'Faiblement fiscalisé';

    // Profil patrimonial
    let profilPatrimonial = 'Patrimoine moyen';
    if (patrimoineNet > 5000000) profilPatrimonial = 'Très haut patrimoine (>5M€)';
    else if (patrimoineNet > 2000000) profilPatrimonial = 'Haut patrimoine (2-5M€)';
    else if (patrimoineNet > 500000) profilPatrimonial = 'Patrimoine important (500k-2M€)';
    else if (patrimoineNet > 100000) profilPatrimonial = 'Patrimoine en développement';

    // Profil risque
    let profilRisque = 'Modéré';
    if (partImmobilier > 80) profilRisque = 'Concentré sur immobilier';
    else if (partImmobilier > 60) profilRisque = 'Orientation immobilière forte';
    else if (partImmobilier < 30) profilRisque = 'Orientation financière';
    
    return {
      fiscal: profilFiscal,
      patrimonial: profilPatrimonial,
      risque: profilRisque,
    };
  }, [calculs]);

  // ===== SCORES =====
  const scores = useMemo((): Score => {
    const { partImmobilier, partFinancier, tauxEndettement, pressionFiscale, liquidite, patrimoineNet } = calculs;

    // Diversification (0-100)
    let diversification = 100;
    if (partImmobilier > 80 || partFinancier > 80) diversification = 30;
    else if (partImmobilier > 70 || partFinancier > 70) diversification = 50;
    else if (partImmobilier > 60 || partFinancier > 60) diversification = 70;
    else diversification = 90;

    // Risque (0-100, plus c'est élevé, plus c'est risqué)
    let risque = 50;
    if (tauxEndettement > 50) risque = 90;
    else if (tauxEndettement > 30) risque = 70;
    else if (tauxEndettement > 20) risque = 50;
    else risque = 30;

    // Fiscalité (0-100, 100 = optimisé)
    let fiscalite = 100;
    if (pressionFiscale > 40) fiscalite = 20;
    else if (pressionFiscale > 30) fiscalite = 40;
    else if (pressionFiscale > 20) fiscalite = 60;
    else if (pressionFiscale > 10) fiscalite = 80;

    // Liquidité (0-100)
    const ratioLiquidite = patrimoineNet > 0 ? (liquidite / patrimoineNet) * 100 : 0;
    let liquiditeScore = 50;
    if (ratioLiquidite > 50) liquiditeScore = 90;
    else if (ratioLiquidite > 30) liquiditeScore = 70;
    else if (ratioLiquidite > 20) liquiditeScore = 50;
    else liquiditeScore = 30;

    // Retraite (simulation simple)
    const ageEstime = 45; // À améliorer avec vraie date de naissance
    const retraite = ageEstime < 50 ? 70 : ageEstime < 60 ? 50 : 30;

    // Protection familiale (basé sur diversification et liquidité)
    const protection = Math.round((diversification + liquiditeScore) / 2);

    // Transmission (basé sur patrimoine et fiscalité)
    const transmission = Math.round((fiscalite + diversification) / 2);

    return {
      diversification,
      risque,
      fiscalite,
      liquidite: liquiditeScore,
      retraite,
      protection,
      transmission,
    };
  }, [calculs]);

  // ===== PROBLÈMES DÉTECTÉS =====
  const problemes = useMemo((): Probleme[] => {
    const problems: Probleme[] = [];
    const { partImmobilier, tauxEndettement, pressionFiscale, liquidite, patrimoineNet } = calculs;

    if (partImmobilier > 70) {
      problems.push({
        id: 'immo-excess',
        titre: 'Patrimoine trop immobilier',
        description: `${partImmobilier.toFixed(0)}% du patrimoine en immobilier. Risque de concentration et manque de liquidité.`,
        severite: partImmobilier > 85 ? 'high' : 'medium',
        impact: 'Diversification insuffisante, difficulté à mobiliser des liquidités rapidement',
      });
    }

    const ratioLiquidite = patrimoineNet > 0 ? (liquidite / patrimoineNet) * 100 : 0;
    if (ratioLiquidite < 20) {
      problems.push({
        id: 'low-liquidity',
        titre: 'Manque de liquidité',
        description: `Seulement ${ratioLiquidite.toFixed(0)}% d'actifs liquides. Recommandé : 20-30%.`,
        severite: ratioLiquidite < 10 ? 'high' : 'medium',
        impact: 'Incapacité à faire face à un imprévu ou une opportunité',
      });
    }

    if (pressionFiscale > 30) {
      problems.push({
        id: 'high-tax',
        titre: 'Fiscalité excessive',
        description: `Pression fiscale de ${pressionFiscale.toFixed(1)}%. Opportunités d'optimisation à étudier.`,
        severite: pressionFiscale > 40 ? 'high' : 'medium',
        impact: 'Érosion du capital et des revenus, diminution de la performance nette',
      });
    }

    if (tauxEndettement > 40) {
      problems.push({
        id: 'high-debt',
        titre: 'Endettement élevé',
        description: `Taux d'endettement de ${tauxEndettement.toFixed(0)}%. Risque en cas de hausse des taux.`,
        severite: tauxEndettement > 50 ? 'high' : 'medium',
        impact: 'Vulnérabilité aux variations de taux, charges importantes',
      });
    }

    if (actifsFinanciers.filter(a => a.category === 'assurance-vie').length === 0) {
      problems.push({
        id: 'no-insurance',
        titre: 'Absence de prévoyance structurée',
        description: 'Aucune assurance-vie détectée. Optimisation fiscale et transmission à prévoir.',
        severite: 'medium',
        impact: 'Pas d\'enveloppe fiscale avantageuse, transmission non optimisée',
      });
    }

    if (patrimoineNet > 500000 && scores.transmission < 50) {
      problems.push({
        id: 'no-transmission',
        titre: 'Transmission non préparée',
        description: 'Patrimoine important sans stratégie de transmission visible.',
        severite: patrimoineNet > 2000000 ? 'high' : 'medium',
        impact: 'Droits de succession élevés, conflits familiaux potentiels',
      });
    }

    if (scores.diversification < 50) {
      problems.push({
        id: 'poor-allocation',
        titre: 'Allocation inefficiente',
        description: 'Répartition déséquilibrée entre les classes d\'actifs.',
        severite: 'medium',
        impact: 'Rendement/risque non optimal, exposition à des chocs spécifiques',
      });
    }

    return problems;
  }, [calculs, scores, actifsFinanciers]);

  // ===== SIMULATIONS =====
  const simulations = useMemo((): Simulation[] => {
    const { patrimoineNet, totalRevenus } = calculs;
    const { inflation, rendementImmobilier, rendementFinancier, croissanceRevenus, tauxImposition } = simulationParams;

    const projections = [10, 20, 30].map(annees => {
      // Retraite
      const capitalRetraiteEstime = patrimoineNet * Math.pow(1 + (rendementFinancier - inflation) / 100, annees);
      const rente4Pourcent = capitalRetraiteEstime * 0.04;

      // Succession
      const patrimoineFutur = patrimoineNet * Math.pow(1 + (rendementFinancier - inflation) / 100, annees);
      const droitsSuccession = patrimoineFutur > 100000 ? patrimoineFutur * 0.20 : patrimoineFutur * 0.05; // Estimation simplifiée

      // Fiscalité
      const revenusFutur = totalRevenus * Math.pow(1 + croissanceRevenus / 100, annees);
      const impotsFutur = revenusFutur * (tauxImposition / 100);
      const impotsCumules = impotsFutur * annees;

      // Performance
      const rendementMoyen = (rendementImmobilier * (calculs.partImmobilier / 100)) + 
                             (rendementFinancier * (calculs.partFinancier / 100));
      const patrimoineAvecRendement = patrimoineNet * Math.pow(1 + rendementMoyen / 100, annees);
      const gainBrut = patrimoineAvecRendement - patrimoineNet;
      const gainNet = gainBrut - (gainBrut * tauxImposition / 100);

      return {
        annees,
        retraite: {
          capital: capitalRetraiteEstime,
          rente: rente4Pourcent,
        },
        succession: {
          patrimoine: patrimoineFutur,
          droits: droitsSuccession,
          netTransmis: patrimoineFutur - droitsSuccession,
        },
        fiscalite: {
          impotAnnuel: impotsFutur,
          impotCumule: impotsCumules,
        },
        performance: {
          patrimoineAvecRendement,
          gainBrut,
          gainNet,
          rendementMoyen,
        },
      };
    });

    return projections;
  }, [calculs, simulationParams]);

  const ratioLiquidite = calculs.patrimoineNet > 0
    ? (calculs.liquidite / calculs.patrimoineNet) * 100
    : 0;

  return (
    <div className="space-y-6">

      {/* ── En-tête ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Pré-analyse Patrimoniale</h2>
            <p className="text-blue-100 text-sm">Analyse complète et scoring automatique — {clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-200 uppercase tracking-wide mb-1">Patrimoine net</p>
            <p className="text-3xl font-bold">{formatEuro(calculs.patrimoineNet)}</p>
          </div>
        </div>
      </div>

      {/* ── 1. Profils client ───────────────────────────────────────── */}
      <ProfilsClient profils={profils} />

      {/* ── 2. Calculs patrimoniaux ─────────────────────────────────── */}
      <CalculsPatrimoniaux calculs={calculs} impositionData={impositionData} />

      {/* ── 3. Scoring détaillé ─────────────────────────────────────── */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-indigo-600" />
          3️⃣ Indicateurs &amp; Scoring
        </h3>
        <ScoringDetaille
          partImmobilier={calculs.partImmobilier}
          partFinancier={calculs.partFinancier}
          tauxEndettement={calculs.tauxEndettement}
          pressionFiscale={calculs.pressionFiscale}
          ratioLiquidite={ratioLiquidite}
          patrimoineNet={calculs.patrimoineNet}
          totalRevenus={calculs.totalRevenus}
          impositionIR={impositionData.impotRevenu}
          impositionIFI={impositionData.ifi}
          nombreAssuranceVie={actifsFinanciers.filter(a => a.category === 'assurance-vie').length}
        />
      </div>

      {/* ── 4. Capacité d'épargne ───────────────────────────────────── */}
      <CapaciteEpargne
        totalRevenus={calculs.totalRevenus}
        impotTotal={calculs.impotTotal}
        chargesAnnuelles={calculs.chargesAnnuelles}
        typeClient="particulier"
      />

      {/* ── 5. Pyramide patrimoniale ────────────────────────────────── */}
      <PyramidePatrimonialeNew
        actifsFinanciers={actifsFinanciers}
        immobilier={immobilier}
        patrimoineTotal={calculs.patrimoineTotal}
        revenusAnnuels={calculs.totalRevenus}
      />

      {/* ── 6. Points de vigilance ──────────────────────────────────── */}
      <ProblemesDetectes problemes={problemes} />

      {/* ── 7. Recommandations ──────────────────────────────────────── */}
      <RecommandationsCategories
        problemes={problemes}
        patrimoineNet={calculs.patrimoineNet}
        pressionFiscale={calculs.pressionFiscale}
        tauxEndettement={calculs.tauxEndettement}
        ratioLiquidite={ratioLiquidite}
        partImmobilier={calculs.partImmobilier}
        partFinancier={calculs.partFinancier}
      />

    </div>
  );
}