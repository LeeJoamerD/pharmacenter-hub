import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

// Bonus de pharmacies pour l'affichage marketing
const PHARMACY_BONUS = 15;

// Données mockées (affichées si pas de tenant connecté)
const MOCK_DATA: HeroMetrics = {
  salesGrowth: 24,
  totalProducts: 1234,
  availabilityRate: 98,
  stockStatus: 'Optimal',
  pharmacyCount: 500,
  isRealData: false,
};

export interface HeroMetrics {
  salesGrowth: number;
  totalProducts: number;
  availabilityRate: number;
  stockStatus: 'Optimal' | 'Attention' | 'Critique';
  pharmacyCount: number;
  isRealData: boolean;
}

export function useHeroMetrics(): {
  metrics: HeroMetrics;
  isLoading: boolean;
} {
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [metrics, setMetrics] = useState<HeroMetrics>(MOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Attendre que le tenant soit chargé
    if (tenantLoading) {
      return;
    }

    // Si pas de tenantId après chargement, utiliser les données mockées
    if (!tenantId) {
      setMetrics(MOCK_DATA);
      return;
    }

    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const previousMonthStart = startOfMonth(subMonths(now, 1));
        const previousMonthEnd = endOfMonth(subMonths(now, 1));

        // CA mois courant
        const { data: currentSalesData } = await supabase
          .from('ventes')
          .select('montant_total_ttc')
          .eq('tenant_id', tenantId)
          .gte('created_at', currentMonthStart.toISOString());
        
        // CA mois précédent
        const { data: previousSalesData } = await supabase
          .from('ventes')
          .select('montant_total_ttc')
          .eq('tenant_id', tenantId)
          .gte('created_at', previousMonthStart.toISOString())
          .lte('created_at', previousMonthEnd.toISOString());
        
        // Total produits actifs (is_active = true)
        const { count: totalProductsCount } = await supabase
          .from('produits')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true);
        
        // Produits avec stock disponible (via la vue produits_with_stock ou lots)
        const { data: lotsData } = await supabase
          .from('lots')
          .select('produit_id, quantite_restante')
          .eq('tenant_id', tenantId);
        
        // Calculer les produits avec stock > 0
        const productsWithStock = new Set<string>();
        (lotsData || []).forEach(lot => {
          if ((lot.quantite_restante || 0) > 0 && lot.produit_id) {
            productsWithStock.add(lot.produit_id);
          }
        });
        
        // Nombre total de pharmacies (global)
        const { count: pharmacyCount } = await supabase
          .from('pharmacies')
          .select('id', { count: 'exact', head: true });

        // Calcul de la croissance des ventes
        const currentSales = (currentSalesData || []).reduce(
          (sum, v) => sum + (Number(v.montant_total_ttc) || 0), 0
        );
        
        const previousSales = (previousSalesData || []).reduce(
          (sum, v) => sum + (Number(v.montant_total_ttc) || 0), 0
        );
        
        let salesGrowth = 0;
        if (previousSales > 0) {
          salesGrowth = ((currentSales - previousSales) / previousSales) * 100;
        } else if (currentSales > 0) {
          salesGrowth = 100;
        }

        // Calcul du taux de disponibilité
        const totalProducts = totalProductsCount || 0;
        const availableProducts = productsWithStock.size;
        
        let availabilityRate = 0;
        if (totalProducts > 0) {
          availabilityRate = (availableProducts / totalProducts) * 100;
        }

        // Détermination du statut de stock
        let stockStatus: 'Optimal' | 'Attention' | 'Critique' = 'Optimal';
        if (availabilityRate < 70) {
          stockStatus = 'Critique';
        } else if (availabilityRate < 90) {
          stockStatus = 'Attention';
        }

        setMetrics({
          salesGrowth: Math.round(salesGrowth),
          totalProducts,
          availabilityRate: Math.round(availabilityRate),
          stockStatus,
          pharmacyCount: (pharmacyCount || 0) + PHARMACY_BONUS,
          isRealData: true,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des métriques Hero:', error);
        setMetrics(MOCK_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [tenantId, tenantLoading]);

  return { metrics, isLoading: isLoading || tenantLoading };
}
