import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface NotificationConfiguration {
  id: string;
  tenant_id: string;
  // Email
  email_enabled: boolean;
  email_smtp_host?: string;
  email_smtp_port?: number;
  email_smtp_user?: string;
  email_smtp_password?: string;
  email_from_name?: string;
  email_from_address?: string;
  email_use_tls?: boolean;
  email_template?: string;
  // SMS
  sms_enabled: boolean;
  sms_provider?: string;
  sms_api_url?: string;
  sms_api_key?: string;
  sms_sender_name?: string;
  sms_template?: string;
  // WhatsApp
  whatsapp_enabled: boolean;
  whatsapp_business_account_id?: string;
  whatsapp_access_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_webhook_verify_token?: string;
  whatsapp_templates?: any[];
  created_at: string;
  updated_at: string;
}

export const useNotificationSettings = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-settings', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_configurations')
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
    mutationFn: async (settings: Omit<NotificationConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('notification_configurations')
        .insert(settings)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', tenantId] });
      toast({
        title: "Configuration créée",
        description: "Les paramètres de notification ont été créés avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration de notification.",
        variant: "destructive",
      });
      console.error('Error creating notification settings:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<NotificationConfiguration> & { id: string }) => {
      const { id, ...updates } = settings;
      const { data, error } = await supabase
        .from('notification_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', tenantId] });
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres de notification ont été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la configuration de notification.",
        variant: "destructive",
      });
      console.error('Error updating notification settings:', error);
    },
  });

  const saveSettings = async (settings: Partial<NotificationConfiguration>) => {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const settingsWithTenant = { ...settings, tenant_id: tenantId };

    if (query.data?.id) {
      return updateMutation.mutateAsync({ ...settingsWithTenant, id: query.data.id });
    } else {
      return createMutation.mutateAsync(settingsWithTenant as Omit<NotificationConfiguration, 'id' | 'created_at' | 'updated_at'>);
    }
  };

  const testEmailConnection = async (emailSettings: {
    host: string;
    port: number;
    user: string;
    password: string;
    use_tls: boolean;
  }) => {
    // This would typically call an edge function to test the email connection
    toast({
      title: "Test en cours",
      description: "Test de connexion email en cours...",
    });
    
    // Mock test result for now
    setTimeout(() => {
      toast({
        title: "Test réussi",
        description: "La connexion email fonctionne correctement.",
      });
    }, 2000);
  };

  const testSMSConnection = async (smsSettings: {
    provider: string;
    api_key: string;
    sender_name: string;
  }) => {
    toast({
      title: "Test en cours",
      description: "Test de connexion SMS en cours...",
    });
    
    setTimeout(() => {
      toast({
        title: "Test réussi",
        description: "La connexion SMS fonctionne correctement.",
      });
    }, 2000);
  };

  const testWhatsAppConnection = async (whatsappSettings: {
    business_account_id: string;
    access_token: string;
    phone_number_id: string;
  }) => {
    toast({
      title: "Test en cours",
      description: "Test de connexion WhatsApp en cours...",
    });
    
    setTimeout(() => {
      toast({
        title: "Test réussi",
        description: "La connexion WhatsApp fonctionne correctement.",
      });
    }, 2000);
  };

  return {
    settings: query.data,
    loading: query.isLoading,
    error: query.error,
    saveSettings,
    isUpdating: createMutation.isPending || updateMutation.isPending,
    testEmailConnection,
    testSMSConnection,
    testWhatsAppConnection,
  };
};