import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface FamilleProduit {
  id: string;
  libelle_famille: string;
  description: string | null;
}

export const useFamillesProduits = () => {
  const { tenantId } = useTenant();

  const query = useQuery({
    queryKey: ['familles-produits', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('famille_produit')
        .select('id, libelle_famille, description')
        .eq('tenant_id', tenantId)
        .order('libelle_famille');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  return {
    familles: query.data || [],
    loading: query.isLoading,
    error: query.error,
  };
};