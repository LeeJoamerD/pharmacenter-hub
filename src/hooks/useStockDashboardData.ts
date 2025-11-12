import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { getStockThreshold } from '@/lib/utils';

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
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, prix_achat,
          stock_critique, stock_faible, stock_limite,
          lots(quantite_restante, prix_achat_unitaire)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;

      const productsWithStock = (products || []).map((product) => {
        const lots = (product as any).lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0), 0
        );

        const valeur_stock = lots.reduce((sum: number, lot: any) => {
          return sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0));
        }, 0);

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
    enabled: !!tenantId,
    staleTime: 30000,
  });

  // Query pour les produits critiques (top 20 pour couvrir plus de cas)
  const criticalProductsQuery = useQuery({
    queryKey: ['stock-critical-products', tenantId, settings?.critical_stock_threshold, settings?.low_stock_threshold],
    queryFn: async () => {
      if (!tenantId) return [];

      console.log('[criticalProductsQuery] Starting query...');

      // ÉTAPE 1 : Charger les produits (sans limite pour avoir tous les produits)
      const { data: productsData, error: productsError } = await supabase
        .from('produits')
        .select('id, libelle_produit, code_cip, prix_achat, stock_critique, stock_faible, stock_limite')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (productsError) {
        console.error('[criticalProductsQuery] Error loading products:', productsError);
        throw productsError;
      }

      console.log('[criticalProductsQuery] Products loaded:', productsData?.length);

      // ÉTAPE 2 : Charger TOUS les lots avec stock > 0 EN UNE SEULE REQUÊTE
      const { data: allLots, error: lotsError } = await supabase
        .from('lots')
        .select('produit_id, quantite_restante, prix_achat_unitaire')
        .eq('tenant_id', tenantId)
        .gt('quantite_restante', 0);

      if (lotsError) {
        console.error('[criticalProductsQuery] Error loading lots:', lotsError);
        throw lotsError;
      }

      console.log('[criticalProductsQuery] Lots loaded:', allLots?.length);

      // ÉTAPE 3 : Grouper les lots par produit_id
      const lotsByProduct = (allLots || []).reduce((acc, lot) => {
        if (!acc[lot.produit_id]) {
          acc[lot.produit_id] = [];
        }
        acc[lot.produit_id].push(lot);
        return acc;
      }, {} as Record<string, any[]>);

      console.log('[criticalProductsQuery] Products with lots:', Object.keys(lotsByProduct).length);

      // ÉTAPE 4 : Calculer le stock pour chaque produit
      const productsWithStock = (productsData || []).map((product) => {
        const lots = lotsByProduct[product.id] || [];
        
        const stock_actuel = lots.reduce(
          (sum, lot) => sum + (lot.quantite_restante || 0),
          0
        );

        const valeur_stock = lots.reduce(
          (sum, lot) => sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0)),
          0
        );

        // Logique de cascade pour les seuils
        const seuil_critique = getStockThreshold('critical', product.stock_critique, settings?.critical_stock_threshold);
        const seuil_faible = getStockThreshold('low', product.stock_faible, settings?.low_stock_threshold);

        // Déterminer le statut
        let statut_stock: 'critique' | 'faible' | 'normal' | 'rupture' | 'surstock' = 'normal';
        
        if (stock_actuel === 0) {
          statut_stock = 'rupture';
        } else if (stock_actuel > 0 && stock_actuel <= seuil_critique) {
          statut_stock = 'critique';
        } else if (stock_actuel <= seuil_faible) {
          statut_stock = 'faible';
        }

        const rotation: 'rapide' | 'normale' | 'lente' = 
          stock_actuel > 0 && stock_actuel <= seuil_faible ? 'rapide' : 'normale';

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
        sample_critical_products: criticalProducts.slice(0, 5).map(p => ({
          name: p.libelle_produit,
          stock: p.stock_actuel,
          stock_critique_produit: p.stock_critique,
          seuil_critique: getStockThreshold('critical', p.stock_critique, settings?.critical_stock_threshold),
          seuil_faible: getStockThreshold('low', p.stock_faible, settings?.low_stock_threshold),
          statut: p.statut_stock,
        })),
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
    queryKey: ['stock-fast-moving-products', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data: products, error } = await supabase
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, prix_achat, prix_vente_ttc,
          stock_critique, stock_faible, stock_limite,
          lots(quantite_restante, prix_achat_unitaire)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;

      const productsWithStock = (products || []).map((product) => {
        const lots = (product as any).lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0), 0
        );

        const valeur_stock = lots.reduce((sum: number, lot: any) => {
          return sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0));
        }, 0);

        const seuil_critique = getStockThreshold('critical', product.stock_critique, settings?.critical_stock_threshold);
        const seuil_faible = getStockThreshold('low', product.stock_faible, settings?.low_stock_threshold);
        const seuil_maximum = getStockThreshold('maximum', product.stock_limite, settings?.maximum_stock_threshold);
        
        let statut_stock: 'critique' | 'faible' | 'normal' | 'rupture' | 'surstock' = 'normal';
        
        if (stock_actuel === 0) {
          statut_stock = 'rupture';
        } else if (stock_actuel <= seuil_critique) {
          statut_stock = 'critique';
        } else if (stock_actuel <= seuil_faible) {
          statut_stock = 'faible';
        } else if (stock_actuel > seuil_maximum) {
          statut_stock = 'surstock';
        }

        const rotation: 'rapide' | 'normale' | 'lente' = 
          stock_actuel > 0 && stock_actuel <= seuil_faible ? 'rapide' : 
          stock_actuel > seuil_maximum ? 'lente' : 'normale';

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
    enabled: !!tenantId,
    staleTime: 30000,
  });

  // Requête pour la distribution des statuts (tous les produits avec pagination)
  const statusDistributionQuery = useQuery({
    queryKey: ['stock-status-distribution', tenantId, settings?.low_stock_threshold, settings?.critical_stock_threshold, settings?.maximum_stock_threshold],
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
          .from('produits')
          .select(`
            id, stock_critique, stock_faible, stock_limite,
            lots(quantite_restante)
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

      (products || []).forEach((product) => {
        const lots = (product as any).lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0), 0
        );

        const seuil_critique = getStockThreshold('critical', product.stock_critique, settings?.critical_stock_threshold);
        const seuil_faible = getStockThreshold('low', product.stock_faible, settings?.low_stock_threshold);
        const seuil_maximum = getStockThreshold('maximum', product.stock_limite, settings?.maximum_stock_threshold);

        if (stock_actuel === 0) {
          distribution.rupture++;
        } else if (stock_actuel <= seuil_critique) {
          distribution.critique++;
        } else if (stock_actuel <= seuil_faible) {
          distribution.faible++;
        } else if (stock_actuel > seuil_maximum) {
          distribution.surstock++;
        } else {
          distribution.normal++;
        }
      });

      return distribution;
    },
    enabled: !!tenantId,
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
