import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour vérifier si une pharmacie possède au moins un administrateur
 * @param tenantId - ID de la pharmacie (tenant)
 * @returns hasAdmin - boolean indiquant si la pharmacie a un admin, isLoading - état de chargement
 */
export function usePharmacyAdmin(tenantId: string | undefined) {
  const { data: hasAdmin, isLoading } = useQuery({
    queryKey: ['pharmacy-has-admin', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase.rpc('check_pharmacy_has_admin', {
        p_tenant_id: tenantId
      });
      
      if (error) {
        console.error('Erreur vérification admin:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!tenantId,
    staleTime: 30000, // Cache 30 secondes
  });

  return { hasAdmin, isLoading };
}
