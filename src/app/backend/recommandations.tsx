/**
 * 🎯 MODULE RECOMMANDATIONS INTELLIGENTES
 * 
 * Phase 4 : Génération automatique de recommandations patrimoniales
 * - Analyse situation client
 * - Scoring de pertinence (0-10)
 * - Simulations financières
 * - Priorisation automatique
 */

// ============================================
// TYPES
// ============================================

type CategorieRecommandation =
  | 'fiscalite'
  | 'patrimoine'
  | 'retraite'
  | 'transmission'
  | 'protection'
  | 'investissement'
  | 'optimisation';

interface SimulationFinanciere {
  gainFiscalAnnuel: number;
  gainFiscal10ans: number;
  gainFiscal20ans: number;
  gainFiscal30ans: number;
  
  coutMiseEnPlace: number;
  rentabiliteAnnuelle?: number;
  
  patrimoineActuel: number;
  patrimoine10ans: number;
  patrimoine20ans: number;
  patrimoine30ans: number;
  
  hypotheses: string[];
}

interface Recommandation {
  id: string;
  categorie: CategorieRecommandation;
  titre: string;
  description: string;
  
  // Pertinence
  scorePertinence: number; // 0-10
  priorite: 'immediate' | 'court_terme' | 'moyen_terme' | 'long_terme';
  
  // Conditions d'application
  conditionsRequises: string[];
  conditionsRemplies: boolean;
  
  // Avantages/Risques
  avantages: string[];
  risques: string[];
  inconvenients: string[];
  
  // Impact financier
  simulation?: SimulationFinanciere;
  
  // Métadonnées
  strategieId: string;
  dateGeneration: string;
}

interface RapportRecommandations {
  clientId: string;
  dateGeneration: string;
  
  // Statistiques
  totalRecommandations: number;
  recommandationsImmédiates: number;
  recommandationsCourtTerme: number;
  recommandationsMoyenTerme: number;
  recommandationsLongTerme: number;
  
  // Score global d'optimisation possible
  scoreOptimisation: number; // 0-100
  gainFiscalPotentielAnnuel: number;
  
  // Liste
  recommandations: Recommandation[];
}

// ============================================
// BASE DE CONNAISSANCES - STRATÉGIES
// ============================================

interface StrategiePatrimoniale {
  id: string;
  nom: string;
  categorie: CategorieRecommandation;
  description: string;
  
  // Conditions d'application
  verifierApplicabilite: (donnees: any) => {
    applicable: boolean;
    scorePertinence: number;
    conditionsRemplies: string[];
    conditionsNonRemplies: string[];
  };
  
  // Génération recommandation
  genererRecommandation: (donnees: any) => Recommandation;
}

const STRATEGIES: StrategiePatrimoniale[] = [
  // ===== FISCALITÉ =====
  {
    id: 'FISC-001',
    nom: 'Défiscalisation LMNP',
    categorie: 'fiscalite',
    description: 'Location Meublée Non Professionnelle pour optimiser revenus locatifs',
    
    verifierApplicabilite: (donnees) => {
      const revenus = donnees.revenus || 0;
      const tmi = donnees.tmi || 0;
      const revenusLocatifs = donnees.revenusLocatifs || 0;
      const immobilierLocatif = donnees.immobilierLocatif || 0;
      
      const applicable = (
        revenus > 50000 &&
        tmi >= 30 &&
        immobilierLocatif > 100000 &&
        revenusLocatifs < 23000
      );
      
      let score = 0;
      const remplies: string[] = [];
      const nonRemplies: string[] = [];
      
      if (revenus > 50000) {
        score += 2;
        remplies.push('Revenus suffisants (> 50k€)');
      } else {
        nonRemplies.push('Revenus insuffisants');
      }
      
      if (tmi >= 30) {
        score += 3;
        remplies.push(`TMI élevée (${tmi}%)`);
      } else {
        nonRemplies.push('TMI trop faible');
      }
      
      if (immobilierLocatif > 100000) {
        score += 3;
        remplies.push('Patrimoine immobilier locatif existant');
      } else {
        nonRemplies.push('Pas d\'immobilier locatif');
      }
      
      if (revenusLocatifs < 23000) {
        score += 2;
        remplies.push('Éligible au statut LMNP');
      } else {
        nonRemplies.push('Revenus locatifs trop élevés pour LMNP');
      }
      
      return {
        applicable,
        scorePertinence: score,
        conditionsRemplies: remplies,
        conditionsNonRemplies: nonRemplies,
      };
    },
    
    genererRecommandation: (donnees) => {
      const tmi = donnees.tmi || 0;
      const revenusLocatifs = donnees.revenusLocatifs || 0;
      const immobilierLocatif = donnees.immobilierLocatif || 0;
      
      const gainFiscalAnnuel = Math.floor(revenusLocatifs * (tmi / 100) * 0.7);
      
      return {
        id: `REC-FISC001-${Date.now()}`,
        categorie: 'fiscalite',
        titre: 'Passer en Location Meublée Non Professionnelle (LMNP)',
        description: `Transformer votre location nue en location meublée pour bénéficier du régime LMNP et amortir le bien.`,
        
        scorePertinence: 8,
        priorite: 'court_terme',
        
        conditionsRequises: [
          'Revenus locatifs < 23 000 €/an',
          'Bien immobilier locatif',
          'TMI ≥ 30%',
        ],
        conditionsRemplies: true,
        
        avantages: [
          'Amortissement du bien et des meubles',
          'Déduction des charges réelles',
          'Réduction d\'impôt significative',
          'Récupération de la TVA possible si meublé de tourisme',
        ],
        risques: [
          'Investissement initial en meubles (5-10k€)',
          'Rotation locataire potentiellement plus élevée',
          'Gestion administrative plus lourde',
        ],
        inconvenients: [
          'Nécessite ameublement du bien',
          'Comptabilité spécifique à tenir',
        ],
        
        simulation: {
          gainFiscalAnnuel,
          gainFiscal10ans: gainFiscalAnnuel * 10,
          gainFiscal20ans: gainFiscalAnnuel * 20,
          gainFiscal30ans: gainFiscalAnnuel * 30,
          
          coutMiseEnPlace: 7500,
          rentabiliteAnnuelle: ((gainFiscalAnnuel - 750) / 7500) * 100,
          
          patrimoineActuel: immobilierLocatif,
          patrimoine10ans: immobilierLocatif + gainFiscalAnnuel * 10,
          patrimoine20ans: immobilierLocatif + gainFiscalAnnuel * 20,
          patrimoine30ans: immobilierLocatif + gainFiscalAnnuel * 30,
          
          hypotheses: [
            `TMI maintenue à ${tmi}%`,
            'Revenus locatifs constants',
            'Amortissement sur 20 ans',
          ],
        },
        
        strategieId: 'FISC-001',
        dateGeneration: new Date().toISOString(),
      };
    },
  },
  
  {
    id: 'FISC-002',
    nom: 'Holding patrimoniale',
    categorie: 'fiscalite',
    description: 'Création d\'une société holding pour optimiser détention de titres',
    
    verifierApplicabilite: (donnees) => {
      const titresSociete = donnees.titresSociete || 0;
      const dividendes = donnees.dividendes || 0;
      const tmi = donnees.tmi || 0;
      
      const applicable = (
        titresSociete > 500000 &&
        dividendes > 30000 &&
        tmi >= 41
      );
      
      let score = 0;
      const remplies: string[] = [];
      const nonRemplies: string[] = [];
      
      if (titresSociete > 500000) {
        score += 4;
        remplies.push('Titres de société importants (> 500k€)');
      } else {
        nonRemplies.push('Montant de titres insuffisant');
      }
      
      if (dividendes > 30000) {
        score += 3;
        remplies.push('Dividendes significatifs (> 30k€)');
      } else {
        nonRemplies.push('Dividendes trop faibles');
      }
      
      if (tmi >= 41) {
        score += 3;
        remplies.push('TMI élevée justifiant optimisation');
      } else {
        nonRemplies.push('TMI insuffisante');
      }
      
      return {
        applicable,
        scorePertinence: score,
        conditionsRemplies: remplies,
        conditionsNonRemplies: nonRemplies,
      };
    },
    
    genererRecommandation: (donnees) => {
      const dividendes = donnees.dividendes || 0;
      const tmi = donnees.tmi || 0;
      
      const impositionDirecte = dividendes * 0.30;
      const impositionHolding = dividendes * 0.25;
      const gainFiscalAnnuel = Math.floor(impositionDirecte - impositionHolding);
      
      return {
        id: `REC-FISC002-${Date.now()}`,
        categorie: 'fiscalite',
        titre: 'Créer une Holding Patrimoniale',
        description: `Créer une société holding pour optimiser la perception et la réinvestissement des dividendes.`,
        
        scorePertinence: 9,
        priorite: 'moyen_terme',
        
        conditionsRequises: [
          'Titres de société > 500 000 €',
          'Dividendes annuels > 30 000 €',
          'TMI ≥ 41%',
        ],
        conditionsRemplies: true,
        
        avantages: [
          'Imposition des dividendes à l\'IS (25%) au lieu de la flat tax (30%)',
          'Régime mère-fille : exonération 95% des dividendes',
          'Réinvestissement sans fiscalité immédiate',
          'Optimisation transmission (Pacte Dutreil)',
          'Protection du patrimoine professionnel',
        ],
        risques: [
          'Coûts de création et gestion annuels',
          'Complexité juridique et comptable',
          'Risques de requalification fiscale si mal structuré',
        ],
        inconvenients: [
          'Nécessite accompagnement expert',
          'Frais de constitution (5-10k€)',
          'Comptabilité annuelle obligatoire',
        ],
        
        simulation: {
          gainFiscalAnnuel,
          gainFiscal10ans: gainFiscalAnnuel * 10,
          gainFiscal20ans: gainFiscalAnnuel * 20,
          gainFiscal30ans: gainFiscalAnnuel * 30,
          
          coutMiseEnPlace: 8000,
          rentabiliteAnnuelle: ((gainFiscalAnnuel - 2000) / 8000) * 100,
          
          patrimoineActuel: donnees.titresSociete || 0,
          patrimoine10ans: (donnees.titresSociete || 0) + gainFiscalAnnuel * 10,
          patrimoine20ans: (donnees.titresSociete || 0) + gainFiscalAnnuel * 20,
          patrimoine30ans: (donnees.titresSociete || 0) + gainFiscalAnnuel * 30,
          
          hypotheses: [
            'Dividendes constants',
            'TMI et IS maintenus',
            'Réinvestissement des gains fiscaux',
          ],
        },
        
        strategieId: 'FISC-002',
        dateGeneration: new Date().toISOString(),
      };
    },
  },
];

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

function extraireDonneesClient(clientData: any): any {
  const patrimoineData = clientData.patrimoineData || {};
  const revenus = clientData.revenus || [];
  const imposition = clientData.imposition || {};
  const familyInfo = clientData.familyInfo || {};
  
  const actifsFinanciers = (patrimoineData.actifsFinanciers || []).reduce(
    (sum: number, a: any) => sum + (a.value || 0),
    0
  );
  
  const immobilier = (patrimoineData.actifsImmobiliers || []).reduce(
    (sum: number, i: any) => sum + (i.value || 0),
    0
  );
  
  const passifs = (patrimoineData.passifs || []).reduce(
    (sum: number, p: any) => sum + (p.value || 0),
    0
  );
  
  const patrimoine = actifsFinanciers + immobilier - passifs;
  
  const liquidites = (patrimoineData.actifsFinanciers || [])
    .filter((a: any) => a.category === 'Comptes courants / Livrets')
    .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    
  const assuranceVie = (patrimoineData.actifsFinanciers || [])
    .filter((a: any) => a.category === 'Assurance-vie')
    .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    
  const titresSociete = (patrimoineData.actifsFinanciers || [])
    .filter((a: any) => a.category === 'Titres de société')
    .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
  
  const immobilierLocatif = (patrimoineData.actifsImmobiliers || [])
    .filter((i: any) => i.subCategory === 'Immobilier locatif')
    .reduce((sum: number, i: any) => sum + (i.value || 0), 0);
  
  const totalRevenus = revenus.reduce(
    (sum: number, r: any) => sum + (r.montantAnnuel || 0),
    0
  );
  
  const revenusPro = revenus
    .filter((r: any) => r.categorie?.includes('tns') || r.categorie?.includes('bnc') || r.categorie?.includes('bic'))
    .reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
    
  const revenusLocatifs = revenus
    .filter((r: any) => r.categorie === 'locatifs')
    .reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
    
  const dividendes = revenus
    .filter((r: any) => r.categorie === 'dividendes')
    .reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
  
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 50;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  
  const age = calculateAge(clientData.birthDate);
  const tmi = imposition.tmi || 0;
  const nbEnfants = familyInfo.nbEnfants || (clientData.children || []).length || 0;
  
  const epargneRetraite = (patrimoineData.actifsFinanciers || [])
    .filter((a: any) => a.category === 'PER / PERP / Madelin')
    .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
  
  return {
    patrimoine,
    actifsFinanciers,
    immobilier,
    immobilierLocatif,
    passifs,
    liquidites,
    assuranceVie,
    titresSociete,
    epargneRetraite,
    revenus: totalRevenus,
    revenusPro,
    revenusLocatifs,
    dividendes,
    tmi,
    impotRevenu: imposition.impotRevenu || 0,
    ifi: imposition.ifi || 0,
    age,
    nbEnfants,
  };
}

export function genererRecommandations(clientData: any): RapportRecommandations {
  
  const donnees = extraireDonneesClient(clientData);
  const recommandations: Recommandation[] = [];
  
  for (const strategie of STRATEGIES) {
    const applicabilite = strategie.verifierApplicabilite(donnees);
    
    if (applicabilite.applicable && applicabilite.scorePertinence >= 5) {
      const recommandation = strategie.genererRecommandation(donnees);
      recommandation.scorePertinence = applicabilite.scorePertinence;
      recommandations.push(recommandation);
      
    } else {
    }
  }
  
  recommandations.sort((a, b) => b.scorePertinence - a.scorePertinence);
  
  const stats = {
    immediate: recommandations.filter(r => r.priorite === 'immediate').length,
    courtTerme: recommandations.filter(r => r.priorite === 'court_terme').length,
    moyenTerme: recommandations.filter(r => r.priorite === 'moyen_terme').length,
    longTerme: recommandations.filter(r => r.priorite === 'long_terme').length,
  };
  
  const scoreOptimisation = recommandations.length > 0
    ? Math.min(100, (recommandations.reduce((sum, r) => sum + r.scorePertinence, 0) / recommandations.length) * 10)
    : 100;
  
  const gainFiscalPotentiel = recommandations.reduce(
    (sum, r) => sum + (r.simulation?.gainFiscalAnnuel || 0),
    0
  );
  
  
  return {
    clientId: clientData.id,
    dateGeneration: new Date().toISOString(),
    totalRecommandations: recommandations.length,
    recommandationsImmédiates: stats.immediate,
    recommandationsCourtTerme: stats.courtTerme,
    recommandationsMoyenTerme: stats.moyenTerme,
    recommandationsLongTerme: stats.longTerme,
    scoreOptimisation,
    gainFiscalPotentielAnnuel: gainFiscalPotentiel,
    recommandations,
  };
}
