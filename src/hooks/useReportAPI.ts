import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type ReportAPIToken = {
  id?: string;
  name: string;
  scopes: string[];
  expires_at?: string;
  is_active: boolean;
  created_at?: string;
};

export function useReportAPI() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading, error } = useQuery({
    queryKey: ['report-api-tokens', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('report_api_tokens')
        .select('id, name, scopes, expires_at, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const createTokenMutation = useMutation({
    mutationFn: async (tokenData: { name: string; scopes: string[]; expires_at?: string }) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      // For demo purposes, we'll create a token hash locally
      // In production, this should be handled by an Edge Function
      const token = `rt_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const tokenHash = btoa(token); // Simple hash for demo

      const { error } = await supabase
        .from('report_api_tokens')
        .insert({
          ...tokenData,
          tenant_id: tenantId,
          token_hash: tokenHash,
        });

      if (error) throw error;
      return { token }; // Return the actual token for display
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['report-api-tokens'] });
      toast({
        title: 'Succès',
        description: `Token créé avec succès. Copiez-le maintenant: ${data.token}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la création: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_api_tokens')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-api-tokens'] });
      toast({
        title: 'Succès',
        description: 'Token révoqué avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la révocation: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_api_tokens')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-api-tokens'] });
      toast({
        title: 'Succès',
        description: 'Token supprimé avec succès',
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
    tokens,
    isLoading,
    error,
    createToken: createTokenMutation.mutate,
    revokeToken: revokeTokenMutation.mutate,
    deleteToken: deleteTokenMutation.mutate,
    isMutating: createTokenMutation.isPending || revokeTokenMutation.isPending || deleteTokenMutation.isPending,
    lastCreatedToken: createTokenMutation.data?.token,
  };
}