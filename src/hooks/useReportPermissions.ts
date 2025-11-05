import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type ReportPermission = {
  id?: string;
  subject_type: 'role' | 'user';
  subject_id: string;
  report_key: string;
  can_view: boolean;
  can_create: boolean;
  can_modify: boolean;
  can_delete: boolean;
  can_export: boolean;
  created_at?: string;
  updated_at?: string;
};

export function useReportPermissions() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading, error } = useQuery({
    queryKey: ['report-permissions', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('report_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const upsertPermissionMutation = useMutation({
    mutationFn: async (permission: ReportPermission) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const { error } = await supabase
        .from('report_permissions')
        .upsert({
          subject_type: permission.subject_type,
          subject_id: permission.subject_id,
          report_key: permission.report_key,
          can_view: permission.can_view,
          can_create: permission.can_create,
          can_modify: permission.can_modify,
          can_delete: permission.can_delete,
          can_export: permission.can_export,
        } as any, {
          onConflict: 'tenant_id,subject_type,subject_id,report_key'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-permissions'] });
      toast({
        title: 'Succès',
        description: 'Permissions sauvegardées avec succès',
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

  const deletePermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_permissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-permissions'] });
      toast({
        title: 'Succès',
        description: 'Permission supprimée avec succès',
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
    permissions,
    isLoading,
    error,
    upsertPermission: upsertPermissionMutation.mutate,
    deletePermission: deletePermissionMutation.mutate,
    isMutating: upsertPermissionMutation.isPending || deletePermissionMutation.isPending,
  };
}