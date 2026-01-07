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
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';
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
        taxRoundingMethod: DEFAULT_SETTINGS.rounding.method as 'ceil' | 'floor' | 'round' | 'none'
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
        roundingPrecision: parseInt(paramsMap.stock_rounding_precision) || DEFAULT_SETTINGS.rounding.precision,
        
        // Paramètres vente - méthode d'arrondi
        taxRoundingMethod: (salesTaxSettings.taxRoundingMethod as 'ceil' | 'floor' | 'round' | 'none') || DEFAULT_SETTINGS.rounding.method,
        
        // Paramètres système - taux par défaut
        defaultTauxTVA: parseFloat(paramsMap.taux_tva) || DEFAULT_SETTINGS.taxes.tva,
        defaultTauxCentime: parseFloat(paramsMap.taux_centime_additionnel) || DEFAULT_SETTINGS.taxes.centimeAdditionnel,
        currencyCode: paramsMap.default_currency || DEFAULT_SETTINGS.currency.code
      };

      console.log('📊 Paramètres pricing unifiés chargés:', config);
      
      return config;
    },
    enabled: !!tenantId,
    staleTime: 0, // Toujours vérifier la fraîcheur des données
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Valeurs par défaut si pas encore chargé - utilise la config centralisée
  const defaultParams: PricingConfigParams = {
    roundingPrecision: DEFAULT_SETTINGS.rounding.precision,
    taxRoundingMethod: DEFAULT_SETTINGS.rounding.method,
    defaultTauxTVA: DEFAULT_SETTINGS.taxes.tva,
    defaultTauxCentime: DEFAULT_SETTINGS.taxes.centimeAdditionnel,
    currencyCode: DEFAULT_SETTINGS.currency.code
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
