import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type ReportSettings = {
  default_date_range?: string;
  default_export_formats?: string;
  timezone?: string;
  auto_refresh_seconds?: string;
  retention_days?: string;
  notifications_enabled?: string;
  data_masking_enabled?: string;
  default_report_currency?: string;
  pdf_template_style?: string;
  export_watermark_enabled?: string;
};

export function useReportSettings() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = {} as ReportSettings, isLoading, error } = useQuery<ReportSettings>({
    queryKey: ['report-settings', tenantId],
    queryFn: async (): Promise<ReportSettings> => {
      if (!tenantId) return {} as ReportSettings;

      const { data, error } = await supabase.rpc('reports_get_configuration');
      if (error) throw error;
      
      return (data as any)?.general_settings || {} as ReportSettings;
    },
    enabled: !!tenantId,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: ReportSettings) => {
      const { error } = await supabase.rpc('reports_upsert_settings', { 
        payload: newSettings 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-settings'] });
      toast({
        title: 'Succès',
        description: 'Paramètres de rapports sauvegardés avec succès',
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

  return {
    settings,
    isLoading,
    error,
    saveSettings: saveSettingsMutation.mutate,
    isSaving: saveSettingsMutation.isPending,
  };
}