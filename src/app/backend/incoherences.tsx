/**
 * 🔍 MODULE INCOHÉRENCES - Détection et gestion des incohérences patrimoniales
 * 
 * Phase 3 : Format structuré avec traçabilité des choix
 * 
 * Architecture :
 * - Détection automatique d'incohérences
 * - Classification par gravité et catégorie
 * - Traçabilité des décisions (validé/ignoré)
 * - Suggestions de résolution
 */

// ============================================
// TYPES
// ============================================

export type CategorieIncoherence =
  | 'patrimoine'
  | 'revenus'
  | 'fiscalite'
  | 'familiale'
  | 'professionnelle'
  | 'juridique'
  | 'chronologique';

export type GraviteIncoherence = 'critique' | 'elevee' | 'moyenne' | 'faible';

export type StatutIncoherence = 'detectee' | 'validee' | 'ignoree' | 'corrigee';

export interface Incoherence {
  id: string;
  categorie: CategorieIncoherence;
  gravite: GraviteIncoherence;
  statut: StatutIncoherence;
  
  // Description
  titre: string;
  description: string;
  consequence: string; // Impact sur l'analyse
  
  // Données concernées
  champsAffectes: string[]; // Ex: ["patrimoine.actifsFinanciers", "revenus.salaires"]
  valeursActuelles: any; // Valeurs en question
  
  // Suggestions
  suggestionsResolution: string[];
  valeursCorrigees?: any; // Valeurs proposées si correction auto possible
  
  // Traçabilité
  dateDetection: string;
  dateResolution?: string;
  utilisateurResolution?: string;
  commentaireResolution?: string;
  
  // Règle appliquée
  regleId: string;
  regleDescription: string;
}

export interface RapportIncoherences {
  clientId: string;
  auditId?: string;
  dateAnalyse: string;
  
  // Statistiques
  totalIncoherences: number;
  parGravite: {
    critique: number;
    elevee: number;
    moyenne: number;
    faible: number;
  };
  parStatut: {
    detectee: number;
    validee: number;
    ignoree: number;
    corrigee: number;
  };
  
  // Liste des incohérences
  incoherences: Incoherence[];
  
  // Score de cohérence global
  scoreCoherence: number; // 0-100 (100 = aucune incohérence)
}

// ============================================
// RÈGLES DE DÉTECTION
// ============================================

interface RegleDetection {
  id: string;
  nom: string;
  description: string;
  categorie: CategorieIncoherence;
  gravite: GraviteIncoherence;
  verifier: (donnees: any) => Incoherence | null;
}

const REGLES_DETECTION: RegleDetection[] = [
  // ===== PATRIMOINE =====
  {
    id: 'PAT-001',
    nom: 'Actifs < Passifs',
    description: 'Le total des passifs dépasse le total des actifs',
    categorie: 'patrimoine',
    gravite: 'critique',
    verifier: (donnees) => {
      const actifs = donnees.actifs || 0;
      const passifs = donnees.passifs || 0;
      
      if (passifs > actifs && actifs > 0) {
        return {
          id: `INC-PAT001-${Date.now()}`,
          categorie: 'patrimoine',
          gravite: 'critique',
          statut: 'detectee',
          titre: 'Passifs supérieurs aux actifs',
          description: `Les passifs (${passifs.toLocaleString('fr-FR')} €) dépassent les actifs (${actifs.toLocaleString('fr-FR')} €), ce qui est incohérent.`,
          consequence: 'Le patrimoine net est négatif, ce qui peut indiquer une erreur de saisie ou une situation de surendettement.',
          champsAffectes: ['patrimoine.actifs', 'patrimoine.passifs'],
          valeursActuelles: { actifs, passifs },
          suggestionsResolution: [
            'Vérifier les montants des actifs',
            'Vérifier les montants des passifs',
            'Si la situation est réelle, documenter la stratégie de désendettement',
          ],
          dateDetection: new Date().toISOString(),
          regleId: 'PAT-001',
          regleDescription: 'Cohérence actifs/passifs',
        };
      }
      return null;
    },
  },
  
  {
    id: 'PAT-002',
    nom: 'Endettement excessif',
    description: 'Taux d\'endettement supérieur à 80%',
    categorie: 'patrimoine',
    gravite: 'elevee',
    verifier: (donnees) => {
      const actifs = donnees.actifs || 0;
      const passifs = donnees.passifs || 0;
      
      if (actifs === 0) return null;
      
      const tauxEndettement = (passifs / actifs) * 100;
      
      if (tauxEndettement > 80 && tauxEndettement <= 100) {
        return {
          id: `INC-PAT002-${Date.now()}`,
          categorie: 'patrimoine',
          gravite: 'elevee',
          statut: 'detectee',
          titre: 'Taux d\'endettement très élevé',
          description: `Le taux d'endettement est de ${tauxEndettement.toFixed(1)}%, ce qui est très élevé.`,
          consequence: 'Risque financier important, capacité d\'investissement limitée.',
          champsAffectes: ['patrimoine.passifs', 'patrimoine.actifs'],
          valeursActuelles: { tauxEndettement, actifs, passifs },
          suggestionsResolution: [
            'Mettre en place un plan de remboursement anticipé',
            'Renégocier les crédits',
            'Vérifier si tous les passifs sont bien réels',
          ],
          dateDetection: new Date().toISOString(),
          regleId: 'PAT-002',
          regleDescription: 'Taux d\'endettement maximum',
        };
      }
      return null;
    },
  },
  
  // ===== REVENUS =====
  {
    id: 'REV-001',
    nom: 'Revenus déclarés < IR payé',
    description: 'L\'impôt sur le revenu payé est incohérent avec les revenus déclarés',
    categorie: 'revenus',
    gravite: 'critique',
    verifier: (donnees) => {
      const revenus = donnees.revenus || 0;
      const impotRevenu = donnees.impotRevenu || 0;
      
      // Si IR > 50% des revenus, c'est incohérent
      if (revenus > 0 && impotRevenu > revenus * 0.5) {
        return {
          id: `INC-REV001-${Date.now()}`,
          categorie: 'revenus',
          gravite: 'critique',
          statut: 'detectee',
          titre: 'Impôt sur le revenu incohérent',
          description: `L'impôt sur le revenu (${impotRevenu.toLocaleString('fr-FR')} €) représente plus de 50% des revenus (${revenus.toLocaleString('fr-FR')} €).`,
          consequence: 'Les calculs fiscaux seront erronés, l\'optimisation fiscale impossible.',
          champsAffectes: ['revenus.total', 'imposition.impotRevenu'],
          valeursActuelles: { revenus, impotRevenu, taux: (impotRevenu / revenus) * 100 },
          suggestionsResolution: [
            'Vérifier le montant de l\'IR déclaré',
            'Vérifier le total des revenus',
            'Vérifier la TMI et les tranches applicables',
          ],
          dateDetection: new Date().toISOString(),
          regleId: 'REV-001',
          regleDescription: 'Cohérence revenus/IR',
        };
      }
      return null;
    },
  },
  
  {
    id: 'REV-002',
    nom: 'Revenus professionnels sans activité',
    description: 'Revenus professionnels déclarés mais pas d\'entreprise',
    categorie: 'professionnelle',
    gravite: 'elevee',
    verifier: (donnees) => {
      const revenusPro = donnees.revenusPro || 0;
      const nbEntreprises = donnees.nbEntreprises || 0;
      
      if (revenusPro > 10000 && nbEntreprises === 0) {
        return {
          id: `INC-REV002-${Date.now()}`,
          categorie: 'professionnelle',
          gravite: 'elevee',
          statut: 'detectee',
          titre: 'Revenus professionnels sans entreprise',
          description: `Des revenus professionnels de ${revenusPro.toLocaleString('fr-FR')} € sont déclarés mais aucune entreprise n'est enregistrée.`,
          consequence: 'Impossible d\'analyser le statut social et l\'optimisation de rémunération.',
          champsAffectes: ['revenus.professionnels', 'entreprises'],
          valeursActuelles: { revenusPro, nbEntreprises },
          suggestionsResolution: [
            'Ajouter les informations sur l\'entreprise',
            'Vérifier si les revenus sont bien professionnels (BIC/BNC)',
            'Corriger la catégorie de revenus si nécessaire',
          ],
          dateDetection: new Date().toISOString(),
          regleId: 'REV-002',
          regleDescription: 'Cohérence revenus pro/entreprise',
        };
      }
      return null;
    },
  },
  
  // ===== FISCALITÉ =====
  {
    id: 'FISC-001',
    nom: 'IFI sans patrimoine suffisant',
    description: 'IFI payé alors que le patrimoine est sous le seuil',
    categorie: 'fiscalite',
    gravite: 'elevee',
    verifier: (donnees) => {
      const patrimoineImmobilier = donnees.patrimoineImmobilier || 0;
      const ifi = donnees.ifi || 0;
      
      // Seuil IFI : 1.3M€
      if (ifi > 0 && patrimoineImmobilier < 1300000) {
        return {
          id: `INC-FISC001-${Date.now()}`,
          categorie: 'fiscalite',
          gravite: 'elevee',
          statut: 'detectee',
          titre: 'IFI payé sous le seuil',
          description: `Un IFI de ${ifi.toLocaleString('fr-FR')} € est déclaré alors que le patrimoine immobilier (${patrimoineImmobilier.toLocaleString('fr-FR')} €) est sous le seuil de 1.3M€.`,
          consequence: 'Calculs fiscaux erronés, optimisation IFI impossible.',
          champsAffectes: ['patrimoine.immobilier', 'imposition.ifi'],
          valeursActuelles: { patrimoineImmobilier, ifi, seuil: 1300000 },
          suggestionsResolution: [
            'Vérifier le montant de l\'IFI payé',
            'Vérifier la valorisation du patrimoine immobilier',
            'Vérifier s\'il y a des biens non comptabilisés',
          ],
          dateDetection: new Date().toISOString(),
          regleId: 'FISC-001',
          regleDescription: 'Cohérence IFI/patrimoine immobilier',
        };
      }
      return null;
    },
  },
  
  // ===== FAMILIALE =====
  {
    id: 'FAM-001',
    nom: 'Conjoint sans régime matrimonial',
    description: 'Marié ou Pacsé sans régime matrimonial défini',
    categorie: 'familiale',
    gravite: 'moyenne',
    verifier: (donnees) => {
      const situationFamiliale = donnees.situationFamiliale || '';
      const regimeMatrimonial = donnees.regimeMatrimonial || '';
      
      if (
        (situationFamiliale === 'Marié(e)' || situationFamiliale === 'Pacsé(e)') &&
        !regimeMatrimonial
      ) {
        return {
          id: `INC-FAM001-${Date.now()}`,
          categorie: 'familiale',
          gravite: 'moyenne',
          statut: 'detectee',
          titre: 'Régime matrimonial non défini',
          description: `Le client est ${situationFamiliale} mais le régime matrimonial n'est pas renseigné.`,
          consequence: 'Impossible d\'analyser la protection du conjoint et la succession.',
          champsAffectes: ['familyInfo.maritalStatus', 'familyInfo.regimeMatrimonial'],
          valeursActuelles: { situationFamiliale, regimeMatrimonial: 'Non défini' },
          suggestionsResolution: [
            'Interroger le client sur son régime matrimonial',
            'Par défaut, supposer communauté réduite aux acquêts pour les mariages post-1965',
            'Demander copie du contrat de mariage',
          ],
          valeursCorrigees: { regimeMatrimonial: 'Communauté réduite aux acquêts' },
          dateDetection: new Date().toISOString(),
          regleId: 'FAM-001',
          regleDescription: 'Régime matrimonial obligatoire',
        };
      }
      return null;
    },
  },
  
  // ===== CHRONOLOGIQUE =====
  {
    id: 'CHRO-001',
    nom: 'Âge incohérent',
    description: 'Âge du client ou du conjoint incohérent',
    categorie: 'chronologique',
    gravite: 'faible',
    verifier: (donnees) => {
      const age = donnees.age || 0;
      
      if (age < 18 || age > 110) {
        return {
          id: `INC-CHRO001-${Date.now()}`,
          categorie: 'chronologique',
          gravite: 'faible',
          statut: 'detectee',
          titre: 'Âge incohérent',
          description: `L'âge calculé (${age} ans) semble incohérent.`,
          consequence: 'Calculs de retraite et transmission erronés.',
          champsAffectes: ['birthDate', 'age'],
          valeursActuelles: { age },
          suggestionsResolution: [
            'Vérifier la date de naissance saisie',
            'Corriger la date de naissance',
          ],
          dateDetection: new Date().toISOString(),
          regleId: 'CHRO-001',
          regleDescription: 'Âge valide',
        };
      }
      return null;
    },
  },
];

// ============================================
// FONCTIONS DE DÉTECTION
// ============================================

/**
 * Extrait les données pertinentes pour la détection
 */
function extraireDonneesDetection(clientData: any): any {
  const patrimoineData = clientData.patrimoineData || {};
  const revenus = clientData.revenus || [];
  const imposition = clientData.imposition || {};
  const familyInfo = clientData.familyInfo || {};
  const entreprises = clientData.entreprises || [];
  
  // Calculer totaux
  const actifsFinanciers = (patrimoineData.actifsFinanciers || []).reduce(
    (sum: number, a: any) => sum + (a.value || 0),
    0
  );
  const immobilier = (patrimoineData.immobilier || []).reduce(
    (sum: number, i: any) => sum + (i.value || 0),
    0
  );
  const passifs = (patrimoineData.passifs || []).reduce(
    (sum: number, p: any) => sum + (p.value || 0),
    0
  );
  
  const totalRevenus = revenus.reduce(
    (sum: number, r: any) => sum + (r.montantAnnuel || 0),
    0
  );
  
  const revenusPro = revenus
    .filter((r: any) => r.categorie?.includes('tns') || r.categorie?.includes('bnc') || r.categorie?.includes('bic'))
    .reduce((sum: number, r: any) => sum + (r.montantAnnuel || 0), 0);
  
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
  
  return {
    // Patrimoine
    actifs: actifsFinanciers + immobilier,
    passifs,
    patrimoineImmobilier: immobilier,
    
    // Revenus
    revenus: totalRevenus,
    revenusPro,
    
    // Imposition
    impotRevenu: imposition.impotRevenu || 0,
    ifi: imposition.ifi || 0,
    
    // Famille
    situationFamiliale: familyInfo.maritalStatus || clientData.maritalStatus || '',
    regimeMatrimonial: familyInfo.regimeMatrimonial || clientData.regimeMatrimonial || '',
    
    // Professionnel
    nbEntreprises: entreprises.length,
    
    // Chronologie
    age: calculateAge(clientData.birthDate),
  };
}

/**
 * Détecte toutes les incohérences pour un client
 */
export function detecterIncoherences(clientData: any): RapportIncoherences {
  
  const donnees = extraireDonneesDetection(clientData);
  const incoherences: Incoherence[] = [];
  
  // Appliquer toutes les règles
  for (const regle of REGLES_DETECTION) {
    const incoherence = regle.verifier(donnees);
    if (incoherence) {
      incoherences.push(incoherence);
    }
  }
  
  // Statistiques
  const parGravite = {
    critique: incoherences.filter((i) => i.gravite === 'critique').length,
    elevee: incoherences.filter((i) => i.gravite === 'elevee').length,
    moyenne: incoherences.filter((i) => i.gravite === 'moyenne').length,
    faible: incoherences.filter((i) => i.gravite === 'faible').length,
  };
  
  const parStatut = {
    detectee: incoherences.filter((i) => i.statut === 'detectee').length,
    validee: incoherences.filter((i) => i.statut === 'validee').length,
    ignoree: incoherences.filter((i) => i.statut === 'ignoree').length,
    corrigee: incoherences.filter((i) => i.statut === 'corrigee').length,
  };
  
  // Score de cohérence (100 = parfait)
  // -30 points par critique, -20 par élevée, -10 par moyenne, -5 par faible
  const scoreCoherence = Math.max(
    0,
    100 -
      parGravite.critique * 30 -
      parGravite.elevee * 20 -
      parGravite.moyenne * 10 -
      parGravite.faible * 5
  );
  
  
  return {
    clientId: clientData.id,
    dateAnalyse: new Date().toISOString(),
    totalIncoherences: incoherences.length,
    parGravite,
    parStatut,
    incoherences,
    scoreCoherence,
  };
}

/**
 * Valide une incohérence (accepte comme correcte)
 */
export function validerIncoherence(
  rapport: RapportIncoherences,
  incoherenceId: string,
  utilisateur: string,
  commentaire?: string
): RapportIncoherences {
  const incoherence = rapport.incoherences.find((i) => i.id === incoherenceId);
  
  if (!incoherence) {
    throw new Error(`Incohérence ${incoherenceId} non trouvée`);
  }
  
  incoherence.statut = 'validee';
  incoherence.dateResolution = new Date().toISOString();
  incoherence.utilisateurResolution = utilisateur;
  incoherence.commentaireResolution = commentaire || 'Validée par l\'administrateur';
  
  
  return rapport;
}

/**
 * Ignore une incohérence (marque comme non pertinente)
 */
export function ignorerIncoherence(
  rapport: RapportIncoherences,
  incoherenceId: string,
  utilisateur: string,
  raison: string
): RapportIncoherences {
  const incoherence = rapport.incoherences.find((i) => i.id === incoherenceId);
  
  if (!incoherence) {
    throw new Error(`Incohérence ${incoherenceId} non trouvée`);
  }
  
  incoherence.statut = 'ignoree';
  incoherence.dateResolution = new Date().toISOString();
  incoherence.utilisateurResolution = utilisateur;
  incoherence.commentaireResolution = raison;
  
  
  return rapport;
}

/**
 * Marque une incohérence comme corrigée
 */
export function marquerCorrigee(
  rapport: RapportIncoherences,
  incoherenceId: string,
  utilisateur: string,
  commentaire?: string
): RapportIncoherences {
  const incoherence = rapport.incoherences.find((i) => i.id === incoherenceId);
  
  if (!incoherence) {
    throw new Error(`Incohérence ${incoherenceId} non trouvée`);
  }
  
  incoherence.statut = 'corrigee';
  incoherence.dateResolution = new Date().toISOString();
  incoherence.utilisateurResolution = utilisateur;
  incoherence.commentaireResolution = commentaire || 'Corrigée';
  
  
  return rapport;
}
