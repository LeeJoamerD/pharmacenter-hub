import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AlertSettings {
  id?: string;
  tenant_id: string;
  low_stock_enabled: boolean;
  low_stock_threshold: number;
  critical_stock_threshold: number;
  maximum_stock_threshold: number;
  expiration_alert_days: number;
  near_expiration_days: number;
  overdue_inventory_days: number;
  slow_moving_days: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  dashboard_notifications: boolean;
  alert_frequency: string;
  business_days_only: boolean;
  alert_start_time: string;
  alert_end_time: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: Omit<AlertSettings, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> = {
  low_stock_enabled: true,
  low_stock_threshold: 10,
  critical_stock_threshold: 5,
  maximum_stock_threshold: 100,
  expiration_alert_days: 30,
  near_expiration_days: 7,
  overdue_inventory_days: 365,
  slow_moving_days: 90,
  email_notifications: true,
  sms_notifications: false,
  dashboard_notifications: true,
  alert_frequency: 'daily',
  business_days_only: true,
  alert_start_time: '08:00',
  alert_end_time: '18:00',
};

export const useAlertSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alert-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_current_tenant_alert_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (settings: Partial<AlertSettings> & { tenant_id: string }) => {
      const { data, error } = await supabase
        .from('alert_settings')
        .insert({
          ...DEFAULT_SETTINGS,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-settings'] });
      toast({
        title: "Configuration créée",
        description: "Les paramètres d'alertes ont été créés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration d'alertes.",
        variant: "destructive",
      });
      console.error('Error creating alert settings:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<AlertSettings>) => {
      const { data, error } = await supabase
        .from('alert_settings')
        .update(settings)
        .eq('tenant_id', settings.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-settings'] });
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres d'alertes ont été sauvegardés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration d'alertes.",
        variant: "destructive",
      });
      console.error('Error updating alert settings:', error);
    },
  });

  const saveSettings = async (settings: Partial<AlertSettings> & { tenant_id: string }) => {
    if (query.data) {
      return updateMutation.mutateAsync({ ...settings, tenant_id: query.data.tenant_id });
    } else {
      return createMutation.mutateAsync(settings);
    }
  };

  return {
    settings: query.data,
    loading: query.isLoading,
    error: query.error,
    saveSettings,
    isUpdating: updateMutation.isPending || createMutation.isPending,
  };
};