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
          stock_alerte, stock_limite,
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

  // Requête pour les produits critiques (top 10)
  const criticalProductsQuery = useQuery({
    queryKey: ['stock-critical-products', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data: products, error } = await supabase
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, prix_achat,
          stock_alerte, stock_limite,
          lots(quantite_restante, prix_achat_unitaire)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;

      const seuil_critique = getStockThreshold('critical', null, settings?.critical_stock_threshold);
      const seuil_faible = getStockThreshold('low', null, settings?.low_stock_threshold);

      const productsWithStock = (products || []).map((product) => {
        const lots = (product as any).lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0), 0
        );

        const valeur_stock = lots.reduce((sum: number, lot: any) => {
          return sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0));
        }, 0);

        let statut_stock: 'critique' | 'faible' | 'normal' | 'rupture' | 'surstock' = 'normal';
        if (stock_actuel === 0) {
          statut_stock = 'rupture';
        } else if (stock_actuel <= seuil_critique) {
          statut_stock = 'critique';
        } else if (stock_actuel <= seuil_faible) {
          statut_stock = 'faible';
        }

        const rotation: 'rapide' | 'normale' | 'lente' = 
          stock_actuel > 0 && stock_actuel <= seuil_faible ? 'rapide' : 
          stock_actuel === 0 ? 'normale' : 
          'normale';

        return {
          ...product,
          stock_actuel,
          valeur_stock,
          statut_stock,
          rotation,
        };
      });

      return productsWithStock
        .filter(p => p.statut_stock === 'critique')
        .sort((a, b) => {
          if (a.rotation === 'rapide' && b.rotation !== 'rapide') return -1;
          if (a.rotation !== 'rapide' && b.rotation === 'rapide') return 1;
          return a.stock_actuel - b.stock_actuel;
        })
        .slice(0, 10);
    },
    enabled: !!tenantId,
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
          stock_alerte, stock_limite,
          lots(quantite_restante, prix_achat_unitaire)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;

      const seuil_faible = getStockThreshold('low', null, settings?.low_stock_threshold);

      const productsWithStock = (products || []).map((product) => {
        const lots = (product as any).lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0), 0
        );

        const valeur_stock = lots.reduce((sum: number, lot: any) => {
          return sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0));
        }, 0);

        let statut_stock: 'critique' | 'faible' | 'normal' | 'rupture' | 'surstock' = 'normal';
        const seuil_critique = getStockThreshold('critical', null, settings?.critical_stock_threshold);
        const seuil_maximum = getStockThreshold('maximum', product.stock_limite, settings?.maximum_stock_threshold);
        
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
            id, stock_alerte, stock_limite,
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

      const seuil_critique = getStockThreshold('critical', null, settings?.critical_stock_threshold);
      const seuil_faible = getStockThreshold('low', null, settings?.low_stock_threshold);

      (products || []).forEach((product) => {
        const lots = (product as any).lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0), 0
        );

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
