/**
 * Utilitaires pour optimiser les requêtes Supabase
 * et éviter les URLs trop longues avec .in()
 */

/**
 * Divise un tableau d'IDs en batches pour éviter les URLs trop longues
 * @param ids - Tableau d'IDs
 * @param batchSize - Taille maximale par batch (défaut: 100)
 */
export const splitIntoBatches = <T>(ids: T[], batchSize: number = 100): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Exécute une requête Supabase avec batching automatique
 * Utile pour les requêtes .in() avec de nombreux IDs
 * @param ids - Tableau d'IDs à traiter
 * @param queryFn - Fonction qui exécute la requête pour un batch d'IDs
 * @param batchSize - Taille maximale par batch (défaut: 100)
 * @returns Tableau combiné de tous les résultats
 */
export const batchQuery = async <T>(
  ids: string[],
  queryFn: (batch: string[]) => Promise<T[]>,
  batchSize: number = 100
): Promise<T[]> => {
  const batches = splitIntoBatches(ids, batchSize);
  const results: T[] = [];
  
  for (const batch of batches) {
    try {
      const data = await queryFn(batch);
      results.push(...data);
    } catch (error) {
      console.error('Erreur batch query:', error);
    }
  }
  
  return results;
};
