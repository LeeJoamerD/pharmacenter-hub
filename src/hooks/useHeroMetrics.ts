import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

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
        // Utiliser le RPC SECURITY DEFINER qui fonctionne même sans auth.uid()
        const { data, error } = await supabase.rpc('get_hero_metrics', {
          p_tenant_id: tenantId
        });

        if (error) {
          console.error('Erreur RPC get_hero_metrics:', error);
          setMetrics(MOCK_DATA);
          return;
        }

        const metricsData = data as {
          salesGrowth: number;
          totalProducts: number;
          availabilityRate: number;
          stockStatus: string;
          pharmacyCount: number;
          isRealData: boolean;
          error?: string;
        };

        if (metricsData.error) {
          console.error('Erreur dans get_hero_metrics:', metricsData.error);
          setMetrics(MOCK_DATA);
          return;
        }

        // Mapper le stockStatus au type correct
        let stockStatus: 'Optimal' | 'Attention' | 'Critique' = 'Optimal';
        if (metricsData.stockStatus === 'Critique') {
          stockStatus = 'Critique';
        } else if (metricsData.stockStatus === 'Attention') {
          stockStatus = 'Attention';
        }

        setMetrics({
          salesGrowth: metricsData.salesGrowth || 0,
          totalProducts: metricsData.totalProducts || 0,
          availabilityRate: metricsData.availabilityRate || 0,
          stockStatus,
          pharmacyCount: (metricsData.pharmacyCount || 0) + PHARMACY_BONUS,
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
