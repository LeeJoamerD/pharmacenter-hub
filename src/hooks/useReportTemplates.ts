import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type ReportTemplate = {
  id?: string;
  name: string;
  category: string;
  description?: string;
  content: Record<string, any>;
  version?: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

export function useReportTemplates() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['report-templates', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const upsertTemplateMutation = useMutation({
    mutationFn: async (template: ReportTemplate) => {
      const { data, error } = await supabase.rpc('reports_upsert_template', { 
        template 
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast({
        title: 'Succès',
        description: 'Modèle de rapport sauvegardé avec succès',
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

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast({
        title: 'Succès',
        description: 'Modèle de rapport supprimé avec succès',
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

  const setDefaultTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase
        .from('report_templates')
        .update({ is_default: false })
        .neq('id', '');

      // Then set the new default
      const { error } = await supabase
        .from('report_templates')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast({
        title: 'Succès',
        description: 'Modèle par défaut défini avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Erreur: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    error,
    upsertTemplate: upsertTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    setDefaultTemplate: setDefaultTemplateMutation.mutate,
    isMutating: upsertTemplateMutation.isPending || deleteTemplateMutation.isPending || setDefaultTemplateMutation.isPending,
  };
}