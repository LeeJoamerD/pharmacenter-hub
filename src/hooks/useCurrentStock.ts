import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTenantQuery } from './useTenantQuery';
import { useStockSettings } from './useStockSettings';
import { useAlertThresholds } from './useAlertThresholds';
import { StockValuationService } from '@/services/stockValuationService';
import { StockUpdateService } from '@/services/stockUpdateService';
import { useDebounce } from '@/utils/supplyChainOptimizations';
import { measurePerformance, getCurrentTenantId } from '@/utils/tenantValidation';
import { StockCacheManager } from '@/utils/stockCacheUtils';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentStockItem {
  id: string;
  tenant_id: string;
  libelle_produit: string;
  code_cip: string;
  famille_id?: string;
  famille_libelle?: string;
  rayon_id?: string;
  rayon_libelle?: string;
  prix_achat: number;
  prix_vente_ttc: number;
  stock_actuel: number;
  stock_limite: number;
  stock_alerte: number;
  date_derniere_entree?: string;
  date_derniere_sortie?: string;
  valeur_stock: number;
  statut_stock: 'normal' | 'faible' | 'critique' | 'rupture' | 'surstock';
  rotation: 'rapide' | 'normale' | 'lente';
  lots_expires_prochainement?: number;
}

export interface StockAlert {
  id: string;
  type: 'rupture' | 'stock_faible' | 'surstock' | 'expiration';
  produit_id: string;
  produit_libelle: string;
  niveau_alerte: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  stock_actuel: number;
  stock_minimum?: number;
  stock_maximum?: number;
  jours_avant_expiration?: number;
}

export const useCurrentStock = () => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const queryClient = useQueryClient();
  const { settings: stockSettings } = useStockSettings();
  const { thresholds } = useAlertThresholds();
  
  // Setup realtime listeners for automatic cache invalidation
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const setupListeners = async () => {
      const tenantId = await getCurrentTenantId();
      if (tenantId) {
        cleanup = StockCacheManager.setupRealtimeListeners(queryClient, tenantId, supabase);
      }
    };
    
    setupListeners();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [queryClient]);
  
  // Manual refresh function
  const refreshData = () => {
    StockCacheManager.invalidateAllStockQueries(queryClient);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedRayon, setSelectedRayon] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'out' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value' | 'rotation'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [stockData, setStockData] = useState<CurrentStockItem[]>([]);
  
  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFamily, selectedRayon, stockFilter, sortBy]);
  
  // Debounced search term (500ms)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Produits avec stock actuel
  const { data: products = [], isLoading, refetch } = useTenantQueryWithCache(
    ['current-stock'],
    'produits',
    `
      id, tenant_id, libelle_produit, code_cip, famille_id, rayon_id,
      prix_achat, prix_vente_ttc, stock_limite, stock_alerte,
      created_at, updated_at, is_active,
      famille_produit!fk_produits_famille_id(id, libelle_famille),
      rayons_produits(id, libelle_rayon)
    `,
    { is_active: true }
  );

  // Récupérer les lots pour calculer le stock réel (tous les lots, même ceux à 0)
  const { data: lots = [] } = useTenantQueryWithCache(
    ['lots'],
    'lots',
    'produit_id, quantite_restante'
  );

  // Récupérer les mouvements de stock pour les dates réelles
  const { data: stockMovements = [] } = useTenantQueryWithCache(
    ['stock-movements-dates'],
    'stock_mouvements',
    'produit_id, date_mouvement, type_mouvement'
  );

  // Familles de produits pour les filtres
  const { data: families = [] } = useTenantQueryWithCache(
    ['product-families'],
    'famille_produit',
    'id, libelle_famille'
  );

  // Rayons pour les filtres
  const { data: rayons = [] } = useTenantQueryWithCache(
    ['product-rayons'],
    'rayons_produits',
    'id, libelle_rayon'
  );

  // Process products with stock calculation from lots
  useEffect(() => {
    const processProducts = async () => {
      if (!products || products.length === 0) {
        setStockData([]);
        return;
      }

      console.log('🔍 Traitement de', products.length, 'produits avec', lots.length, 'lots');

      // Créer un mapping produit_id -> stock total depuis les lots
      const stockByProduct = lots.reduce((acc: Record<string, number>, lot: any) => {
        acc[lot.produit_id] = (acc[lot.produit_id] || 0) + lot.quantite_restante;
        return acc;
      }, {});

      // Créer des mappings pour les vraies dates de mouvements
      const lastEntryByProduct: Record<string, string> = {};
      const lastExitByProduct: Record<string, string> = {};
      
      stockMovements.forEach((movement: any) => {
        if (movement.type_mouvement === 'entree') {
          if (!lastEntryByProduct[movement.produit_id] || 
              movement.date_mouvement > lastEntryByProduct[movement.produit_id]) {
            lastEntryByProduct[movement.produit_id] = movement.date_mouvement;
          }
        } else if (movement.type_mouvement === 'sortie') {
          if (!lastExitByProduct[movement.produit_id] || 
              movement.date_mouvement > lastExitByProduct[movement.produit_id]) {
            lastExitByProduct[movement.produit_id] = movement.date_mouvement;
          }
        }
      });

      console.log('📦 Stock par produit:', stockByProduct);
      console.log('📅 Dates dernières entrées:', Object.keys(lastEntryByProduct).length);
      console.log('📅 Dates dernières sorties:', Object.keys(lastExitByProduct).length);

      const processedProducts: CurrentStockItem[] = [];

      for (const product of products) {
        // Récupérer le stock depuis le mapping (déjà filtré par tenant)
        const currentStock = stockByProduct[product.id] || 0;
        
        // Get category-specific threshold if available
        const categoryThreshold = thresholds?.find(t => 
          t.category === product.famille_produit?.libelle_famille && t.enabled
        );
        const effectiveThreshold = categoryThreshold?.threshold || product.stock_limite || 10;
        
        // Calculate stock value using configured valuation method
        let stockValue = currentStock * (product.prix_achat || 0);
        if (stockSettings && currentStock > 0) {
          try {
            const valuation = await StockValuationService.calculateValuation(product.id, stockSettings);
            stockValue = valuation.totalValue;
          } catch (error) {
            console.warn('Valuation calculation failed, using simple method:', error);
          }
        }

        // Determine stock status using enhanced logic
        let stockStatus: CurrentStockItem['statut_stock'] = 'normal';
        if (currentStock === 0) {
          stockStatus = 'rupture';
        } else if (currentStock <= Math.floor(effectiveThreshold * 0.3)) {
          stockStatus = 'critique';
        } else if (currentStock <= effectiveThreshold) {
          stockStatus = 'faible';
        } else if (currentStock >= (product.stock_alerte || 100)) {
          stockStatus = 'surstock';
        }

        // Enhanced rotation calculation avec les vraies dates
        let rotation: CurrentStockItem['rotation'] = 'normale';
        const lastExitDate = lastExitByProduct[product.id];
        const daysSinceLastMovement = lastExitDate
          ? Math.floor((Date.now() - new Date(lastExitDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        const slowMovingDays = stockSettings?.minimum_stock_days || 30;
        if (daysSinceLastMovement < 7) rotation = 'rapide';
        else if (daysSinceLastMovement > slowMovingDays) rotation = 'lente';

        processedProducts.push({
          id: product.id,
          tenant_id: product.tenant_id,
          libelle_produit: product.libelle_produit,
          code_cip: product.code_cip || '',
          famille_id: product.famille_id,
          famille_libelle: product.famille_produit?.libelle_famille,
          rayon_id: product.rayon_id,
          rayon_libelle: product.rayons_produits?.libelle_rayon,
          prix_achat: product.prix_achat || 0,
          prix_vente_ttc: product.prix_vente_ttc || 0,
          stock_actuel: currentStock,
          stock_limite: effectiveThreshold,
          stock_alerte: product.stock_alerte || 100,
          date_derniere_entree: lastEntryByProduct[product.id],
          date_derniere_sortie: lastExitByProduct[product.id],
          valeur_stock: stockValue,
          statut_stock: stockStatus,
          rotation
        });
      }

      console.log('✅ Produits traités:', processedProducts.length, '| Disponibles:', processedProducts.filter(p => p.stock_actuel > 0).length);
      setStockData(processedProducts);
    };

    processProducts();
  }, [products, lots, stockMovements, stockSettings, thresholds]);

  // Filtrage, tri et pagination des produits
  const filteredAndSortedProducts = useMemo(() => {
    let result = stockData.filter(product => {
      // Filtre par terme de recherche (debounced)
      if (debouncedSearchTerm && 
          !product.libelle_produit.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
          !product.code_cip.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par famille
      if (selectedFamily && selectedFamily !== 'all' && product.famille_id !== selectedFamily) {
        return false;
      }

      // Filtre par rayon
      if (selectedRayon && selectedRayon !== 'all' && product.rayon_id !== selectedRayon) {
        return false;
      }

      // Filtre par statut de stock
      switch (stockFilter) {
        case 'available':
          return product.stock_actuel > 0;
        case 'low':
          return product.statut_stock === 'faible';
        case 'out':
          return product.statut_stock === 'rupture';
        case 'critical':
          return product.statut_stock === 'critique';
        default:
          return true;
      }
    });

    // Tri des produits
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.libelle_produit.localeCompare(b.libelle_produit);
          break;
        case 'stock':
          comparison = a.stock_actuel - b.stock_actuel;
          break;
        case 'value':
          comparison = a.valeur_stock - b.valeur_stock;
          break;
        case 'rotation':
          const rotationOrder = { rapide: 3, normale: 2, lente: 1 };
          comparison = rotationOrder[a.rotation] - rotationOrder[b.rotation];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [stockData, debouncedSearchTerm, selectedFamily, selectedRayon, stockFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage]);

  // Génération des alertes
  const generateAlerts = (products: CurrentStockItem[]): StockAlert[] => {
    const alerts: StockAlert[] = [];

    products.forEach(product => {
      if (product.statut_stock === 'rupture') {
        alerts.push({
          id: `rupture-${product.id}`,
          type: 'rupture',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'critical',
          message: `Produit en rupture de stock`,
          stock_actuel: product.stock_actuel
        });
      } else if (product.statut_stock === 'critique') {
        alerts.push({
          id: `critique-${product.id}`,
          type: 'stock_faible',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'danger',
          message: `Stock critique: ${product.stock_actuel} unités restantes`,
          stock_actuel: product.stock_actuel,
          stock_minimum: product.stock_limite
        });
      } else if (product.statut_stock === 'faible') {
        alerts.push({
          id: `faible-${product.id}`,
          type: 'stock_faible',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'warning',
          message: `Stock faible: ${product.stock_actuel} unités restantes`,
          stock_actuel: product.stock_actuel,
          stock_minimum: product.stock_limite
        });
      } else if (product.statut_stock === 'surstock') {
        alerts.push({
          id: `surstock-${product.id}`,
          type: 'surstock',
          produit_id: product.id,
          produit_libelle: product.libelle_produit,
          niveau_alerte: 'info',
          message: `Surstock détecté: ${product.stock_actuel} unités`,
          stock_actuel: product.stock_actuel,
          stock_maximum: product.stock_alerte
        });
      }
    });

    return alerts;
  };

  // Métriques calculées
  const metrics = {
    totalProducts: filteredAndSortedProducts.length,
    availableProducts: filteredAndSortedProducts.filter(p => p.stock_actuel > 0).length,
    lowStockProducts: filteredAndSortedProducts.filter(p => p.statut_stock === 'faible').length,
    outOfStockProducts: filteredAndSortedProducts.filter(p => p.statut_stock === 'rupture').length,
    criticalStockProducts: filteredAndSortedProducts.filter(p => p.statut_stock === 'critique').length,
    totalStockValue: filteredAndSortedProducts.reduce((sum, p) => sum + p.valeur_stock, 0),
    fastMovingProducts: filteredAndSortedProducts.filter(p => p.rotation === 'rapide').length,
    slowMovingProducts: filteredAndSortedProducts.filter(p => p.rotation === 'lente').length
  };

  const alerts = generateAlerts(filteredAndSortedProducts);

  return {
    products: paginatedProducts, // Paginated products for the table
    allStockData: stockData, // All products (unfiltered) for dashboard components
    filteredProducts: filteredAndSortedProducts, // All filtered products for calculations
    allProductsCount: filteredAndSortedProducts.length,
    families,
    rayons,
    metrics,
    alerts,
    filters: {
      searchTerm,
      setSearchTerm,
      selectedFamily,
      setSelectedFamily,
      selectedRayon,
      setSelectedRayon,
      stockFilter,
      setStockFilter: (value: string) => {
        setStockFilter(value as 'all' | 'available' | 'low' | 'out' | 'critical');
      }
    },
    sorting: {
      sortBy,
      setSortBy: (value: string) => {
        setSortBy(value as 'name' | 'stock' | 'value' | 'rotation');
      },
      sortOrder,
      setSortOrder
    },
    pagination: {
      currentPage,
      setCurrentPage,
      totalPages,
      itemsPerPage
    },
    isLoading,
    refetch,
    refreshData // Add manual refresh function
  };
};