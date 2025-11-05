import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type ReportConnector = {
  id?: string;
  provider: 'powerbi' | 'tableau' | 'qlik';
  config: Record<string, any>;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export function useReportConnectors() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connectors = [], isLoading, error } = useQuery({
    queryKey: ['report-connectors', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('report_connectors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const upsertConnectorMutation = useMutation({
    mutationFn: async (connector: ReportConnector) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const { error } = await supabase
        .from('report_connectors')
        .upsert({
          provider: connector.provider,
          config: connector.config,
          is_enabled: connector.is_enabled,
        } as any, {
          onConflict: 'tenant_id,provider'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-connectors'] });
      toast({
        title: 'Succès',
        description: 'Connecteur sauvegardé avec succès',
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

  const deleteConnectorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_connectors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-connectors'] });
      toast({
        title: 'Succès',
        description: 'Connecteur supprimé avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    connectors,
    isLoading,
    error,
    upsertConnector: upsertConnectorMutation.mutate,
    deleteConnector: deleteConnectorMutation.mutate,
    isMutating: upsertConnectorMutation.isPending || deleteConnectorMutation.isPending,
  };
}