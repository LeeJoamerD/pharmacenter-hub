/**
 * Hook pour récupérer le statut des retours associés à des ventes en attente.
 * Utilisé dans l'Encaissement pour afficher un indicateur de retour sur chaque transaction.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface ReturnStatusInfo {
  id: string;
  numero_retour: string;
  statut: string; // 'En attente', 'Approuvé', 'Rejeté', 'Terminé'
}

export const useReturnStatusForSales = (venteIds: string[]) => {
  const { tenantId } = useTenant();

  const { data: returnsByVenteId, isLoading, refetch } = useQuery({
    queryKey: ['return-status-for-sales', tenantId, venteIds],
    queryFn: async (): Promise<Record<string, ReturnStatusInfo>> => {
      if (!venteIds.length || !tenantId) return {};

      const { data, error } = await supabase
        .from('retours')
        .select('id, numero_retour, statut, vente_origine_id')
        .eq('tenant_id', tenantId)
        .in('vente_origine_id', venteIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération statuts retours:', error);
        return {};
      }

      // Garder le retour le plus récent par vente
      const map: Record<string, ReturnStatusInfo> = {};
      for (const r of data || []) {
        const venteId = (r as any).vente_origine_id;
        if (venteId && !map[venteId]) {
          map[venteId] = {
            id: r.id,
            numero_retour: r.numero_retour,
            statut: r.statut,
          };
        }
      }
      return map;
    },
    enabled: !!tenantId && venteIds.length > 0,
    staleTime: 15_000,
    refetchInterval: 10_000,
  });

  return {
    returnsByVenteId: returnsByVenteId || {},
    isLoading,
    refetch,
  };
};
