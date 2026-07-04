/**
 * Fonctions utilitaires pour la pré-analyse patrimoniale
 */

export const getScoreColor = (score: number): string => {
  if (score >= 75) return 'text-green-600 bg-green-50 border-green-300';
  if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-300';
  return 'text-red-600 bg-red-50 border-red-300';
};

export const getSeveriteColor = (severite: 'high' | 'medium' | 'low'): string => {
  if (severite === 'high') return 'bg-red-100 border-red-400 text-red-900';
  if (severite === 'medium') return 'bg-orange-100 border-orange-400 text-orange-900';
  return 'bg-yellow-100 border-yellow-400 text-yellow-900';
};

export const formatEuro = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(value);
};
