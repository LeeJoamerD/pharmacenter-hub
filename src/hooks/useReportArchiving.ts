import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type ReportArchivingPolicy = {
  id?: string;
  retention_days: number;
  purge_enabled: boolean;
  storage_location?: string;
  created_at?: string;
  updated_at?: string;
};

export function useReportArchiving() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: policy, isLoading, error } = useQuery({
    queryKey: ['report-archiving-policy', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('report_archiving_policies')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const upsertPolicyMutation = useMutation({
    mutationFn: async (policyData: ReportArchivingPolicy) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const { error } = await supabase
        .from('report_archiving_policies')
        .upsert({
          ...policyData,
          tenant_id: tenantId,
        }, {
          onConflict: 'tenant_id'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-archiving-policy'] });
      toast({
        title: 'Succès',
        description: 'Politique d\'archivage sauvegardée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la sauvegarde: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const applyArchivingPolicyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reports_apply_archiving_policy');
      if (error) throw error;
      return data;
    },
    onSuccess: (deletedCount) => {
      toast({
        title: 'Succès',
        description: `Purge effectuée: ${deletedCount} anciens éléments supprimés`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la purge: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    policy,
    isLoading,
    error,
    upsertPolicy: upsertPolicyMutation.mutate,
    applyArchivingPolicy: applyArchivingPolicyMutation.mutate,
    isMutating: upsertPolicyMutation.isPending,
    isPurging: applyArchivingPolicyMutation.isPending,
  };
}