import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook pour gérer les approbations en attente
 * Récupère le personnel non activé et les documents en attente de validation
 */
export const useAdminApprovals = () => {
  const { tenantId } = useTenant();

  // Personnel en attente d'activation
  const personnelApprovals = useQuery({
    queryKey: ['admin-approvals-personnel', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('personnel')
        .select('id, prenoms, noms, role, created_at')
        .eq('tenant_id', tenantId)
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;

      return data?.map(p => ({
        id: p.id,
        type: 'personnel' as const,
        title: 'Nouveau personnel à activer',
        description: `${p.prenoms} ${p.noms} - ${p.role}`,
        status: 'en_attente',
        createdAt: p.created_at
      })) || [];
    },
    enabled: !!tenantId,
    staleTime: 30000,
  });

  // Documents en attente de validation
  const documentApprovals = useQuery({
    queryKey: ['admin-approvals-documents', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('id, name, document_type, created_at')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'draft'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching documents for approval:', error);
        return [];
      }

      return data?.map(d => ({
        id: d.id,
        type: 'document' as const,
        title: 'Document à valider',
        description: `${d.name} (${d.document_type || 'Type non spécifié'})`,
        status: 'en_attente',
        createdAt: d.created_at
      })) || [];
    },
    enabled: !!tenantId,
    staleTime: 30000,
  });

  // Combiner toutes les approbations
  const allApprovals = [
    ...(personnelApprovals.data || []),
    ...(documentApprovals.data || [])
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    approvals: allApprovals,
    total: allApprovals.length,
    byType: {
      personnel: personnelApprovals.data?.length || 0,
      documents: documentApprovals.data?.length || 0
    },
    isLoading: personnelApprovals.isLoading || documentApprovals.isLoading,
    error: personnelApprovals.error || documentApprovals.error,
    refetch: () => {
      personnelApprovals.refetch();
      documentApprovals.refetch();
    }
  };
};
