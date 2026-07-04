import * as kv from './kv_store.tsx';
import * as reglesFiscalesDB from './regles_fiscales_db.tsx';
import * as montagesPatrimoniaux from './montages_patrimoniaux.tsx';
import * as moteurPatrimonialIA from './moteur_patrimonial_ia.tsx';
import * as indexIA from './index_ia.tsx';
import * as simulateurPatrimonial from './simulateur_patrimonial.tsx';
import { genererRapportStructure, type RapportStructure } from './rapport_structure.tsx';
import { analyseAvancee7Etapes } from './ia_analyse_avancee.tsx';

/**
 * ============================================
 * MODULE AUDIT PATRIMONIAL AUTOMATIQUE
 * ============================================
 * 
 * Génération automatique d'audits patrimoniaux complets
 * Architecture complète :
 * 
 * Sources → Collecteur → Parser → Extracteur → Base
 *                                                ↓
 *                                           Index IA
 *                                                ↓
 *                                          Moteur IA
 *                                                ↓
 *                                          Simulateur
 *                                                ↓
 *                                       Audit CoreVision
 * 
 * Connexions :
 * - Règles fiscales (110 règles)
 * - Montages patrimoniaux (60 montages)
 * - Moteur IA (recommandations intelligentes)
 * - Index IA (recherche sémantique)
 * - Simulateur (projections financières)
 */

// ============================================
// TYPES
// ============================================

export interface DonneesClient {
  // Foyer
  regime_matrimonial?: string;
  nombre_enfants?: number;
  age_client?: number;
  age_conjoint?: number;
  situation_familiale?: string;
  
  // Revenus
  revenus_salaires?: number;
  revenus_dividendes?: number;
  revenus_fonciers?: number;
  revenus_autres?: number;
  tmi?: number; // Tranche marginale d'imposition
  impot_revenu?: number; // 🔥 NOUVEAU - IR calculé depuis l'onglet Revenus
  prelevements_sociaux?: number; // 🔥 NOUVEAU - PS calculés depuis l'onglet Revenus
  ifi?: number; // 🔥 NOUVEAU - IFI calculé depuis l'onglet Revenus
  nombre_parts?: number; // 🔥 NOUVEAU - Nombre de parts fiscales
  
  // Patrimoine
  immobilier_pp?: number;
  immobilier_locatif?: number;
  immobilier_secondaire?: number; // 🔥 NOUVEAU
  sci?: number; // 🔥 NOUVEAU
  scpi?: number; // 🔥 NOUVEAU
  liquidites?: number;
  assurance_vie?: number;
  per?: number; // 🔥 NOUVEAU
  titres_societe?: number;
  portefeuille_financier?: number;
  passifs?: number; // 🔥 NOUVEAU - Total des dettes
  patrimoine_net?: number; // 🔥 NOUVEAU - Actifs - Passifs
  
  // Objectifs
  objectifs?: string[];
  horizon?: number; // en années
  
  // Statut professionnel
  statut?: string; // Salarié, TNS, Dirigeant, etc.
  societe?: string;
  participation_societe?: number; // en %
}

export interface AnalyseCivile {
  regime_matrimonial_analyse: string;
  protection_conjoint: {
    niveau: 'faible' | 'moyen' | 'fort';
    recommandations: string[];
  };
  organisation_successorale: {
    analyse: string;
    risques: string[];
    optimisations: string[];
  };
  risques_indivision: string[];
  score: number; // sur 10
}

export interface AnalyseFiscale {
  fiscalite_revenus: {
    ir_estime: number;
    ps_estimees: number;
    taux_global: number;
    analyse: string;
  };
  fiscalite_patrimoine: {
    ifi_estime: number;
    assujetti: boolean;
    analyse: string;
  };
  optimisations_possibles: {
    type: string;
    gain_estime: number;
    description: string;
    regle_fiscale?: string;
  }[];
  risques_fiscaux: string[];
  score: number; // sur 10
}

export interface AnalyseSociale {
  statut_social: string;
  cotisations_estimees: number;
  protection_sociale: {
    niveau: 'faible' | 'moyen' | 'fort';
    maladie: boolean;
    retraite_base: number;
    retraite_complementaire: number;
    prevoyance: boolean;
  };
  optimisation_remuneration?: {
    actuel: { salaire: number; dividendes: number; total_charges: number };
    optimise: { salaire: number; dividendes: number; total_charges: number };
    gain_annuel: number;
  };
  score: number; // sur 10
}

export interface AnalysePatrimonialeGlobale {
  patrimoine_total: number;
  repartition: {
    immobilier_pp_pct: number;
    immobilier_locatif_pct: number;
    liquidites_pct: number;
    assurance_vie_pct: number;
    titres_societe_pct: number;
    portefeuille_financier_pct: number;
  };
  diversification: {
    score: number; // sur 10
    analyse: string;
    recommandations: string[];
  };
  liquidite: {
    montant: number;
    ratio: number; // % du patrimoine
    analyse: string;
  };
  horizon_patrimonial: string;
  score: number; // sur 10
}

export interface StrategiePatrimoniale {
  montage_id: string;
  nom: string;
  pertinence: number; // score sur 10
  objectif: string;
  conditions: string;
  avantages: string;
  risques: string;
  fiscalite: string;
  etapes: string;
  simulation?: {
    gain_fiscal_annuel: number;
    cout_mise_en_place: number;
    duree_amortissement: number; // en mois
    gain_sur_10ans: number;
  };
}

export interface AuditPatrimonial {
  id: string;
  client_id: string;
  commande_id?: string;
  date_creation: string;
  date_modification: string;
  statut: 'brouillon' | 'valide' | 'envoye';
  
  // Données collectées
  donnees_client: DonneesClient;
  
  // Analyses
  analyse_civile: AnalyseCivile;
  analyse_fiscale: AnalyseFiscale;
  analyse_sociale: AnalyseSociale;
  analyse_patrimoniale: AnalysePatrimonialeGlobale;
  
  // Stratégies
  strategies_proposees: StrategiePatrimoniale[];
  
  // Préconisations finales
  preconisations: string[];
  
  // Score global
  score_global: number; // sur 10
  
  // 🔥 NOUVEAU : Rapport structuré en 7 sections
  rapport_structure?: RapportStructure;
}

// ============================================
// 1️⃣ COLLECTE DES DONNÉES CLIENT
// ============================================

export async function collecterDonneesClient(clientId: string, clientDataFromFrontend?: any): Promise<DonneesClient | null> {
  console.log(`📊 Collecte des données client: ${clientId}`);
  
  try {
    let client = clientDataFromFrontend;
    
    // Si pas de données fournies, essayer de les récupérer du KV store
    if (!client) {
      console.log('🔍 Recherche du client dans le KV store...');
      const allClients = await kv.getByPrefix('client:');
      console.log(`📋 ${allClients.length} clients trouvés dans le KV store`);
      
      client = allClients.find((c: any) => c.id === clientId);
      
      if (!client) {
        console.warn(`⚠️ Client non trouvé: ${clientId}`);
        console.log('📋 IDs disponibles:', allClients.slice(0, 5).map((c: any) => c.id));
        return null;
      }
    } else {
      console.log('✅ Données client reçues du frontend');
    }
    
    console.log(`✅ Client trouvé:`, {
      id: client.id,
      nom: client.lastName || client.nom,
      prenom: client.firstName || client.prenom,
      hasPatrimoine: !!client.patrimoineData,
      hasRevenus: !!client.revenus,
      hasImposition: !!client.imposition,
      hasObjectifs: !!client.objectifs,
      hasFamilyInfo: !!client.familyInfo
    });
    
    // 🔥 AJOUT DE LOGS DÉTAILLÉS POUR DÉBOGUER
    console.log('📦 Structure complète du client:', {
      keys: Object.keys(client),
      // Patrimoine Perso
      patrimoineData: client.patrimoineData ? {
        hasActifsFinanciers: !!client.patrimoineData.actifsFinanciers,
        nbActifsFinanciers: client.patrimoineData.actifsFinanciers?.length || 0,
        actifsFinanciers: client.patrimoineData.actifsFinanciers?.map((a: any) => ({ type: a.type, value: a.value })),
        hasImmobilier: !!client.patrimoineData.immobilier,
        nbImmobilier: client.patrimoineData.immobilier?.length || 0,
        immobilier: client.patrimoineData.immobilier?.map((i: any) => ({ type: i.type, value: i.value })),
        hasPassifs: !!client.patrimoineData.passifs,
        nbPassifs: client.patrimoineData.passifs?.length || 0,
        passifs: client.patrimoineData.passifs?.map((p: any) => ({ name: p.name, value: p.value }))
      } : 'ABSENT',
      // Patrimoine Pro
      entreprises: client.entreprises ? `Array(${client.entreprises.length})` : 'ABSENT',
      // Revenus
      revenus: client.revenus ? {
        nbRevenus: client.revenus.length,
        categories: client.revenus.map((r: any) => r.categorie),
        total: client.revenus.reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0)
      } : 'ABSENT',
      // Imposition
      imposition: client.imposition ? {
        keys: Object.keys(client.imposition),
        tmi: client.imposition.tmi,
        revenusFonciers: client.imposition.revenusFonciers,
        impotRevenu: client.imposition.impotRevenu,
        ifi: client.imposition.ifi
      } : 'ABSENT',
      // Famille
      familyInfo: client.familyInfo ? {
        maritalStatus: client.familyInfo.maritalStatus,
        regimeMatrimonial: client.familyInfo.regimeMatrimonial,
        nbChildren: client.familyInfo.children?.length || 0,
        spouse: !!client.familyInfo.spouse
      } : 'ABSENT',
      // Objectifs
      objectifs: client.objectifs ? `Array(${client.objectifs.length})` : 'ABSENT'
    });
    
    // 🔥 RÉCUPÉRATION COMPLÈTE DES DONNÉES
    
    // Calculer l'âge depuis la date de naissance
    const calculateAge = (birthDate: string): number => {
      if (!birthDate) return 0;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };
    
    // 📋 FOYER (depuis familyInfo ou client direct)
    const familyInfo = client.familyInfo || {};
    const regimeMatrimonial = familyInfo.regimeMatrimonial || client.regimeMatrimonial || 'Communauté réduite aux acquêts';
    const maritalStatus = familyInfo.maritalStatus || client.maritalStatus || 'Célibataire';
    const nbChildren = (familyInfo.children || client.children || []).length;
    const ageClient = calculateAge(client.birthDate);
    const ageConjoint = familyInfo.spouse?.birthDate ? calculateAge(familyInfo.spouse.birthDate) : 0;
    
    console.log(`👨‍👩‍👧‍👦 FOYER: ${maritalStatus}, ${regimeMatrimonial}, ${nbChildren} enfant(s), Client ${ageClient}ans, Conjoint ${ageConjoint}ans`);
    
    // 💰 REVENUS (depuis revenus array + imposition)
    const revenusArray = client.revenus || [];
    
    const revenus_salaires = revenusArray
      .filter((r: any) => 
        r.categorie?.includes('salarie') || 
        r.categorie?.includes('pension') ||
        r.categorie?.includes('fonctionnaire') ||
        r.categorie === 'retraite' ||
        r.categorie === 'interimaire' ||
        r.categorie === 'cdd' ||
        r.categorie === 'intermittent'
      )
      .reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
    
    const revenus_tns = revenusArray
      .filter((r: any) => 
        r.categorie?.includes('gerant_sarl') || 
        r.categorie === 'auto_entrepreneur' ||
        r.categorie?.includes('president_sas')
      )
      .reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
    
    const revenus_dividendes = revenusArray
      .filter((r: any) => r.categorie === 'dividende')
      .reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
    
    // 🔥 Les revenus fonciers sont calculés plus bas depuis les biens immobiliers
    const revenus_autres = client.imposition?.reveusValeursCapitauxMobiliers || client.imposition?.revenusValeursMobilieres || 0;
    const tmi = parseInt(client.imposition?.trancheMarginaleTMI || client.imposition?.tmi || '30');
    const impotRevenu = client.imposition?.impotSurRevenu || client.imposition?.impotRevenu || 0;
    const ifi = client.imposition?.IFI || client.imposition?.ifi || 0;
    const prelevementsSociaux = client.imposition?.prelevementsSociaux || 0;
    const nombreParts = client.imposition?.nombreParts || 1;
    
    // 🏛️ PATRIMOINE PERSONNEL (depuis patrimoineData)
    const patrimoineData = client.patrimoineData || {};
    
    // Actifs Financiers
    const actifsFinanciers = patrimoineData.actifsFinanciers || [];
    
    const liquidites = actifsFinanciers
      .filter((a: any) => 
        a.type === 'Compte courant' ||
        a.type === 'Livret A' ||
        a.type === 'LDDS' ||
        a.type === 'LEP' ||
        a.type === 'Livret jeune'
      )
      .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    
    const assurance_vie = actifsFinanciers
      .filter((a: any) => a.type === 'Assurance-vie')
      .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    
    const per = actifsFinanciers
      .filter((a: any) => a.type === 'PER' || a.type === 'PERCO')
      .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    
    const portefeuille_financier = actifsFinanciers
      .filter((a: any) => a.type === 'PEA' || a.type === 'Compte-titres')
      .reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    
    // Immobilier
    const immobilier = patrimoineData.immobilier || [];
    
    // 🔥 CORRECTION : Normaliser les types d'immobilier (gérer snake_case et espaces)
    const normalizeType = (type: string): string => {
      if (!type) return '';
      return type.toLowerCase().replace(/_/g, ' ').trim();
    };
    
    // 🔥 CORRECTION : Calculer les revenus fonciers depuis les biens immobiliers
    const revenus_fonciers = immobilier
      .filter((i: any) => {
        const normalized = normalizeType(i.type);
        return normalized === 'locatif nu' || 
               normalized === 'location nue' ||
               normalized === 'locatif meublé' ||
               normalized === 'locatif meuble' ||
               normalized === 'location meublée' ||
               normalized === 'location meublee' ||
               normalized === 'lmnp';
      })
      .reduce((sum: number, i: any) => sum + (i.loyerAnnuel || 0), 0);
    
    console.log(`💰 Revenus fonciers calculés depuis les biens : ${revenus_fonciers.toLocaleString('fr-FR')}€`);
    
    const immobilier_pp = immobilier
      .filter((i: any) => {
        const normalized = normalizeType(i.type);
        return normalized === 'résidence principale' || normalized === 'residence principale';
      })
      .reduce((sum: number, i: any) => sum + (i.value || 0), 0);
    
    const immobilier_secondaire = immobilier
      .filter((i: any) => {
        const normalized = normalizeType(i.type);
        return normalized === 'résidence secondaire' || normalized === 'residence secondaire';
      })
      .reduce((sum: number, i: any) => sum + (i.value || 0), 0);
    
    const immobilier_locatif = immobilier
      .filter((i: any) => {
        const normalized = normalizeType(i.type);
        return normalized === 'locatif nu' || 
               normalized === 'location nue' ||
               normalized === 'locatif meublé' ||
               normalized === 'locatif meuble' ||
               normalized === 'location meublée' ||
               normalized === 'location meublee' ||
               normalized === 'lmnp';
      })
      .reduce((sum: number, i: any) => sum + (i.value || 0), 0);
    
    const sci = immobilier
      .filter((i: any) => normalizeType(i.type) === 'sci')
      .reduce((sum: number, i: any) => sum + (i.value || 0), 0);
    
    const scpi = immobilier
      .filter((i: any) => normalizeType(i.type) === 'scpi')
      .reduce((sum: number, i: any) => sum + (i.value || 0), 0);
    
    // Passifs
    const passifs = patrimoineData.passifs || [];
    const totalPassifs = passifs.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    
    console.log(`🏠 PATRIMOINE PERSO: Liquidités ${liquidites}€, AV ${assurance_vie}€, PER ${per}€, Portefeuille ${portefeuille_financier}€, RP ${immobilier_pp}€, RS ${immobilier_secondaire}€, Locatif ${immobilier_locatif}€, SCI ${sci}€, SCPI ${scpi}€, Passifs ${totalPassifs}€`);
    
    // 🏢 PATRIMOINE PROFESSIONNEL (depuis entreprises)
    const entreprises = client.entreprises || [];
    let titres_societe = 0;
    let valorisation_entreprises = 0;
    let ca_total_entreprises = 0;
    let statut_professionnel = 'salarie';
    
    if (entreprises.length > 0) {
      console.log(`🏢 PATRIMOINE PRO: ${entreprises.length} entreprise(s) détectée(s)`);
      
      entreprises.forEach((ent: any) => {
        const valorisation = ent.valorisation || 0;
        const participation = (ent.participation || 100) / 100;
        const valeurPart = valorisation * participation;
        
        titres_societe += valeurPart;
        valorisation_entreprises += valorisation;
        ca_total_entreprises += ent.chiffreAffaires || 0;
        
        console.log(`  📊 ${ent.nom}: ${ent.formeJuridique}, ${ent.participation}%, Valorisation ${valorisation}€, CA ${ent.chiffreAffaires}€`);
      });
      
      // Déterminer le statut professionnel
      const premiereEntreprise = entreprises[0];
      if (premiereEntreprise.formeJuridique?.includes('SARL') && premiereEntreprise.participation > 50) {
        statut_professionnel = 'gerant_majoritaire';
      } else if (premiereEntreprise.formeJuridique?.includes('SAS') || premiereEntreprise.formeJuridique?.includes('SA')) {
        statut_professionnel = 'assimile_salarie';
      } else if (premiereEntreprise.formeJuridique?.includes('EI') || premiereEntreprise.formeJuridique?.includes('EIRL')) {
        statut_professionnel = 'tns';
      }
      
      console.log(`💼 STATUT PRO: ${statut_professionnel}, Titres société ${titres_societe}€, Valorisation totale ${valorisation_entreprises}€, CA total ${ca_total_entreprises}€`);
    }
    
    // Calculer le patrimoine total
    const patrimoineTotalActifs = 
      liquidites + assurance_vie + per + portefeuille_financier +
      immobilier_pp + immobilier_secondaire + immobilier_locatif + sci + scpi +
      titres_societe;
    
    const patrimoineNet = patrimoineTotalActifs - totalPassifs;
    
    console.log(`💰 PATRIMOINE TOTAL: ${patrimoineNet.toLocaleString('fr-FR')} € (Actifs: ${patrimoineTotalActifs.toLocaleString('fr-FR')} €, Passifs: ${totalPassifs.toLocaleString('fr-FR')} €)`);
    
    // 🎯 OBJECTIFS
    const objectifs = (client.objectifs || [])
      .filter((obj: any) => obj.included !== false)
      .map((obj: any) => obj.description || obj.title || obj.nom || '');
    
    console.log(`🎯 OBJECTIFS: ${objectifs.length} objectif(s) - ${objectifs.slice(0, 3).join(', ')}${objectifs.length > 3 ? '...' : ''}`);
    
    // Extraire les données pertinentes dans le format attendu
    const donnees: DonneesClient = {
      // Foyer
      regime_matrimonial: regimeMatrimonial,
      nombre_enfants: nbChildren,
      age_client: ageClient,
      age_conjoint: ageConjoint,
      situation_familiale: maritalStatus,
      
      // Revenus
      revenus_salaires: revenus_salaires + revenus_tns, // Combiner salaires + TNS
      revenus_dividendes: revenus_dividendes,
      revenus_fonciers: revenus_fonciers,
      revenus_autres: revenus_autres,
      tmi: tmi,
      impot_revenu: impotRevenu, // 🔥 NOUVEAU - Depuis l'onglet Revenus
      prelevements_sociaux: prelevementsSociaux, // 🔥 NOUVEAU - Depuis l'onglet Revenus
      ifi: ifi, // 🔥 NOUVEAU - Depuis l'onglet Revenus
      nombre_parts: nombreParts, // 🔥 NOUVEAU - Depuis l'onglet Revenus
      
      // Patrimoine personnel - 🔥 CORRECTION : Garder toutes les catégories séparées
      immobilier_pp: immobilier_pp,
      immobilier_locatif: immobilier_locatif,
      immobilier_secondaire: immobilier_secondaire, // 🔥 SÉPARÉ
      sci: sci, // 🔥 SÉPARÉ
      scpi: scpi, // 🔥 SÉPARÉ
      liquidites: liquidites,
      assurance_vie: assurance_vie,
      per: per, // 🔥 SÉPARÉ
      titres_societe: titres_societe,
      portefeuille_financier: portefeuille_financier,
      passifs: totalPassifs, // 🔥 NOUVEAU
      patrimoine_net: patrimoineNet, // 🔥 NOUVEAU
      
      // Objectifs
      objectifs: objectifs,
      horizon: 10,
      
      // Statut professionnel
      statut: statut_professionnel,
      societe: entreprises.length > 0 ? entreprises[0].nom : undefined,
      participation_societe: entreprises.length > 0 ? entreprises[0].participation : 0,
    };
    
    const revenusTotaux = donnees.revenus_salaires + donnees.revenus_dividendes + donnees.revenus_fonciers + donnees.revenus_autres;
    
    console.log(`✅ Données collectées pour ${client.firstName} ${client.lastName}:`, {
      patrimoine_total: patrimoineNet,
      revenus_total: revenusTotaux,
      objectifs_count: donnees.objectifs?.length || 0,
      tmi: donnees.tmi,
      statut: donnees.statut,
      nb_enfants: donnees.nombre_enfants
    });
    
    // 🔥 VÉRIFICATION FINALE : Même si le patrimoine est à 0, on continue
    if (patrimoineNet === 0 && revenusTotaux === 0) {
      console.warn('⚠️ Le client n\'a ni patrimoine ni revenus renseignés, l\'analyse sera limitée mais continue');
    }
    
    return donnees;
    
  } catch (error) {
    console.error(`❌ Erreur collecte données client:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return null;
  }
}

// ============================================
// 2️⃣ ANALYSE CIVILE
// ============================================

export async function analyserCivil(donnees: DonneesClient): Promise<AnalyseCivile> {
  console.log(`⚖️ Analyse civile en cours...`);
  
  const analyse: AnalyseCivile = {
    regime_matrimonial_analyse: '',
    protection_conjoint: {
      niveau: 'moyen',
      recommandations: []
    },
    organisation_successorale: {
      analyse: '',
      risques: [],
      optimisations: []
    },
    risques_indivision: [],
    score: 7
  };
  
  // Analyse du régime matrimonial
  const regime = donnees.regime_matrimonial || 'separation';
  
  if (regime === 'communaute') {
    analyse.regime_matrimonial_analyse = "Régime de communauté réduite aux acquêts : protection automatique du conjoint survivant sur 50% du patrimoine commun.";
    analyse.protection_conjoint.niveau = 'fort';
  } else if (regime === 'separation') {
    analyse.regime_matrimonial_analyse = "Régime de séparation de biens : protection limitée du conjoint survivant. Nécessité d'anticiper la transmission.";
    analyse.protection_conjoint.niveau = 'faible';
    analyse.protection_conjoint.recommandations.push(
      "Mettre en place une donation au dernier vivant pour protéger le conjoint",
      "Souscrire des contrats d'assurance-vie avec clause bénéficiaire au profit du conjoint"
    );
  } else if (regime === 'participation_acquets') {
    analyse.regime_matrimonial_analyse = "Régime de participation aux acquêts : protection mixte avec créance de participation au décès ou divorce.";
    analyse.protection_conjoint.niveau = 'moyen';
  } else if (regime === 'communaute_universelle') {
    analyse.regime_matrimonial_analyse = "Régime de communauté universelle : protection maximale du conjoint survivant avec clause d'attribution intégrale.";
    analyse.protection_conjoint.niveau = 'fort';
  }
  
  // Analyse successorale
  if (donnees.nombre_enfants && donnees.nombre_enfants > 1) {
    analyse.organisation_successorale.analyse = `Présence de ${donnees.nombre_enfants} enfants : nécessité d'organiser l'égalité de la transmission et d'éviter les conflits.`;
    analyse.organisation_successorale.optimisations.push(
      "Réaliser une donation-partage pour figer les valeurs et éviter les rapports à succession",
      "Mettre en place des pactes d'actionnaires si détention de société"
    );
    analyse.risques_indivision.push("Risque d'indivision sur les biens immobiliers au décès");
  }
  
  if (donnees.titres_societe && donnees.titres_societe > 500000) {
    analyse.organisation_successorale.optimisations.push(
      "Mettre en place un pacte Dutreil pour bénéficier de l'abattement de 75% sur la transmission d'entreprise (CGI art. 787 B)",
      "Créer une holding familiale pour faciliter la transmission progressive"
    );
  }
  
  if (donnees.immobilier_pp && donnees.immobilier_pp > 300000) {
    analyse.organisation_successorale.optimisations.push(
      "Envisager un démembrement de propriété (donation de nue-propriété) pour réduire les droits de succession (CGI art. 669)"
    );
  }
  
  // 🔥 NOUVEAU : Recherche dans les règles fiscales pertinentes avec détails
  try {
    const reglesTransmission = await reglesFiscalesDB.getReglesParDomaine('transmission');
    if (reglesTransmission.length > 0) {
      console.log(`📚 ${reglesTransmission.length} règles de transmission trouvées`);
      
      // Extraire les dispositifs les plus pertinents
      const reglesApplicables = reglesTransmission.filter((regle: any) => {
        // Pacte Dutreil si titres société
        if (regle.titre?.toLowerCase().includes('dutreil') && donnees.titres_societe && donnees.titres_societe > 300000) {
          return true;
        }
        // Donation si enfants
        if (regle.titre?.toLowerCase().includes('donation') && donnees.nombre_enfants && donnees.nombre_enfants > 0) {
          return true;
        }
        // Assurance-vie
        if (regle.titre?.toLowerCase().includes('assurance') && donnees.assurance_vie && donnees.assurance_vie > 100000) {
          return true;
        }
        return false;
      }).slice(0, 3);
      
      // Enrichir les optimisations avec les règles trouvées
      reglesApplicables.forEach((regle: any) => {
        if (regle.article_code && regle.description) {
          const optimisation = `${regle.titre} (${regle.article_code}) : ${regle.description.substring(0, 150)}...`;
          if (!analyse.organisation_successorale.optimisations.includes(optimisation)) {
            analyse.organisation_successorale.optimisations.push(optimisation);
          }
        }
      });
      
      analyse.organisation_successorale.analyse += ` ${reglesTransmission.length} dispositifs fiscaux de transmission analysés.`;
    }
    
    // 📚 NOUVEAU : Rechercher dans les documents IA pour enrichir l'analyse
    try {
      console.log(`📚 Recherche dans la base de connaissances (transmission)...`);
      const documentsTransmission = await indexIA.rechercherDocuments('transmission patrimoine succession donation', 2);
      
      if (documentsTransmission.length > 0) {
        console.log(`📄 ${documentsTransmission.length} documents trouvés sur la transmission`);
        
        const sourcesDocs = documentsTransmission
          .map((doc: any) => doc.titre || doc.nom_fichier)
          .join(', ');
        
        analyse.organisation_successorale.analyse += ` Références documentaires : ${sourcesDocs}.`;
      }
    } catch (error) {
      console.warn('⚠️ Erreur recherche documents transmission:', error);
    }
    
  } catch (error) {
    console.warn('⚠️ Erreur lors de la recherche des règles de transmission:', error);
  }
  
  // Calcul du score
  let score = 5;
  if (analyse.protection_conjoint.niveau === 'fort') score += 2;
  if (analyse.protection_conjoint.niveau === 'moyen') score += 1;
  if (analyse.organisation_successorale.optimisations.length > 2) score += 2;
  if (analyse.risques_indivision.length === 0) score += 1;
  
  analyse.score = Math.min(10, score);
  
  console.log(`✅ Analyse civile terminée - Score: ${analyse.score}/10`);
  return analyse;
}

// ============================================
// 3️⃣ ANALYSE FISCALE
// ============================================

export async function analyserFiscal(donnees: DonneesClient): Promise<AnalyseFiscale> {
  console.log(`💰 Analyse fiscale en cours...`);
  
  const revenus_total = 
    (donnees.revenus_salaires || 0) +
    (donnees.revenus_dividendes || 0) +
    (donnees.revenus_fonciers || 0) +
    (donnees.revenus_autres || 0);
  
  const patrimoine_total = 
    (donnees.immobilier_pp || 0) +
    (donnees.immobilier_locatif || 0) +
    (donnees.liquidites || 0) +
    (donnees.assurance_vie || 0) +
    (donnees.titres_societe || 0) +
    (donnees.portefeuille_financier || 0);
  
  // 🔥 CORRECTION : Utiliser les valeurs calculées depuis l'onglet Revenus et Imposition
  const tmi = donnees.tmi || 30;
  const ir_estime = donnees.impot_revenu || (revenus_total * (tmi / 100)); // Fallback si pas de valeur
  const ps_estimees = donnees.prelevements_sociaux || (revenus_total * 0.172); // Fallback 17,2% PS
  const ifi_estime = donnees.ifi || 0;
  
  console.log(`💰 Fiscalité - IR: ${ir_estime.toLocaleString('fr-FR')}€ (depuis onglet Revenus), PS: ${ps_estimees.toLocaleString('fr-FR')}€, IFI: ${ifi_estime.toLocaleString('fr-FR')}€, TMI: ${tmi}%, Parts: ${donnees.nombre_parts || 1}`);
  
  // Estimation IFI (pour l'analyse seulement)
  const patrimoine_immobilier_net = 
    (donnees.immobilier_pp || 0) * 0.7 + // Abattement 30% RP
    (donnees.immobilier_locatif || 0);
  
  const assujetti_ifi = patrimoine_immobilier_net > 1300000;
  
  const analyse: AnalyseFiscale = {
    fiscalite_revenus: {
      ir_estime,
      ps_estimees,
      taux_global: revenus_total > 0 ? ((ir_estime + ps_estimees) / revenus_total) * 100 : 0,
      analyse: `Revenus totaux: ${revenus_total.toLocaleString('fr-FR')}€. IR calculé avec barème progressif: ${ir_estime.toLocaleString('fr-FR')}€ (TMI ${tmi}%, ${donnees.nombre_parts || 1} parts fiscales). PS: ${ps_estimees.toLocaleString('fr-FR')}€.`
    },
    fiscalite_patrimoine: {
      ifi_estime,
      assujetti: assujetti_ifi || ifi_estime > 0,
      analyse: ifi_estime > 0
        ? `IFI calculé: ${ifi_estime.toLocaleString('fr-FR')}€. Patrimoine immobilier net taxable: ${patrimoine_immobilier_net.toLocaleString('fr-FR')}€.`
        : assujetti_ifi
        ? `Patrimoine immobilier net taxable: ${patrimoine_immobilier_net.toLocaleString('fr-FR')}€. IFI estimé: 0€.`
        : `Patrimoine immobilier net: ${patrimoine_immobilier_net.toLocaleString('fr-FR')}€. Non assujetti à l'IFI (seuil 1,3M€).`
    },
    optimisations_possibles: [],
    risques_fiscaux: [],
    score: 7
  };
  
  // Recherche d'optimisations
  if (donnees.revenus_dividendes && donnees.revenus_dividendes > 50000) {
    const gain_flat_tax = donnees.revenus_dividendes * 0.30;
    const gain_bareme = donnees.revenus_dividendes * 0.40 * (tmi / 100) + donnees.revenus_dividendes * 0.172;
    
    if (Math.abs(gain_flat_tax - gain_bareme) > 1000) {
      analyse.optimisations_possibles.push({
        type: 'Choix fiscalité dividendes',
        gain_estime: Math.abs(gain_flat_tax - gain_bareme),
        description: gain_flat_tax < gain_bareme 
          ? 'Opter pour le PFU (flat tax 30%) plutôt que le barème progressif'
          : 'Opter pour le barème progressif avec abattement 40% plutôt que le PFU',
        regle_fiscale: 'CGI art. 200 A'
      });
    }
  }
  
  if (donnees.immobilier_locatif && donnees.immobilier_locatif > 200000 && donnees.revenus_fonciers) {
    analyse.optimisations_possibles.push({
      type: 'Optimisation fiscale immobilière',
      gain_estime: donnees.revenus_fonciers * 0.15,
      description: 'Création d\'une SCI à l\'IS pour bénéficier de l\'amortissement et de l\'IS réduit (15-25% vs TMI)',
      regle_fiscale: 'CGI art. 206 - SCI IS'
    });
  }
  
  if (assujetti_ifi && donnees.immobilier_pp && donnees.immobilier_pp > 500000) {
    analyse.optimisations_possibles.push({
      type: 'Réduction IFI',
      gain_estime: ifi_estime * 0.30,
      description: 'Démembrement de propriété pour sortir progressivement de l\'assiette IFI',
      regle_fiscale: 'CGI art. 969 - Démembrement'
    });
  }
  
  // 🔥 NOUVEAU : Interroger les règles fiscales pertinentes et enrichir les optimisations
  try {
    const reglesOptimisation = await reglesFiscalesDB.rechercherRegles('optimisation');
    if (reglesOptimisation.length > 0) {
      console.log(`📚 ${reglesOptimisation.length} règles d'optimisation fiscale trouvées`);
      
      // Extraire les dispositifs les plus pertinents
      const reglesApplicables = reglesOptimisation.filter((regle: any) => {
        // Démembrement si IFI
        if (regle.titre?.toLowerCase().includes('démembrement') && assujetti_ifi && donnees.immobilier_pp && donnees.immobilier_pp > 500000) {
          return true;
        }
        // SCI si immobilier locatif
        if (regle.titre?.toLowerCase().includes('sci') && donnees.immobilier_locatif && donnees.immobilier_locatif > 300000) {
          return true;
        }
        // PFU si dividendes
        if (regle.titre?.toLowerCase().includes('pfu') && donnees.revenus_dividendes && donnees.revenus_dividendes > 50000) {
          return true;
        }
        return false;
      }).slice(0, 3);
      
      // Enrichir les optimisations avec les règles trouvées
      reglesApplicables.forEach((regle: any) => {
        if (regle.article_code && regle.description) {
          const optimisation = `${regle.titre} (${regle.article_code}) : ${regle.description.substring(0, 150)}...`;
          if (!analyse.optimisations_possibles.some(opt => opt.description.includes(regle.titre))) {
            analyse.optimisations_possibles.push({
              type: regle.titre,
              gain_estime: 0, // À calculer selon le cas
              description: optimisation,
              regle_fiscale: regle.article_code
            });
          }
        }
      });
      
      analyse.organisation_successorale.analyse += ` ${reglesOptimisation.length} dispositifs fiscaux d'optimisation analysés.`;
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors de la recherche des règles d\'optimisation:', error);
  }
  
  // Calcul du score
  let score = 5;
  if (analyse.fiscalite_revenus.taux_global < 30) score += 2;
  if (analyse.fiscalite_revenus.taux_global < 40) score += 1;
  if (!assujetti_ifi) score += 2;
  
  analyse.score = Math.min(10, score);
  
  console.log(`✅ Analyse fiscale terminée - Score: ${analyse.score}/10`);
  return analyse;
}

// ============================================
// 4️⃣ ANALYSE SOCIALE
// ============================================

export async function analyserSocial(donnees: DonneesClient): Promise<AnalyseSociale> {
  console.log(`🏥 Analyse sociale en cours...`);
  
  const statut = donnees.statut || 'salarie';
  let cotisations_estimees = 0;
  let niveau_protection: 'faible' | 'moyen' | 'fort' = 'moyen';
  
  if (statut === 'salarie' || statut === 'assimile_salarie') {
    cotisations_estimees = (donnees.revenus_salaires || 0) * 0.22; // 22% part salariale
    niveau_protection = 'fort';
  } else if (statut === 'tns' || statut === 'gerant_majoritaire') {
    cotisations_estimees = (donnees.revenus_salaires || 0) * 0.45; // 45% TNS
    niveau_protection = 'moyen';
  } else if (statut === 'liberal') {
    cotisations_estimees = (donnees.revenus_salaires || 0) * 0.40;
    niveau_protection = 'moyen';
  }
  
  const analyse: AnalyseSociale = {
    statut_social: statut,
    cotisations_estimees,
    protection_sociale: {
      niveau: niveau_protection,
      maladie: statut !== 'tns',
      retraite_base: cotisations_estimees * 0.30,
      retraite_complementaire: cotisations_estimees * 0.20,
      prevoyance: statut === 'salarie' || statut === 'assimile_salarie'
    },
    score: 7
  };
  
  // Optimisation rémunération si dirigeant
  if ((statut === 'gerant_majoritaire' || statut === 'assimile_salarie') && donnees.revenus_dividendes) {
    const salaire_actuel = donnees.revenus_salaires || 0;
    const dividendes_actuels = donnees.revenus_dividendes || 0;
    const charges_actuelles = cotisations_estimees + dividendes_actuels * 0.172;
    
    // Calcul optimisé (exemple simplifié)
    const salaire_optimise = salaire_actuel * 1.1;
    const dividendes_optimises = dividendes_actuels * 0.9;
    const charges_optimisees = salaire_optimise * 0.40 + dividendes_optimises * 0.172;
    
    if (charges_optimisees < charges_actuelles) {
      analyse.optimisation_remuneration = {
        actuel: {
          salaire: salaire_actuel,
          dividendes: dividendes_actuels,
          total_charges: charges_actuelles
        },
        optimise: {
          salaire: salaire_optimise,
          dividendes: dividendes_optimises,
          total_charges: charges_optimisees
        },
        gain_annuel: charges_actuelles - charges_optimisees
      };
    }
  }
  
  // Calcul du score
  let score = 5;
  if (niveau_protection === 'fort') score += 2;
  if (niveau_protection === 'moyen') score += 1;
  if (analyse.optimisation_remuneration && analyse.optimisation_remuneration.gain_annuel > 5000) score += 2;
  if (cotisations_estimees / (donnees.revenus_salaires || 1) < 0.35) score += 1;
  
  analyse.score = Math.min(10, score);
  
  console.log(`✅ Analyse sociale terminée - Score: ${analyse.score}/10`);
  return analyse;
}

// ============================================
// 5️⃣ ANALYSE PATRIMONIALE GLOBALE
// ============================================

export async function analyserPatrimoine(donnees: DonneesClient): Promise<AnalysePatrimonialeGlobale> {
  console.log(`🏛️ Analyse patrimoniale globale en cours...`);
  
  // 🔥 CORRECTION : Utiliser le patrimoine NET (actifs - passifs)
  // Calculer d'abord le patrimoine BRUT (tous les actifs)
  const patrimoine_brut = 
    (donnees.immobilier_pp || 0) +
    (donnees.immobilier_locatif || 0) +
    (donnees.immobilier_secondaire || 0) +
    (donnees.sci || 0) +
    (donnees.scpi || 0) +
    (donnees.liquidites || 0) +
    (donnees.assurance_vie || 0) +
    (donnees.per || 0) +
    (donnees.titres_societe || 0) +
    (donnees.portefeuille_financier || 0);
  
  // 🔥 CORRECTION : Soustraire les passifs pour obtenir le patrimoine NET
  const passifs_total = donnees.passifs || 0;
  const patrimoine_total = donnees.patrimoine_net || (patrimoine_brut - passifs_total);
  
  console.log(`💰 Analyse patrimoine: Brut ${patrimoine_brut.toLocaleString('fr-FR')}€ - Passifs ${passifs_total.toLocaleString('fr-FR')}€ = Net ${patrimoine_total.toLocaleString('fr-FR')}€`);
  
  // 🔥 CORRECTION : Calculer les pourcentages sur le patrimoine BRUT pour la répartition
  // (car on veut voir la répartition des actifs, pas du net)
  const repartition = {
    immobilier_pp_pct: patrimoine_brut > 0 ? (donnees.immobilier_pp || 0) / patrimoine_brut * 100 : 0,
    immobilier_locatif_pct: patrimoine_brut > 0 ? ((donnees.immobilier_locatif || 0) + (donnees.immobilier_secondaire || 0)) / patrimoine_brut * 100 : 0,
    liquidites_pct: patrimoine_brut > 0 ? (donnees.liquidites || 0) / patrimoine_brut * 100 : 0,
    assurance_vie_pct: patrimoine_brut > 0 ? (donnees.assurance_vie || 0) / patrimoine_brut * 100 : 0,
    titres_societe_pct: patrimoine_brut > 0 ? (donnees.titres_societe || 0) / patrimoine_brut * 100 : 0,
    portefeuille_financier_pct: patrimoine_brut > 0 ? ((donnees.portefeuille_financier || 0) + (donnees.per || 0) + (donnees.sci || 0) + (donnees.scpi || 0)) / patrimoine_brut * 100 : 0
  };
  
  // Analyse de la diversification
  let score_diversification = 10;
  const immobilier_total_pct = repartition.immobilier_pp_pct + repartition.immobilier_locatif_pct;
  
  if (immobilier_total_pct > 70) score_diversification -= 3;
  if (repartition.titres_societe_pct > 50) score_diversification -= 2;
  if (repartition.liquidites_pct < 5) score_diversification -= 1;
  if (repartition.liquidites_pct > 30) score_diversification -= 2;
  
  const analyse_diversification = 
    immobilier_total_pct > 70 
      ? "Patrimoine trop concentré sur l'immobilier. Recommandation : diversifier vers des actifs financiers."
      : immobilier_total_pct < 30
      ? "Patrimoine bien diversifié avec une bonne répartition immobilier/financier."
      : "Répartition équilibrée du patrimoine.";
  
  const recommandations_diversification: string[] = [];
  
  if (immobilier_total_pct > 70) {
    recommandations_diversification.push("Réduire l'exposition immobilière en diversifiant vers des actifs financiers");
  }
  if (repartition.liquidites_pct < 5) {
    recommandations_diversification.push("Augmenter la poche de liquidités (épargne de précaution)");
  }
  if (repartition.assurance_vie_pct < 10 && patrimoine_total > 200000) {
    recommandations_diversification.push("Ouvrir ou alimenter des contrats d'assurance-vie pour optimiser la transmission");
  }
  
  // Analyse liquidité
  const liquidites_totales = (donnees.liquidites || 0) + (donnees.assurance_vie || 0) * 0.8; // AV partiellement liquide
  const ratio_liquidite = liquidites_totales / patrimoine_total * 100;
  
  const analyse_liquidite = 
    ratio_liquidite < 10 
      ? "Liquidité faible. Risque en cas de besoin de trésorerie urgent."
      : ratio_liquidite > 30
      ? "Liquidité élevée. Opportunité de réinvestissement pour optimiser le rendement."
      : "Niveau de liquidité adapté.";
  
  const analyse: AnalysePatrimonialeGlobale = {
    patrimoine_total,
    repartition,
    diversification: {
      score: Math.max(0, score_diversification),
      analyse: analyse_diversification,
      recommandations: recommandations_diversification
    },
    liquidite: {
      montant: liquidites_totales,
      ratio: ratio_liquidite,
      analyse: analyse_liquidite
    },
    horizon_patrimonial: `Horizon ${donnees.horizon || 10} ans`,
    score: Math.max(0, score_diversification)
  };
  
  console.log(`✅ Analyse patrimoniale terminée - Score: ${analyse.score}/10`);
  return analyse;
}

// ============================================
// 6️⃣ RECHERCHE D'OPTIMISATIONS
// ============================================

export async function rechercherStrategies(
  donnees: DonneesClient,
  analyse_civile: AnalyseCivile,
  analyse_fiscale: AnalyseFiscale,
  analyse_sociale: AnalyseSociale,
  analyse_patrimoniale: AnalysePatrimonialeGlobale
): Promise<StrategiePatrimoniale[]> {
  console.log(`🔍 Recherche de stratégies patrimoniales...`);
  
  const strategies: StrategiePatrimoniale[] = [];
  
  // 🔥 NOUVEAU : Récupérer tous les montages avec enrichissement IA
  const tousLesMontages = await montagesPatrimoniaux.getAllMontages();
  console.log(`📚 ${tousLesMontages.length} montages patrimoniaux disponibles`);
  
  // 🤖 NOUVEAU : Appeler le moteur IA pour des recommandations personnalisées
  try {
    console.log(`🤖 Appel du moteur IA patrimonial...`);
    
    // Préparer le contexte client pour l'IA
    const contexteClient = {
      situation_familiale: `${donnees.situation_familiale}, ${donnees.nombre_enfants} enfant(s)`,
      age: donnees.age_client,
      patrimoine_net: donnees.patrimoine_net || 0,
      revenus_annuels: (donnees.revenus_salaires || 0) + (donnees.revenus_dividendes || 0) + (donnees.revenus_fonciers || 0),
      tmi: donnees.tmi,
      immobilier: (donnees.immobilier_pp || 0) + (donnees.immobilier_locatif || 0),
      titres_societe: donnees.titres_societe || 0,
      objectifs: donnees.objectifs?.join(', '),
      score_civil: analyse_civile.score,
      score_fiscal: analyse_fiscale.score,
      score_patrimonial: analyse_patrimoniale.score,
      problemes_identifies: [
        ...analyse_civile.risques_indivision,
        ...analyse_fiscale.risques_fiscaux
      ].join(', ')
    };
    
    // Appeler le moteur IA avec le contexte
    const recommandationsIA = await moteurPatrimonialIA.genererRecommandations(
      JSON.stringify(contexteClient, null, 2),
      'audit_patrimonial'
    );
    
    console.log(`✅ Moteur IA : ${recommandationsIA.recommandations?.length || 0} recommandations générées`);
    
    // 📚 NOUVEAU : Rechercher dans les documents pertinents
    if (recommandationsIA.recommandations && recommandationsIA.recommandations.length > 0) {
      console.log(`📚 Recherche dans la base de connaissances...`);
      
      for (const reco of recommandationsIA.recommandations.slice(0, 3)) {
        try {
          // Rechercher des documents pertinents
          const documentsRelevants = await indexIA.rechercherDocuments(reco.titre || reco.strategie, 3);
          
          if (documentsRelevants.length > 0) {
            console.log(`📄 ${documentsRelevants.length} documents trouvés pour "${reco.titre}"`);
            
            // Enrichir la recommandation avec les documents
            const sourcesDocuments = documentsRelevants
              .map((doc: any) => `${doc.titre || doc.nom_fichier} (pertinence: ${Math.round(doc.score * 100)}%)`)
              .join(', ');
            
            if (reco.description) {
              reco.description += `\n\n📚 Sources: ${sourcesDocuments}`;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erreur recherche documents pour "${reco.titre}":`, error);
        }
      }
    }
    
    // Convertir les recommandations IA en stratégies
    if (recommandationsIA.recommandations) {
      for (const reco of recommandationsIA.recommandations) {
        const strategieIA: StrategiePatrimoniale = {
          montage_id: `ia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nom: reco.strategie || reco.titre || 'Recommandation IA',
          pertinence: reco.pertinence || 8,
          objectif: reco.objectif || reco.description || '',
          conditions: reco.conditions || 'Voir analyse détaillée',
          avantages: reco.avantages || 'Optimisation personnalisée',
          risques: reco.risques || 'À évaluer au cas par cas',
          fiscalite: reco.fiscalite || 'Selon la situation',
          etapes: reco.etapes || 'Consulter un CGP pour mise en œuvre'
        };
        
        strategies.push(strategieIA);
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Erreur lors de l\'appel au moteur IA:', error);
  }
  
  // Filtrer et scorer les montages pertinents
  for (const montage of tousLesMontages) {
    let pertinence = 0;
    
    // Holding si titres société > 500k€
    if (montage.tags?.includes('holding') && (donnees.titres_societe || 0) > 500000) {
      pertinence += 5;
    }
    
    // Transmission si enfants et patrimoine > 500k€
    if (montage.tags?.includes('transmission') && (donnees.nombre_enfants || 0) > 0 && analyse_patrimoniale.patrimoine_total > 500000) {
      pertinence += 4;
    }
    
    // Pacte Dutreil si entreprise
    if (montage.tags?.includes('pacte dutreil') && (donnees.titres_societe || 0) > 300000) {
      pertinence += 5;
    }
    
    // SCI si immobilier > 300k€
    if (montage.tags?.includes('SCI') && ((donnees.immobilier_locatif || 0) > 300000)) {
      pertinence += 4;
    }
    
    // Optimisation rémunération si dirigeant
    if (montage.tags?.includes('rémunération') && (donnees.statut === 'gerant_majoritaire' || donnees.statut === 'assimile_salarie')) {
      pertinence += 4;
    }
    
    // Retraite si âge > 50 ans
    if (montage.tags?.includes('retraite') && (donnees.age_client || 0) > 50) {
      pertinence += 3;
    }
    
    // Immobilier si forte concentration
    if (montage.tags?.includes('immobilier') && analyse_patrimoniale.repartition.immobilier_pp_pct + analyse_patrimoniale.repartition.immobilier_locatif_pct > 60) {
      pertinence += 3;
    }
    
    // Si pertinence > 3, on ajoute la stratégie
    if (pertinence >= 3) {
      const strategie: StrategiePatrimoniale = {
        montage_id: montage.id,
        nom: montage.nom_montage,
        pertinence: Math.min(10, pertinence),
        objectif: montage.objectif,
        conditions: montage.conditions,
        avantages: montage.avantages,
        risques: montage.risques,
        fiscalite: montage.fiscalite,
        etapes: montage.etapes_juridiques
      };
      
      strategies.push(strategie);
    }
  }
  
  // Trier par pertinence décroissante
  strategies.sort((a, b) => b.pertinence - a.pertinence);
  
  // Limiter aux 10 meilleures stratégies
  const strategiesTop = strategies.slice(0, 10);
  
  const nbStrategiesIA = strategies.filter(s => s.montage_id.startsWith('ia_')).length;
  console.log(`✅ ${strategiesTop.length} stratégies identifiées (dont ${nbStrategiesIA} recommandations IA)`);
  return strategiesTop;
}

// ============================================
// 7️⃣ SIMULATIONS
// ============================================

export async function simulerStrategies(
  strategies: StrategiePatrimoniale[],
  donnees: DonneesClient
): Promise<StrategiePatrimoniale[]> {
  console.log(`📊 Simulation des stratégies...`);
  
  const strategiesAvecSimulation = strategies.map(strategie => {
    // Simulation simplifiée (à affiner selon le montage)
    let gain_fiscal_annuel = 0;
    let cout_mise_en_place = 5000;
    
    if (strategie.nom.toLowerCase().includes('holding')) {
      gain_fiscal_annuel = (donnees.revenus_dividendes || 0) * 0.05;
      cout_mise_en_place = 3000;
    } else if (strategie.nom.toLowerCase().includes('sci')) {
      gain_fiscal_annuel = (donnees.revenus_fonciers || 0) * 0.10;
      cout_mise_en_place = 2000;
    } else if (strategie.nom.toLowerCase().includes('dutreil')) {
      gain_fiscal_annuel = (donnees.titres_societe || 0) * 0.75 * 0.20 / 10; // Économie sur 10 ans
      cout_mise_en_place = 5000;
    } else if (strategie.nom.toLowerCase().includes('assurance-vie')) {
      gain_fiscal_annuel = (donnees.assurance_vie || 0) * 0.03;
      cout_mise_en_place = 0;
    }
    
    const duree_amortissement = gain_fiscal_annuel > 0 ? Math.ceil(cout_mise_en_place / gain_fiscal_annuel * 12) : 999;
    const gain_sur_10ans = gain_fiscal_annuel * 10 - cout_mise_en_place;
    
    return {
      ...strategie,
      simulation: {
        gain_fiscal_annuel,
        cout_mise_en_place,
        duree_amortissement,
        gain_sur_10ans
      }
    };
  });
  
  console.log(`✅ Simulations terminées`);
  return strategiesAvecSimulation;
}

// ============================================
// 8️⃣ GÉNÉRATION AUDIT COMPLET
// ============================================

export async function genererAuditComplet(clientId: string, commandeId?: string, clientDataFromFrontend?: any): Promise<AuditPatrimonial | null> {
  console.log(`🎯 Génération audit patrimonial complet pour client ${clientId}`);
  
  try {
    // 1️⃣ Collecte des données
    const donnees = await collecterDonneesClient(clientId, clientDataFromFrontend);
    if (!donnees) {
      console.error('❌ Impossible de collecter les données client');
      return null;
    }
    
    // 2️⃣ Analyse civile
    const analyse_civile = await analyserCivil(donnees);
    
    // 3️⃣ Analyse fiscale
    const analyse_fiscale = await analyserFiscal(donnees);
    
    // 4️⃣ Analyse sociale
    const analyse_sociale = await analyserSocial(donnees);
    
    // 5️⃣ Analyse patrimoniale
    const analyse_patrimoniale = await analyserPatrimoine(donnees);
    
    // 6️⃣ Recherche de stratégies
    let strategies = await rechercherStrategies(
      donnees,
      analyse_civile,
      analyse_fiscale,
      analyse_sociale,
      analyse_patrimoniale
    );
    
    // 7️⃣ Simulations
    strategies = await simulerStrategies(strategies, donnees);
    
    // Score global
    const score_global = (
      analyse_civile.score +
      analyse_fiscale.score +
      analyse_sociale.score +
      analyse_patrimoniale.score
    ) / 4;
    
    // 🔥 NOUVEAU : Génération du rapport structuré en 7 sections
    const rapport = await genererRapportStructure(
      donnees,
      analyse_civile,
      analyse_fiscale,
      analyse_sociale,
      analyse_patrimoniale,
      strategies,
      score_global
    );
    
    const preconisations = rapport.preconisations;
    
    // Création de l'audit
    const audit: AuditPatrimonial = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_id: clientId,
      commande_id: commandeId,
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString(),
      statut: 'brouillon',
      donnees_client: donnees,
      analyse_civile,
      analyse_fiscale,
      analyse_sociale,
      analyse_patrimoniale,
      strategies_proposees: strategies,
      preconisations,
      score_global: Math.round(score_global * 10) / 10,
      rapport_structure: rapport // 🔥 NOUVEAU
    };
    
    // Sauvegarder l'audit
    await kv.set(`audit_patrimonial:${audit.id}`, audit);
    
    console.log(`✅ Audit patrimonial généré avec succès - Score global: ${audit.score_global}/10`);
    return audit;
    
  } catch (error) {
    console.error('❌ Erreur génération audit:', error);
    return null;
  }
}

// ============================================
// GESTION DES AUDITS
// ============================================

// 🔥 NOUVEAU : Génération rapport LIVE sans stockage
export async function genererRapportLive(clientId: string, clientDataFromFrontend?: any): Promise<any | null> {
  console.log(`📄 Génération rapport LIVE pour client ${clientId}`);
  
  try {
    // 1️⃣ Collecte des données fraîches
    console.log('📊 ÉTAPE 1/6 : Collecte des données client...');
    const donnees = await collecterDonneesClient(clientId, clientDataFromFrontend);
    if (!donnees) {
      console.error('❌ [ÉTAPE 1/6] Impossible de collecter les données client');
      return null;
    }
    console.log('✅ [ÉTAPE 1/6] Données client collectées');
    
    // 2️⃣ Analyses
    console.log('📊 ÉTAPE 2/6 : Analyse civile...');
    const analyse_civile = await analyserCivil(donnees);
    console.log('✅ [ÉTAPE 2/6] Analyse civile terminée');
    
    console.log('📊 ÉTAPE 2/6 : Analyse fiscale...');
    const analyse_fiscale = await analyserFiscal(donnees);
    console.log('✅ [ÉTAPE 2/6] Analyse fiscale terminée');
    
    console.log('📊 ÉTAPE 2/6 : Analyse sociale...');
    const analyse_sociale = await analyserSocial(donnees);
    console.log('✅ [ÉTAPE 2/6] Analyse sociale terminée');
    
    console.log('📊 ÉTAPE 2/6 : Analyse patrimoniale...');
    const analyse_patrimoniale = await analyserPatrimoine(donnees);
    console.log('✅ [ÉTAPE 2/6] Analyse patrimoniale terminée');
    
    // 3️⃣ Stratégies - DÉSACTIVÉES TEMPORAIREMENT (trop gourmand en ressources)
    console.log('📊 ÉTAPE 3/6 : Recherche de stratégies DÉSACTIVÉE...');
    console.log('⚡ MODE ULTRA-RAPIDE : Skip des appels lourds pour éviter les timeouts');
    const strategies: any[] = []; // Array vide - Réactiver rechercherStrategies() si nécessaire
    console.log(`✅ [ÉTAPE 3/6] Mode rapide activé`);
    
    // 4️⃣ Score global
    const score_global = (
      analyse_civile.score +
      analyse_fiscale.score +
      analyse_sociale.score +
      analyse_patrimoniale.score
    ) / 4;
    console.log(`📊 Score global calculé : ${Math.round(score_global * 10) / 10}/10`);
    
    // 5️⃣ Génération du rapport structuré
    console.log('📊 ÉTAPE 5/6 : Génération du rapport structuré...');
    const rapport = await genererRapportStructure(
      donnees,
      analyse_civile,
      analyse_fiscale,
      analyse_sociale,
      analyse_patrimoniale,
      strategies,
      score_global
    );
    console.log('✅ [ÉTAPE 5/6] Rapport structuré généré');
    
    // 6️⃣ 🔥 ANALYSE AVANCÉE 7 ÉTAPES IA - DÉSACTIVÉE
    console.log('📊 ÉTAPE 6/6 : Analyse avancée 7 étapes IA DÉSACTIVÉE (ressources insuffisantes)...');
    console.log('⚠️ L\'analyse avancée consomme trop de ressources pour les Edge Functions Supabase');
    console.log('💡 Le rapport structuré classique reste disponible avec toutes les analyses A-B-C-D');
    
    // DÉSACTIVÉ TEMPORAIREMENT - Consomme trop de ressources (7 appels IA séquentiels)
    // Pour réactiver : décommenter le code ci-dessous et augmenter les limites Edge Function
    /*
    try {
      const analyseAvancee = await analyseAvancee7Etapes(
        donnees,
        {
          analyse_civile,
          analyse_fiscale,
          analyse_sociale,
          analyse_patrimoniale
        },
        strategies
      );
      
      if (analyseAvancee) {
        console.log('✅ [ÉTAPE 6/6] Analyse avancée 7 étapes complétée !');
        rapport.analyse_avancee = analyseAvancee;
      } else {
        console.warn('⚠️ [ÉTAPE 6/6] Analyse avancée non disponible, rapport classique retourné');
      }
    } catch (error) {
      console.error('❌ [ÉTAPE 6/6] Erreur analyse avancée (non bloquant):');
      console.error('  Type:', typeof error);
      console.error('  Message:', error instanceof Error ? error.message : String(error));
      console.error('  Stack:', error instanceof Error ? error.stack : 'No stack');
      // L'analyse avancée est optionnelle, on continue sans elle
    }
    */
    
    console.log(`✅✅✅ Rapport LIVE généré avec succès - Score: ${Math.round(score_global * 10) / 10}/10`);
    return rapport;
    
  } catch (error) {
    console.error('❌❌❌ Erreur génération rapport live - DÉTAILS COMPLETS:');
    console.error('  Type:', typeof error);
    console.error('  Message:', error instanceof Error ? error.message : String(error));
    console.error('  Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('  Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function getAudit(auditId: string): Promise<AuditPatrimonial | null> {
  const audit = await kv.get(`audit_patrimonial:${auditId}`);
  return audit as AuditPatrimonial | null;
}

export async function getAuditsClient(clientId: string): Promise<AuditPatrimonial[]> {
  const allItems = await kv.getByPrefix('audit_patrimonial:');
  const audits = allItems
    .filter((audit): audit is AuditPatrimonial => audit && typeof audit === 'object' && audit.client_id === clientId)
    .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
  
  return audits;
}

export async function validerAudit(auditId: string): Promise<boolean> {
  const audit = await getAudit(auditId);
  if (!audit) return false;
  
  audit.statut = 'valide';
  audit.date_modification = new Date().toISOString();
  
  await kv.set(`audit_patrimonial:${auditId}`, audit);
  return true;
}

export async function modifierAudit(auditId: string, modifications: Partial<AuditPatrimonial>): Promise<boolean> {
  const audit = await getAudit(auditId);
  if (!audit) return false;
  
  const auditModifie = {
    ...audit,
    ...modifications,
    id: audit.id,
    date_modification: new Date().toISOString()
  };
  
  await kv.set(`audit_patrimonial:${auditId}`, auditModifie);
  return true;
}