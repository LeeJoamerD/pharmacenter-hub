/**
 * Hook unifié pour récupérer TOUS les paramètres influençant les prix
 * 
 * Ce hook centralise la récupération des paramètres depuis:
 * - useSystemSettings (TVA, centime additionnel, devise)
 * - useStockSettings (précision d'arrondi)
 * - useSalesSettings (méthode d'arrondi)
 * - usePricingSettings (marges, arrondis prix)
 * 
 * Il fournit une interface unifiée pour tous les composants
 * qui calculent des prix.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { PricingConfigParams } from '@/services/UnifiedPricingService';

export interface UnifiedPricingParamsResult {
  // Paramètres de calcul
  params: PricingConfigParams;
  // État de chargement
  isLoading: boolean;
  // Erreur éventuelle
  error: Error | null;
  // Fonction pour rafraîchir
  refetch: () => void;
}

export const useUnifiedPricingParams = (): UnifiedPricingParamsResult => {
  const { tenantId } = useTenant();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['unified-pricing-params', tenantId],
    queryFn: async (): Promise<PricingConfigParams> => {
      if (!tenantId) {
        throw new Error('Tenant ID non disponible');
      }

      // Récupérer tous les paramètres système en une seule requête
      const { data: systemParams, error: systemError } = await supabase
        .from('parametres_systeme')
        .select('cle_parametre, valeur_parametre')
        .eq('tenant_id', tenantId)
        .in('cle_parametre', [
          'taux_tva',
          'taux_centime_additionnel',
          'default_currency',
          'stock_rounding_precision',
          'sales_tax'
        ]);

      if (systemError) {
        console.error('Erreur chargement paramètres pricing:', systemError);
        throw systemError;
      }

      // Mapper les paramètres
      const paramsMap = systemParams?.reduce((acc, param) => {
        acc[param.cle_parametre] = param.valeur_parametre;
        return acc;
      }, {} as Record<string, string>) || {};

      // Parser les paramètres de vente (JSON)
      let salesTaxSettings = {
        taxRoundingMethod: 'ceil' as const
      };
      
      try {
        if (paramsMap.sales_tax) {
          const parsed = JSON.parse(paramsMap.sales_tax);
          salesTaxSettings = {
            ...salesTaxSettings,
            ...parsed
          };
        }
      } catch (e) {
        console.warn('Erreur parsing sales_tax:', e);
      }

      // Construire l'objet de configuration unifié
      const config: PricingConfigParams = {
        // Paramètres stock - précision d'arrondi
        roundingPrecision: parseInt(paramsMap.stock_rounding_precision) || 25,
        
        // Paramètres vente - méthode d'arrondi
        taxRoundingMethod: (salesTaxSettings.taxRoundingMethod as 'ceil' | 'floor' | 'round' | 'none') || 'ceil',
        
        // Paramètres système - taux par défaut
        defaultTauxTVA: parseFloat(paramsMap.taux_tva) || 19.25,
        defaultTauxCentime: parseFloat(paramsMap.taux_centime_additionnel) || 0.175,
        currencyCode: paramsMap.default_currency || 'XAF'
      };

      console.log('📊 Paramètres pricing unifiés chargés:', config);
      
      return config;
    },
    enabled: !!tenantId,
    staleTime: 0, // Toujours vérifier la fraîcheur des données
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Valeurs par défaut si pas encore chargé
  const defaultParams: PricingConfigParams = {
    roundingPrecision: 25,
    taxRoundingMethod: 'ceil',
    defaultTauxTVA: 19.25,
    defaultTauxCentime: 0.175,
    currencyCode: 'XAF'
  };

  return {
    params: data || defaultParams,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook simplifié pour obtenir juste les paramètres (sans état de chargement)
 * Utilise les valeurs par défaut pendant le chargement
 */
export const usePricingConfig = (): PricingConfigParams => {
  const { params } = useUnifiedPricingParams();
  return params;
};
