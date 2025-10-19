import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface OutOfStockItem {
  id: string;
  tenant_id: string;
  code_cip: string;
  libelle_produit: string;
  famille_libelle: string;
  rayon_libelle: string;
  rotation: 'rapide' | 'normale' | 'lente';
  date_derniere_sortie?: string;
  prix_vente_ttc: number;
  prix_achat: number;
  stock_limite: number;
  stock_alerte: number;
  stock_actuel: number;
  statut_stock: 'normal' | 'faible' | 'critique' | 'rupture' | 'surstock';
  valeur_stock: number;
}

export interface OutOfStockMetrics {
  totalItems: number;
  criticalItems: number;
  rapidRotationItems: number;
  recentOutOfStockItems: number;
  totalPotentialLoss: number;
}

interface UseOutOfStockDataPaginatedParams {
  search?: string;
  rotation?: string;
  urgency?: string;
  sortBy?: 'libelle_produit' | 'date_derniere_sortie' | 'rotation' | 'potential_loss' | 'days_out_of_stock';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Fonction pour calculer la rotation en batch pour tous les produits
const calculateProductRotationsBatch = async (productIds: string[], tenantId: string): Promise<Record<string, 'rapide' | 'normale' | 'lente'>> => {
  try {
    if (productIds.length === 0) return {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let allMovements: any[] = [];
    const batchSize = 100; // Réduit pour éviter les URLs trop longues (erreur 400)

    // Récupérer les mouvements par batch pour éviter les limites d'URL
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const { data: movements } = await supabase
        .from('mouvements_lots')
        .select('produit_id, quantite_mouvement')
        .eq('tenant_id', tenantId)
        .in('produit_id', batch)
        .eq('type_mouvement', 'sortie')
        .gte('date_mouvement', thirtyDaysAgo.toISOString());
      
      if (movements) {
        allMovements = [...allMovements, ...movements];
      }
    }

    // Calculer la rotation pour chaque produit
    const rotationByProduct: Record<string, 'rapide' | 'normale' | 'lente'> = {};
    const salesByProduct = allMovements.reduce((acc, m) => {
      if (!acc[m.produit_id]) acc[m.produit_id] = 0;
      acc[m.produit_id] += m.quantite_mouvement || 0;
      return acc;
    }, {} as Record<string, number>);

    productIds.forEach(id => {
      const totalSales = salesByProduct[id] || 0;
      if (totalSales >= 100) rotationByProduct[id] = 'rapide';
      else if (totalSales >= 30) rotationByProduct[id] = 'normale';
      else rotationByProduct[id] = 'lente';
    });

    return rotationByProduct;
  } catch {
    return productIds.reduce((acc, id) => ({ ...acc, [id]: 'normale' as const }), {});
  }
};

export const useOutOfStockDataPaginated = (params: UseOutOfStockDataPaginatedParams = {}) => {
  const {
    search = '',
    rotation = '',
    urgency = '',
    sortBy = 'date_derniere_sortie',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = params;

  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Charger TOUS les produits en rupture avec pagination serveur
  const { data: allOutOfStockProducts = [], isLoading, refetch: refetchQuery } = useQuery({
    queryKey: ['all-out-of-stock-products', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      let allProducts: any[] = [];
      let currentPage = 0;
      const pageSize = 1000;
      let hasMore = true;

      // Charger tous les produits par batch de 1000
      while (hasMore) {
        const { data: products, error } = await supabase
          .from('produits')
          .select(`
            id, code_cip, libelle_produit,
            prix_vente_ttc, prix_achat, stock_limite, stock_alerte,
            famille_id, rayon_id, updated_at,
            famille_produit(libelle_famille),
            rayons_produits(libelle_rayon),
            lots(quantite_restante)
          `)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        if (error) throw error;

        if (products && products.length > 0) {
          allProducts = [...allProducts, ...products];
          hasMore = products.length === pageSize;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      // Filtrer uniquement les produits en rupture (stock = 0)
      const outOfStockProductsData = allProducts.filter((product: any) => {
        const lots = product.lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => sum + (lot.quantite_restante || 0), 0);
        return stock_actuel === 0;
      });

      // Calculer la rotation en batch (1 seule série de requêtes au lieu de N requêtes)
      const productIds = outOfStockProductsData.map((p: any) => p.id);
      const rotationByProduct = await calculateProductRotationsBatch(productIds, tenantId);

      // Mapper les produits avec leur rotation
      const outOfStockProducts = outOfStockProductsData.map((product: any) => {
        return {
          id: product.id,
          tenant_id: tenantId,
          code_cip: product.code_cip || '',
          libelle_produit: product.libelle_produit,
          famille_libelle: product.famille_produit?.libelle_famille || 'N/A',
          rayon_libelle: product.rayons_produits?.libelle_rayon || 'N/A',
          rotation: rotationByProduct[product.id] || 'normale',
          date_derniere_sortie: product.updated_at,
          prix_vente_ttc: product.prix_vente_ttc || 0,
          prix_achat: product.prix_achat || 0,
          stock_limite: product.stock_limite || 0,
          stock_alerte: product.stock_alerte || 0,
          stock_actuel: 0,
          statut_stock: 'rupture' as const,
          valeur_stock: 0
        } as OutOfStockItem;
      });

      return outOfStockProducts;
    },
    enabled: !!tenantId,
    staleTime: 30000, // Cache de 30 secondes
  });

  // Calculer les métriques localement
  const metrics: OutOfStockMetrics = useMemo(() => {
    const totalItems = allOutOfStockProducts.length;
    
    const rapidRotationItems = allOutOfStockProducts.filter(
      p => p.rotation === 'rapide'
    ).length;

    // Ruptures critiques = rotation rapide
    const criticalItems = rapidRotationItems;

    // Ruptures récentes (dernière semaine)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentOutOfStockItems = allOutOfStockProducts.filter(
      p => p.date_derniere_sortie && new Date(p.date_derniere_sortie) >= oneWeekAgo
    ).length;

    // Perte potentielle totale
    const totalPotentialLoss = allOutOfStockProducts.reduce(
      (sum, p) => sum + (p.prix_vente_ttc * p.stock_limite), 0
    );

    return {
      totalItems,
      criticalItems,
      rapidRotationItems,
      recentOutOfStockItems,
      totalPotentialLoss
    };
  }, [allOutOfStockProducts]);

  // Filtrage et tri des données
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...allOutOfStockProducts];

    // Filtrage par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.libelle_produit.toLowerCase().includes(searchLower) ||
        item.code_cip.toLowerCase().includes(searchLower) ||
        item.famille_libelle.toLowerCase().includes(searchLower)
      );
    }

    // Filtrage par rotation
    if (rotation) {
      filtered = filtered.filter(item => item.rotation === rotation);
    }

    // Filtrage par urgence
    if (urgency) {
      const getDaysSinceLastStock = (lastExitDate: string | undefined) => {
        if (!lastExitDate) return null;
        return Math.floor((Date.now() - new Date(lastExitDate).getTime()) / (1000 * 60 * 60 * 24));
      };

      const getUrgencyLevel = (lastExitDate: string | undefined, rotation: string) => {
        const days = getDaysSinceLastStock(lastExitDate);
        if (!days) return 'unknown';
        
        if (rotation === 'rapide' && days > 3) return 'critical';
        if (rotation === 'normale' && days > 7) return 'high';
        if (days > 14) return 'medium';
        return 'low';
      };

      filtered = filtered.filter(item => getUrgencyLevel(item.date_derniere_sortie, item.rotation) === urgency);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'libelle_produit':
          aValue = a.libelle_produit.toLowerCase();
          bValue = b.libelle_produit.toLowerCase();
          break;
        case 'date_derniere_sortie':
          aValue = a.date_derniere_sortie ? new Date(a.date_derniere_sortie).getTime() : 0;
          bValue = b.date_derniere_sortie ? new Date(b.date_derniere_sortie).getTime() : 0;
          break;
        case 'rotation':
          const rotationPriority = { rapide: 3, normale: 2, lente: 1 };
          aValue = rotationPriority[a.rotation];
          bValue = rotationPriority[b.rotation];
          break;
        case 'potential_loss':
          aValue = a.prix_vente_ttc * a.stock_limite;
          bValue = b.prix_vente_ttc * b.stock_limite;
          break;
        case 'days_out_of_stock':
          const getDays = (date: string | undefined) => {
            if (!date) return 0;
            return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
          };
          aValue = getDays(a.date_derniere_sortie);
          bValue = getDays(b.date_derniere_sortie);
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allOutOfStockProducts, search, rotation, urgency, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Fonction de rafraîchissement améliorée
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['all-out-of-stock-products', tenantId] });
    refetchQuery();
  };

  return {
    outOfStockItems: paginatedData,
    allItemsCount: filteredAndSortedData.length,
    metrics,
    totalPages,
    currentPage: page,
    isLoading,
    refetch,
  };
};