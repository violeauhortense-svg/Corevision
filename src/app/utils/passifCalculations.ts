/**
 * Utilitaires de calcul pour les passifs (emprunts)
 */

/**
 * Calcule la date de fin d'un emprunt
 * @param dateDebut - Date de début de l'emprunt (format ISO)
 * @param nombreEcheances - Nombre total d'échéances (mensualités)
 * @returns Date de fin au format ISO
 */
export function calculerDateFin(dateDebut: string, nombreEcheances: number): string {
  const date = new Date(dateDebut);
  date.setMonth(date.getMonth() + nombreEcheances);
  return date.toISOString().split('T')[0];
}

/**
 * Calcule le capital restant dû d'un emprunt
 * Formule: CRD = Capital × [(1 + t)^n - (1 + t)^p] / [(1 + t)^n - 1]
 * où:
 * - Capital = capital initial
 * - t = taux mensuel (taux annuel / 12)
 * - n = nombre total d'échéances
 * - p = nombre d'échéances payées
 * 
 * @param capitalInitial - Montant emprunté
 * @param tauxAnnuel - Taux d'intérêt annuel (en décimal, ex: 0.02 pour 2%)
 * @param nombreEcheances - Nombre total d'échéances
 * @param dateDebut - Date de début de l'emprunt
 * @returns Capital restant dû
 */
export function calculerCapitalRestantDu(
  capitalInitial: number,
  tauxAnnuel: number,
  nombreEcheances: number,
  dateDebut: string
): number {
  // Calculer le nombre d'échéances déjà payées
  const debut = new Date(dateDebut);
  const maintenant = new Date();
  const moisEcoules = Math.max(0, (maintenant.getFullYear() - debut.getFullYear()) * 12 + 
                                   (maintenant.getMonth() - debut.getMonth()));
  const echeancesPayees = Math.min(moisEcoules, nombreEcheances);
  
  // Si l'emprunt n'a pas encore commencé
  if (echeancesPayees <= 0) {
    return capitalInitial;
  }
  
  // Si toutes les échéances sont payées
  if (echeancesPayees >= nombreEcheances) {
    return 0;
  }
  
  // Taux mensuel
  const tauxMensuel = tauxAnnuel / 12;
  
  // Si taux = 0, calcul simplifié
  if (tauxMensuel === 0) {
    return capitalInitial * (1 - echeancesPayees / nombreEcheances);
  }
  
  // Formule du capital restant dû
  const facteur1 = Math.pow(1 + tauxMensuel, nombreEcheances);
  const facteur2 = Math.pow(1 + tauxMensuel, echeancesPayees);
  
  const crd = capitalInitial * (facteur1 - facteur2) / (facteur1 - 1);
  
  return Math.max(0, Math.round(crd * 100) / 100);
}

/**
 * Calcule la mensualité d'un emprunt
 * Formule: M = Capital × t × (1 + t)^n / [(1 + t)^n - 1]
 * 
 * @param capitalInitial - Montant emprunté
 * @param tauxAnnuel - Taux d'intérêt annuel (en décimal)
 * @param nombreEcheances - Nombre total d'échéances
 * @returns Mensualité
 */
export function calculerMensualite(
  capitalInitial: number,
  tauxAnnuel: number,
  nombreEcheances: number
): number {
  const tauxMensuel = tauxAnnuel / 12;
  
  if (tauxMensuel === 0) {
    return capitalInitial / nombreEcheances;
  }
  
  const facteur = Math.pow(1 + tauxMensuel, nombreEcheances);
  const mensualite = capitalInitial * tauxMensuel * facteur / (facteur - 1);
  
  return Math.round(mensualite * 100) / 100;
}

/**
 * Ajoute automatiquement 1 an à une date de signature pour calculer l'expiration
 * @param dateSignature - Date de signature (format ISO)
 * @returns Date d'expiration au format ISO
 */
export function calculerDateExpiration(dateSignature: string): string {
  const date = new Date(dateSignature);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}
