import * as kv from './kv_store.tsx';
import { MONTAGES_60_PROFESSIONNELS } from './montages_60_patrimoniaux.tsx';

// Types
export interface MontagePatrimonial {
  id: string;
  nom_montage: string;
  objectif: string;
  conditions: string;
  avantages: string;
  risques: string;
  etapes_juridiques: string;
  fiscalite: string;
  source: string;
  date_creation: string;
  date_modification: string;
  tags?: string[]; // Pour catégoriser les montages
  complexite?: 'simple' | 'moyen' | 'complexe';
  statut?: 'actif' | 'obsolète' | 'à_vérifier';
}

/**
 * Créer un nouveau montage patrimonial
 */
export async function creerMontage(montage: Omit<MontagePatrimonial, 'id' | 'date_creation' | 'date_modification'>): Promise<{
  success: boolean;
  montage?: MontagePatrimonial;
  error?: string;
}> {

  try {
    // Générer un ID unique
    const id = `montage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const now = new Date().toISOString();

    const nouveauMontage: MontagePatrimonial = {
      ...montage,
      id,
      date_creation: now,
      date_modification: now,
      tags: montage.tags || [],
      complexite: montage.complexite || 'moyen',
      statut: montage.statut || 'actif',
    };

    // Stocker dans le KV store
    const key = `montage_patrimonial:${id}`;
    await kv.set(key, nouveauMontage);


    return {
      success: true,
      montage: nouveauMontage
    };

  } catch (error) {
    console.error('❌ Erreur création montage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Obtenir un montage par son ID ou son nom
 */
export async function getMontage(montageIdOrName: string): Promise<MontagePatrimonial | null> {

  try {
    // 1. Essayer de récupérer par ID dans le KV store
    const key = `montage_patrimonial:${montageIdOrName}`;
    const montageFromKV = await kv.get(key) as MontagePatrimonial | null;

    if (montageFromKV) {
      return montageFromKV;
    }

    // 2. Si non trouvé, chercher dans les montages statiques par nom
    const montageStatique = MONTAGES_60_PROFESSIONNELS.find(
      m => m.nom_montage === montageIdOrName || m.nom_montage.toLowerCase() === montageIdOrName.toLowerCase()
    );

    if (montageStatique) {
      // Créer un montage complet avec un ID temporaire
      const montageComplet: MontagePatrimonial = {
        ...montageStatique,
        id: `static_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };
      return montageComplet;
    }

    return null;

  } catch (error) {
    console.error('❌ Erreur récupération montage:', error);
    return null;
  }
}

/**
 * Mettre à jour un montage existant
 */
export async function updateMontage(
  montageId: string,
  updates: Partial<Omit<MontagePatrimonial, 'id' | 'date_creation'>>
): Promise<{
  success: boolean;
  montage?: MontagePatrimonial;
  error?: string;
}> {

  try {
    const montageExistant = await getMontage(montageId);

    if (!montageExistant) {
      return {
        success: false,
        error: 'Montage non trouvé'
      };
    }

    const montageModifie: MontagePatrimonial = {
      ...montageExistant,
      ...updates,
      id: montageExistant.id, // Ne pas modifier l'ID
      date_creation: montageExistant.date_creation, // Ne pas modifier la date de création
      date_modification: new Date().toISOString(),
    };

    const key = `montage_patrimonial:${montageId}`;
    await kv.set(key, montageModifie);


    return {
      success: true,
      montage: montageModifie
    };

  } catch (error) {
    console.error('❌ Erreur mise à jour montage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Supprimer un montage
 */
export async function deleteMontage(montageId: string): Promise<{
  success: boolean;
  error?: string;
}> {

  try {
    const montageExistant = await getMontage(montageId);

    if (!montageExistant) {
      return {
        success: false,
        error: 'Montage non trouvé'
      };
    }

    const key = `montage_patrimonial:${montageId}`;
    await kv.del(key);


    return { success: true };

  } catch (error) {
    console.error('❌ Erreur suppression montage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Rechercher des montages patrimoniaux
 */
export async function searchMontages(
  query?: string,
  objectif?: string,
  complexite?: string,
  statut?: string,
  tags?: string[]
): Promise<MontagePatrimonial[]> {

  try {
    // Récupérer tous les montages
    const allItems = await kv.getByPrefix('montage_patrimonial:');

    let montages: MontagePatrimonial[] = allItems.map(item => item.value as MontagePatrimonial);

    // Filtrer par statut
    if (statut) {
      montages = montages.filter(m => m.statut === statut);
    }

    // Filtrer par complexité
    if (complexite) {
      montages = montages.filter(m => m.complexite === complexite);
    }

    // Filtrer par objectif (contient le texte)
    if (objectif && objectif.trim()) {
      const objectifLower = objectif.toLowerCase();
      montages = montages.filter(m => 
        m.objectif.toLowerCase().includes(objectifLower)
      );
    }

    // Filtrer par tags
    if (tags && tags.length > 0) {
      montages = montages.filter(m => {
        if (!m.tags) return false;
        return tags.some(tag => m.tags!.includes(tag));
      });
    }

    // Filtrer par query (recherche dans tous les champs texte)
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      montages = montages.filter(m =>
        m.nom_montage.toLowerCase().includes(queryLower) ||
        m.objectif.toLowerCase().includes(queryLower) ||
        m.conditions.toLowerCase().includes(queryLower) ||
        m.avantages.toLowerCase().includes(queryLower) ||
        m.risques.toLowerCase().includes(queryLower) ||
        m.fiscalite.toLowerCase().includes(queryLower) ||
        m.source.toLowerCase().includes(queryLower) ||
        (m.tags && m.tags.some(tag => tag.toLowerCase().includes(queryLower)))
      );
    }

    // Trier par date de modification (plus récent d'abord)
    montages.sort((a, b) => {
      const dateA = new Date(a.date_modification).getTime();
      const dateB = new Date(b.date_modification).getTime();
      return dateB - dateA;
    });

    return montages;

  } catch (error) {
    console.error('❌ Erreur recherche montages:', error);
    return [];
  }
}

/**
 * Obtenir tous les montages (alias pour searchMontages sans filtres)
 */
export async function getAllMontages(): Promise<MontagePatrimonial[]> {
  return searchMontages();
}

/**
 * Obtenir les statistiques des montages
 */
export async function getMontagesStats() {
  try {
    const allMontages = await getAllMontages();

    // Compter par statut
    const byStatut = {
      actif: allMontages.filter(m => m.statut === 'actif').length,
      obsolète: allMontages.filter(m => m.statut === 'obsolète').length,
      à_vérifier: allMontages.filter(m => m.statut === 'à_vérifier').length
    };

    // Compter par complexité
    const byComplexite = {
      simple: allMontages.filter(m => m.complexite === 'simple').length,
      moyen: allMontages.filter(m => m.complexite === 'moyen').length,
      complexe: allMontages.filter(m => m.complexite === 'complexe').length
    };

    // Compter les tags uniques
    const allTags = new Set<string>();
    allMontages.forEach(m => {
      if (m.tags) {
        m.tags.forEach(tag => allTags.add(tag));
      }
    });

    // Top 10 tags les plus utilisés
    const tagsCounts: Record<string, number> = {};
    allMontages.forEach(m => {
      if (m.tags) {
        m.tags.forEach(tag => {
          tagsCounts[tag] = (tagsCounts[tag] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      total_montages: allMontages.length,
      by_statut: byStatut,
      by_complexite: byComplexite,
      total_tags_uniques: allTags.size,
      top_tags: topTags
    };

  } catch (error) {
    console.error('❌ Erreur récupération stats montages:', error);
    return {
      total_montages: 0,
      by_statut: { actif: 0, obsolète: 0, à_vérifier: 0 },
      by_complexite: { simple: 0, moyen: 0, complexe: 0 },
      total_tags_uniques: 0,
      top_tags: []
    };
  }
}

/**
 * Obtenir tous les tags uniques
 */
export async function getAllTags(): Promise<string[]> {
  try {
    const allMontages = await getAllMontages();

    const tagsSet = new Set<string>();
    allMontages.forEach(m => {
      if (m.tags) {
        m.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    const tags = Array.from(tagsSet).sort();

    return tags;

  } catch (error) {
    console.error('❌ Erreur récupération tags:', error);
    return [];
  }
}

/**
 * Importer des montages en masse (pour pré-remplir la base)
 */
export async function importerMontages(montages: Omit<MontagePatrimonial, 'id' | 'date_creation' | 'date_modification'>[]): Promise<{
  success: boolean;
  imported: number;
  errors: string[];
}> {

  const errors: string[] = [];
  let imported = 0;

  for (const montage of montages) {
    try {
      const result = await creerMontage(montage);
      if (result.success) {
        imported++;
      } else {
        errors.push(`Erreur import ${montage.nom_montage}: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = `Erreur import ${montage.nom_montage}: ${error instanceof Error ? error.message : 'Unknown'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }


  return {
    success: errors.length === 0,
    imported,
    errors
  };
}

/**
 * Supprimer tous les montages (pour réinitialiser)
 */
export async function deleteAllMontages(): Promise<{ deleted: number }> {

  try {
    const allItems = await kv.getByPrefix('montage_patrimonial:');
    
    for (const item of allItems) {
      await kv.del(item.key);
    }

    return { deleted: allItems.length };

  } catch (error) {
    console.error('❌ Erreur suppression montages:', error);
    return { deleted: 0 };
  }
}

/**
 * Données exemple de montages patrimoniaux classiques
 * 60 montages professionnels couvrant 7 domaines
 */
export const MONTAGES_EXEMPLE = MONTAGES_60_PROFESSIONNELS;
