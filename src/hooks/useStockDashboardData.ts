import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { getStockThresholds, calculateStockStatus, calculateRotation } from '@/utils/stockThresholds';

interface StatusDistribution {
  normal: number;
  faible: number;
  critique: number;
  rupture: number;
  surstock: number;
}

export const useStockDashboardData = () => {
  const { tenantId } = useTenant();
  const { settings } = useAlertSettings();

  // Requête pour les produits en rupture (top 10)
  const ruptureProductsQuery = useQuery({
    queryKey: ['stock-rupture-products', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data: products, error } = await supabase
        .from('produits_with_stock')
        .select(`
          id, libelle_produit, code_cip, prix_achat, stock_actuel,
          stock_critique, stock_faible, stock_limite
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;

      const productsWithStock = (products || []).map((product) => {
        const stock_actuel = product.stock_actuel || 0;
        const valeur_stock = stock_actuel * (product.prix_achat || 0);

        return {
          ...product,
          stock_actuel,
          valeur_stock,
          statut_stock: stock_actuel === 0 ? 'rupture' : 'normal',
        };
      });

      return productsWithStock
        .filter(p => p.statut_stock === 'rupture')
        .slice(0, 10);
    },
    enabled: !!tenantId && !!settings,
    staleTime: 30000,
  });

  // Query pour les produits critiques (top 20 pour couvrir plus de cas)
  const criticalProductsQuery = useQuery({
    queryKey: ['stock-critical-products-v3', tenantId, settings?.critical_stock_threshold, settings?.low_stock_threshold],
    queryFn: async () => {
      if (!tenantId) return [];

      console.log('[criticalProductsQuery] Starting query...');

      // ÉTAPE 1 : Charger tous les produits avec pagination
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: products, error } = await supabase
          .from('produits_with_stock')
          .select('id, libelle_produit, code_cip, prix_achat, stock_actuel, stock_critique, stock_faible, stock_limite')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error('[criticalProductsQuery] Error loading products:', error);
          throw error;
        }

        if (products && products.length > 0) {
          allProducts = [...allProducts, ...products];
          hasMore = products.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      const productsData = allProducts;
      if (!productsData) throw new Error('No products data');

      console.log('[criticalProductsQuery] Products loaded:', productsData?.length);

      // ÉTAPE 2 : Utiliser stock_actuel de la vue (pas besoin de charger les lots)
      const productsWithStock = (productsData || []).map((product) => {
        const stock_actuel = product.stock_actuel || 0;
        const valeur_stock = stock_actuel * (product.prix_achat || 0);

        // ✅ Utiliser la logique centralisée de stockThresholds.ts
        const thresholds = getStockThresholds(
          {
            stock_critique: product.stock_critique,
            stock_faible: product.stock_faible,
            stock_limite: product.stock_limite
          },
          settings
        );

        const statut_stock = calculateStockStatus(stock_actuel, thresholds);
        const rotation = calculateRotation(stock_actuel, thresholds);

        return {
          ...product,
          produit_id: product.id,
          stock_actuel,
          valeur_stock,
          statut_stock,
          rotation,
          stock_limite: product.stock_limite,
        };
      });

      // ÉTAPE 5 : Filtrer les produits critiques
      const criticalProducts = productsWithStock.filter(
        p => p.statut_stock === 'critique' && p.stock_actuel > 0
      );
      
      console.log('[criticalProductsQuery] Critical products debug:', {
        total_products: productsData?.length || 0,
        products_with_stock: productsWithStock.filter(p => p.stock_actuel > 0).length,
        critical_products_found: criticalProducts.length,
        settings_critical_threshold: settings?.critical_stock_threshold,
        settings_low_threshold: settings?.low_stock_threshold,
        sample_critical_products: criticalProducts.slice(0, 5).map(p => {
          const thresholds = getStockThresholds(
            {
              stock_critique: p.stock_critique,
              stock_faible: p.stock_faible,
              stock_limite: p.stock_limite
            },
            settings
          );
          return {
            name: p.libelle_produit,
            stock: p.stock_actuel,
            stock_critique_produit: p.stock_critique,
            seuil_critique: thresholds.critique,
            seuil_faible: thresholds.faible,
            statut: p.statut_stock,
          };
        }),
        sample_all_products: productsWithStock.slice(0, 5).map(p => ({
          name: p.libelle_produit,
          stock: p.stock_actuel,
          statut: p.statut_stock,
        }))
      });

      // ÉTAPE 6 : Trier et limiter à 20 résultats
      return criticalProducts
        .sort((a, b) => {
          if (a.rotation === 'rapide' && b.rotation !== 'rapide') return -1;
          if (a.rotation !== 'rapide' && b.rotation === 'rapide') return 1;
          return a.stock_actuel - b.stock_actuel;
        })
        .slice(0, 20);
    },
    enabled: !!tenantId && !!settings,
    staleTime: 30000,
  });

  // Requête pour les produits à rotation rapide (top 10)
  const fastMovingProductsQuery = useQuery({
    queryKey: ['stock-fast-moving-v3', tenantId, settings?.low_stock_threshold, settings?.maximum_stock_threshold],
    queryFn: async () => {
      if (!tenantId) return [];

      // Charger tous les produits avec pagination
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: products, error } = await supabase
          .from('produits_with_stock')
          .select(`
            id, libelle_produit, code_cip, prix_achat, prix_vente_ttc, stock_actuel,
            stock_critique, stock_faible, stock_limite
          `)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error('[fastMovingProductsQuery] Error loading products:', error);
          throw error;
        }

        if (products && products.length > 0) {
          allProducts = [...allProducts, ...products];
          hasMore = products.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      const products = allProducts;

      const productsWithStock = (products || []).map((product) => {
        const stock_actuel = product.stock_actuel || 0;
        const valeur_stock = stock_actuel * (product.prix_achat || 0);

        // ✅ Utiliser la logique centralisée de stockThresholds.ts
        const thresholds = getStockThresholds(
          {
            stock_critique: product.stock_critique,
            stock_faible: product.stock_faible,
            stock_limite: product.stock_limite
          },
          settings
        );

        const statut_stock = calculateStockStatus(stock_actuel, thresholds);
        const rotation = calculateRotation(stock_actuel, thresholds);

        return {
          ...product,
          stock_actuel,
          valeur_stock,
          statut_stock,
          rotation,
        };
      });

      return productsWithStock
        .filter(p => p.rotation === 'rapide' && p.stock_actuel > 0)
        .sort((a, b) => a.stock_actuel - b.stock_actuel)
        .slice(0, 10);
    },
    enabled: !!tenantId && !!settings,
    staleTime: 30000,
  });

  // Requête pour la distribution des statuts (tous les produits avec pagination)
  const statusDistributionQuery = useQuery({
    queryKey: ['stock-status-distribution-v3', tenantId, settings?.low_stock_threshold, settings?.critical_stock_threshold, settings?.maximum_stock_threshold],
    queryFn: async (): Promise<StatusDistribution> => {
      if (!tenantId) {
        return { normal: 0, faible: 0, critique: 0, rupture: 0, surstock: 0 };
      }

      // Charger tous les produits avec pagination
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: products, error } = await supabase
          .from('produits_with_stock')
          .select(`
            id, stock_actuel, stock_critique, stock_faible, stock_limite
          `)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (products && products.length > 0) {
          allProducts = [...allProducts, ...products];
          hasMore = products.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      const products = allProducts;


      const distribution: StatusDistribution = {
        normal: 0,
        faible: 0,
        critique: 0,
        rupture: 0,
        surstock: 0,
      };

      /**
       * ✅ Logique de cascade pour les seuils de stock :
       * 1. Priorité : Seuils définis au niveau du produit
       * 2. Fallback : Paramètres globaux (alert_settings)
       * 3. Par défaut : Valeurs système (critique=2, faible=5, limite=10)
       * 
       * Calcul des statuts (sans chevauchement) :
       * - rupture : stock === 0
       * - critique : 0 < stock <= seuil_critique
       * - faible : seuil_critique < stock <= seuil_faible
       * - normal : seuil_faible < stock <= seuil_limite
       * - surstock : stock > seuil_limite
       * 
       * Source de vérité : src/utils/stockThresholds.ts
       */
      // Capturer les 20 premiers produits avec stock > 0 pour debug
      let debugSamples: any[] = [];

      (products || []).forEach((product) => {
        const stock_actuel = product.stock_actuel || 0;

        // ✅ Utiliser la logique centralisée de stockThresholds.ts
        const thresholds = getStockThresholds(
          {
            stock_critique: product.stock_critique,
            stock_faible: product.stock_faible,
            stock_limite: product.stock_limite
          },
          settings
        );

        const statut = calculateStockStatus(stock_actuel, thresholds);
        distribution[statut]++;
        
        // Capturer les 20 premiers produits avec stock > 0 pour debug
        if (stock_actuel > 0 && debugSamples.length < 20) {
          debugSamples.push({
            id: product.id,
            stock: stock_actuel,
            stock_critique_produit: product.stock_critique,
            stock_faible_produit: product.stock_faible,
            stock_limite_produit: product.stock_limite,
            seuils_utilises: thresholds,
            statut_calcule: statut
          });
        }
      });

      console.log('[statusDistributionQuery] Distribution calculée:', {
        distribution,
        total_calculated: Object.values(distribution).reduce((a, b) => a + b, 0),
        settings_used: {
          critique: settings?.critical_stock_threshold,
          faible: settings?.low_stock_threshold,
          limite: settings?.maximum_stock_threshold
        },
        sample_products: debugSamples
      });

      return distribution;
    },
    enabled: !!tenantId && !!settings,
    staleTime: 30000,
  });

  return {
    criticalProducts: criticalProductsQuery.data || [],
    ruptureProducts: ruptureProductsQuery.data || [],
    fastMovingProducts: fastMovingProductsQuery.data || [],
    statusDistribution: statusDistributionQuery.data || {
      normal: 0,
      faible: 0,
      critique: 0,
      rupture: 0,
      surstock: 0,
    },
    isLoading: criticalProductsQuery.isLoading || ruptureProductsQuery.isLoading || fastMovingProductsQuery.isLoading || statusDistributionQuery.isLoading,
  };
};
