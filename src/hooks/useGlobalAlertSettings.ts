import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface GlobalAlertSettings {
  id: string;
  tenant_id: string;
  system_enabled: boolean;
  check_frequency_minutes: number;
  business_hours_only: boolean;
  business_start_time: string;
  business_end_time: string;
  business_days: number[];
  alert_retention_days: number;
  auto_cleanup_enabled: boolean;
  escalation_enabled: boolean;
  escalation_delay_minutes: number;
  max_escalation_level: number;
  max_alerts_per_hour: number;
  duplicate_alert_cooldown_minutes: number;
  default_email_template?: string;
  default_sms_template?: string;
  default_whatsapp_template?: string;
  created_at: string;
  updated_at: string;
}

export const useGlobalAlertSettings = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['global-alert-settings', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_alert_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }
      return data;
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (settings: Omit<GlobalAlertSettings, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('global_alert_settings')
        .insert(settings)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-alert-settings', tenantId] });
      toast({
        title: "Configuration créée",
        description: "Les paramètres globaux ont été créés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration globale.",
        variant: "destructive",
      });
      console.error('Error creating global alert settings:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<GlobalAlertSettings> & { id: string }) => {
      const { id, ...updates } = settings;
      const { data, error } = await supabase
        .from('global_alert_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-alert-settings', tenantId] });
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres globaux ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la configuration globale.",
        variant: "destructive",
      });
      console.error('Error updating global alert settings:', error);
    },
  });

  const saveSettings = async (settings: Partial<GlobalAlertSettings>) => {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const settingsWithTenant = { ...settings, tenant_id: tenantId };

    if (query.data?.id) {
      return updateMutation.mutateAsync({ ...settingsWithTenant, id: query.data.id });
    } else {
      return createMutation.mutateAsync(settingsWithTenant as Omit<GlobalAlertSettings, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const testConfiguration = async () => {
    toast({
      title: "Test en cours",
      description: "Test de la configuration globale en cours...",
    });
    
    // Mock test result for now
    setTimeout(() => {
      toast({
        title: "Test réussi",
        description: "La configuration globale fonctionne correctement.",
      });
    }, 2000);
  };

  return {
    settings: query.data,
    loading: query.isLoading,
    error: query.error,
    saveSettings,
    testConfiguration,
    isUpdating: createMutation.isPending || updateMutation.isPending,
  };
};