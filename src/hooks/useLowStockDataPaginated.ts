import { useState, useEffect, useMemo } from 'react';
import { useTenantQuery } from './useTenantQuery';
import { useAlertThresholds } from './useAlertThresholds';
import { StockUpdateService } from '@/services/stockUpdateService';
import { StockValuationService } from '@/services/stockValuationService';
import { useStockSettings } from './useStockSettings';
import { useDebouncedValue } from './use-debounce';

export interface LowStockItem {
  id: string;
  tenant_id: string;
  codeProduit: string;
  nomProduit: string;
  dci: string;
  quantiteActuelle: number;
  seuilMinimum: number;
  seuilOptimal: number;
  unite: string;
  categorie: string;
  fournisseurPrincipal: string;
  prixUnitaire: number;
  valeurStock: number;
  dernierMouvement: Date | null;
  statut: 'critique' | 'faible' | 'attention';
  famille_id: string;
  rayon_id: string;
  rotation: 'rapide' | 'normale' | 'lente';
  jours_sans_mouvement: number;
}

export interface LowStockMetrics {
  totalItems: number;
  criticalItems: number;
  lowItems: number;
  attentionItems: number;
  totalValue: number;
  averageRotation: number;
  urgentActions: number;
}

interface UseLowStockDataPaginatedParams {
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const useLowStockDataPaginated = (params: UseLowStockDataPaginatedParams = {}) => {
  const {
    search = '',
    category = '',
    status = '',
    sortBy = 'statut',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = params;

  const { useTenantQueryWithCache } = useTenantQuery();
  const { thresholds } = useAlertThresholds();
  const { settings: stockSettings } = useStockSettings();
  
  const [allLowStockItems, setAllLowStockItems] = useState<LowStockItem[]>([]);
  const [metrics, setMetrics] = useState<LowStockMetrics>({
    totalItems: 0,
    criticalItems: 0,
    lowItems: 0,
    attentionItems: 0,
    totalValue: 0,
    averageRotation: 0,
    urgentActions: 0
  });

  const debouncedSearch = useDebouncedValue(search, 300);

  // Récupérer tous les produits avec leurs relations
  const { data: products = [], isLoading: isLoadingProducts, refetch } = useTenantQueryWithCache(
    ['products-for-low-stock-paginated'],
    'produits',
    `
      id, tenant_id, libelle_produit, code_cip,
      prix_achat, prix_vente_ttc, stock_limite, stock_alerte,
      famille_id, rayon_id, created_at, updated_at, is_active,
      famille_produit(id, libelle_famille),
      rayons_produits(id, libelle_rayon)
    `,
    { is_active: true }
  );

  // Récupérer les catégories pour les filtres
  const { data: categories = [] } = useTenantQueryWithCache(
    ['categories-for-low-stock-filters'],
    'famille_produit',
    'libelle_famille'
  );

  // Récupérer tous les lots en une seule requête pour optimiser les performances
  const { data: lots = [] } = useTenantQueryWithCache(
    ['lots-for-low-stock'],
    'lots',
    'produit_id, quantite_restante',
    { quantite_restante: { gt: 0 } }
  );

  // Process products to determine low stock status
  useEffect(() => {
    const processLowStockData = async () => {
      if (!products || products.length === 0) {
        setAllLowStockItems([]);
        return;
      }

      console.log('🔍 [LOW STOCK PAGINATED] Traitement de', products.length, 'produits avec', lots.length, 'lots');

      // Créer un mapping produit_id -> stock total (optimisation performance)
      const stockByProduct = lots.reduce((acc: Record<string, number>, lot: any) => {
        acc[lot.produit_id] = (acc[lot.produit_id] || 0) + lot.quantite_restante;
        return acc;
      }, {});

      const processedItems: LowStockItem[] = [];

      for (const product of products) {
        // Utiliser le mapping au lieu d'appeler le service
        const currentStock = stockByProduct[product.id] || 0;
        
        // Get category-specific threshold
        const categoryThreshold = thresholds?.find(t => 
          t.category === product.famille_produit?.libelle_famille && t.enabled
        );
        const effectiveThreshold = categoryThreshold?.threshold || product.stock_limite || 10;
        const optimalThreshold = product.stock_alerte || effectiveThreshold * 3;

        // Determine if this is a low stock item
        let stockStatus: 'critique' | 'faible' | 'attention' | null = null;
        
        if (currentStock === 0) {
          stockStatus = 'critique';
        } else if (currentStock <= Math.floor(effectiveThreshold * 0.3)) {
          stockStatus = 'critique';
        } else if (currentStock <= effectiveThreshold) {
          stockStatus = 'faible';
        } else if (currentStock <= Math.floor(effectiveThreshold * 1.5)) {
          stockStatus = 'attention';
        }

        // Only include items that are actually low in stock
        if (!stockStatus) continue;

        // Calculate stock value
        let stockValue = currentStock * (product.prix_achat || 0);
        if (stockSettings && currentStock > 0) {
          try {
            const valuation = await StockValuationService.calculateValuation(product.id, stockSettings);
            stockValue = valuation.totalValue;
          } catch (error) {
            console.warn('Valuation calculation failed:', error);
          }
        }

        // Determine rotation (simplified logic)
        const rotation: 'rapide' | 'normale' | 'lente' = 
          currentStock < effectiveThreshold * 0.5 ? 'rapide' :
          currentStock < effectiveThreshold ? 'normale' : 'lente';

        const lowStockItem: LowStockItem = {
          id: product.id,
          tenant_id: product.tenant_id,
          codeProduit: product.code_cip || '',
          nomProduit: product.libelle_produit,
          dci: product.libelle_produit, // Simplified
          quantiteActuelle: currentStock,
          seuilMinimum: effectiveThreshold,
          seuilOptimal: optimalThreshold,
          unite: 'unité',
          categorie: product.famille_produit?.libelle_famille || 'Non classé',
          fournisseurPrincipal: 'N/A',
          prixUnitaire: product.prix_achat || 0,
          valeurStock: stockValue,
          dernierMouvement: new Date(product.updated_at),
          statut: stockStatus,
          famille_id: product.famille_id,
          rayon_id: product.rayon_id,
          rotation,
          jours_sans_mouvement: Math.floor((Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        };

        processedItems.push(lowStockItem);
      }

      console.log('📊 [LOW STOCK PAGINATED] Items traités:', processedItems.length);
      setAllLowStockItems(processedItems);

      // Calculate metrics
      const newMetrics: LowStockMetrics = {
        totalItems: processedItems.length,
        criticalItems: processedItems.filter(item => item.statut === 'critique').length,
        lowItems: processedItems.filter(item => item.statut === 'faible').length,
        attentionItems: processedItems.filter(item => item.statut === 'attention').length,
        totalValue: processedItems.reduce((sum, item) => sum + item.valeurStock, 0),
        averageRotation: processedItems.length > 0 ? 
          processedItems.reduce((sum, item) => sum + item.jours_sans_mouvement, 0) / processedItems.length : 0,
        urgentActions: processedItems.filter(item => item.statut === 'critique').length
      };

      setMetrics(newMetrics);
    };

    processLowStockData();
  }, [products, lots, thresholds, stockSettings]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...allLowStockItems];

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.nomProduit.toLowerCase().includes(searchLower) ||
        item.codeProduit.toLowerCase().includes(searchLower) ||
        item.categorie.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (category && category !== '') {
      filtered = filtered.filter(item => item.famille_id === category);
    }

    // Apply status filter
    if (status && status !== '') {
      filtered = filtered.filter(item => item.statut === status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof LowStockItem];
      let bValue: any = b[sortBy as keyof LowStockItem];

      // Handle special sorting cases
      if (sortBy === 'nomProduit') {
        aValue = a.nomProduit;
        bValue = b.nomProduit;
      } else if (sortBy === 'quantiteActuelle') {
        aValue = a.quantiteActuelle;
        bValue = b.quantiteActuelle;
      } else if (sortBy === 'seuilMinimum') {
        aValue = a.seuilMinimum;
        bValue = b.seuilMinimum;
      } else if (sortBy === 'valeurStock') {
        aValue = a.valeurStock;
        bValue = b.valeurStock;
      } else if (sortBy === 'dernierMouvement') {
        aValue = a.dernierMouvement ? new Date(a.dernierMouvement).getTime() : 0;
        bValue = b.dernierMouvement ? new Date(b.dernierMouvement).getTime() : 0;
      } else if (sortBy === 'statut') {
        const statusOrder = { 'critique': 3, 'faible': 2, 'attention': 1 };
        aValue = statusOrder[a.statut];
        bValue = statusOrder[b.statut];
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [allLowStockItems, debouncedSearch, category, status, sortBy, sortOrder]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, page, limit]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / limit);
  const totalItems = filteredAndSortedItems.length;

  return {
    lowStockItems: paginatedItems,
    allItemsCount: totalItems,
    metrics,
    categories,
    totalPages,
    isLoading: isLoadingProducts,
    refetch,
    filters: {
      search: debouncedSearch,
      category,
      status
    }
  };
};