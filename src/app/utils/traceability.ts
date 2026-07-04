/**
 * Utilitaires pour la traçabilité automatique
 * Ajout automatique de dateCreation et dateModification
 */

export interface Traceable {
  dateCreation?: string;
  dateModification?: string;
}

/**
 * Ajoute les timestamps de traçabilité à un objet
 * @param data L'objet à tracer
 * @param isCreation true si c'est une création, false si c'est une modification
 * @returns L'objet avec les timestamps ajoutés
 */
export function addTimestamps<T extends object>(
  data: T,
  isCreation: boolean = false
): T & Traceable {
  const now = new Date().toISOString();
  
  if (isCreation) {
    return {
      ...data,
      dateCreation: now,
      dateModification: now,
    };
  }
  
  return {
    ...data,
    dateModification: now,
  };
}

/**
 * Ajoute les timestamps à un tableau d'objets
 * Détecte automatiquement si c'est une création (pas de dateCreation) ou une modification
 */
export function addTimestampsToArray<T extends Traceable>(
  items: T[],
  existingItems: T[] = []
): T[] {
  return items.map(item => {
    // Trouver si l'item existe déjà
    const existing = existingItems.find(e => 
      (e as any).id === (item as any).id || 
      (e as any).name === (item as any).name
    );
    
    const isCreation = !existing || !item.dateCreation;
    return addTimestamps(item, isCreation);
  });
}

/**
 * Ajoute les timestamps de création uniquement aux nouveaux items
 */
export function markNewItems<T extends Traceable>(
  items: T[],
  existingItems: T[] = []
): T[] {
  return items.map(item => {
    // Si l'item a déjà une dateCreation, on garde les dates existantes
    if (item.dateCreation) {
      return {
        ...item,
        dateModification: new Date().toISOString(),
      };
    }
    
    // Sinon, c'est un nouvel item
    return addTimestamps(item, true);
  });
}
