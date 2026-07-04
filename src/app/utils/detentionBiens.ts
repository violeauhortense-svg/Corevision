/**
 * 👩‍❤️‍👨 LOGIQUE DE DÉTENTION DES BIENS
 * 
 * Gestion de la détention juridique des biens selon :
 * - Le statut matrimonial
 * - Le régime matrimonial
 * - La date d'acquisition vs date de mariage
 */

import type { FamilyInfo } from '../components/client-detail/types';

export interface DetentionContext {
  showProprietaire: boolean; // Afficher le champ propriétaire (régime séparatiste)
  showNatureAcquisition: boolean; // Afficher la nature d'acquisition
  showBeneficiaire: boolean; // Afficher le bénéficiaire (donation/succession)
  help: string; // Texte d'aide contextuel
}

/**
 * Détermine si le régime matrimonial est séparatiste
 */
export function isRegimeSeparatiste(regimeMatrimonial: string): boolean {
  const regimesSeparatistes = [
    'Séparation de biens',
    'Participation aux acquêts',
  ];
  return regimesSeparatistes.includes(regimeMatrimonial);
}

/**
 * Détermine si le régime matrimonial est communautaire
 */
export function isRegimeCommunautaire(regimeMatrimonial: string): boolean {
  const regimesCommunautaires = [
    'Communauté réduite aux acquêts',
    'Communauté universelle',
    'Communauté de meubles et acquêts',
  ];
  return regimesCommunautaires.includes(regimeMatrimonial);
}

/**
 * Détermine si l'acquisition est avant ou après le mariage
 */
export function isAcquisitionAvantMariage(
  dateAcquisition: string | undefined,
  dateMarriage: string | undefined
): boolean {
  if (!dateAcquisition || !dateMarriage) return false;
  
  const acqDate = new Date(dateAcquisition);
  const marDate = new Date(dateMarriage);
  
  return acqDate < marDate;
}

/**
 * Calcule le contexte de détention pour un bien donné
 */
export function getDetentionContext(
  familyInfo: FamilyInfo,
  dateAcquisition?: string
): DetentionContext {
  const { maritalStatus, regimeMatrimonial, dateMarriage } = familyInfo;

  // Cas 1 : Non marié = pas de logique spécifique
  if (maritalStatus !== 'Marié(e)') {
    return {
      showProprietaire: false,
      showNatureAcquisition: false,
      showBeneficiaire: false,
      help: 'Aucune logique de détention spécifique (non marié)',
    };
  }

  // Cas 2 : Régime séparatiste
  if (isRegimeSeparatiste(regimeMatrimonial)) {
    return {
      showProprietaire: true,
      showNatureAcquisition: false,
      showBeneficiaire: false,
      help: 'En régime séparatiste, chaque bien appartient à celui qui l\'a acquis, quelle que soit la date d\'acquisition.',
    };
  }

  // Cas 3 : Régime communautaire
  if (isRegimeCommunautaire(regimeMatrimonial)) {
    const avantMariage = isAcquisitionAvantMariage(dateAcquisition, dateMarriage);

    if (avantMariage) {
      // Acquisition avant mariage = bien propre
      return {
        showProprietaire: true,
        showNatureAcquisition: false,
        showBeneficiaire: false,
        help: 'Bien acquis avant le mariage : il reste un bien propre et appartient à celui qui l\'a acquis.',
      };
    } else {
      // Acquisition après mariage = dépend de la nature
      return {
        showProprietaire: false,
        showNatureAcquisition: true,
        showBeneficiaire: true, // Affiché conditionnellement si donation/succession
        help: 'Bien acquis après le mariage : sa qualification dépend de la nature de l\'acquisition (achat, donation, succession).',
      };
    }
  }

  // Cas par défaut
  return {
    showProprietaire: false,
    showNatureAcquisition: false,
    showBeneficiaire: false,
    help: '',
  };
}

/**
 * Génère un résumé textuel de la détention d'un bien
 */
export function generateDetentionSummary(
  familyInfo: FamilyInfo,
  proprietaire?: 'client' | 'conjoint' | 'indivision',
  natureAcquisition?: 'achat' | 'donation' | 'succession',
  beneficiaire?: 'client' | 'conjoint',
  dateAcquisition?: string
): string {
  const { maritalStatus, regimeMatrimonial, dateMarriage } = familyInfo;

  if (maritalStatus !== 'Marié(e)') {
    return 'Bien propre du client';
  }

  // Régime séparatiste
  if (isRegimeSeparatiste(regimeMatrimonial)) {
    if (proprietaire === 'client') return 'Bien propre du client';
    if (proprietaire === 'conjoint') return 'Bien propre du conjoint';
    if (proprietaire === 'indivision') return 'Bien en indivision';
    return 'Propriétaire à définir';
  }

  // Régime communautaire
  if (isRegimeCommunautaire(regimeMatrimonial)) {
    const avantMariage = isAcquisitionAvantMariage(dateAcquisition, dateMarriage);

    if (avantMariage) {
      if (proprietaire === 'client') return 'Bien propre du client (acquis avant mariage)';
      if (proprietaire === 'conjoint') return 'Bien propre du conjoint (acquis avant mariage)';
      return 'Bien propre (acquis avant mariage)';
    } else {
      // Après mariage
      if (natureAcquisition === 'achat') {
        return 'Bien commun (acquis par achat après mariage)';
      }
      if (natureAcquisition === 'donation' || natureAcquisition === 'succession') {
        if (beneficiaire === 'client') {
          return `Bien propre du client (${natureAcquisition} après mariage)`;
        }
        if (beneficiaire === 'conjoint') {
          return `Bien propre du conjoint (${natureAcquisition} après mariage)`;
        }
        return `Bien propre (${natureAcquisition} après mariage)`;
      }
      return 'Bien commun (par défaut)';
    }
  }

  return 'Qualification juridique à déterminer';
}

/**
 * Valide la cohérence des données de détention
 */
export function validateDetention(
  familyInfo: FamilyInfo,
  proprietaire?: 'client' | 'conjoint' | 'indivision',
  natureAcquisition?: 'achat' | 'donation' | 'succession',
  beneficiaire?: 'client' | 'conjoint',
  dateAcquisition?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const context = getDetentionContext(familyInfo, dateAcquisition);

  // Validation du propriétaire
  if (context.showProprietaire && !proprietaire) {
    errors.push('Le propriétaire du bien doit être spécifié');
  }

  // Validation de la nature d'acquisition
  if (context.showNatureAcquisition && !natureAcquisition) {
    errors.push('La nature d\'acquisition doit être spécifiée');
  }

  // Validation du bénéficiaire (si donation/succession)
  if (
    context.showBeneficiaire &&
    (natureAcquisition === 'donation' || natureAcquisition === 'succession') &&
    !beneficiaire
  ) {
    errors.push('Le bénéficiaire doit être spécifié pour une donation ou succession');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
