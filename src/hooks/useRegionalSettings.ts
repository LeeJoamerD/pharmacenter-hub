/**
 * Hook pour récupérer les paramètres régionaux (multi-localités)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface RegionalSettings {
  currency: string;
  defaultTVA: number;
  invoiceFormat: string;
  autoPrint: boolean;
  language: string;
}

export const useRegionalSettings = () => {
  const { tenantId } = useTenant();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['regional-settings', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('parametres_systeme')
        .select('cle_parametre, valeur_parametre')
        .eq('tenant_id', tenantId)
        .in('cle_parametre', [
          'devise_principale',
          'tva_defaut',
          'format_numero_facture',
          'impression_auto_ticket',
          'langue_interface'
        ]);

      const params = data?.reduce((acc, param) => ({
        ...acc,
        [param.cle_parametre]: param.valeur_parametre
      }), {} as Record<string, any>);

      return {
        currency: params?.devise_principale || 'FCFA',
        defaultTVA: parseFloat(params?.tva_defaut) || 16,
        invoiceFormat: params?.format_numero_facture || 'POS-{date}-{seq}',
        autoPrint: params?.impression_auto_ticket === 'true' || params?.impression_auto_ticket === true,
        language: params?.langue_interface || 'fr'
      } as RegionalSettings;
    },
    enabled: !!tenantId,
    staleTime: 30 * 60 * 1000 // 30 minutes
  });

  return {
    currency: settings?.currency || 'FCFA',
    defaultTVA: settings?.defaultTVA || 16,
    invoiceFormat: settings?.invoiceFormat || 'POS-{date}-{seq}',
    autoPrint: settings?.autoPrint ?? true,
    language: settings?.language || 'fr',
    isLoading
  };
};
