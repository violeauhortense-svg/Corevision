// Re-export core montage functions (implementation moved to montages_core.tsx)
export {
  creerMontage,
  getMontage,
  updateMontage,
  deleteMontage,
  searchMontages,
  getAllMontages,
  getMontagesStats,
  getAllTags,
  importerMontages,
  deleteAllMontages,
} from './montages_core.tsx';

// Re-export types
export { MontagePatrimonial } from './shared/montage_types.ts';

// Re-export 60 professional montages for backward compatibility
export { MONTAGES_60_PROFESSIONNELS } from './montages_60_patrimoniaux.tsx';

// Alias for backward compatibility
export { MONTAGES_60_PROFESSIONNELS as MONTAGES_EXEMPLE } from './montages_60_patrimoniaux.tsx';
